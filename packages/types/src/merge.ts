import type {
    LuaAlias,
    LuaClass,
    LuaMethod,
    LuaReturn,
    ParsedFile,
    RawMethod,
    SdkModel,
    TsfxField
} from './types.js';

const TSFX_ENTRYPOINT = 'TSFXClass';

function isTypeFile(path: string): boolean {
    return path.startsWith('resource/shared/types/') || path.endsWith('types.d.lua');
}

function isFacadeFile(path: string): boolean {
    return path.endsWith('facade.lua') || path.endsWith('_facade.lua');
}

function detectChainable(method: RawMethod, className: string): boolean {
    if (method.returns.length === 0) return true;
    return method.returns.some((r) => r.type === className || r.type === 'self');
}

const LUA_PRIMITIVES = new Set([
    'string',
    'number',
    'boolean',
    'integer',
    'nil',
    'any',
    'void',
    'table',
    'function',
    'userdata',
    'thread',
    'true',
    'false',
    'self',
    'T',
    'K',
    'V'
]);

/**
 * Extracts all potential named type identifiers from a type expression string.
 * We scan for word-boundary-delimited tokens that start with an uppercase
 * letter and aren't Lua primitives.
 */
function extractTypeNames(typeExpr: string): string[] {
    const found: string[] = [];
    const re = /\b([A-Z][A-Za-z0-9_]*)\b/g;
    let m = re.exec(typeExpr);

    while (m !== null) {
        const name = m[1];

        if (!LUA_PRIMITIVES.has(name)) {
            found.push(name);
        }

        m = re.exec(typeExpr);
    }

    return found;
}

function buildReachableSet(
    startClass: LuaClass,
    allClasses: Map<string, LuaClass>,
    allAliases: Map<string, LuaAlias>
): { reachableClasses: Set<string>; reachableAliases: Set<string> } {
    const reachableClasses = new Set<string>();
    const reachableAliases = new Set<string>();
    const queue: string[] = [startClass.name];

    function enqueue(typeName: string): void {
        if (allClasses.has(typeName) && !reachableClasses.has(typeName)) {
            reachableClasses.add(typeName);
            queue.push(typeName);
        } else if (allAliases.has(typeName) && !reachableAliases.has(typeName)) {
            reachableAliases.add(typeName);

            const alias = allAliases.get(typeName);

            if (alias) {
                for (const name of extractTypeNames(alias.typeExpr)) {
                    enqueue(name);
                }
            }
        }
    }

    function walkTypeExpr(typeExpr: string): void {
        for (const name of extractTypeNames(typeExpr)) {
            enqueue(name);
        }
    }

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;

        const cls = allClasses.get(current);
        if (!cls) continue;

        if (cls.parent) enqueue(cls.parent);

        for (const field of cls.fields) {
            walkTypeExpr(field.type);
        }

        for (const method of cls.methods) {
            for (const param of method.params) walkTypeExpr(param.type);
            for (const ret of method.returns) walkTypeExpr(ret.type);
        }
    }

    return { reachableClasses, reachableAliases };
}

export function mergeModel(parsedFiles: ParsedFile[]): SdkModel {
    console.log('[merge] Building SDK model...');

    const allClasses = new Map<string, LuaClass>();
    const allAliases = new Map<string, LuaAlias>();

    for (const file of parsedFiles) {
        for (const rawClass of file.classes) {
            if (!allClasses.has(rawClass.name)) {
                allClasses.set(rawClass.name, {
                    name: rawClass.name,
                    parent: rawClass.parent,
                    fields: rawClass.fields,
                    methods: [],
                    description: rawClass.description,
                    sourceFile: file.filePath
                });
            } else if (isTypeFile(file.filePath)) {
                const existing = allClasses.get(rawClass.name);
                if (!existing) continue;

                for (const field of rawClass.fields) {
                    if (!existing.fields.find((f) => f.name === field.name)) {
                        existing.fields.push(field);
                    }
                }

                if (!existing.description && rawClass.description) {
                    existing.description = rawClass.description;
                }
            }
        }
    }

    for (const file of parsedFiles) {
        for (const rawAlias of file.aliases) {
            if (!allAliases.has(rawAlias.name)) {
                allAliases.set(rawAlias.name, {
                    name: rawAlias.name,
                    typeExpr: rawAlias.typeExpr,
                    generics: rawAlias.generics,
                    description: rawAlias.description,
                    sourceFile: file.filePath
                });
            }
        }
    }

    for (const file of parsedFiles) {
        if (!isFacadeFile(file.filePath)) continue;

        for (const rawMethod of file.methods) {
            const cls = allClasses.get(rawMethod.className);

            if (!cls) {
                console.warn(
                    `[merge] Warning: ${rawMethod.className}:${rawMethod.name} references undeclared class — creating stub.`
                );

                allClasses.set(rawMethod.className, {
                    name: rawMethod.className,
                    fields: [],
                    methods: [],
                    description: '',
                    sourceFile: file.filePath
                });
            }

            const target = allClasses.get(rawMethod.className);
            if (!target) continue;

            if (target.methods.find((m) => m.name === rawMethod.name)) continue;

            const chainable = detectChainable(rawMethod, rawMethod.className);
            let finalReturns: LuaReturn[] = rawMethod.returns;
            if (chainable && rawMethod.returns.length === 0) {
                finalReturns = [
                    { type: rawMethod.className, description: 'The handle for chaining.' }
                ];
            }

            const method: LuaMethod = {
                name: rawMethod.name,
                className: rawMethod.className,
                callStyle: rawMethod.callStyle,
                params: rawMethod.params,
                returns: finalReturns,
                description: rawMethod.description,
                chainable,
                sourceFile: file.filePath
            };

            target.methods.push(method);
        }
    }

    const entrypoint = allClasses.get(TSFX_ENTRYPOINT);

    if (!entrypoint) {
        console.error(`[merge] ERROR: Could not find ${TSFX_ENTRYPOINT} in any parsed file.`);
        console.error('[merge] Ensure resource/shared/types/tsfx.lua is being fetched correctly.');

        process.exit(1);
    }

    const tsfxFields: TsfxField[] = entrypoint.fields.map((f) => ({
        name: f.name,
        typeExpr: f.type,
        description: f.description
    }));

    const { reachableClasses, reachableAliases } = buildReachableSet(
        entrypoint,
        allClasses,
        allAliases
    );

    reachableClasses.delete(TSFX_ENTRYPOINT);

    const prunedClasses = new Map<string, LuaClass>();

    for (const name of reachableClasses) {
        const cls = allClasses.get(name);
        if (cls) prunedClasses.set(name, cls);
    }

    const prunedAliases = new Map<string, LuaAlias>();
    for (const name of reachableAliases) {
        const alias = allAliases.get(name);
        if (alias) prunedAliases.set(name, alias);
    }

    const totalClasses = allClasses.size - 1;
    const totalAliases = allAliases.size;

    console.log(
        `[merge] Reachability: ${prunedClasses.size}/${totalClasses} classes, ${prunedAliases.size}/${totalAliases} aliases`
    );
    console.log(`[merge] TSFX fields: ${tsfxFields.length}`);

    if (prunedClasses.size < totalClasses) {
        const pruned = [...allClasses.keys()].filter(
            (k) => k !== TSFX_ENTRYPOINT && !reachableClasses.has(k)
        );

        console.log(`[merge] Pruned (unreachable): ${pruned.join(', ')}`);
    }

    return {
        classes: prunedClasses,
        aliases: prunedAliases,
        tsfxFields
    };
}
