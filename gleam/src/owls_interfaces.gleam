// Downstream wire projection only. TypeSpec and authored JSON Schema remain peers.

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

// @contract-ir SchemaVersion enum 1|2
pub type SchemaVersion {
  SchemaV1
  SchemaV2
}

// @contract-ir RuntimeKind enum flutter-web|raw-wasm|wasm-bindgen
pub type RuntimeKind {
  RawWasm
  WasmBindgen
  FlutterWeb
}

// @contract-ir FrameworkKind enum dioxus|flutter|leptos|none
pub type FrameworkKind {
  FrameworkNone
  Leptos
  Dioxus
  Flutter
}

// @contract-ir AssetKind enum data|font|module|script|wasm
pub type AssetKind {
  Wasm
  Module
  Script
  Data
  Font
}

// @contract-ir AssetRole enum asset|bootstrap|chunk|fallback|glue|module
pub type AssetRole {
  Bootstrap
  Glue
  ModuleRole
  Fallback
  Chunk
  AssetRoleAsset
}

// @contract-ir AssetStage enum critical|lazy|optional
pub type AssetStage {
  Critical
  Optional
  Lazy
}

// @contract-ir PrepareStage enum compile|fetch
pub type PrepareStage {
  Fetch
  Compile
}

// @contract-ir ActivationMode enum attach-view|hydrate-islands|mount-route|run-app
pub type ActivationMode {
  AttachView
  HydrateIslands
  MountRoute
  RunApp
}

// @contract-ir AssetId scalar-like
pub type AssetId =
  String

// @contract-ir HttpsAssetUrl scalar-like
pub type HttpsAssetUrl =
  String

// @contract-ir Sha256Hex scalar-like
pub type Sha256Hex =
  String

// @contract-ir ApplicationId scalar-like
pub type ApplicationId =
  String

// @contract-ir ReleaseId scalar-like
pub type ReleaseId =
  String

// @contract-ir ToolchainId scalar-like
pub type ToolchainId =
  String

// @contract-ir EntrypointId scalar-like
pub type EntrypointId =
  String

// @contract-ir HostSelector scalar-like
pub type HostSelector =
  String

// @contract-ir IslandName scalar-like
pub type IslandName =
  String

// @contract-ir RecordString model
pub type RecordString =
  List(#(String, String))

// @contract-ir RecordUnknown model
pub type RecordUnknown =
  List(#(String, JsonValue))

// @contract-ir Asset model bytes|dependencies|id|kind|prepare|role|sha256|stage|url
pub type Asset {
  Asset(
    id: AssetId,
    url: HttpsAssetUrl,
    kind: AssetKind,
    role: Maybe(AssetRole),
    stage: Maybe(AssetStage),
    dependencies: Maybe(List(AssetId)),
    bytes: Int,
    sha256: Sha256Hex,
    prepare: Bool,
  )
}

// @contract-ir PrepareBudget model furthestStage|maxBytes|maxConcurrency
pub type PrepareBudget {
  PrepareBudget(
    max_bytes: Int,
    max_concurrency: Int,
    furthest_stage: PrepareStage,
  )
}

// @contract-ir Activation model hostSelector|islands|mode|routes
pub type Activation {
  Activation(
    mode: ActivationMode,
    host_selector: Maybe(HostSelector),
    islands: Maybe(List(IslandName)),
    routes: Maybe(RecordString),
  )
}

// @contract-ir Release model activation|appId|assets|entrypoint|extensions|framework|prepareBudget|release|requiresCrossOriginIsolation|runtime|schemaVersion|toolchain
pub type Release {
  Release(
    schema_version: SchemaVersion,
    app_id: ApplicationId,
    release: ReleaseId,
    runtime: RuntimeKind,
    framework: Maybe(FrameworkKind),
    toolchain: Maybe(ToolchainId),
    entrypoint: EntrypointId,
    requires_cross_origin_isolation: Maybe(Bool),
    assets: List(Asset),
    prepare_budget: Maybe(PrepareBudget),
    activation: Maybe(Activation),
    extensions: RecordUnknown,
  )
}

pub fn schema_version_to_int(version: SchemaVersion) -> Int {
  case version {
    SchemaV1 -> 1
    SchemaV2 -> 2
  }
}

pub fn runtime_kind_to_wire(runtime: RuntimeKind) -> String {
  case runtime {
    RawWasm -> "raw-wasm"
    WasmBindgen -> "wasm-bindgen"
    FlutterWeb -> "flutter-web"
  }
}

pub fn framework_kind_to_wire(framework: FrameworkKind) -> String {
  case framework {
    FrameworkNone -> "none"
    Leptos -> "leptos"
    Dioxus -> "dioxus"
    Flutter -> "flutter"
  }
}

pub fn asset_kind_to_wire(kind: AssetKind) -> String {
  case kind {
    Wasm -> "wasm"
    Module -> "module"
    Script -> "script"
    Data -> "data"
    Font -> "font"
  }
}

pub fn asset_role_to_wire(role: AssetRole) -> String {
  case role {
    Bootstrap -> "bootstrap"
    Glue -> "glue"
    ModuleRole -> "module"
    Fallback -> "fallback"
    Chunk -> "chunk"
    AssetRoleAsset -> "asset"
  }
}

pub fn asset_stage_to_wire(stage: AssetStage) -> String {
  case stage {
    Critical -> "critical"
    Optional -> "optional"
    Lazy -> "lazy"
  }
}

pub fn prepare_stage_to_wire(stage: PrepareStage) -> String {
  case stage {
    Fetch -> "fetch"
    Compile -> "compile"
  }
}

pub fn activation_mode_to_wire(mode: ActivationMode) -> String {
  case mode {
    AttachView -> "attach-view"
    HydrateIslands -> "hydrate-islands"
    MountRoute -> "mount-route"
    RunApp -> "run-app"
  }
}
