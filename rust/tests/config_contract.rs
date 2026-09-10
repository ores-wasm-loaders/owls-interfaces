use owls_interfaces::config::{
    ActivationPolicy, ConfigActivation, ConfigPrepare, ConfigPrepareStage, ConfigVersion,
    EnvDeclaration, EnvValueType, HostConfig, HostKind, OresWasmConfig, PrepareTrigger,
};
use serde_json::json;
use std::collections::BTreeMap;

#[test]
fn config_projection_round_trips_the_admitted_wire_shape() {
    let hosts = BTreeMap::from([(
        "native".to_owned(),
        HostConfig {
            kind: HostKind::RustNative,
            enabled: Some(true),
            root: Some("./dist".to_owned()),
            release_manifest: "./dist/release.json".to_owned(),
            allowed_origins: Some(vec!["https://example.test".to_owned()]),
            prepare: Some(ConfigPrepare {
                trigger: PrepareTrigger::Intent,
                max_bytes: Some(8_388_608),
                max_concurrency: Some(4),
                furthest_stage: Some(ConfigPrepareStage::Compile),
            }),
            activation: Some(ConfigActivation {
                policy: ActivationPolicy::Explicit,
            }),
        },
    )]);
    let env = BTreeMap::from([(
        "feature".to_owned(),
        EnvDeclaration {
            env: "OWLS_FEATURE".to_owned(),
            value_type: EnvValueType::Bool,
            target: "native".to_owned(),
            required: Some(true),
        },
    )]);
    let config = OresWasmConfig {
        version: ConfigVersion::V1,
        enabled: true,
        strict: Some(true),
        hosts,
        env: Some(env),
        extensions: Some(BTreeMap::from([("owner".to_owned(), json!("DEN-3959"))])),
    };

    let value = serde_json::to_value(&config).expect("config must serialize");
    assert_eq!(value["version"], json!(1));
    assert_eq!(value["hosts"]["native"]["kind"], json!("rust-native"));
    assert_eq!(
        value["hosts"]["native"]["prepare"]["trigger"],
        json!("intent")
    );
    assert_eq!(
        value["hosts"]["native"]["prepare"]["furthestStage"],
        json!("compile")
    );
    assert_eq!(
        value["hosts"]["native"]["activation"]["policy"],
        json!("explicit")
    );
    assert_eq!(value["env"]["feature"]["type"], json!("bool"));

    let decoded: OresWasmConfig =
        serde_json::from_value(value).expect("serialized config must round-trip");
    assert_eq!(decoded, config);
}

#[test]
fn config_projection_rejects_an_unknown_version() {
    let invalid = json!({
        "version": 2,
        "enabled": true,
        "hosts": {}
    });
    assert!(serde_json::from_value::<OresWasmConfig>(invalid).is_err());
}
