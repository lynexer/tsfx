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
 * Maps a TypeScript parameter/return type string to its Teal equivalent.
 * The .d.ts files use: number, boolean, string, void, string | number, Vector3
 */
function tsTypeToTeal(tsType: string): string {
    const t = tsType.trim();

    switch (t) {
        case 'void':
            return '';
        case 'boolean':
            return 'boolean';
        case 'string':
            return 'string';
        case 'Vector3':
            return 'vector3';
        case 'string | number':
        case 'number | string':
            return 'Hash';
        case 'number':
            return 'number';
        case 'any':
            return 'any';
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

const DECLARE_FUNC_RE = /^declare function ([A-Za-z_][A-Za-z0-9_]*)\(([^)]*)\)\s*:\s*([^;]+);/;

/**
 * Parse all `declare function` statements from a .d.ts file.
 * Collects JSDoc comment blocks immediately preceding each declaration.
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

        const match = DECLARE_FUNC_RE.exec(line);

        if (!match) {
            if (line !== '' && !line.startsWith('*') && !line.startsWith('/')) {
                pendingDoc = '';
            }

            continue;
        }

        const [, funcName, rawParams, rawReturn] = match;

        if (funcName.startsWith('N_0x') || funcName.startsWith('n_0x')) {
            pendingDoc = '';
            continue;
        }

        const params: { name: string; type: string }[] = [];

        if (rawParams.trim()) {
            for (const param of rawParams.split(',')) {
                const colonIdx = param.lastIndexOf(':');
                if (colonIdx === -1) continue;

                const paramName = param
                    .slice(0, colonIdx)
                    .trim()
                    .replace(/^\.\.\./, '');
                const paramType = param.slice(colonIdx + 1).trim();

                if (paramName) {
                    params.push({ name: paramName, type: tsTypeToTeal(paramType) });
                }
            }
        }

        const returnType = tsTypeToTeal(rawReturn.trim());

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
            const safeName = /^(end|do|then|local|function|return|type|record|enum|goto)$/.test(
                p.name
            )
                ? `${p.name}_`
                : p.name;

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

function writeFile(outPath: string, context: string, declarations: string[]): void {
    const header =
        `-- natives_${context}.d.tl\n` +
        `-- Auto-generated by scripts/gen-natives.ts\n` +
        `-- Source: @citizenfx/${context === 'shared' ? 'client + server' : context}\n` +
        `-- DO NOT EDIT MANUALLY — re-run pnpm gen-natives to update.\n\n`;

    writeFileSync(outPath, `${header + declarations.join('\n\n')}\n`, 'utf8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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

    const outDir = join(ROOT, 'types', 'fivem');
    mkdirSync(outDir, { recursive: true });

    writeFile(join(outDir, 'natives_shared.d.tl'), 'shared', shared.map(buildTealDecl));
    writeFile(join(outDir, 'natives_client.d.tl'), 'client', clientOnly.map(buildTealDecl));
    writeFile(join(outDir, 'natives_server.d.tl'), 'server', serverOnly.map(buildTealDecl));

    console.log(`\nWrote files to ${outDir}`);
    console.log('Done.');
}

main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
