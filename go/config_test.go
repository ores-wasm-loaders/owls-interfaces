package owlsinterfaces

import (
	"encoding/json"
	"testing"
)

func TestConfigProjectionWireShape(t *testing.T) {
	enabled := true
	strict := true
	root := RepoPath("./dist")
	maxBytes := uint64(8_388_608)
	maxConcurrency := uint8(4)
	stage := ConfigPrepareCompile
	required := true

	config := OresWasmConfig{
		Version: ConfigVersionV1,
		Enabled: true,
		Strict:  &strict,
		Hosts: HostConfigMap{
			"native": HostConfig{
				Kind:            HostRustNative,
				Enabled:         &enabled,
				Root:            &root,
				ReleaseManifest: RepoPath("./dist/release.json"),
				AllowedOrigins:  []string{"https://example.test"},
				Prepare: &ConfigPrepare{
					Trigger:        PrepareIntent,
					MaxBytes:       &maxBytes,
					MaxConcurrency: &maxConcurrency,
					FurthestStage:  &stage,
				},
				Activation: &ConfigActivation{Policy: ActivationExplicit},
			},
		},
		Env: EnvDeclarationMap{
			"feature": EnvDeclaration{
				Env:      EnvKey("OWLS_FEATURE"),
				Type:     EnvBool,
				Target:   ConfigTarget("native"),
				Required: &required,
			},
		},
		Extensions: ConfigExtensions{"owner": "DEN-3959"},
	}

	encoded, err := json.Marshal(config)
	if err != nil {
		t.Fatalf("marshal config: %v", err)
	}
	var wire map[string]any
	if err := json.Unmarshal(encoded, &wire); err != nil {
		t.Fatalf("decode wire JSON: %v", err)
	}

	if got := wire["version"]; got != float64(1) {
		t.Fatalf("version: got %#v, want 1", got)
	}
	hosts := requireObject(t, wire["hosts"], "hosts")
	native := requireObject(t, hosts["native"], "hosts.native")
	if got := native["kind"]; got != "rust-native" {
		t.Fatalf("hosts.native.kind: got %#v, want rust-native", got)
	}
	prepare := requireObject(t, native["prepare"], "hosts.native.prepare")
	if got := prepare["trigger"]; got != "intent" {
		t.Fatalf("hosts.native.prepare.trigger: got %#v, want intent", got)
	}
	if got := prepare["furthestStage"]; got != "compile" {
		t.Fatalf("hosts.native.prepare.furthestStage: got %#v, want compile", got)
	}
	activation := requireObject(t, native["activation"], "hosts.native.activation")
	if got := activation["policy"]; got != "explicit" {
		t.Fatalf("hosts.native.activation.policy: got %#v, want explicit", got)
	}
	env := requireObject(t, wire["env"], "env")
	feature := requireObject(t, env["feature"], "env.feature")
	if got := feature["type"]; got != "bool" {
		t.Fatalf("env.feature.type: got %#v, want bool", got)
	}
}

func TestConfigEnumWireValues(t *testing.T) {
	tests := []struct {
		label string
		got   string
		want  string
	}{
		{"HostBrowser", string(HostBrowser), "browser"},
		{"HostSSR", string(HostSSR), "ssr"},
		{"HostWorker", string(HostWorker), "worker"},
		{"HostRustNative", string(HostRustNative), "rust-native"},
		{"HostFlutter", string(HostFlutter), "flutter"},
		{"PrepareExplicit", string(PrepareExplicit), "explicit"},
		{"PrepareIntent", string(PrepareIntent), "intent"},
		{"PrepareIdle", string(PrepareIdle), "idle"},
		{"PrepareDisabled", string(PrepareDisabled), "disabled"},
		{"ConfigPrepareFetch", string(ConfigPrepareFetch), "fetch"},
		{"ConfigPrepareCompile", string(ConfigPrepareCompile), "compile"},
		{"ActivationExplicit", string(ActivationExplicit), "explicit"},
		{"ActivationRoute", string(ActivationRoute), "route"},
		{"ActivationStartup", string(ActivationStartup), "startup"},
		{"ActivationDisabled", string(ActivationDisabled), "disabled"},
		{"EnvString", string(EnvString), "string"},
		{"EnvInteger", string(EnvInteger), "integer"},
		{"EnvBool", string(EnvBool), "bool"},
		{"EnvDouble", string(EnvDouble), "double"},
		{"EnvJSON", string(EnvJSON), "json"},
		{"EnvArray", string(EnvArray), "array"},
		{"EnvMap", string(EnvMap), "map"},
	}
	for _, test := range tests {
		if test.got != test.want {
			t.Fatalf("%s: got %q, want %q", test.label, test.got, test.want)
		}
	}
}

func requireObject(t *testing.T, value any, label string) map[string]any {
	t.Helper()
	object, ok := value.(map[string]any)
	if !ok {
		t.Fatalf("%s: got %T, want JSON object", label, value)
	}
	return object
}
