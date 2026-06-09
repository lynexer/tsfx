---@diagnostic disable: undefined-global, missing-return

-- ============================================================================
-- Manual injections
-- Stubs defined here are appended verbatim to the generated library/tsfx.lua.
-- Use this for anything that can't be auto-detected from the SDK source —
-- e.g. globally-injected helpers, context utilities, or late-bound globals.
-- ============================================================================

---Check if running in server context
---@return boolean true if running on server
function TSFXClass.isServer() end

---Check if running in client context
---@return boolean true if running on client
function TSFXClass.isClient() end