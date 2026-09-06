// TypeSpec peer of schemas/release.schema.json. Neither is generated from the other; a test
// checks that they describe the same release, so a change to one that is not mirrored in the
// other fails the build instead of drifting.
namespace Ores.WasmLoaders;

model Asset {
  id: string;
  url: url;
  kind: "wasm" | "module" | "script" | "data" | "font";
  bytes: int64;
  sha256: string;
  /** v1 authority on whether an asset may be fetched speculatively at all. */
  prepare: boolean;
  /** The part this file plays in startup, so a host can prepare only the variant it will use. */
  role?: "bootstrap" | "glue" | "module" | "fallback" | "chunk" | "asset";
  /** How eagerly. Absent means derived from `prepare`: true -> critical, false -> lazy. */
  stage?: "critical" | "optional" | "lazy";
}

model PrepareBudget {
  maxBytes: int64;
  maxConcurrency: int32;
  /** `compile` is optional and only useful where a runtime's init can accept a module. */
  furthestStage: "fetch" | "compile";
}

model Activation {
  mode: "attach-view" | "hydrate-islands" | "mount-route" | "run-app";
  hostSelector?: string;
  islands?: string[];
  routes?: Record<string>;
}

model Release {
  schemaVersion: 2;
  appId: string;
  release: string;
  /** How bytes become an instance — the host execution contract. */
  runtime: "raw-wasm" | "wasm-bindgen" | "flutter-web";
  /** Which activation shape, when the runtime alone does not say (Leptos vs Dioxus). */
  framework?: "leptos" | "dioxus" | "flutter" | "none";
  toolchain?: string;
  entrypoint: string;
  /** True only for Flutter's threaded renderer, never for WebAssembly in general. */
  requiresCrossOriginIsolation?: boolean;
  assets: Asset[];
  prepareBudget?: PrepareBudget;
  activation?: Activation;
  extensions?: Record<unknown>;
}
