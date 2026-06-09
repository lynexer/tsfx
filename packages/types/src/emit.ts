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

/** Render a param name for a function stub body (strip ? suffix) */
function stubParam(p: LuaParam): string {
    return p.optional ? `${p.name}?` : p.name;
}

interface FunSignature {
    params: Array<{ name: string; type: string; optional: boolean }>;
    returnType: string;
}

/**
 * Parses `fun(source?: number): PlayerHandleClass` into structured form.
 * Returns null if the type isn't a fun(...) signature (i.e. it's a bare class name).
 */
function parseFunType(typeExpr: string): FunSignature | null {
    if (!typeExpr.trimStart().startsWith('fun(')) return null;

    const parenOpen = typeExpr.indexOf('(');
    const parenClose = typeExpr.indexOf(')');
    if (parenOpen === -1 || parenClose === -1) return null;

    const paramStr = typeExpr.slice(parenOpen + 1, parenClose).trim();
    const afterParen = typeExpr.slice(parenClose + 1).trim();

    const returnType = afterParen.startsWith(':') ? afterParen.slice(1).trim() : '';

    const params: FunSignature['params'] = [];

    if (paramStr) {
        for (const part of paramStr.split(',')) {
            const [rawName, rawType] = part
                .trim()
                .split(':')
                .map((s) => s.trim());
            if (!rawName) continue;

            const optional = rawName.endsWith('?');

            params.push({
                name: rawName.replace('?', '').trim(),
                type: rawType ?? 'any',
                optional
            });
        }
    }

    return { params, returnType: returnType || 'nil' };
}

function emitAlias(alias: LuaAlias, lines: string[]): void {
    lines.push('');

    if (alias.description) lines.push(doc(alias.description));

    for (const g of alias.generics) {
        lines.push(ann(`generic ${g}`));
    }

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

    const classLine = cls.parent
        ? ann(`class ${cls.name} : ${cls.parent}`)
        : ann(`class ${cls.name}`);

    lines.push(classLine);

    for (const field of cls.fields) {
        lines.push(emitField(field));
    }

    lines.push(`local ${cls.name} = {}`);
}

function emitMethod(method: LuaMethod, lines: string[]): void {
    lines.push('');
    if (method.description) lines.push(doc(method.description));

    for (const p of method.params) {
        const opt = p.optional ? '?' : '';
        const desc = p.description ? `  ${p.description}` : '';

        lines.push(ann(`param ${p.name}${opt} ${formatType(p.type)}${desc}`));
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

        if (sig) {
            lines.push('');

            if (field.description) lines.push(doc(field.description));

            for (const p of sig.params) {
                const opt = p.optional ? '?' : '';
                lines.push(ann(`param ${p.name}${opt} ${formatType(p.type)}`));
            }

            lines.push(ann(`return ${formatType(sig.returnType)}`));

            const paramStr = sig.params.map((p) => (p.optional ? `${p.name}?` : p.name)).join(', ');

            lines.push(`function TSFXClass.${field.name}(${paramStr}) end`);
        }
    }

    lines.push('');
    lines.push(doc('@type TSFXClass'));
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

    const sortedAliases = Array.from(model.aliases.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    for (const alias of sortedAliases) {
        emitAlias(alias, lines);
    }

    const sortedClasses = Array.from(model.classes.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    for (const cls of sortedClasses) {
        emitClassDeclaration(cls, lines);
        const sortedMethods = cls.methods.slice().sort((a, b) => a.name.localeCompare(b.name));

        for (const method of sortedMethods) {
            emitMethod(method, lines);
        }
    }

    emitTsfxGlobal(model.tsfxFields, lines);

    lines.push('');
    return lines.join('\n');
}
