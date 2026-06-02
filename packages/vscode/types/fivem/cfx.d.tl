-- cfx.d.tl
-- Core cfxlua/FiveM global type definitions.
-- These cover the Citizen API, event system, exports, and runtime globals
-- available in both client and server contexts unless noted.

global record Citizen
  -- Scheduling / timing
  CreateThread: function(fn: function())
  Wait: function(ms: integer)
  SetTimeout: function(ms: integer, fn: function())

  -- Resource lifecycle
  GetCurrentResourceName: function(): string
  GetResourceState: function(resourceName: string): string

  -- Invokation
  InvokeNative: function(hash: any, ...: any): any

  -- Networking / replication
  Trace: function(msg: string)
end

-- cfxlua exposes these as bare globals aliasing Citizen.*
global CreateThread: function(fn: function())
global SetTimeout: function(ms: integer, fn: function())

-- Variadic event/trigger globals
global AddEventHandler: function(eventName: string, handler: function)
global RemoveEventHandler: function(eventName: string, handler: function)

global TriggerEvent: function(eventName: string, ...: any)
global TriggerServerEvent: function(eventName: string, ...: any)
global TriggerClientEvent: function(eventName: string, source: integer, ...: any)
global TriggerNetEvent: function(eventName: string, ...: any)

global RegisterNetEvent: function(eventName: string, handler?: function)

-- exports object: allows calling exports from other resources
global exports: {string: {string: function}}

-- Vector types
global record vector2
  x: number
  y: number
end

global record vector3
  x: number
  y: number
  z: number
end

global record vector4
  x: number
  y: number
  z: number
  w: number
end

-- Type aliases for native handle types (all integers under the hood)
global type Hash    = integer
global type Entity  = integer
global type Player  = integer
global type Ped     = integer
global type Vehicle = integer
global type Object  = integer
global type Blip    = integer
global type Cam     = integer
global type Pickup  = integer

-- Server-side globals
-- Note: GetPlayerIdentifier and GetNumPlayerIdentifiers are also declared in
-- the generated server natives — omitting them here to avoid redeclaration.
global GetInvokingResource: function(): string
global source: integer
