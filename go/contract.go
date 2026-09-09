// Package owlsinterfaces contains downstream wire projections for immutable
// shared-WASM release manifests. TypeSpec and authored JSON Schema remain the
// independent peer authorities.
package owlsinterfaces

import (
	"encoding/json"
	"fmt"
	"io"
)

// @contract-ir SchemaVersion enum 1|2
type SchemaVersion int

const (
	SchemaVersionV1 SchemaVersion = 1
	SchemaVersionV2 SchemaVersion = 2
)

// @contract-ir RuntimeKind enum flutter-web|raw-wasm|wasm-bindgen
type RuntimeKind string

const (
	RuntimeRawWasm     RuntimeKind = "raw-wasm"
	RuntimeWasmBindgen RuntimeKind = "wasm-bindgen"
	RuntimeFlutterWeb  RuntimeKind = "flutter-web"
)

// @contract-ir FrameworkKind enum dioxus|flutter|leptos|none
type FrameworkKind string

const (
	FrameworkNone    FrameworkKind = "none"
	FrameworkLeptos  FrameworkKind = "leptos"
	FrameworkDioxus  FrameworkKind = "dioxus"
	FrameworkFlutter FrameworkKind = "flutter"
)

// @contract-ir AssetKind enum data|font|module|script|wasm
type AssetKind string

const (
	AssetKindWasm   AssetKind = "wasm"
	AssetKindModule AssetKind = "module"
	AssetKindScript AssetKind = "script"
	AssetKindData   AssetKind = "data"
	AssetKindFont   AssetKind = "font"
)

// @contract-ir AssetRole enum asset|bootstrap|chunk|fallback|glue|module
type AssetRole string

const (
	AssetRoleBootstrap AssetRole = "bootstrap"
	AssetRoleGlue      AssetRole = "glue"
	AssetRoleModule    AssetRole = "module"
	AssetRoleFallback  AssetRole = "fallback"
	AssetRoleChunk     AssetRole = "chunk"
	AssetRoleAsset     AssetRole = "asset"
)

// @contract-ir AssetStage enum critical|lazy|optional
type AssetStage string

const (
	AssetStageCritical AssetStage = "critical"
	AssetStageOptional AssetStage = "optional"
	AssetStageLazy     AssetStage = "lazy"
)

// @contract-ir PrepareStage enum compile|fetch
type PrepareStage string

const (
	PrepareStageFetch   PrepareStage = "fetch"
	PrepareStageCompile PrepareStage = "compile"
)

// @contract-ir ActivationMode enum attach-view|hydrate-islands|mount-route|run-app
type ActivationMode string

const (
	ActivationAttachView     ActivationMode = "attach-view"
	ActivationHydrateIslands ActivationMode = "hydrate-islands"
	ActivationMountRoute     ActivationMode = "mount-route"
	ActivationRunApp         ActivationMode = "run-app"
)

// @contract-ir AssetId scalar-like
type AssetID = string

// @contract-ir HttpsAssetUrl scalar-like
type HTTPSAssetURL = string

// @contract-ir Sha256Hex scalar-like
type SHA256Hex = string

// @contract-ir ApplicationId scalar-like
type ApplicationID = string

// @contract-ir ReleaseId scalar-like
type ReleaseID = string

// @contract-ir ToolchainId scalar-like
type ToolchainID = string

// @contract-ir EntrypointId scalar-like
type EntrypointID = string

// @contract-ir HostSelector scalar-like
type HostSelector = string

// @contract-ir IslandName scalar-like
type IslandName = string

// @contract-ir RecordString model
type RecordString map[string]string

// @contract-ir RecordUnknown model
type RecordUnknown map[string]any

// @contract-ir Asset model bytes|dependencies|id|kind|prepare|role|sha256|stage|url
type Asset struct {
	ID           AssetID       `json:"id"`
	URL          HTTPSAssetURL `json:"url"`
	Kind         AssetKind     `json:"kind"`
	Role         AssetRole     `json:"role,omitempty"`
	Stage        AssetStage    `json:"stage,omitempty"`
	Dependencies []AssetID     `json:"dependencies,omitempty"`
	Bytes        uint64        `json:"bytes"`
	SHA256       SHA256Hex     `json:"sha256"`
	Prepare      bool          `json:"prepare"`
}

// @contract-ir PrepareBudget model furthestStage|maxBytes|maxConcurrency
type PrepareBudget struct {
	MaxBytes       uint64       `json:"maxBytes"`
	MaxConcurrency uint8        `json:"maxConcurrency"`
	FurthestStage  PrepareStage `json:"furthestStage"`
}

