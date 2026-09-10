use serde::{Deserialize, Deserializer, Serialize, Serializer, de::Error as _};
use std::collections::BTreeMap;

// Downstream `.ores-wasm.toml` semantic projection only.
// TypeSpec and authored JSON Schema remain independent peer authorities.

// @config-contract-ir ConfigVersion enum 1
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConfigVersion {
    V1,
}

impl Serialize for ConfigVersion {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u8(1)
    }
}

impl<'de> Deserialize<'de> for ConfigVersion {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        match u8::deserialize(deserializer)? {
            1 => Ok(Self::V1),
            value => Err(D::Error::custom(format!(
                "unsupported config version {value}"
            ))),
        }
    }
}

// @config-contract-ir HostKind enum browser|flutter|rust-native|ssr|worker
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum HostKind {
    Browser,
    Ssr,
    Worker,
    RustNative,
    Flutter,
}

// @config-contract-ir PrepareTrigger enum disabled|explicit|idle|intent
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PrepareTrigger {
    Explicit,
    Intent,
    Idle,
    Disabled,
}

// @config-contract-ir ConfigPrepareStage enum compile|fetch
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConfigPrepareStage {
    Fetch,
    Compile,
}

// @config-contract-ir ActivationPolicy enum disabled|explicit|route|startup
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ActivationPolicy {
    Explicit,
    Route,
    Startup,
    Disabled,
}

// @config-contract-ir EnvValueType enum array|bool|double|integer|json|map|string
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum EnvValueType {
    String,
    Integer,
    #[serde(rename = "bool")]
    Bool,
    Double,
    Json,
    Array,
    Map,
}

// @config-contract-ir RepoPath scalar-like
pub type RepoPath = String;
// @config-contract-ir EnvKey scalar-like
pub type EnvKey = String;
// @config-contract-ir ConfigTarget scalar-like
pub type ConfigTarget = String;

// @config-contract-ir ConfigPrepare model furthestStage|maxBytes|maxConcurrency|trigger
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ConfigPrepare {
    pub trigger: PrepareTrigger,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_bytes: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_concurrency: Option<u8>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub furthest_stage: Option<ConfigPrepareStage>,
}

// @config-contract-ir ConfigActivation model policy
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ConfigActivation {
    pub policy: ActivationPolicy,
}

// @config-contract-ir HostConfig model activation|allowedOrigins|enabled|kind|prepare|releaseManifest|root
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HostConfig {
    pub kind: HostKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub enabled: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub root: Option<RepoPath>,
    pub release_manifest: RepoPath,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub allowed_origins: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prepare: Option<ConfigPrepare>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub activation: Option<ConfigActivation>,
}

// @config-contract-ir HostConfigMap model
pub type HostConfigMap = BTreeMap<String, HostConfig>;

// @config-contract-ir EnvDeclaration model env|required|target|type
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EnvDeclaration {
    pub env: EnvKey,
    #[serde(rename = "type")]
    pub value_type: EnvValueType,
    pub target: ConfigTarget,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
}

// @config-contract-ir EnvDeclarationMap model
pub type EnvDeclarationMap = BTreeMap<String, EnvDeclaration>;

// @config-contract-ir ConfigExtensions model
pub type ConfigExtensions = BTreeMap<String, serde_json::Value>;

// @config-contract-ir OresWasmConfig model enabled|env|extensions|hosts|strict|version
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct OresWasmConfig {
    pub version: ConfigVersion,
    pub enabled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub strict: Option<bool>,
    pub hosts: HostConfigMap,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub env: Option<EnvDeclarationMap>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extensions: Option<ConfigExtensions>,
}
