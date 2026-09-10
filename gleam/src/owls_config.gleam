// Downstream `.ores-wasm.toml` semantic projection only.
// TypeSpec and authored JSON Schema remain independent peer authorities.

pub type Maybe(value) {
  Absent
  Present(value)
}

pub type JsonValue {
  JsonNull
  JsonBool(Bool)
  JsonInt(Int)
  JsonFloat(Float)
  JsonString(String)
  JsonArray(List(JsonValue))
  JsonObject(List(#(String, JsonValue)))
}

// @config-contract-ir ConfigVersion enum 1
pub type ConfigVersion {
  ConfigV1
}

// @config-contract-ir HostKind enum browser|flutter|rust-native|ssr|worker
pub type HostKind {
  Browser
  Ssr
  Worker
  RustNative
  Flutter
}

// @config-contract-ir PrepareTrigger enum disabled|explicit|idle|intent
pub type PrepareTrigger {
  Explicit
  Intent
  Idle
  Disabled
}

// @config-contract-ir ConfigPrepareStage enum compile|fetch
pub type ConfigPrepareStage {
  Fetch
  Compile
}

// @config-contract-ir ActivationPolicy enum disabled|explicit|route|startup
pub type ActivationPolicy {
  ActivationExplicit
  Route
  Startup
  ActivationDisabled
}

// @config-contract-ir EnvValueType enum array|bool|double|integer|json|map|string
pub type EnvValueType {
  EnvString
  EnvInteger
  EnvBool
  EnvDouble
  EnvJson
  EnvArray
  EnvMap
}

// @config-contract-ir RepoPath scalar-like
pub type RepoPath =
  String

// @config-contract-ir EnvKey scalar-like
pub type EnvKey =
  String

// @config-contract-ir ConfigTarget scalar-like
pub type ConfigTarget =
  String

// @config-contract-ir ConfigPrepare model furthestStage|maxBytes|maxConcurrency|trigger
pub type ConfigPrepare {
  ConfigPrepare(
    trigger: PrepareTrigger,
    max_bytes: Maybe(Int),
    max_concurrency: Maybe(Int),
    furthest_stage: Maybe(ConfigPrepareStage),
  )
}

// @config-contract-ir ConfigActivation model policy
pub type ConfigActivation {
  ConfigActivation(policy: ActivationPolicy)
}

// @config-contract-ir HostConfig model activation|allowedOrigins|enabled|kind|prepare|releaseManifest|root
pub type HostConfig {
  HostConfig(
    kind: HostKind,
    enabled: Maybe(Bool),
    root: Maybe(RepoPath),
    release_manifest: RepoPath,
    allowed_origins: Maybe(List(String)),
    prepare: Maybe(ConfigPrepare),
    activation: Maybe(ConfigActivation),
  )
}

// @config-contract-ir HostConfigMap model
pub type HostConfigMap =
  List(#(String, HostConfig))

// @config-contract-ir EnvDeclaration model env|required|target|type
pub type EnvDeclaration {
  EnvDeclaration(
    env: EnvKey,
    value_type: EnvValueType,
    target: ConfigTarget,
    required: Maybe(Bool),
  )
}

// @config-contract-ir EnvDeclarationMap model
pub type EnvDeclarationMap =
  List(#(String, EnvDeclaration))

// @config-contract-ir ConfigExtensions model
pub type ConfigExtensions =
  List(#(String, JsonValue))

// @config-contract-ir OresWasmConfig model enabled|env|extensions|hosts|strict|version
pub type OresWasmConfig {
  OresWasmConfig(
    version: ConfigVersion,
    enabled: Bool,
    strict: Maybe(Bool),
    hosts: HostConfigMap,
    env: Maybe(EnvDeclarationMap),
    extensions: Maybe(ConfigExtensions),
  )
}

pub fn config_version_to_int(version: ConfigVersion) -> Int {
  case version {
    ConfigV1 -> 1
  }
}

pub fn host_kind_to_wire(kind: HostKind) -> String {
  case kind {
    Browser -> "browser"
    Ssr -> "ssr"
    Worker -> "worker"
    RustNative -> "rust-native"
    Flutter -> "flutter"
  }
}

pub fn prepare_trigger_to_wire(trigger: PrepareTrigger) -> String {
  case trigger {
    Explicit -> "explicit"
    Intent -> "intent"
    Idle -> "idle"
    Disabled -> "disabled"
  }
}

pub fn config_prepare_stage_to_wire(stage: ConfigPrepareStage) -> String {
  case stage {
    Fetch -> "fetch"
    Compile -> "compile"
  }
}

pub fn activation_policy_to_wire(policy: ActivationPolicy) -> String {
  case policy {
    ActivationExplicit -> "explicit"
    Route -> "route"
    Startup -> "startup"
    ActivationDisabled -> "disabled"
  }
}

pub fn env_value_type_to_wire(value: EnvValueType) -> String {
  case value {
    EnvString -> "string"
    EnvInteger -> "integer"
    EnvBool -> "bool"
    EnvDouble -> "double"
    EnvJson -> "json"
    EnvArray -> "array"
    EnvMap -> "map"
  }
}
