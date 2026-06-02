/**
 * scripts/gen-natives.ts
 *
 * Generates .d.tl declaration files from the official @citizenfx/client and
 * @citizenfx/server TypeScript definitions. These packages are maintained by
 * Cfx themselves and contain PascalCase Lua-callable names with correct types.
 *
 * Sources:
 *   node_modules/@citizenfx/client/natives_universal.d.ts  -> client
 *   node_modules/@citizenfx/server/natives_universal.d.ts  -> server
 *   Functions present in both                              -> shared
 *
 * Usage:
 *   pnpm run gen-natives
 *
 * Output:
 *   types/fivem/natives_client.d.tl
 *   types/fivem/natives_server.d.tl
 *   types/fivem/natives_shared.d.tl
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Type mapping: TypeScript -> Teal
// ---------------------------------------------------------------------------

/**
 * Maps a TypeScript type string to its Teal equivalent.
 *
 * Handles:
 *   number, boolean, string, void, any, Vector3
 *   string | number  -> Hash
 *   function types   -> function(...): any  (Teal has no arrow syntax)
 *   tuple types      -> any  (Teal has no tuple syntax)
 *   everything else  -> any
 */
function tsTypeToTeal(tsType: string): string {
    const t = tsType.trim();

    if (t.includes('=>')) return 'function';

    if (t.startsWith('[')) return 'any';

    switch (t) {
        case 'void':
            return '';
        case 'boolean':
            return 'boolean';
        case 'string':
            return 'string';
        case 'number':
            return 'number';
        case 'any':
            return 'any';
        case 'Vector3':
            return 'vector3';
        case 'string | number':
        case 'number | string':
            return 'Hash';
        default:
            return 'any';
    }
}

// ---------------------------------------------------------------------------
// .d.ts parser
// ---------------------------------------------------------------------------

interface ParsedNative {
    name: string;
    params: { name: string; type: string }[];
    returnType: string;
    doc: string;
}

/**
 * Splits a parameter list string on top-level commas only,
 * correctly handling nested parens and brackets.
 *
 * e.g. "ped: number, cb: (result: string) => void, flags: number"
 *   -> ["ped: number", "cb: (result: string) => void", "flags: number"]
 */
