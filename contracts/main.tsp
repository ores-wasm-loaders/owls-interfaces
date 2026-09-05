namespace Ores.WasmLoaders;
model Asset {
  id: string;
  url: url;
  kind: "wasm" | "module" | "script" | "data" | "font";
  bytes: int64;
  sha256: string;
  prepare: boolean;
}
model Release {
  schemaVersion: 1;
  appId: string;
  release: string;
  runtime: "raw-wasm" | "wasm-bindgen" | "flutter-web";
  entrypoint: string;
  assets: Asset[];
  extensions?: Record<unknown>;
}

