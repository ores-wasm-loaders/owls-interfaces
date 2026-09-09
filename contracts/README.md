# Release contract authorities

`main.tsp` and `../schemas/release.schema.json` are independently authored peer authorities.
Neither file is generated from the other and neither has precedence.

CI uses the immutable, reviewed `ORESoftware/typespec-json-schema-validator` (`tjsv`) revision
pinned in `.github/workflows/contract.yml`. It compiles TypeSpec into a temporary **Schema B**
with the official TypeSpec JSON Schema emitter, compares its declaration inventory and normalized
semantics with independently authored **Schema A**, and runs differential instance probes. The
emitted file is evidence only; it is never committed over Schema A.

The checked-in release fixtures are also staged into TJSV's `Release/valid` instance corpus in CI.
That makes real Leptos, Dioxus, Flutter, and legacy release payloads a third independently maintained
semantic witness: both authored authorities must accept every fixture. The corpus is copied only into
the ephemeral evidence directory; the authored fixtures remain the source files under `fixtures/`.

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

CI verifies that evidence twice. First, the canonical TJSV
`actions/verify-contract-ir` consumer gate rebuilds the current source closure and requires the
complete 23-declaration `Ores.WasmLoaders.*` inventory before writing a self-digesting
`consumer-verification.json` receipt. Second, the repository-local verifier reloads the current
TypeSpec source, generated Schema B, authored Schema A, receipt, and Contract IR and calls the
validator's `verifyContractIr()` API. Promotion stops unless both checks remain self-consistent,
match the exact source closure, preserve `precedence: none`, and admit the expected declarations.
A stopped or failed parity run leaves no stale evidence that can be treated as current admission.

The five current language projections are then checked against the admitted Contract IR before
their native compile/test jobs run: TypeScript, Rust, Dart, Go, and Gleam must expose the complete
admitted declaration set and matching enum/model members. The parity receipt, Schema B, SARIF,
Contract IR, consumer verification, runtime corpus, and projection evidence are uploaded together
as short-lived CI evidence. None is promoted to editable authority.

Any future TypeScript, Dart, Rust, Go, Gleam, Protobuf, WIT, OpenAPI, SQL, ORM, client, or server
projection must bind itself to current parity-approved evidence and reject missing, stale, tampered,
incomplete, or tombstoned inputs. New language/runtime support does not weaken the peer-authority
rule: unexplained divergence remains `STOPPED_FOR_EVALUATION` rather than choosing a preferred lane.
