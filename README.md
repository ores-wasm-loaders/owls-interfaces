# OWLS release contracts

Shared contracts for ores-wasm-loaders: TypeScript, Dart and Rust serialized types, with a strict JSON Schema for untrusted release manifests. Install the complete repository with zed-pkg; each host consumes these same contracts.

Each immutable app/release identity binds exact asset URLs, decoded byte lengths and SHA-256 hashes. An asset marked `prepare: true` is public and may be fetched speculatively without credentials or execution. Runtime host validation also checks unique IDs/URLs, an appropriate entrypoint kind, canonical HTTPS URLs and an explicit origin allowlist.

`schemas/release.schema.json` owns JSON validation. `contracts/main.tsp` is a peer service-model declaration, not a generator for JSON Schema. The TypeSpec model describes the shape; JSON Schema adds wire constraints, and hosts add semantic policy. Do not claim these are interchangeable validators.

`zed task run deps` then `zed task run check` validates package metadata and language types. Runtime and common negative-case tests live in the host libraries and the external test organization.

See https://github.com/ores-wasm-loaders/owls-interfaces/issues/1 for the release plan. Linear project exists, but new issue creation is blocked by workspace quota; branches use the GitHub issue ID until a real DEN identifier is available.
Versioned WASM release contracts for browser, Flutter and Rust hosts
