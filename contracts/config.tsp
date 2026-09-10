import "@typespec/json-schema";
using TypeSpec.JsonSchema;

@jsonSchema
namespace Ores.WasmLoaders;

// This file and schemas/ores-wasm-config.schema.json are independently authored peers.
// Generated JSON Schema is comparison evidence only and never replaces either authority.

@id("ConfigVersion")
enum ConfigVersion {
  v1: 1,
}

@id("HostKind")
enum HostKind {
  browser: "browser",
  ssr: "ssr",
  worker: "worker",
  rustNative: "rust-native",
  flutter: "flutter",
}

@id("PrepareTrigger")
enum PrepareTrigger {
  explicit: "explicit",
  intent: "intent",
  idle: "idle",
  disabled: "disabled",
}

@id("ConfigPrepareStage")
enum ConfigPrepareStage {
  fetch: "fetch",
  compile: "compile",
}

@id("ActivationPolicy")
enum ActivationPolicy {
  explicit: "explicit",
  route: "route",
  startup: "startup",
  disabled: "disabled",
}

// These names intentionally match flags-2-env's public coercion vocabulary. The
// .cli-flags.toml file remains the argv/alias/default authority; this contract only names
// environment keys and maps them into loader settings.
@id("EnvValueType")
enum EnvValueType {
  string: "string",
  integer: "integer",
  boolean: "bool",
  double: "double",
  json: "json",
  array: "array",
  map: "map",
}

@id("RepoPath")
@minLength(1)
@maxLength(4096)
scalar RepoPath extends string;

@id("EnvKey")
@pattern("^[A-Z][A-Z0-9_]{0,127}$")
scalar EnvKey extends string;

@id("ConfigTarget")
@minLength(1)
@maxLength(256)
scalar ConfigTarget extends string;

@id("ConfigPrepare")
model ConfigPrepare {
  trigger: PrepareTrigger;

  @minValue(0)
  @maxValue(268435456)
  maxBytes?: int32;

  @minValue(1)
  @maxValue(16)
  maxConcurrency?: int32;

  furthestStage?: ConfigPrepareStage;
}

@id("ConfigActivation")
model ConfigActivation {
  policy: ActivationPolicy;
}

@id("HostConfig")
model HostConfig {
  kind: HostKind;
  enabled?: boolean;
  root?: RepoPath;
  releaseManifest: RepoPath;

  @maxItems(16)
  allowedOrigins?: string[];

  prepare?: ConfigPrepare;
  activation?: ConfigActivation;
}

@id("HostConfigMap")
model HostConfigMap is Record<HostConfig>;

@id("EnvDeclaration")
model EnvDeclaration {
  env: EnvKey;
  type: EnvValueType;
  target: ConfigTarget;
  required?: boolean;
}

@id("EnvDeclarationMap")
model EnvDeclarationMap is Record<EnvDeclaration>;

@id("ConfigExtensions")
model ConfigExtensions is Record<unknown>;

@id("OresWasmConfig")
model OresWasmConfig {
  version: ConfigVersion;
  enabled: boolean;
  strict?: boolean;
  hosts: HostConfigMap;
  env?: EnvDeclarationMap;
  extensions?: ConfigExtensions;
}
