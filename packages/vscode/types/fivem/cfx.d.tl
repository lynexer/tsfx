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

-- Variadic event/trigger globals use ...: any for extra payload args
global AddEventHandler: function(eventName: string, handler: function)
global RemoveEventHandler: function(eventName: string, handler: function)

global TriggerEvent: function(eventName: string, ...: any)
global TriggerServerEvent: function(eventName: string, ...: any)
global TriggerClientEvent: function(eventName: string, source: integer, ...: any)
global TriggerNetEvent: function(eventName: string, ...: any)

-- handler is optional — RegisterNetEvent can be called with just the event name
global RegisterNetEvent: function(eventName: string, handler?: function)

-- exports object: allows calling exports from other resources
-- Typed loosely since resource exports are dynamic
global exports: {string: {string: function}}

-- Standard globals available in cfxlua
global print: function(...: any)

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
global type Hash   = integer
global type Entity = integer
global type Player = integer
global type Ped    = integer
global type Vehicle = integer
global type Object  = integer
global type Blip    = integer
global type Cam     = integer
global type Pickup  = integer

-- Server-side globals
global GetInvokingResource: function(): string
global GetPlayerIdentifier: function(source: integer, index: integer): string
global GetNumPlayerIdentifiers: function(source: integer): integer
global source: integer
