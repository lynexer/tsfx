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
    sourceFile: string;
}

/** A class declaration parsed from @class annotations */
export interface LuaClass {
    name: string;
    parent?: string;
    fields: LuaField[];
    methods: LuaMethod[];
    description: string;
    sourceFile: string;
}

/** A top-level factory method on the TSFX global (e.g. TSFX.Player) */
export interface TsfxFactory {
    name: string;
    params: LuaParam[];
    returns: LuaReturn[];
    description: string;
}

/** The fully-merged model ready for emission */
export interface SdkModel {
    classes: Map<string, LuaClass>;
    tsfxFactories: TsfxFactory[];
}

export interface ParsedFile {
    filePath: string;
    classes: RawClass[];
    methods: RawMethod[];
}

export interface RawClass {
    name: string;
    parent?: string;
    description: string;
    fields: LuaField[];
}

export interface RawMethod {
    className: string;
    name: string;
    callStyle: 'colon' | 'dot';
    params: LuaParam[];
    returns: LuaReturn[];
    description: string;
}
