import type { FetchedFile } from './fetch.js';
import type { LuaParam, LuaReturn, ParsedFile, RawClass, RawMethod } from './types.js';

/** Matches: --- @class Foo [: Bar]  (with optional leading whitespace) */
const RE_CLASS = /^---\s*@class\s+([\w.]+)(?:\s*:\s*([\w.]+))?/;

/** Matches: --- @field [modifier] name[?] type [description] */
const RE_FIELD =
    /^---\s*@field\s+(?:public\s+|private\s+|protected\s+)?([\w]+)(\?)?(?:\s+([\w|.<>[\]?]+))?(.*)?$/;

/** Matches: --- @param name[?] type [description] */
const RE_PARAM = /^---\s*@param\s+([\w.]+)(\?)?(?:\s+([\w|.<>[\]?]+))?(.*)?$/;

/** Matches: --- @return type [name] [description] */
const RE_RETURN = /^---\s*@return\s+([\w|.<>[\]?]+)(?:\s+([\w]+))?(.*)?$/;

/** Matches: function ClassName:MethodName(...) or function ClassName.MethodName(...) */
const RE_FUNCTION = /^(?:local\s+)?function\s+([\w]+)([:.])([\w]+)\s*\(/;

/** Matches a plain description comment: --- Some text (not starting with @) */
const RE_DESC = /^---\s+(?!@)(.*)/;

function parseType(raw: string | undefined): string {
    if (!raw) return 'any';
    return raw.trim();
}

function parseDescription(raw: string | undefined): string {
    if (!raw) return '';
    return raw.trim().replace(/^[-–—]\s*/, '');
}

/**
 * Parses a single Lua source file and extracts all annotation blocks.
 */
export function parseFile(file: FetchedFile): ParsedFile {
    const lines = file.content.split('\n');
    const classes: RawClass[] = [];
    const methods: RawMethod[] = [];

    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (line.startsWith('---')) {
            const block = collectAnnotationBlock(lines, i);
            i += block.lines.length;

            const nextLine = lines[i]?.trim() ?? '';

            const classMatch = block.annotations.find((a) => RE_CLASS.test(a));

            if (classMatch) {
                const m = RE_CLASS.exec(classMatch);
                if (!m) continue;

                const cls: RawClass = {
                    name: m[1],
                    parent: m[2],
                    description: block.description,
                    fields: []
                };

                for (const annotation of block.annotations) {
                    const fm = annotation.match(RE_FIELD);

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

                for (const annotation of block.annotations) {
                    const pm = annotation.match(RE_PARAM);
                    if (pm) {
                        params.push({
                            name: pm[1],
                            optional: pm[2] === '?',
                            type: parseType(pm[3]),
                            description: parseDescription(pm[4])
                        });
                    }

                    const rm = annotation.match(RE_RETURN);
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
                continue;
            }

            continue;
        }

        i++;
    }

    return {
        filePath: file.path,
        classes,
        methods
    };
}

interface AnnotationBlock {
    annotations: string[];
    description: string;
    lines: string[];
}

/**
 * Starting at line `startIndex`, collects contiguous `---` lines into a
 * single annotation block. Returns when a non-`---` line is hit.
 */
function collectAnnotationBlock(lines: string[], startIndex: number): AnnotationBlock {
    const annotations: string[] = [];
    const descParts: string[] = [];
    const consumed: string[] = [];

    let i = startIndex;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line.startsWith('---')) break;

        consumed.push(lines[i]);

        const descMatch = line.match(RE_DESC);

        if (descMatch) {
            descParts.push(descMatch[1].trim());
        } else if (/^---\s*@/.test(line)) {
            annotations.push(line);
        }

        i++;
    }

    return {
        annotations,
        description: descParts.join(' ').trim(),
        lines: consumed
    };
}

export function parseAllFiles(files: FetchedFile[]): ParsedFile[] {
    console.log(`[parse] Parsing ${files.length} Lua files...`);

    const parsed = files.map((f) => {
        const result = parseFile(f);
        const classCount = result.classes.length;
        const methodCount = result.methods.length;

        if (classCount > 0 || methodCount > 0) {
            console.log(
                `  ${f.path.split('/').slice(-2).join('/')} → ${classCount} class(es), ${methodCount} method(s)`
            );
        }

        return result;
    });

    return parsed;
}
