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
  InvokeNative: function(hash: string | integer, ...: any): any

  -- Networking / replication
  Trace: function(msg: string)
end

-- AddEventHandler is a top-level global
global AddEventHandler: function(eventName: string, handler: function(...: any))

-- RemoveEventHandler
global RemoveEventHandler: function(eventName: string, handler: function(...: any))

-- TriggerEvent (shared/local)
global TriggerEvent: function(eventName: string, ...: any)

-- TriggerServerEvent (client-side only)
global TriggerServerEvent: function(eventName: string, ...: any)

-- TriggerClientEvent (server-side only)
global TriggerClientEvent: function(eventName: string, source: integer, ...: any)

-- TriggerNetEvent (alias used in some contexts)
global TriggerNetEvent: function(eventName: string, ...: any)

-- RegisterNetEvent
global RegisterNetEvent: function(eventName: string, handler?: function(...: any))

-- exports object: allows calling exports from other resources
-- Usage: exports["resource-name"]:FunctionName(args)
-- Typed loosely as a table of tables since resource exports are dynamic.
global exports: {string: {string: function}}

-- print override (same as Lua standard but aliased here for completeness)
global print: function(...: any)

-- Teal-compatible type for FiveM's vector types
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

-- Common hash type alias used throughout native signatures
global type Hash = integer

-- Entity handle (integer under the hood)
global type Entity = integer
global type Player = integer
global type Ped = integer
global type Vehicle = integer
global type Object = integer
global type Blip = integer
global type Cam = integer
global type Pickup = integer

-- GetInvokingResource: returns the resource that triggered the current event (server-side)
global GetInvokingResource: function(): string

-- GetPlayerIdentifier (server-side)
global GetPlayerIdentifier: function(source: integer, index?: integer): string

-- GetNumPlayerIdentifiers (server-side)
global GetNumPlayerIdentifiers: function(source: integer): integer

-- source global (server-side: the player that triggered the event)
global source: integer
