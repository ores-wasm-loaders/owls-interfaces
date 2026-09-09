# owls-interfaces

Versioned WASM release contracts and language projections for browser, Flutter, Rust, Go, and
Gleam hosts.

A release describes what it contains, what may be prepared before a visitor explicitly starts an
application, and how the selected framework activates. Hosts validate untrusted JSON against the
authored schema and host invariants before using it.

## release-v2

v2 is a strict superset of v1: every v1 document remains consumable. It adds the information a
shared loader needs to prepare only the selected runtime path and preserve framework ownership.

| Added | Purpose |
| --- | --- |
| `assets[].role` | Distinguishes bootstrap, generated glue, module, fallback, chunk, and ordinary assets. |
| `assets[].stage` | Grades critical, optional, and lazy assets while retaining `prepare` as the speculative-fetch authority. |
| `prepareBudget` | Sets publisher byte, concurrency, and preparation-stage ceilings. |
| `activation` | Declares attach-view, island hydration, route mounting, or ordinary application startup. |
| `framework` | Distinguishes Leptos, Dioxus, Flutter, or no browser framework where the runtime alone is insufficient. |
| `requiresCrossOriginIsolation` | Records the release-specific isolation requirement rather than applying it to all Wasm. |
| `toolchain` | Identifies the build toolchain that produced the release. |

`releaseProblems()` enforces invariants that JSON Schema alone cannot express: matching
entrypoints, unique identities, canonical HTTPS origins, wasm-bindgen module pairing, coherent
preparation budgets, supported activation modes, named islands, and declared route chunks.

## Independent authorities and Contract IR

`contracts/main.tsp` and `schemas/release.schema.json` are independently authored peer authorities.
Neither is generated from or ranked above the other. CI uses an immutable commit of
[`ORESoftware/typespec-json-schema-validator`](https://github.com/ORESoftware/typespec-json-schema-validator)
to emit a temporary JSON Schema B from TypeSpec, perform declaration and semantic comparison, run
differential probes, and stop on any unexplained difference.

The same admitted Contract IR is then checked against the TypeScript, Rust, Dart, Go, and Gleam
projections. This keeps the browser, native Rust, Flutter/Dart, Go, and BEAM-facing contract surfaces
bound to one parity receipt without making either authored authority derivative of the other.

A passing run emits deterministic Contract IR and immediately verifies it against the exact receipt
and input digests. Contract IR and Schema B are downstream evidence only; they are never committed
over either authored source.

## Five language projections

The admitted declaration set is projected into:

| Language | Location | Compatibility |
| --- | --- | --- |
| TypeScript | `typescript/index.ts` and `index.d.ts` | v1 and v2 structural types; both files must be byte-identical. |
| Rust | `rust/src/v2.rs` | Complete v2 module; legacy root v1 structs remain intact for current native hosts. |
| Dart | `dart/lib/owls_interfaces.dart` | Immutable v1/v2 JSON models and closed wire enums. |
| Go | `go/contract.go` | Strict decoding, closed wire enums, and v1/v2 fixture round trips. |
| Gleam | `gleam/src/owls_interfaces.gleam` | Dependency-free custom types and explicit wire conversions. |

Each projection carries machine-readable `@contract-ir` markers. After Contract IR admission,
`scripts/check-language-projections.mjs` requires every language to contain the exact declaration
set, model-property sets, and enum domains. It writes a deterministic projection receipt containing
the Contract IR ID, parity receipt run ID, every assertion digest, and each projection source hash.
The marker and receipt layer detects projection drift; it does not replace schema or host validation.

CI compiles and tests every language with exact toolchain versions. Rust, Dart, and Go round-trip the
shared v1/v2 fixture corpus; the Node suite checks package contents and projection policy.

```sh
node --test test/*.test.mjs
npm ci --ignore-scripts
npm run typecheck
(cd rust && cargo test --locked)
(cd go && go test ./...)
(cd dart && dart pub get --enforce-lockfile && dart run bin/fixture_check.dart)
(cd gleam && gleam check)
```