function splitParams(raw: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let current = '';

    for (const ch of raw) {
        if (ch === '(' || ch === '[' || ch === '<') {
            depth++;
            current += ch;
        } else if (ch === ')' || ch === ']' || ch === '>') {
            depth--;
            current += ch;
        } else if (ch === ',' && depth === 0) {
            parts.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
}

/**
 * Extracts the outermost param list and return type from a declare function
 * line, correctly handling nested parens in callback parameter types.
 *
 * Returns null if the line is not a declare function.
 */
function parseDeclare(line: string): { name: string; rawParams: string; rawReturn: string } | null {
    const nameMatch = /^declare function ([A-Za-z_][A-Za-z0-9_]*)\(/.exec(line);
    if (!nameMatch) return null;

    const name = nameMatch[1];
    let depth = 0;
    const paramStart = line.indexOf('(');
    let paramEnd = -1;

    for (let i = paramStart; i < line.length; i++) {
        if (line[i] === '(') depth++;
        else if (line[i] === ')') {
            depth--;
            if (depth === 0) {
                paramEnd = i;
                break;
            }
        }
    }

    if (paramEnd === -1) return null;

    const rawParams = line.slice(paramStart + 1, paramEnd);

    const afterParen = line.slice(paramEnd + 1).trim();
    const returnMatch = /^:\s*([^;]+);/.exec(afterParen);
    if (!returnMatch) return null;

    return { name, rawParams, rawReturn: returnMatch[1].trim() };
}

/**
 * Parse all `declare function` statements from a .d.ts file.
 */
function parseDts(filePath: string): Map<string, ParsedNative> {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const natives = new Map<string, ParsedNative>();

    let pendingDoc = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('/**')) {
            pendingDoc = '';

            while (i < lines.length) {
                const docLine = lines[i].trim();

                pendingDoc += `${docLine}\n`;
                if (docLine.endsWith('*/')) break;

                i++;
            }

            continue;
        }

        if (!line.startsWith('declare function')) {
            if (line !== '' && !line.startsWith('*') && !line.startsWith('/')) {
                pendingDoc = '';
            }

            continue;
        }

        const parsed = parseDeclare(line);
        if (!parsed) {
            pendingDoc = '';
            continue;
        }

        const { name: funcName, rawParams, rawReturn } = parsed;

        if (funcName.startsWith('N_0x') || funcName.startsWith('n_0x')) {
            pendingDoc = '';
            continue;
        }

        const params: { name: string; type: string }[] = [];
        if (rawParams.trim()) {
            for (const param of splitParams(rawParams)) {
                const colonIdx = param.indexOf(':');
                if (colonIdx === -1) continue;

                const paramName = param
                    .slice(0, colonIdx)
                    .trim()
                    .replace(/^\.\.\./, '')
                    .replace(/\?$/, '');

                const paramType = param.slice(colonIdx + 1).trim();

                if (paramName) {
                    params.push({ name: paramName, type: tsTypeToTeal(paramType) });
                }
            }
        }

        const returnType = tsTypeToTeal(rawReturn);

        let doc = '';

        if (pendingDoc) {
            const summaryMatch = pendingDoc.match(/\*\s+([^@\n*][^\n]+)/);

            if (summaryMatch) {
                doc = summaryMatch[1].trim().substring(0, 120).replace(/--/g, '~~');
            }
        }

        natives.set(funcName, { name: funcName, params, returnType, doc });
        pendingDoc = '';
    }

    return natives;
}

// ---------------------------------------------------------------------------
// Teal output generation
// ---------------------------------------------------------------------------

function buildTealDecl(native: ParsedNative): string {
    const params = native.params
        .map((p) => {
            const RESERVED =
                /^(and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while|record|enum|type|global|where)$/;
            const safeName = RESERVED.test(p.name) ? `${p.name}_` : p.name;

            return `${safeName}: ${p.type}`;
        })
        .join(', ');

    const sig =
        native.returnType === ''
            ? `function(${params})`
            : `function(${params}): ${native.returnType}`;

    const decl = `global ${native.name}: ${sig}`;
    return native.doc ? `-- ${native.doc}\n${decl}` : decl;
}

function resolvePackageDts(pkg: string, filename: string): string {
    const candidate = join(ROOT, 'node_modules', pkg, filename);

    if (!existsSync(candidate)) {
        throw new Error(
            `Could not find ${candidate}\n` +
                `Run 'pnpm install' to ensure @citizenfx packages are available.`
        );
    }

    return candidate;
}

async function main(): Promise<void> {
    console.log('Parsing @citizenfx/client...');
    const clientDts = resolvePackageDts('@citizenfx/client', 'natives_universal.d.ts');
    const clientNatives = parseDts(clientDts);
    console.log(`  Found ${clientNatives.size} client natives`);

    console.log('Parsing @citizenfx/server...');
    const serverDts = resolvePackageDts('@citizenfx/server', 'natives_server.d.ts');
    const serverNatives = parseDts(serverDts);
    console.log(`  Found ${serverNatives.size} server natives`);

    const shared: ParsedNative[] = [];
    const clientOnly: ParsedNative[] = [];
    const serverOnly: ParsedNative[] = [];

    for (const [name, native] of clientNatives) {
        if (serverNatives.has(name)) {
            shared.push(native);
        } else {
            clientOnly.push(native);
        }
    }

    for (const [name, native] of serverNatives) {
        if (!clientNatives.has(name)) {
            serverOnly.push(native);
        }
    }

    console.log(
        `  Shared: ${shared.length}, client-only: ${clientOnly.length}, server-only: ${serverOnly.length}`
    );

    const cfxPath = join(ROOT, 'types', 'fivem', 'cfx.d.tl');

    if (!existsSync(cfxPath)) {
        throw new Error(
            `cfx.d.tl not found at ${cfxPath}. It should be committed to types/fivem/.`
        );
    }

    const cfxContent = readFileSync(cfxPath, 'utf8');

    const outDir = join(ROOT, 'types', 'fivem');
    mkdirSync(outDir, { recursive: true });

    const header =
        `-- fivem.d.tl\n` +
        `-- Auto-generated by scripts/gen-natives.ts — DO NOT EDIT MANUALLY.\n` +
        `-- Contains: cfx core globals + all client, server, and shared natives.\n` +
        `-- Pass as: tl check --include-dir <types/fivem> --global-env-def fivem\n\n`;

    const sections = [
        '-- ============================================================',
        '-- cfx core (Citizen, exports, events, vectors, handle aliases)',
        '-- ============================================================',
        cfxContent.trim(),
        '',
        '-- ============================================================',
        '-- Shared natives (available in both client and server)',
        '-- ============================================================',
        ...shared.map(buildTealDecl),
        '',
        '-- ============================================================',
        '-- Client-only natives',
        '-- ============================================================',
        ...clientOnly.map(buildTealDecl),
        '',
        '-- ============================================================',
        '-- Server-only natives',
        '-- ============================================================',
        ...serverOnly.map(buildTealDecl)
    ];

    const outPath = join(outDir, 'fivem.d.tl');
    writeFileSync(outPath, header + sections.join('\n'), 'utf8');

    console.log(
        `\nWrote ${shared.length + clientOnly.length + serverOnly.length} natives → ${outPath}`
    );
    console.log('Done.');
}

main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
