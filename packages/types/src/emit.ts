import type { LuaClass, LuaField, LuaMethod, LuaParam, SdkModel, TsfxFactory } from './types.js';

function docLine(text: string): string {
    return `--- ${text}`;
}

function annotLine(annotation: string): string {
    return `--- ${annotation}`;
}

/**
 * Formats a type string for LuaLS:
 *  - Strips leading/trailing whitespace
 *  - "self" stays as-is
 */
function formatType(t: string): string {
    return t.trim() || 'any';
}

/**
 * Builds the param list for a function stub, e.g. `self, source, amount`
 * For colon-style methods `self` is implicit in Lua, but we include it
 * in the stub signature so LuaLS generates correct hover docs.
 */
function buildParamList(params: LuaParam[]): string {
    const names = params.map((p) => (p.optional ? `${p.name}?` : p.name));
    return names.join(', ');
}

function emitClassDeclaration(cls: LuaClass, lines: string[]): void {
    lines.push('');

    if (cls.description) {
        lines.push(docLine(cls.description));
    }

    const classLine = cls.parent
        ? `--- @class ${cls.name} : ${cls.parent}`
        : `--- @class ${cls.name}`;

    lines.push(classLine);

    for (const field of cls.fields) {
        lines.push(emitField(field));
    }

    lines.push(`local ${cls.name} = {}`);
}

function emitField(field: LuaField): string {
    const optional = field.optional ? '?' : '';
    const desc = field.description ? ` ${field.description}` : '';

    return `--- @field ${field.name}${optional} ${formatType(field.type)}${desc}`;
}

function emitMethod(method: LuaMethod, lines: string[]): void {
    lines.push('');

    if (method.description) {
        lines.push(docLine(method.description));
    }

    for (const param of method.params) {
        const optional = param.optional ? '?' : '';
        const desc = param.description ? ` ${param.description}` : '';

        lines.push(annotLine(`@param ${param.name}${optional} ${formatType(param.type)}${desc}`));
    }

    for (const ret of method.returns) {
        const name = ret.name ? ` ${ret.name}` : '';
        const desc = ret.description ? ` ${ret.description}` : '';

        lines.push(annotLine(`@return ${formatType(ret.type)}${name}${desc}`));
    }

    const paramStr = buildParamList(method.params);
    const sep = method.callStyle === 'colon' ? ':' : '.';

    lines.push(`function ${method.className}${sep}${method.name}(${paramStr}) end`);
}

function emitTsfxGlobal(factories: TsfxFactory[], lines: string[]): void {
    lines.push('');
    lines.push('--- The TSFX Bridge SDK global. All SDK access starts here.');
    lines.push('--- @class TSFX');

    for (const factory of factories) {
        const returnSig = factory.returns.map((r) => formatType(r.type)).join(', ');
        const paramSig = factory.params
            .map((p) => `${p.name}${p.optional ? '?' : ''}: ${formatType(p.type)}`)
            .join(', ');

        lines.push(`--- @field ${factory.name} fun(${paramSig}): ${returnSig || 'nil'}`);
    }

    lines.push('local TSFX = {}');

    for (const factory of factories) {
        lines.push('');

        if (factory.description) {
            lines.push(docLine(factory.description));
        }

        for (const param of factory.params) {
            const optional = param.optional ? '?' : '';
            const desc = param.description ? ` ${param.description}` : '';

            lines.push(
                annotLine(`@param ${param.name}${optional} ${formatType(param.type)}${desc}`)
            );
        }

        for (const ret of factory.returns) {
            const name = ret.name ? ` ${ret.name}` : '';
            const desc = ret.description ? ` ${ret.description}` : '';

            lines.push(annotLine(`@return ${formatType(ret.type)}${name}${desc}`));
        }

        const paramStr = factory.params.map((p) => (p.optional ? `${p.name}?` : p.name)).join(', ');

        lines.push(`function TSFX.${factory.name}(${paramStr}) end`);
    }

    lines.push('');
    lines.push('--- @type TSFX');
    lines.push('TSFX = TSFX');
}

/**
 * When the SDK's tsfx.lua doesn't have explicit @class TSFX / @field entries,
 * we infer factories from Handle-named classes.
 *
 * E.g. class "PlayerHandle" → factory TSFX.Player(source?: number): PlayerHandle
 */
function buildFallbackFactories(classes: Map<string, LuaClass>): TsfxFactory[] {
    const factories: TsfxFactory[] = [];

    for (const [name, cls] of classes) {
        if (!name.endsWith('Handle')) continue;

        const factoryName = name.replace(/Handle$/, '');

        const initMethod = cls.methods.find(
            (m) => m.name === 'init' || m.name === 'new' || m.name === '__new'
        );

        factories.push({
            name: factoryName,
            params: initMethod ? initMethod.params.filter((p) => p.name !== 'self') : [],
            returns: [{ type: name, description: `A new ${name} instance.` }],
            description: cls.description || `Returns a ${name} for the given context.`
        });
    }

    factories.sort((a, b) => a.name.localeCompare(b.name));
    return factories;
}

const FILE_HEADER = `---@meta
-- ============================================================================
-- TSFX Bridge SDK — LuaLS type definitions
-- Auto-generated by tsfx-lls-addon/src/generate.ts
-- Do not edit this file manually. Run \`npm run generate\` to regenerate.
-- ============================================================================
-- Source: https://github.com/lynexer/tsfx_sdk
-- Addon:  https://github.com/lynexer/tsfx
-- ============================================================================
`;

export function emitLibrary(model: SdkModel): string {
    const lines: string[] = [FILE_HEADER];

    const sortedClasses = Array.from(model.classes.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    for (const cls of sortedClasses) {
        emitClassDeclaration(cls, lines);

        for (const method of cls.methods.sort((a, b) => a.name.localeCompare(b.name))) {
            emitMethod(method, lines);
        }
    }

    const factories =
        model.tsfxFactories.length > 0
            ? model.tsfxFactories
            : buildFallbackFactories(model.classes);

    if (factories.length > 0) {
        emitTsfxGlobal(factories, lines);
    } else {
        lines.push('');
        lines.push('--- The TSFX Bridge SDK global.');
        lines.push('--- @class TSFX');
        lines.push('local TSFX = {}');
        lines.push('');
        lines.push('--- @type TSFX');
        lines.push('TSFX = TSFX');
    }

    lines.push('');
    return lines.join('\n');
}
