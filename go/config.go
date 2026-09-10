package owlsinterfaces

// Downstream `.ores-wasm.toml` semantic projection only.
// TypeSpec and authored JSON Schema remain independent peer authorities.

// @config-contract-ir ConfigVersion enum 1
type ConfigVersion int

const ConfigVersionV1 ConfigVersion = 1

// @config-contract-ir HostKind enum browser|flutter|rust-native|ssr|worker
type HostKind string

const (
	HostBrowser    HostKind = "browser"
	HostSSR        HostKind = "ssr"
	HostWorker     HostKind = "worker"
	HostRustNative HostKind = "rust-native"
	HostFlutter    HostKind = "flutter"
)

// @config-contract-ir PrepareTrigger enum disabled|explicit|idle|intent
type PrepareTrigger string

const (
	PrepareExplicit PrepareTrigger = "explicit"
	PrepareIntent   PrepareTrigger = "intent"
	PrepareIdle     PrepareTrigger = "idle"
	PrepareDisabled PrepareTrigger = "disabled"
)

// @config-contract-ir ConfigPrepareStage enum compile|fetch
type ConfigPrepareStage string

const (
	ConfigPrepareFetch   ConfigPrepareStage = "fetch"
	ConfigPrepareCompile ConfigPrepareStage = "compile"
)

// @config-contract-ir ActivationPolicy enum disabled|explicit|route|startup
type ActivationPolicy string

const (
	ActivationExplicit ActivationPolicy = "explicit"
	ActivationRoute    ActivationPolicy = "route"
	ActivationStartup  ActivationPolicy = "startup"
	ActivationDisabled ActivationPolicy = "disabled"
)

// @config-contract-ir EnvValueType enum array|bool|double|integer|json|map|string
type EnvValueType string

const (
	EnvString  EnvValueType = "string"
	EnvInteger EnvValueType = "integer"
	EnvBool    EnvValueType = "bool"
	EnvDouble  EnvValueType = "double"
	EnvJSON    EnvValueType = "json"
	EnvArray   EnvValueType = "array"
	EnvMap     EnvValueType = "map"
)

// @config-contract-ir RepoPath scalar-like
type RepoPath = string

// @config-contract-ir EnvKey scalar-like
type EnvKey = string

// @config-contract-ir ConfigTarget scalar-like
type ConfigTarget = string

// @config-contract-ir ConfigPrepare model furthestStage|maxBytes|maxConcurrency|trigger
type ConfigPrepare struct {
	Trigger        PrepareTrigger      `json:"trigger"`
	MaxBytes       *uint64             `json:"maxBytes,omitempty"`
	MaxConcurrency *uint8              `json:"maxConcurrency,omitempty"`
	FurthestStage  *ConfigPrepareStage `json:"furthestStage,omitempty"`
}

// @config-contract-ir ConfigActivation model policy
type ConfigActivation struct {
	Policy ActivationPolicy `json:"policy"`
}

// @config-contract-ir HostConfig model activation|allowedOrigins|enabled|kind|prepare|releaseManifest|root
type HostConfig struct {
	Kind            HostKind          `json:"kind"`
	Enabled         *bool             `json:"enabled,omitempty"`
	Root            *RepoPath         `json:"root,omitempty"`
	ReleaseManifest RepoPath          `json:"releaseManifest"`
	AllowedOrigins  []string          `json:"allowedOrigins,omitempty"`
	Prepare         *ConfigPrepare    `json:"prepare,omitempty"`
	Activation      *ConfigActivation `json:"activation,omitempty"`
}

// @config-contract-ir HostConfigMap model
type HostConfigMap map[string]HostConfig

// @config-contract-ir EnvDeclaration model env|required|target|type
type EnvDeclaration struct {
	Env      EnvKey       `json:"env"`
	Type     EnvValueType `json:"type"`
	Target   ConfigTarget `json:"target"`
	Required *bool        `json:"required,omitempty"`
}

// @config-contract-ir EnvDeclarationMap model
type EnvDeclarationMap map[string]EnvDeclaration

// @config-contract-ir ConfigExtensions model
type ConfigExtensions map[string]any

// @config-contract-ir OresWasmConfig model enabled|env|extensions|hosts|strict|version
type OresWasmConfig struct {
	Version    ConfigVersion     `json:"version"`
	Enabled    bool              `json:"enabled"`
	Strict     *bool             `json:"strict,omitempty"`
	Hosts      HostConfigMap     `json:"hosts"`
	Env        EnvDeclarationMap `json:"env,omitempty"`
	Extensions ConfigExtensions  `json:"extensions,omitempty"`
}