// @contract-ir Activation model hostSelector|islands|mode|routes
type Activation struct {
	Mode         ActivationMode `json:"mode"`
	HostSelector HostSelector   `json:"hostSelector,omitempty"`
	Islands      []IslandName   `json:"islands,omitempty"`
	Routes       RecordString   `json:"routes,omitempty"`
}

// @contract-ir Release model activation|appId|assets|entrypoint|extensions|framework|prepareBudget|release|requiresCrossOriginIsolation|runtime|schemaVersion|toolchain
type Release struct {
	SchemaVersion                SchemaVersion  `json:"schemaVersion"`
	AppID                        ApplicationID  `json:"appId"`
	Release                      ReleaseID      `json:"release"`
	Runtime                      RuntimeKind    `json:"runtime"`
	Framework                    FrameworkKind  `json:"framework,omitempty"`
	Toolchain                    ToolchainID    `json:"toolchain,omitempty"`
	Entrypoint                   EntrypointID   `json:"entrypoint"`
	RequiresCrossOriginIsolation *bool          `json:"requiresCrossOriginIsolation,omitempty"`
	Assets                       []Asset        `json:"assets"`
	PrepareBudget                *PrepareBudget `json:"prepareBudget,omitempty"`
	Activation                   *Activation    `json:"activation,omitempty"`
	Extensions                   RecordUnknown  `json:"extensions,omitempty"`
}

// DecodeRelease performs strict object decoding and validates the contract's
// closed wire enums. Full structure and semantic admission still belongs to the
// independently authored JSON Schema and the host invariants.
func DecodeRelease(reader io.Reader) (Release, error) {
	decoder := json.NewDecoder(reader)
	decoder.DisallowUnknownFields()
	var release Release
	if err := decoder.Decode(&release); err != nil {
		return Release{}, fmt.Errorf("decode release: %w", err)
	}
	var trailing any
	if err := decoder.Decode(&trailing); err != io.EOF {
		if err == nil {
			return Release{}, fmt.Errorf("decode release: trailing JSON value")
		}
		return Release{}, fmt.Errorf("decode release trailer: %w", err)
	}
	if err := release.ValidateProjection(); err != nil {
		return Release{}, err
	}
	return release, nil
}

// ValidateProjection checks the finite wire domains represented by this
// projection. It intentionally does not replace JSON Schema validation.
func (release Release) ValidateProjection() error {
	if release.SchemaVersion != SchemaVersionV1 && release.SchemaVersion != SchemaVersionV2 {
		return fmt.Errorf("unsupported schemaVersion %d", release.SchemaVersion)
	}
	if !release.Runtime.valid() {
		return fmt.Errorf("unknown runtime %q", release.Runtime)
	}
	if release.Framework != "" && !release.Framework.valid() {
		return fmt.Errorf("unknown framework %q", release.Framework)
	}
	for index, asset := range release.Assets {
		if !asset.Kind.valid() {
			return fmt.Errorf("assets[%d]: unknown kind %q", index, asset.Kind)
		}
		if asset.Role != "" && !asset.Role.valid() {
			return fmt.Errorf("assets[%d]: unknown role %q", index, asset.Role)
		}
		if asset.Stage != "" && !asset.Stage.valid() {
			return fmt.Errorf("assets[%d]: unknown stage %q", index, asset.Stage)
		}
	}
	if release.PrepareBudget != nil && !release.PrepareBudget.FurthestStage.valid() {
		return fmt.Errorf("unknown prepare stage %q", release.PrepareBudget.FurthestStage)
	}
	if release.Activation != nil && !release.Activation.Mode.valid() {
		return fmt.Errorf("unknown activation mode %q", release.Activation.Mode)
	}
	return nil
}

func (value RuntimeKind) valid() bool {
	return value == RuntimeRawWasm || value == RuntimeWasmBindgen || value == RuntimeFlutterWeb
}
func (value FrameworkKind) valid() bool {
	return value == FrameworkNone || value == FrameworkLeptos || value == FrameworkDioxus || value == FrameworkFlutter
}
func (value AssetKind) valid() bool {
	return value == AssetKindWasm || value == AssetKindModule || value == AssetKindScript || value == AssetKindData || value == AssetKindFont
}
func (value AssetRole) valid() bool {
	return value == AssetRoleBootstrap || value == AssetRoleGlue || value == AssetRoleModule || value == AssetRoleFallback || value == AssetRoleChunk || value == AssetRoleAsset
}
func (value AssetStage) valid() bool {
	return value == AssetStageCritical || value == AssetStageOptional || value == AssetStageLazy
}
func (value PrepareStage) valid() bool {
	return value == PrepareStageFetch || value == PrepareStageCompile
}
func (value ActivationMode) valid() bool {
	return value == ActivationAttachView || value == ActivationHydrateIslands || value == ActivationMountRoute || value == ActivationRunApp
}
