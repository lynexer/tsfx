import type { FetchedFile } from './fetch.js';
import type { LuaParam, LuaReturn, ParsedFile, RawAlias, RawClass, RawMethod } from './types.js';

const RE_CLASS = /^---\s*@class\s+([\w.]+)(?:\s*:\s*([\w.]+))?/;
const RE_ALIAS = /^---\s*@alias\s+([\w]+)\s+(.*)/;
const RE_GENERIC = /^---\s*@generic\s+([\w]+)/;
const RE_FIELD =
    /^---\s*@field\s+(?:(?:public|private|protected)\s+)?([\w]+)(\?)?\s+(.*?)(?:\s{2,}(.*))?$/;
const RE_PARAM = /^---\s*@param\s+([\w.]+)(\?)?\s+(.*?)(?:\s{2,}(.*))?$/;
const RE_RETURN = /^---\s*@return\s+(.*?)(?:\s{2,}(.*))?$/;
const RE_FUNCTION = /^(?:local\s+)?function\s+([\w]+)([:.])([\w]+)\s*\(/;
const RE_DESC = /^---\s+(?!@)(.*)/;

function parseType(raw: string | undefined): string {
    return raw?.trim() || 'any';
}

function parseDescription(raw: string | undefined): string {
    return raw?.trim().replace(/^[-–—]\s*/, '') ?? '';
}

interface AnnotationBlock {
    annotations: string[];
    description: string;
    lineCount: number;
}

function collectAnnotationBlock(lines: string[], startIndex: number): AnnotationBlock {
    const annotations: string[] = [];
    const descParts: string[] = [];
    let i = startIndex;

    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line.startsWith('---')) break;

        if (/^---\s*@/.test(line)) {
            annotations.push(line);
        } else {
            const dm = line.match(RE_DESC);
            if (dm) descParts.push(dm[1].trim());
        }

        i++;
    }

    return {
        annotations,
        description: descParts.join(' ').trim(),
        lineCount: i - startIndex
    };
}

export function parseFile(file: FetchedFile): ParsedFile {
    const lines = file.content.split('\n');
    const classes: RawClass[] = [];
    const aliases: RawAlias[] = [];
    const methods: RawMethod[] = [];

    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (!line.startsWith('---')) {
            i++;
            continue;
        }

        const block = collectAnnotationBlock(lines, i);
        i += block.lineCount;

        const nextLine = lines[i]?.trim() ?? '';

        let pendingGenerics: string[] = [];
        let pendingDescription = block.description;

        for (const annotation of block.annotations) {
            const gm = annotation.match(RE_GENERIC);

            if (gm) {
                pendingGenerics.push(gm[1]);
                continue;
            }

            const am = annotation.match(RE_ALIAS);

            if (am) {
                aliases.push({
                    name: am[1],
                    typeExpr: am[2].trim(),
                    generics: pendingGenerics,
                    description: pendingDescription
                });

                pendingGenerics = [];
                pendingDescription = '';

                continue;
            }

            const cm = annotation.match(RE_CLASS);

            if (cm) {
                const cls: RawClass = {
                    name: cm[1],
                    parent: cm[2],
                    description: pendingDescription,
                    fields: []
                };

                classes.push(cls);
                pendingGenerics = [];
                pendingDescription = '';

                continue;
            }

            const fm = annotation.match(RE_FIELD);

            if (fm && classes.length > 0) {
                const target = classes[classes.length - 1];

                target.fields.push({
                    name: fm[1],
                    type: parseType(fm[3]),
                    optional: fm[2] === '?',
                    description: parseDescription(fm[4])
                });
            }
        }

        const funcMatch = nextLine.match(RE_FUNCTION);

        if (funcMatch) {
            const className = funcMatch[1];
            const separator = funcMatch[2] as ':' | '.';
            const methodName = funcMatch[3];

            const params: LuaParam[] = [];
            const returns: LuaReturn[] = [];
            const generics: string[] = [];

            for (const annotation of block.annotations) {
                const gm = annotation.match(RE_GENERIC);

                if (gm) {
                    generics.push(gm[1]);
                    continue;
                }

                const pm = annotation.match(RE_PARAM);

                if (pm) {
                    params.push({
                        name: pm[1],
                        optional: pm[2] === '?',
                        type: parseType(pm[3]),
                        description: parseDescription(pm[4])
                    });

                    continue;
                }

                const rm = annotation.match(RE_RETURN);

                if (rm) {
                    returns.push({
                        type: parseType(rm[1]),
                        description: parseDescription(rm[2])
                    });
                }
            }

            methods.push({
                className,
                name: methodName,
                callStyle: separator === ':' ? 'colon' : 'dot',
                params,
                returns,
                generics,
                description: block.description
            });

            i++;
        }
    }

    return { filePath: file.path, classes, aliases, methods };
}

export function parseAllFiles(files: FetchedFile[]): ParsedFile[] {
    console.log(`[parse] Parsing ${files.length} Lua files...`);

    let contributed = 0;
    const results = files.map((f) => {
        const result = parseFile(f);
        const cc = result.classes.length;
        const ac = result.aliases.length;
        const mc = result.methods.length;

        if (cc > 0 || ac > 0 || mc > 0) {
            console.log(
                `  ${f.path.split('/').slice(-2).join('/')} → ${cc} class(es), ${ac} alias(es), ${mc} method(s)`
            );

            contributed++;
        }

        return result;
    });

    console.log(`[parse] ${contributed}/${files.length} files contributed declarations.`);

    return results;
}
