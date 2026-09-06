import "@typespec/json-schema";
using TypeSpec.JsonSchema;

@jsonSchema
namespace Ores.WasmLoaders;

// TypeSpec and schemas/release.schema.json are independently authored peer authorities.
// Generated JSON Schema is comparison evidence only and never replaces either source.

@id("SchemaVersion")
enum SchemaVersion {
  v1: 1,
  v2: 2,
}

@id("RuntimeKind")
enum RuntimeKind {
  rawWasm: "raw-wasm",
  wasmBindgen: "wasm-bindgen",
  flutterWeb: "flutter-web",
}

@id("FrameworkKind")
enum FrameworkKind {
  none: "none",
  leptos: "leptos",
  dioxus: "dioxus",
  flutter: "flutter",
}

@id("AssetKind")
enum AssetKind {
  wasm: "wasm",
  module: "module",
  script: "script",
  data: "data",
  font: "font",
}

@id("AssetRole")
enum AssetRole {
  bootstrap: "bootstrap",
  glue: "glue",
  module: "module",
  fallback: "fallback",
  chunk: "chunk",
  asset: "asset",
}

@id("AssetStage")
enum AssetStage {
  critical: "critical",
  optional: "optional",
  lazy: "lazy",
}

@id("PrepareStage")
enum PrepareStage {
  fetch: "fetch",
  compile: "compile",
}

@id("ActivationMode")
enum ActivationMode {
  attachView: "attach-view",
  hydrateIslands: "hydrate-islands",
  mountRoute: "mount-route",
  runApp: "run-app",
}

@id("AssetId")
@pattern("^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")
scalar AssetId extends string;

@id("HttpsAssetUrl")
@pattern("^https://[^\\s]+$")
@maxLength(4096)
scalar HttpsAssetUrl extends string;

@id("Sha256Hex")
@pattern("^[a-f0-9]{64}$")
scalar Sha256Hex extends string;

@id("ApplicationId")
@pattern("^[a-z0-9][a-z0-9-]{0,63}$")
scalar ApplicationId extends string;

@id("ReleaseId")
@pattern("^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")
scalar ReleaseId extends string;

@id("ToolchainId")
@minLength(1)
@maxLength(128)
scalar ToolchainId extends string;

@id("EntrypointId")
@minLength(1)
@maxLength(128)
scalar EntrypointId extends string;

@id("HostSelector")
@minLength(1)
@maxLength(256)
scalar HostSelector extends string;

@id("IslandName")
@minLength(1)
@maxLength(128)
scalar IslandName extends string;

@id("RecordString")
model RecordString is Record<string>;

@id("RecordUnknown")
model RecordUnknown is Record<unknown>;

@id("Asset")
model Asset {
  id: AssetId;
  url: HttpsAssetUrl;
  kind: AssetKind;
  role?: AssetRole;
  stage?: AssetStage;
  @minValue(1)
  @maxValue(268435456)
  bytes: int32;
  sha256: Sha256Hex;
  prepare: boolean;
}

@id("PrepareBudget")
model PrepareBudget {
  @minValue(0)
  @maxValue(268435456)
  maxBytes: int32;

  @minValue(1)
  @maxValue(16)
  maxConcurrency: int32;

  furthestStage: PrepareStage;
}

@id("Activation")
model Activation {
  mode: ActivationMode;
  hostSelector?: HostSelector;

  @maxItems(256)
  islands?: IslandName[];

  routes?: RecordString;
}

@id("Release")
model Release {
  schemaVersion: SchemaVersion;
  appId: ApplicationId;
  release: ReleaseId;
  runtime: RuntimeKind;
  framework?: FrameworkKind;
  toolchain?: ToolchainId;
  entrypoint: EntrypointId;
  requiresCrossOriginIsolation?: boolean;

  @minItems(1)
  @maxItems(512)
  assets: Asset[];

  prepareBudget?: PrepareBudget;
  activation?: Activation;
  extensions?: RecordUnknown;
}
