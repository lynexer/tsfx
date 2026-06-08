import type {
    LuaClass,
    LuaMethod,
    LuaParam,
    LuaReturn,
    ParsedFile,
    RawMethod,
    SdkModel,
    TsfxFactory
} from './types.js';

function isTypeFile(path: string): boolean {
    return path.startsWith('resource/shared/types/') || path.endsWith('types.d.lua');
}

function isFacadeFile(path: string): boolean {
    return path.endsWith('facade.lua') || path.endsWith('_facade.lua');
}

/**
 * A method is chainable if ANY of its @return types match the className
 * it belongs to, OR if it has no @return at all AND comes from a facade
 * (facade methods that don't declare a return are assumed chainable because
 * the SDK's design makes chaining the default pattern).
 */
function detectChainable(method: RawMethod, className: string): boolean {
    if (method.returns.length === 0) {
        return true;
    }

    return method.returns.some((r) => {
        // Exact class match, or "self" literal
        return r.type === className || r.type === 'self';
    });
}

/**
 * Determines if a class is a top-level TSFX factory entry.
 * We look for:
 *  - Classes literally named "TSFX" (the global itself)
 *  - Classes that appear as @field entries on the TSFX class
 */
function extractTsfxFactories(
    tsfxClass: LuaClass | undefined,
    allClasses: Map<string, LuaClass>
): TsfxFactory[] {
    if (!tsfxClass) return [];

    const factories: TsfxFactory[] = [];

    for (const field of tsfxClass.fields) {
        const returnClass = allClasses.get(field.type) ?? allClasses.get(`${field.name}Handle`);

        factories.push({
            name: field.name,
            params: parseFunctionTypeParams(field.type),
            returns: returnClass
                ? [{ type: returnClass.name, description: '' }]
                : [{ type: field.type, description: '' }],
            description: field.description
        });
    }

    for (const method of tsfxClass.methods) {
        if (method.callStyle === 'dot') {
            factories.push({
                name: method.name,
                params: method.params,
                returns: method.returns,
                description: method.description
            });
        }
    }

    return factories;
}

/**
 * Very lightweight parser for inline function type signatures like:
 * `fun(source?: number): PlayerHandle`
 * Returns params array if parseable, empty array otherwise.
 */
function parseFunctionTypeParams(typeStr: string): LuaParam[] {
    const m = typeStr.match(/^fun\(([^)]*)\)/);
    if (!m?.[1].trim()) return [];

    return m[1].split(',').map((p) => {
        const parts = p.trim().split(/\s*:\s*/);
        const rawName = parts[0]?.trim() ?? 'arg';
        const optional = rawName.endsWith('?');
        return {
            name: rawName.replace('?', ''),
            type: parts[1]?.trim() ?? 'any',
            optional,
            description: ''
        };
    });
}

export function mergeModel(parsedFiles: ParsedFile[]): SdkModel {
    console.log('[merge] Building SDK model...');

    const classes = new Map<string, LuaClass>();

    for (const file of parsedFiles) {
        if (!isTypeFile(file.filePath)) continue;

        for (const rawClass of file.classes) {
            if (!classes.has(rawClass.name)) {
                classes.set(rawClass.name, {
                    name: rawClass.name,
                    parent: rawClass.parent,
                    fields: rawClass.fields,
                    methods: [],
                    description: rawClass.description,
                    sourceFile: file.filePath
                });
            } else {
                const existing = classes.get(rawClass.name);
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
        if (!isFacadeFile(file.filePath)) continue;

        for (const rawClass of file.classes) {
            if (!classes.has(rawClass.name)) {
                classes.set(rawClass.name, {
                    name: rawClass.name,
                    parent: rawClass.parent,
                    fields: rawClass.fields,
                    methods: [],
                    description: rawClass.description,
                    sourceFile: file.filePath
                });
            }
        }
    }

    for (const file of parsedFiles) {
        if (!isFacadeFile(file.filePath)) continue;

        for (const rawMethod of file.methods) {
            const targetClass = classes.get(rawMethod.className);

            if (!targetClass) {
                console.warn(
                    `[merge] Warning: method ${rawMethod.className}:${rawMethod.name} references undeclared class. Creating stub.`
                );

                classes.set(rawMethod.className, {
                    name: rawMethod.className,
                    fields: [],
                    methods: [],
                    description: '',
                    sourceFile: file.filePath
                });
            }

            const cls = classes.get(rawMethod.className);
            if (!cls) continue;
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

            if (!cls.methods.find((m) => m.name === rawMethod.name)) {
                cls.methods.push(method);
            }
        }
    }

    const tsfxClass = classes.get('TSFX');
    const tsfxFactories = extractTsfxFactories(tsfxClass, classes);

    if (tsfxClass) {
        classes.delete('TSFX');
    }

    console.log(
        `[merge] Model built: ${classes.size} classes, ${tsfxFactories.length} TSFX factories`
    );

    for (const [name, cls] of classes) {
        console.log(`  ${name}: ${cls.fields.length} field(s), ${cls.methods.length} method(s)`);
    }

    return { classes, tsfxFactories };
}
