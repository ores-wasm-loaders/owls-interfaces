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

## Parity-approved Contract IR

A passing parity run also emits
`.typespec-json-schema-validator/contract-ir.json` using the exact validator commit pinned in CI.
The Contract IR is downstream comparison output, not an editable third authority. It records the
independent TypeSpec and authored JSON Schema lanes, the comparison-only Schema B lane, the exact
source digests, the parity receipt digest and run ID, admitted declarations, coverage, and its own
content digest.

CI immediately reloads the current TypeSpec source, generated Schema B, authored Schema A, receipt,
and Contract IR and calls the validator's `verifyContractIr()` API. Promotion stops unless the
artifact is self-consistent, still matches the exact source closure, preserves `precedence: none`,
and admits the core `Release`, `Asset`, `PrepareBudget`, and `Activation` declarations. A stopped or
failed parity run leaves a non-admissible tombstone rather than a stale green IR.

The receipt, Schema B, SARIF presentation, Contract IR, and verification evidence are uploaded as a
single short-lived CI artifact. They are not committed into either authored lane. Any future
TypeScript, Dart, Rust, Go, Gleam, Protobuf, WIT, OpenAPI, SQL, or ORM projection must record at
least the Contract IR schema, `irId`, parity receipt `runId`, generator identity, and generator
options digest; it must reject missing, stale, tampered, incomplete, or tombstoned evidence.
