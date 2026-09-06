# Release contract authorities

`main.tsp` and `../schemas/release.schema.json` are independently authored peer authorities.
Neither file is generated from the other and neither has precedence.

CI compiles TypeSpec into a temporary **Schema B** with the pinned official TypeSpec JSON Schema
emitter, compares its declaration inventory and normalized semantics with independently authored
**Schema A**, and runs differential instance probes. The emitted file is evidence only; it is never
committed over Schema A.

When the two authorities disagree, change both deliberately or stop for evaluation. Do not add a
mapping merely to hide a real wire-level difference. Explicit named enums, scalars, records, and
models keep declaration parity inspectable and make downstream TypeScript, Dart, Rust, Go, and
Gleam projections deterministic.
