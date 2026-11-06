# OWLS v2 activation formal assurance — bounded policy

Run `python3 formal/check_release_activation.py`: a dependency-free, exhaustive **small-domain** model enumerates three host classes, three release types and 256 combinations of eight independent activation conditions. It proves only a property of this reference model: there is no accepted activation with an incompatible host, failed origin/digest/MIME/size/entrypoint/preparation check, or absent explicit user activation. A deliberately weakened start gate must produce a counterexample.

`attolang/release_activation.atto` contains an AttoLang candidate admission function with positive and negative cases. This is **not compiled guest support**. The model does not parse actual `schemas/release.schema.json`, `contracts/main.tsp`, or exercise any production projection.

## Required refinement

- Compare v1/v2 schema and independent TypeSpec authority before treating an asset as admitted. Validate strict release types, role/stage, unique identity, manifest entrypoint and selected runtime compatibility.
- Verify against the exact verified bytes and SHA-256 digest; enforce canonical HTTPS URL, allowlist, content type, byte and preparation quotas.
- Prefetch must never instantiate or activate a module without explicit user action.
- Replay all 2304 model combinations against actual browser/native/Flutter projection validators and host APIs; include negative mutations, exact SHA and nonzero executed CI steps.
- Compile and run the `.atto` fixture on each supported AttoLang backend; mark missing guest receipts as `NOT_EXECUTED`, not passing.

This small-domain model is a specification/exploration lane, **not** a production implementation proof, a schema-parity receipt, or a runtime sandbox assurance.
