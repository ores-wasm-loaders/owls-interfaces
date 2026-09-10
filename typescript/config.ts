// Downstream `.ores-wasm.toml` semantic projection only.
// TypeSpec and authored JSON Schema remain independent peer authorities.

// @config-contract-ir ConfigVersion enum 1
export type ConfigVersion = 1;

// @config-contract-ir HostKind enum browser|flutter|rust-native|ssr|worker
export type HostKind = "browser" | "ssr" | "worker" | "rust-native" | "flutter";

// @config-contract-ir PrepareTrigger enum disabled|explicit|idle|intent
export type PrepareTrigger = "explicit" | "intent" | "idle" | "disabled";

// @config-contract-ir ConfigPrepareStage enum compile|fetch
export type ConfigPrepareStage = "fetch" | "compile";

// @config-contract-ir ActivationPolicy enum disabled|explicit|route|startup
export type ActivationPolicy = "explicit" | "route" | "startup" | "disabled";

// @config-contract-ir EnvValueType enum array|bool|double|integer|json|map|string
export type EnvValueType = "string" | "integer" | "bool" | "double" | "json" | "array" | "map";

// @config-contract-ir RepoPath scalar-like
export type RepoPath = string;
// @config-contract-ir EnvKey scalar-like
export type EnvKey = string;
// @config-contract-ir ConfigTarget scalar-like
export type ConfigTarget = string;

// @config-contract-ir ConfigPrepare model furthestStage|maxBytes|maxConcurrency|trigger
export interface ConfigPrepare {
  readonly trigger: PrepareTrigger;
  readonly maxBytes?: number;
  readonly maxConcurrency?: number;
  readonly furthestStage?: ConfigPrepareStage;
}

// @config-contract-ir ConfigActivation model policy
export interface ConfigActivation {
  readonly policy: ActivationPolicy;
}

// @config-contract-ir HostConfig model activation|allowedOrigins|enabled|kind|prepare|releaseManifest|root
export interface HostConfig {
  readonly kind: HostKind;
  readonly enabled?: boolean;
  readonly root?: RepoPath;
  readonly releaseManifest: RepoPath;
  readonly allowedOrigins?: readonly string[];
  readonly prepare?: ConfigPrepare;
  readonly activation?: ConfigActivation;
}

// @config-contract-ir HostConfigMap model
export type HostConfigMap = Readonly<Record<string, HostConfig>>;

// @config-contract-ir EnvDeclaration model env|required|target|type
export interface EnvDeclaration {
  readonly env: EnvKey;
  readonly type: EnvValueType;
  readonly target: ConfigTarget;
  readonly required?: boolean;
}

// @config-contract-ir EnvDeclarationMap model
export type EnvDeclarationMap = Readonly<Record<string, EnvDeclaration>>;

// @config-contract-ir ConfigExtensions model
export type ConfigExtensions = Readonly<Record<string, unknown>>;

// @config-contract-ir OresWasmConfig model enabled|env|extensions|hosts|strict|version
export interface OresWasmConfig {
  readonly version: ConfigVersion;
  readonly enabled: boolean;
  readonly strict?: boolean;
  readonly hosts: HostConfigMap;
  readonly env?: EnvDeclarationMap;
  readonly extensions?: ConfigExtensions;
}
