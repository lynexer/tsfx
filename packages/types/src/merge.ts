import type {
    LuaAlias,
    LuaClass,
    LuaMethod,
    LuaParam,
    LuaReturn,
    ParsedFile,
    RawMethod,
    SdkModel,
    TsfxField
} from './types.js';

const TSFX_ENTRYPOINT = 'TSFXClass';

function isTypeFile(path: string): boolean {
    if (path.includes('/types/')) return true;
    if (path.endsWith('.d.lua')) return true;

    return false;
}

/** Conventional single-char generic names used in LuaCATS */
const GENERIC_VARS = new Set(['T', 'K', 'V', 'U', 'R', 'E', 'S', 'A', 'B']);

function inferGenerics(explicit: string[], params: LuaParam[], returns: LuaReturn[]): string[] {
    const result = new Set(explicit);
    const allTypeExprs = [...params.map((p) => p.type), ...returns.map((r) => r.type)];

    for (const expr of allTypeExprs) {
        const re = /\b([A-Z])\b/g;
        let m = re.exec(expr);

        while (m !== null) {
            if (GENERIC_VARS.has(m[1])) result.add(m[1]);
            m = re.exec(expr);
        }
    }

    return [...result];
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
    'V',
    'U'
]);

function extractTypeNames(typeExpr: string): string[] {
    const found: string[] = [];
    const re = /\b([A-Z][A-Za-z0-9_]*)\b/g;
    let m = re.exec(typeExpr);

    while (m !== null) {
        if (!LUA_PRIMITIVES.has(m[1])) found.push(m[1]);
        m = re.exec(typeExpr);
    }

    return found;
}

function buildClassNameMap(allClasses: Map<string, LuaClass>): Map<string, string> {
    const map = new Map<string, string>();

    for (const name of allClasses.keys()) {
        map.set(name, name);

        if (name.endsWith('Class')) {
            const short = name.slice(0, -5);
            if (!map.has(short)) map.set(short, name);
        }

        if (name.endsWith('HandleClass')) {
            const short = name.slice(0, -5);
            if (!map.has(short)) map.set(short, name);
        }
    }

    return map;
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
                for (const name of extractTypeNames(alias.typeExpr)) enqueue(name);
            }
        }
    }

    function walkTypeExpr(typeExpr: string): void {
        for (const name of extractTypeNames(typeExpr)) enqueue(name);
    }

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;

        const cls = allClasses.get(current);
        if (!cls) continue;

        if (cls.parent) enqueue(cls.parent);

        for (const field of cls.fields) walkTypeExpr(field.type);

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

    const classNameMap = buildClassNameMap(allClasses);

    for (const file of parsedFiles) {
        if (isTypeFile(file.filePath)) continue;

        for (const rawMethod of file.methods) {
            const canonicalName = classNameMap.get(rawMethod.className) ?? rawMethod.className;
            const target = allClasses.get(canonicalName);

            if (!target) {
                console.warn(
                    `[merge] Warning: ${rawMethod.className}:${rawMethod.name} — no matching class found (tried "${canonicalName}"), skipping.`
                );

                continue;
            }

            if (target.methods.find((m) => m.name === rawMethod.name)) continue;

            const chainable = detectChainable(rawMethod, canonicalName);
            let finalReturns: LuaReturn[] = rawMethod.returns;

            if (chainable && rawMethod.returns.length === 0) {
                finalReturns = [{ type: canonicalName, description: 'The handle for chaining.' }];
            }

            finalReturns = finalReturns.map((r) => ({
                ...r,
                type: classNameMap.get(r.type) ?? r.type
            }));

            const method: LuaMethod = {
                name: rawMethod.name,
                className: canonicalName,
                callStyle: rawMethod.callStyle,
                params: rawMethod.params,
                returns: finalReturns,
                description: rawMethod.description,
                chainable,
                generics: inferGenerics(rawMethod.generics, rawMethod.params, finalReturns),
                sourceFile: file.filePath
            };

            target.methods.push(method);
        }
    }

    const entrypoint = allClasses.get(TSFX_ENTRYPOINT);

    if (!entrypoint) {
        console.error(`[merge] ERROR: Could not find ${TSFX_ENTRYPOINT} in any parsed file.`);
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

    const unreachable = [...allClasses.keys()].filter(
        (k) => k !== TSFX_ENTRYPOINT && !reachableClasses.has(k)
    );

    if (unreachable.length > 0) {
        console.log(`[merge] Pruned (unreachable): ${unreachable.join(', ')}`);
    }

    return { classes: prunedClasses, aliases: prunedAliases, tsfxFields };
}
