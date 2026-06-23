/** A single @param annotation parsed from a Lua doc block */
export interface LuaParam {
    name: string;
    type: string;
    optional: boolean;
    description: string;
}

/** A single @return annotation parsed from a Lua doc block */
export interface LuaReturn {
    type: string;
    name?: string;
    description: string;
}

/** A single @field annotation (used on @class declarations) */
export interface LuaField {
    name: string;
    type: string;
    optional: boolean;
    description: string;
}

/** A method defined on a class (from facade.lua function bodies) */
export interface LuaMethod {
    name: string;
    className: string;
    callStyle: 'colon' | 'dot';
    params: LuaParam[];
    returns: LuaReturn[];
    description: string;
    chainable: boolean;
    generics: string[];
    sourceFile: string;
}

/** A class declaration parsed from @class annotations */
export interface LuaClass {
    name: string;
    parent?: string;
    fields: LuaField[];
    methods: LuaMethod[];
    description: string;
    globalName?: string;
    sourceFile: string;
}

/**
 * An alias declaration parsed from @alias annotations.
 * The RHS is kept verbatim so it can be re-emitted as-is.
 *   e.g.  ---@alias AwaitFn fun(condition: ..., timeout: ...): T?, string?
 */
export interface LuaAlias {
    name: string;
    typeExpr: string;
    generics: string[];
    description: string;
    sourceFile: string;
}

/** A top-level field on the TSFXClass (dot-notation access off the TSFX global) */
export interface TsfxField {
    name: string;
    typeExpr: string;
    description: string;
}

/** The fully-merged, reachability-pruned model ready for emission */
export interface SdkModel {
    classes: Map<string, LuaClass>;
    aliases: Map<string, LuaAlias>;
    tsfxFields: TsfxField[];
}

export interface ParsedFile {
    filePath: string;
    classes: RawClass[];
    aliases: RawAlias[];
    methods: RawMethod[];
}

export interface RawClass {
    name: string;
    parent?: string;
    description: string;
    fields: LuaField[];
    globalName?: string;
}

export interface RawAlias {
    name: string;
    typeExpr: string;
    generics: string[];
    description: string;
}

export interface RawMethod {
    className: string;
    name: string;
    callStyle: 'colon' | 'dot';
    params: LuaParam[];
    returns: LuaReturn[];
    description: string;
    generics: string[];
}
