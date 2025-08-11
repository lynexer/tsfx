# TSFX React Hooks Package (@tsfx/hooks)

Utilities and React hooks for building FiveM NUI front‑ends. Written in TypeScript.

### Included: 

Providers, contexts, a typed event listener hook, visibility state, and a `fetchNui` helper for request/response to the client script.
Dev-mode helpers make browser testing painless.

## Installation

```bash
pnpm add @tsfx/hooks
# or
npm i @tsfx/hooks
# or
yarn add @tsfx/hooks
```

## Quick Start

Wrap your app:

```tsx
import React from "react";
import { NuiProvider, NuiVisibilityProvider } from "@tsfx/hooks";

export default function Root() {{
  return (
    <NuiProvider>
      <NuiVisibilityProvider>
        <App />
      </NuiVisibilityProvider>
    </NuiProvider>
  );
}}
```

Listen for events coming from the client script (Lua/JS):

```tsx
import { useNuiEvent } from "@tsfx/hooks";

function Example() {{
  useNuiEvent("setData", {{
    handler: (payload) => {{
      console.log("NUI payload:", payload);
    }},
  }});

  return <div>Listening…</div>;
}}
```

Send events to the client script and await a response:

```ts
import { fetchNui } from "@tsfx/hooks";

async function ping() {{
  const res = await fetchNui("ping", { payload: { now: Date.now() } });
  console.log("pong:", res);
}}
```

Check if you’re running in the dev browser:

```ts
import { isDevBrowser } from "@tsfx/hooks";

if (isDevBrowser()) {{
  console.log("Running in browser dev mode");
}}
```

---

## Providers & Contexts

### `NuiProvider`
Provides the NUI messaging bridge via `NuiContext`.
```tsx
import { NuiProvider } from "@tsfx/hooks";

<NuiProvider>…</NuiProvider>
```

### `NuiVisibilityProvider`
Tracks UI visibility (toggled by your client script) via `NuiVisibilityContext`.
```tsx
import { NuiVisibilityProvider } from "@tsfx/hooks";

<NuiVisibilityProvider>…</NuiVisibilityProvider>
```

### `NuiContext`
A React context that exposes the NUI bridge object your app uses internally.

```tsx
import React, { useContext } from "react";
import { NuiContext } from "@tsfx/hooks";

function Debug() {{
  const bridge = useContext(NuiContext);
  return <pre>{{JSON.stringify(bridge, null, 2)}}</pre>;
}}
```

### `NuiVisibilityContext`
A `React.Context<boolean>` that tells you if the UI should be visible.

```tsx
import React, { useContext } from "react";
import { NuiVisibilityContext } from "@tsfx/hooks";

function Gate({ children }: React.PropsWithChildren) {{
  const visible = useContext(NuiVisibilityContext);
  return visible ? <>{children}</> : null;
}}
```

---

## Hooks

### `useNuiEvent<T>(event, options)`

Strongly-typed listener for client → UI messages.

**Signature:**  
```ts
// from source: useNuiEvent<T>(
//   event: string,
//   options: UseNuiEventOptions<T>
// ): void
```

**`options` fields (typical):**
- `defaultValue?: T` — default value if no data is received
- `handler?: (data: T) => void` — optional side-effect handler when event arrives

**Example:**
```tsx
type User = { id: number; name: string };

function UsersPanel() {{
  const [users, setUsers] = React.useState<User[]>([]);

  useNuiEvent<User[]>("users:list", {{
    defaultValue: [],
    handler: (list) => setUsers(list),
  }});

  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}}
```

### `useNuiVisibility(): boolean`

Consume visibility state from `NuiVisibilityContext`.

```tsx
import { useNuiVisibility } from "@tsfx/hooks";

export function HUD() {{
  const visible = useNuiVisibility();
  return visible ? <div className="hud">HUD</div> : null;
}}
```

---

## Services

### `fetchNui<T = unknown>(event, options)`

Send an event to the client (Lua/JS) and await a typed response.

**Signature:**  
```ts
export async function fetchNui<T = unknown>(
  event: string,
  options: FetchNuiEventOptions<T> = {}
): Promise<T>;
```

**Common `options`:**
- `payload?: unknown` — payload sent with the event
- `debugReturn?: T` — return value when `isDevBrowser()` is true

**Example:**

```ts
type Balance = { amount: number; currency: string };

async function loadBalance() {{
  const balance = await fetchNui<Balance>("bank:getBalance");
  console.log(balance.amount);
}}
```

### Dev helpers

#### `isDevBrowser(): boolean`
Returns `true` when running in a regular browser (not inside FiveM). Useful for stubbing data or skipping FiveM-only code.

```ts
import { isDevBrowser } from "@tsfx/hooks";

if (isDevBrowser()) {{
  // Use fake data or open a mocked panel
}}
```

*(If you expose them in the future)* you can add utilities like `sendDevNuiEvent` / `sendDevNuiEvents` to simulate incoming messages during browser development.

---

## Full API (summary)

| Export | Kind | Purpose |
|-------|------|---------|
| `NuiProvider` | Provider | Supplies `NuiContext` (bridge) |
| `NuiVisibilityProvider` | Provider | Supplies `NuiVisibilityContext` (boolean) |
| `NuiContext` | Context | Bridge to NUI messaging |
| `NuiVisibilityContext` | Context | UI visibility state |
| `useNuiEvent<T>` | Hook | Subscribe to client → UI events |
| `useNuiVisibility` | Hook | Read visibility state |
| `fetchNui<T>` | Service | Send event and await reply |
| `isDevBrowser` | Service | Detect browser dev mode |

---

## Patterns

**Request/Response pattern**  
Use `fetchNui` for one-off RPC‑style calls; use `useNuiEvent` for push updates.

**Visibility gating**  
Wrap sections of UI behind `useNuiVisibility()` so they don’t render when hidden, which avoids expensive work when the panel is off.

**Development**  
Check `isDevBrowser()` to bypass FiveM‑only code and feed mocked events/data so you can build UI in a standard browser.

---

## TypeScript

The hooks/services are generic-friendly so you can keep end-to-end types:

```ts
type InventoryItem = { id: number; label: string };

useNuiEvent<InventoryItem[]>("inventory:update", {
  defaultValue: [],
  handler: (items) => setItems(items),
});

const items = await fetchNui<InventoryItem[]>("inventory:list");
```

---

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more information.
