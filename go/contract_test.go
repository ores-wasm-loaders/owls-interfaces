package owlsinterfaces

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"
)

func TestSharedFixturesRoundTrip(t *testing.T) {
	paths, err := filepath.Glob(filepath.Join("..", "fixtures", "valid", "*.json"))
	if err != nil {
		t.Fatal(err)
	}
	sort.Strings(paths)
	if len(paths) < 4 {
		t.Fatalf("expected shared fixture corpus, got %d files", len(paths))
	}
	sawV1, sawV2 := false, false
	for _, path := range paths {
		raw, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		release, err := DecodeRelease(bytes.NewReader(raw))
		if err != nil {
			t.Fatalf("%s: %v", path, err)
		}
		sawV1 = sawV1 || release.SchemaVersion == SchemaVersionV1
		sawV2 = sawV2 || release.SchemaVersion == SchemaVersionV2
		encoded, err := json.Marshal(release)
		if err != nil {
			t.Fatal(err)
		}
		var expected, actual any
		if err := json.Unmarshal(raw, &expected); err != nil {
			t.Fatal(err)
		}
		if err := json.Unmarshal(encoded, &actual); err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(expected, actual) {
			t.Fatalf("%s changed during projection round trip\nexpected: %#v\nactual: %#v", path, expected, actual)
		}
	}
	if !sawV1 || !sawV2 {
		t.Fatal("both schema generations must remain consumable")
	}
}

func TestDecodeReleaseRejectsUnknownFieldsAndEnums(t *testing.T) {
	unknownField := `{"schemaVersion":1,"appId":"demo","release":"r1","runtime":"raw-wasm","entrypoint":"main","assets":[],"shadowAuthority":true}`
	if _, err := DecodeRelease(strings.NewReader(unknownField)); err == nil {
		t.Fatal("unknown field was accepted")
	}
	unknownRuntime := `{"schemaVersion":1,"appId":"demo","release":"r1","runtime":"native","entrypoint":"main","assets":[]}`
	if _, err := DecodeRelease(strings.NewReader(unknownRuntime)); err == nil {
		t.Fatal("unknown runtime was accepted")
	}
}

func TestEnumWireValues(t *testing.T) {
	cases := map[any]string{
		SchemaVersionV1:          "1",
		SchemaVersionV2:          "2",
		RuntimeRawWasm:           `"raw-wasm"`,
		RuntimeWasmBindgen:       `"wasm-bindgen"`,
		RuntimeFlutterWeb:        `"flutter-web"`,
		FrameworkNone:            `"none"`,
		FrameworkLeptos:          `"leptos"`,
		FrameworkDioxus:          `"dioxus"`,
		FrameworkFlutter:         `"flutter"`,
		AssetKindWasm:            `"wasm"`,
		AssetKindModule:          `"module"`,
		AssetKindScript:          `"script"`,
		AssetKindData:            `"data"`,
		AssetKindFont:            `"font"`,
		AssetRoleBootstrap:       `"bootstrap"`,
		AssetRoleGlue:            `"glue"`,
		AssetRoleModule:          `"module"`,
		AssetRoleFallback:        `"fallback"`,
		AssetRoleChunk:           `"chunk"`,
		AssetRoleAsset:           `"asset"`,
		AssetStageCritical:       `"critical"`,
		AssetStageOptional:       `"optional"`,
		AssetStageLazy:           `"lazy"`,
		PrepareStageFetch:        `"fetch"`,
		PrepareStageCompile:      `"compile"`,
		ActivationAttachView:     `"attach-view"`,
		ActivationHydrateIslands: `"hydrate-islands"`,
		ActivationMountRoute:     `"mount-route"`,
		ActivationRunApp:         `"run-app"`,
	}
	for value, expected := range cases {
		actual, err := json.Marshal(value)
		if err != nil {
			t.Fatal(err)
		}
		if string(actual) != expected {
			t.Fatalf("%v encoded as %s, expected %s", value, actual, expected)
		}
	}
}
