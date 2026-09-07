use serde::{Deserialize, Deserializer, Serialize, Serializer, de::Error as _};
use std::collections::BTreeMap;

// These are downstream wire projections. TypeSpec and authored JSON Schema remain peers.

// @contract-ir SchemaVersion enum 1|2
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SchemaVersion {
    V1,
    V2,
}

impl Serialize for SchemaVersion {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u8(match self {
            Self::V1 => 1,
            Self::V2 => 2,
        })
    }
}

impl<'de> Deserialize<'de> for SchemaVersion {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        match u8::deserialize(deserializer)? {
            1 => Ok(Self::V1),
            2 => Ok(Self::V2),
            value => Err(D::Error::custom(format!(
                "unsupported schemaVersion {value}"
            ))),
        }
    }
}

// @contract-ir RuntimeKind enum flutter-web|raw-wasm|wasm-bindgen
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeKind {
    RawWasm,
    WasmBindgen,
    FlutterWeb,
}

// @contract-ir FrameworkKind enum dioxus|flutter|leptos|none
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FrameworkKind {
    None,
    Leptos,
    Dioxus,
    Flutter,
}

// @contract-ir AssetKind enum data|font|module|script|wasm
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AssetKind {
    Wasm,
    Module,
    Script,
    Data,
    Font,
}

// @contract-ir AssetRole enum asset|bootstrap|chunk|fallback|glue|module
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AssetRole {
    Bootstrap,
    Glue,
    Module,
    Fallback,
    Chunk,
    Asset,
}

// @contract-ir AssetStage enum critical|lazy|optional
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AssetStage {
    Critical,
    Optional,
    Lazy,
}

// @contract-ir PrepareStage enum compile|fetch
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PrepareStage {
    Fetch,
    Compile,
}

// @contract-ir ActivationMode enum attach-view|hydrate-islands|mount-route|run-app
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ActivationMode {
    AttachView,
    HydrateIslands,
    MountRoute,
    RunApp,
}

// @contract-ir AssetId scalar-like
pub type AssetId = String;
// @contract-ir HttpsAssetUrl scalar-like
pub type HttpsAssetUrl = String;
// @contract-ir Sha256Hex scalar-like
pub type Sha256Hex = String;
// @contract-ir ApplicationId scalar-like
pub type ApplicationId = String;
// @contract-ir ReleaseId scalar-like
pub type ReleaseId = String;
// @contract-ir ToolchainId scalar-like
pub type ToolchainId = String;
// @contract-ir EntrypointId scalar-like
pub type EntrypointId = String;
// @contract-ir HostSelector scalar-like
pub type HostSelector = String;
// @contract-ir IslandName scalar-like
pub type IslandName = String;

// @contract-ir RecordString model
pub type RecordString = BTreeMap<String, String>;
// @contract-ir RecordUnknown model
pub type RecordUnknown = BTreeMap<String, serde_json::Value>;

// @contract-ir Asset model bytes|id|kind|prepare|role|sha256|stage|url
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Asset {
    pub id: AssetId,
    pub url: HttpsAssetUrl,
    pub kind: AssetKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub role: Option<AssetRole>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub stage: Option<AssetStage>,
    pub bytes: u64,
    pub sha256: Sha256Hex,
    pub prepare: bool,
}

// @contract-ir PrepareBudget model furthestStage|maxBytes|maxConcurrency
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PrepareBudget {
    pub max_bytes: u64,
    pub max_concurrency: u8,
    pub furthest_stage: PrepareStage,
}

// @contract-ir Activation model hostSelector|islands|mode|routes
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Activation {
    pub mode: ActivationMode,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub host_selector: Option<HostSelector>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub islands: Option<Vec<IslandName>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub routes: Option<RecordString>,
}

// @contract-ir Release model activation|appId|assets|entrypoint|extensions|framework|prepareBudget|release|requiresCrossOriginIsolation|runtime|schemaVersion|toolchain
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Release {
    pub schema_version: SchemaVersion,
    pub app_id: ApplicationId,
    pub release: ReleaseId,
    pub runtime: RuntimeKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub framework: Option<FrameworkKind>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub toolchain: Option<ToolchainId>,
    pub entrypoint: EntrypointId,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub requires_cross_origin_isolation: Option<bool>,
    pub assets: Vec<Asset>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prepare_budget: Option<PrepareBudget>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub activation: Option<Activation>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub extensions: RecordUnknown,
}
