# Conformance

`contracts/` remains the structural and wire-format authority. `conformance/` owns shared, implementation-neutral behavioral expectations.

This repository starts in **scaffold-only** coverage. `conformance/cases/bootstrap.v1.json` is policy metadata only and MUST NOT be counted as a behavioral case or used to claim runtime parity.

Run `node conformance/check.mjs`. Promotion to `coverage.status = "behavioral"` requires real `ores.conformance.case/v1` behavior cases, required participants, and exact contract/corpus-digest-bound evidence for every participant. Missing or stale evidence fails closed. Runtime-specific goldens and generated evidence are never conformance authority.
