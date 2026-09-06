import "@typespec/json-schema";

using TypeSpec.JsonSchema;

@jsonSchema
namespace Ores.WasmLoaders;

model Asset {
  @minLength(1)
  @maxLength(96)
  @pattern("^[A-Za-z0-9._-]+$")
  id: string;

  url: url;

  kind: "wasm" | "module" | "script" | "data" | "font";

  @minValue(1)
  @maxValue(268435456)
  bytes: int32;

  @pattern("^[0-9a-f]{64}$")
  sha256: string;

  prepare: boolean;

  role?: "bootstrap" | "glue" | "module" | "fallback" | "chunk" | "asset";

  stage?: "critical" | "optional" | "lazy";
}

model PrepareBudget {
  @minValue(1)
  @maxValue(268435456)
  maxBytes: int32;

  @minValue(1)
  @maxValue(8)
  maxConcurrency: int32;

  furthestStage: "fetch" | "compile";
}

model Activation {
  mode: "attach-view" | "hydrate-islands" | "mount-route" | "run-app";

  @minLength(1)
  @maxLength(512)
  hostSelector?: string;

  @maxItems(256)
  islands?: string[];

  routes?: Record<string>;
}

model Release {
  schemaVersion: 1 | 2;

  @minLength(2)
  @maxLength(63)
  @pattern("^[a-z][a-z0-9-]*$")
  appId: string;

  @minLength(1)
  @maxLength(128)
  @pattern("^[A-Za-z0-9._+-]+$")
  release: string;

  runtime: "raw-wasm" | "wasm-bindgen" | "flutter-web";

  framework?: "leptos" | "dioxus" | "flutter" | "none";

  @minLength(1)
  @maxLength(128)
  toolchain?: string;

  @minLength(1)
  @maxLength(96)
  @pattern("^[A-Za-z0-9._-]+$")
  entrypoint: string;

  requiresCrossOriginIsolation?: boolean;

  @minItems(1)
  @maxItems(512)
  assets: Asset[];

  prepareBudget?: PrepareBudget;
  activation?: Activation;
  extensions?: Record<unknown>;
}
