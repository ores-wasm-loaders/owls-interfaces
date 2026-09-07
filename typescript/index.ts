// These are downstream wire projections. TypeSpec and authored JSON Schema remain peers.

// @contract-ir SchemaVersion enum 1|2
export type SchemaVersion = 1 | 2;

// @contract-ir RuntimeKind enum flutter-web|raw-wasm|wasm-bindgen
export type RuntimeKind = "raw-wasm" | "wasm-bindgen" | "flutter-web";

// @contract-ir FrameworkKind enum dioxus|flutter|leptos|none
export type FrameworkKind = "none" | "leptos" | "dioxus" | "flutter";

// @contract-ir AssetKind enum data|font|module|script|wasm
export type AssetKind = "wasm" | "module" | "script" | "data" | "font";

// @contract-ir AssetRole enum asset|bootstrap|chunk|fallback|glue|module
export type AssetRole = "bootstrap" | "glue" | "module" | "fallback" | "chunk" | "asset";

// @contract-ir AssetStage enum critical|lazy|optional
export type AssetStage = "critical" | "optional" | "lazy";

// @contract-ir PrepareStage enum compile|fetch
export type PrepareStage = "fetch" | "compile";

// @contract-ir ActivationMode enum attach-view|hydrate-islands|mount-route|run-app
export type ActivationMode = "attach-view" | "hydrate-islands" | "mount-route" | "run-app";

// @contract-ir AssetId scalar-like
export type AssetId = string;
// @contract-ir HttpsAssetUrl scalar-like
export type HttpsAssetUrl = string;
// @contract-ir Sha256Hex scalar-like
export type Sha256Hex = string;
// @contract-ir ApplicationId scalar-like
export type ApplicationId = string;
// @contract-ir ReleaseId scalar-like
export type ReleaseId = string;
// @contract-ir ToolchainId scalar-like
export type ToolchainId = string;
// @contract-ir EntrypointId scalar-like
export type EntrypointId = string;
// @contract-ir HostSelector scalar-like
export type HostSelector = string;
// @contract-ir IslandName scalar-like
export type IslandName = string;

export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

// @contract-ir RecordString model
export type RecordString = Readonly<Record<string, string>>;
// @contract-ir RecordUnknown model
export type RecordUnknown = Readonly<Record<string, JsonValue>>;

// @contract-ir Asset model bytes|id|kind|prepare|role|sha256|stage|url
export interface Asset {
  readonly id: AssetId;
  readonly url: HttpsAssetUrl;
  readonly kind: AssetKind;
  readonly role?: AssetRole;
  readonly stage?: AssetStage;
  readonly bytes: number;
  readonly sha256: Sha256Hex;
  readonly prepare: boolean;
}

// @contract-ir PrepareBudget model furthestStage|maxBytes|maxConcurrency
export interface PrepareBudget {
  readonly maxBytes: number;
  readonly maxConcurrency: number;
  readonly furthestStage: PrepareStage;
}

// @contract-ir Activation model hostSelector|islands|mode|routes
export interface Activation {
  readonly mode: ActivationMode;
  readonly hostSelector?: HostSelector;
  readonly islands?: readonly IslandName[];
  readonly routes?: RecordString;
}

// @contract-ir Release model activation|appId|assets|entrypoint|extensions|framework|prepareBudget|release|requiresCrossOriginIsolation|runtime|schemaVersion|toolchain
export interface Release {
  readonly schemaVersion: SchemaVersion;
  readonly appId: ApplicationId;
  readonly release: ReleaseId;
  readonly runtime: RuntimeKind;
  readonly framework?: FrameworkKind;
  readonly toolchain?: ToolchainId;
  readonly entrypoint: EntrypointId;
  readonly requiresCrossOriginIsolation?: boolean;
  readonly assets: readonly Asset[];
  readonly prepareBudget?: PrepareBudget;
  readonly activation?: Activation;
  readonly extensions?: RecordUnknown;
}

export interface LoaderEvent {
  readonly phase:
    | "prepare-start"
    | "fetch"
    | "prepared"
    | "prepare-cancelled"
    | "activate-start"
    | "activated"
    | "deactivated"
    | "error";
  readonly appId: string;
  readonly release: string;
  readonly assetId?: string;
  readonly bytes?: number;
}
