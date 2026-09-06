# owls-interfaces

Versioned WASM release contracts for browser, Flutter and Rust hosts.

A release describes itself: what it is made of, what may be prepared before a visitor asks
for it, and what activation means. Hosts validate untrusted JSON with `parseRelease` before
using any of it.

## release-v2

v2 is a strict superset of v1 — every v1 document still validates and still means exactly
what it meant. It adds what a host needs in order to prepare *well* rather than merely
prepare:

| Added | Why |
| --- | --- |
| `assets[].role` | `bootstrap` / `glue` / `module` / `fallback` / `chunk` / `asset`. Lets a host prepare the startup variant the runtime will actually use instead of every variant — a Flutter page no longer pulls both the WasmGC module and the full JS fallback. |
| `assets[].stage` | `critical` / `optional` / `lazy`, refining v1's boolean `prepare`, which remains the authority on whether an asset may be fetched speculatively at all. Absent means derived: `prepare:true` → critical, `false` → lazy. |
| `prepareBudget` | The publisher's ceiling on speculative work: bytes, concurrency, and how far preparation may go (`fetch`, or `compile` where a runtime's init can accept a module). |
| `activation` | `attach-view` / `hydrate-islands` / `mount-route` / `run-app`, plus the islands or route→chunk map the build actually emitted. |
| `framework` | Which activation shape, where the runtime alone does not say: Leptos and Dioxus are both wasm-bindgen runtimes that activate differently. |
| `requiresCrossOriginIsolation` | True only for Flutter's threaded renderer — not a property of WebAssembly, and not something to apply fleet-wide by reflex. |
| `toolchain` | What produced the build. |

## The invariants a schema cannot state

`releaseProblems()` checks them, and `parseRelease` refuses a release that fails any:

- the entrypoint exists and its kind matches the runtime;
- asset ids and URLs are unique;
- every asset URL is canonical HTTPS on an allowed origin (no credentials, query or fragment);
- a wasm-bindgen release has a wasm module beside its glue;
- `prepareBudget.maxBytes` covers the release's own critical bytes — a budget that guarantees
  truncation is a bug that looks like a mysterious slow start;
- a flutter-web release does not claim the `compile` stage: its generated bootstrap owns
  compilation, so a separately compiled module has nowhere to go;
- the activation mode is one the runtime can perform, island hydration names its islands, and
  every declared route maps to a declared asset.

## Authorities

`schemas/release.schema.json` is the wire authority. `contracts/main.tsp` is its independent
TypeSpec peer — neither is generated from the other, and a test asserts they describe the same
release, so a change to one that is not mirrored in the other fails the build rather than
drifting. TypeScript, Dart and Rust projections live beside them.

Validation is dependency-free: no build step and no registry, because this package is
consumed by the first script a page runs.

```sh
node --test test/*.test.mjs
```
