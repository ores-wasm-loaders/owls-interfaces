use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub const RELEASE_SCHEMA: &str = include_str!("../../schemas/release.schema.json");

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Runtime { RawWasm, WasmBindgen, FlutterWeb }
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AssetKind { Wasm, Module, Script, Data, Font }
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Asset {
    pub id: String,
    pub url: String,
    pub kind: AssetKind,
    pub bytes: u64,
    pub sha256: String,
    pub prepare: bool,
}
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Release {
    pub schema_version: u8,
    pub app_id: String,
    pub release: String,
    pub runtime: Runtime,
    pub entrypoint: String,
    pub assets: Vec<Asset>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub extensions: BTreeMap<String, serde_json::Value>,
}

