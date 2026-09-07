use owls_interfaces::v2::{
    ActivationMode, AssetKind, AssetRole, AssetStage, FrameworkKind, PrepareStage, Release,
    RuntimeKind, SchemaVersion,
};
use serde_json::{Value, json};
use std::fs;
use std::path::PathBuf;

fn fixture_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../fixtures/valid")
}

#[test]
fn every_shared_fixture_round_trips_without_losing_v2_fields() {
    let mut names = fs::read_dir(fixture_dir())
        .expect("fixture directory")
        .map(|entry| entry.expect("fixture entry").path())
        .filter(|path| {
            path.extension().and_then(|extension| extension.to_str()) == Some("json")
        })
        .collect::<Vec<_>>();
    names.sort();
    assert!(names.len() >= 4, "expected the shared release fixture corpus");

    let mut saw_v1 = false;
    let mut saw_v2 = false;
    for path in names {
        let source = fs::read_to_string(&path).expect("fixture source");
        let expected: Value = serde_json::from_str(&source).expect("fixture JSON");
        let release: Release = serde_json::from_value(expected.clone()).unwrap_or_else(|error| {
            panic!("{} did not deserialize: {error}", path.display())
        });
        saw_v1 |= release.schema_version == SchemaVersion::V1;
        saw_v2 |= release.schema_version == SchemaVersion::V2;
        assert_eq!(
            serde_json::to_value(release).expect("serialize release"),
            expected,
            "{} did not round trip",
            path.display()
        );
    }
    assert!(saw_v1 && saw_v2, "both schema generations must remain consumable");
}

#[test]
fn enum_wire_values_match_the_contract() {
    let cases: &[(&str, Value)] = &[
        ("raw-wasm", json!(RuntimeKind::RawWasm)),
        ("wasm-bindgen", json!(RuntimeKind::WasmBindgen)),
        ("flutter-web", json!(RuntimeKind::FlutterWeb)),
        ("none", json!(FrameworkKind::None)),
        ("leptos", json!(FrameworkKind::Leptos)),
        ("dioxus", json!(FrameworkKind::Dioxus)),
        ("flutter", json!(FrameworkKind::Flutter)),
        ("wasm", json!(AssetKind::Wasm)),
        ("module", json!(AssetKind::Module)),
        ("script", json!(AssetKind::Script)),
        ("data", json!(AssetKind::Data)),
        ("font", json!(AssetKind::Font)),
        ("bootstrap", json!(AssetRole::Bootstrap)),
        ("glue", json!(AssetRole::Glue)),
        ("module", json!(AssetRole::Module)),
        ("fallback", json!(AssetRole::Fallback)),
        ("chunk", json!(AssetRole::Chunk)),
        ("asset", json!(AssetRole::Asset)),
        ("critical", json!(AssetStage::Critical)),
        ("optional", json!(AssetStage::Optional)),
        ("lazy", json!(AssetStage::Lazy)),
        ("fetch", json!(PrepareStage::Fetch)),
        ("compile", json!(PrepareStage::Compile)),
        ("attach-view", json!(ActivationMode::AttachView)),
        ("hydrate-islands", json!(ActivationMode::HydrateIslands)),
        ("mount-route", json!(ActivationMode::MountRoute)),
        ("run-app", json!(ActivationMode::RunApp)),
    ];
    for (wire, value) in cases {
        assert_eq!(value, json!(wire));
    }
}

#[test]
fn unknown_release_fields_are_rejected() {
    let source = fs::read_to_string(fixture_dir().join("legacy-v1.json")).expect("fixture");
    let mut value: Value = serde_json::from_str(&source).expect("JSON");
    value["untrackedAuthority"] = json!(true);
    assert!(serde_json::from_value::<Release>(value).is_err());
}
