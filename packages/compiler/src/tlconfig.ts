import { execFileSync } from 'node:child_process';
import { getTlBinary } from './index.js';

export interface TlConfig {
    source_dir?: string;
    build_dir?: string;
    files?: string[];
}

/**
 * Reads and evaluates tlconfig.lua in the given project root using the tl
 * binary itself (via `tl run -e`) to avoid needing a separate Lua interpreter.
 */
export function readTlConfig(cwd: string): TlConfig {
    const tl = getTlBinary();
    const luaSnippet = `
        local cfg = dofile("tlconfig.lua")
        local parts = {}
        if cfg.source_dir then parts[#parts+1] = '"source_dir":"' .. cfg.source_dir .. '"' end
        if cfg.build_dir  then parts[#parts+1] = '"build_dir":"'  .. cfg.build_dir  .. '"' end
        if cfg.files then
        local fs = {}
        for _, f in ipairs(cfg.files) do fs[#fs+1] = '"' .. f .. '"' end
        parts[#parts+1] = '"files":[' .. table.concat(fs, ",") .. "]"
        end
        print("{" .. table.concat(parts, ",") .. "}")
    `;

    try {
        const output = execFileSync(tl, ['run', '-e', luaSnippet], {
            cwd,
            encoding: 'utf8'
        }).trim();
        return JSON.parse(output) as TlConfig;
    } catch {
        throw new Error(
            `[@tlfx/compiler] Failed to parse tlconfig.lua in ${cwd}.\n` +
                `  Make sure the file exists and is valid Lua.`
        );
    }
}
