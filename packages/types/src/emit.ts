import type {
    LuaAlias,
    LuaClass,
    LuaField,
    LuaMethod,
    LuaParam,
    SdkModel,
    TsfxField
} from './types.js';

function doc(text: string): string {
    return `--- ${text}`;
}

function ann(annotation: string): string {
    return `---@${annotation}`;
}

function formatType(t: string): string {
    return t.trim() || 'any';
}

/**
 * Param name for an annotation line — includes the `?` suffix.
 * e.g.  `---@param source? number`
 */
function annotParam(p: LuaParam): string {
    return p.optional ? `${p.name}?` : p.name;
}

/**
 * Param name for the actual Lua function stub body — NO `?` suffix.
 * Optional params are expressed only in the annotation, not the signature.
 * e.g.  `function TSFXClass.Player(source) end`
 */
function stubParam(p: LuaParam): string {
    return p.name;
}

interface FunSignature {
    params: Array<{ name: string; type: string; optional: boolean }>;
    returnType: string;
}

function findMatchingParen(str: string, openIdx: number): number {
    let depth = 0;

    for (let i = openIdx; i < str.length; i++) {
        if (str[i] === '(') depth++;
        else if (str[i] === ')') {
            depth--;
            if (depth === 0) return i;
        }
    }

    return -1;
}

/**
 * Splits a param string at top-level commas only (not commas inside nested
 * parentheses or angle brackets).
 */
function splitTopLevelParams(paramStr: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let current = '';

    for (const ch of paramStr) {
        if (ch === '(' || ch === '<') depth++;
        else if (ch === ')' || ch === '>') depth--;
        else if (ch === ',' && depth === 0) {
            parts.push(current.trim());
            current = '';
            continue;
        }
        current += ch;
    }

    if (current.trim()) parts.push(current.trim());

    return parts;
}

/**
 * Parses `fun(...): ReturnType` into a structured FunSignature.
 * Returns null if typeExpr doesn't start with `fun(`.
 */
function parseFunType(typeExpr: string): FunSignature | null {
    const trimmed = typeExpr.trimStart();
    if (!trimmed.startsWith('fun(')) return null;

    const openIdx = trimmed.indexOf('(');
    const closeIdx = findMatchingParen(trimmed, openIdx);
    if (openIdx === -1 || closeIdx === -1) return null;

    const paramStr = trimmed.slice(openIdx + 1, closeIdx).trim();
    const after = trimmed.slice(closeIdx + 1).trim();
    const returnType = after.startsWith(':') ? after.slice(1).trim() : 'nil';

    const params: FunSignature['params'] = [];

    if (paramStr) {
        for (const part of splitTopLevelParams(paramStr)) {
            const colonIdx = part.indexOf(':');
            if (colonIdx === -1) continue;

            const rawName = part.slice(0, colonIdx).trim();
            const rawType = part.slice(colonIdx + 1).trim();
            if (!rawName) continue;

            const optional = rawName.endsWith('?');

            params.push({
                name: rawName.replace('?', '').trim(),
                type: rawType || 'any',
                optional
            });
        }
    }

    return { params, returnType: returnType || 'nil' };
}

function emitAlias(alias: LuaAlias, lines: string[]): void {
    lines.push('');
    if (alias.description) lines.push(doc(alias.description));

    for (const g of alias.generics) lines.push(ann(`generic ${g}`));

    lines.push(ann(`alias ${alias.name} ${alias.typeExpr}`));
}

function emitField(field: LuaField): string {
    const opt = field.optional ? '?' : '';
    const desc = field.description ? `  ${field.description}` : '';

    return ann(`field ${field.name}${opt} ${formatType(field.type)}${desc}`);
}

function emitClassDeclaration(cls: LuaClass, lines: string[]): void {
    lines.push('');
    if (cls.description) lines.push(doc(cls.description));

    lines.push(cls.parent ? ann(`class ${cls.name} : ${cls.parent}`) : ann(`class ${cls.name}`));
    for (const field of cls.fields) lines.push(emitField(field));

    lines.push(`local ${cls.name} = {}`);
}

function emitMethod(method: LuaMethod, lines: string[]): void {
    lines.push('');
    if (method.description) lines.push(doc(method.description));

    for (const p of method.params) {
        const desc = p.description ? `  ${p.description}` : '';

        lines.push(ann(`param ${annotParam(p)} ${formatType(p.type)}${desc}`));
    }

    for (const r of method.returns) {
        const name = r.name ? ` ${r.name}` : '';
        const desc = r.description ? `  ${r.description}` : '';

        lines.push(ann(`return ${formatType(r.type)}${name}${desc}`));
    }

    const sep = method.callStyle === 'colon' ? ':' : '.';
    const paramStr = method.params.map(stubParam).join(', ');

    lines.push(`function ${method.className}${sep}${method.name}(${paramStr}) end`);
}

function emitTsfxGlobal(tsfxFields: TsfxField[], lines: string[]): void {
    lines.push('');
    lines.push(doc('The TSFX Bridge SDK global. All SDK access starts here.'));
    lines.push(ann('class TSFXClass'));

    for (const field of tsfxFields) {
        const desc = field.description ? `  ${field.description}` : '';
        lines.push(ann(`field ${field.name} ${formatType(field.typeExpr)}${desc}`));
    }

    lines.push('local TSFXClass = {}');

    for (const field of tsfxFields) {
        const sig = parseFunType(field.typeExpr);
        if (!sig) continue;

        lines.push('');
        if (field.description) lines.push(doc(field.description));

        for (const p of sig.params) {
            const opt = p.optional ? '?' : '';
            lines.push(ann(`param ${p.name}${opt} ${formatType(p.type)}`));
        }

        lines.push(ann(`return ${formatType(sig.returnType)}`));

        const paramStr = sig.params.map((p) => p.name).join(', ');
        lines.push(`function TSFXClass.${field.name}(${paramStr}) end`);
    }

    lines.push('');
    lines.push(ann('type TSFXClass'));
    lines.push('TSFX = TSFXClass');
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

    for (const alias of [...model.aliases.values()].sort((a, b) => a.name.localeCompare(b.name))) {
        emitAlias(alias, lines);
    }

    for (const cls of [...model.classes.values()].sort((a, b) => a.name.localeCompare(b.name))) {
        emitClassDeclaration(cls, lines);
        const sorted = cls.methods.slice().sort((a, b) => a.name.localeCompare(b.name));

        for (const method of sorted) emitMethod(method, lines);
    }

    emitTsfxGlobal(model.tsfxFields, lines);

    lines.push('');
    return lines.join('\n');
}
