import type { FetchedFile } from './fetch.js';
import type { LuaParam, LuaReturn, ParsedFile, RawAlias, RawClass, RawMethod } from './types.js';

/** ---@class Foo [: Bar] */
const RE_CLASS = /^---\s*@class\s+([\w.]+)(?:\s*:\s*([\w.]+))?/;

/** ---@alias Name <rest> — captures everything after the name as the type expr */
const RE_ALIAS = /^---\s*@alias\s+([\w]+)\s+(.*)/;

/** ---@generic T [: constraint] — just capture the param name(s) */
const RE_GENERIC = /^---\s*@generic\s+([\w]+)/;

/** ---@field [modifier] name[?] type [description] */
const RE_FIELD =
    /^---\s*@field\s+(?:public\s+|private\s+|protected\s+)?([\w]+)(\?)?(?:\s+([\w|.<>[\]?()\s,*:]+?))?(?:\s{2,}(.*))?$/;

/** ---@param name[?] type [description] */
const RE_PARAM = /^---\s*@param\s+([\w.]+)(\?)?(?:\s+([\w|.<>[\]?()\s,*:]+?))?(?:\s{2,}(.*))?$/;

/** ---@return type [name] [description] */
const RE_RETURN = /^---\s*@return\s+([\w|.<>[\]?()\s,*:]+?)(?:\s+([\w]+))?(?:\s{2,}(.*))?$/;

/** function ClassName:MethodName(...) or function ClassName.MethodName(...) */
const RE_FUNCTION = /^(?:local\s+)?function\s+([\w]+)([:.])([\w]+)\s*\(/;

/** Plain description: --- text not starting with @ */
const RE_DESC = /^---\s+(?!@)(.*)/;

function parseType(raw: string | undefined): string {
    if (!raw) return 'any';
    return raw.trim();
}

function parseDescription(raw: string | undefined): string {
    if (!raw) return '';
    return raw.trim().replace(/^[-–—]\s*/, '');
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
        const generics: string[] = [];

        for (const ann of block.annotations) {
            const gm = ann.match(RE_GENERIC);
            if (gm) generics.push(gm[1]);
        }

        const aliasAnn = block.annotations.find((a) => RE_ALIAS.test(a));

        if (aliasAnn) {
            const m = RE_ALIAS.exec(aliasAnn);

            if (m) {
                aliases.push({
                    name: m[1],
                    typeExpr: m[2].trim(),
                    generics,
                    description: block.description
                });
            }

            continue;
        }

        const classAnn = block.annotations.find((a) => RE_CLASS.test(a));

        if (classAnn) {
            const m = RE_CLASS.exec(classAnn);
            if (!m) continue;

            const cls: RawClass = {
                name: m[1],
                parent: m[2],
                description: block.description,
                fields: []
            };

            for (const ann of block.annotations) {
                const fm = ann.match(RE_FIELD);

                if (fm) {
                    cls.fields.push({
                        name: fm[1],
                        type: parseType(fm[3]),
                        optional: fm[2] === '?',
                        description: parseDescription(fm[4])
                    });
                }
            }

            classes.push(cls);
            continue;
        }

        const funcMatch = nextLine.match(RE_FUNCTION);

        if (funcMatch) {
            const className = funcMatch[1];
            const separator = funcMatch[2] as ':' | '.';
            const methodName = funcMatch[3];
            const params: LuaParam[] = [];
            const returns: LuaReturn[] = [];

            for (const ann of block.annotations) {
                const pm = ann.match(RE_PARAM);

                if (pm) {
                    params.push({
                        name: pm[1],
                        optional: pm[2] === '?',
                        type: parseType(pm[3]),
                        description: parseDescription(pm[4])
                    });
                }

                const rm = ann.match(RE_RETURN);

                if (rm) {
                    returns.push({
                        type: parseType(rm[1]),
                        name: rm[2],
                        description: parseDescription(rm[3])
                    });
                }
            }

            methods.push({
                className,
                name: methodName,
                callStyle: separator === ':' ? 'colon' : 'dot',
                params,
                returns,
                description: block.description
            });

            i++;
        }
    }

    return { filePath: file.path, classes, aliases, methods };
}

export function parseAllFiles(files: FetchedFile[]): ParsedFile[] {
    console.log(`[parse] Parsing ${files.length} Lua files...`);

    return files.map((f) => {
        const result = parseFile(f);
        const cc = result.classes.length;
        const ac = result.aliases.length;
        const mc = result.methods.length;

        if (cc > 0 || ac > 0 || mc > 0) {
            console.log(
                `  ${f.path.split('/').slice(-2).join('/')} → ${cc} class(es), ${ac} alias(es), ${mc} method(s)`
            );
        }

        return result;
    });
}
