/** JSON Schema is the wire authority. Hosts validate untrusted JSON before use. */
export interface Asset {
  readonly id: string;
  readonly url: string;
  readonly kind: "wasm" | "module" | "script" | "data" | "font";
  readonly bytes: number;
  readonly sha256: string;
  readonly prepare: boolean;
}
export interface Release {
  readonly schemaVersion: 1;
  readonly appId: string;
  readonly release: string;
  readonly runtime: "raw-wasm" | "wasm-bindgen" | "flutter-web";
  readonly entrypoint: string;
  readonly assets: readonly Asset[];
  readonly extensions?: Readonly<Record<string, unknown>>;
}
export interface LoaderEvent {
  readonly phase: "fetch" | "prepared" | "activated" | "error";
  readonly appId: string;
  readonly release: string;
  readonly assetId?: string;
  readonly bytes?: number;
}

