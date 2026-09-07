import type {
  ActivationMode,
  Asset,
  AssetKind,
  AssetRole,
  AssetStage,
  FrameworkKind,
  PrepareStage,
  Release,
  RuntimeKind,
  SchemaVersion,
} from "./index.js";

const v1 = {
  schemaVersion: 1,
  appId: "legacy-v1-app",
  release: "2026.08.01-v1",
  runtime: "raw-wasm",
  entrypoint: "main-wasm",
  assets: [
    {
      id: "main-wasm",
      url: "https://assets.example/releases/legacy/main.wasm",
      kind: "wasm",
      bytes: 4096,
      sha256: "0".repeat(64),
      prepare: true,
    },
  ],
} satisfies Release;

const v2 = {
  schemaVersion: 2,
  appId: "flutter-app",
  release: "2026.09.07-a",
  runtime: "flutter-web",
  framework: "flutter",
  toolchain: "flutter wasm",
  entrypoint: "flutter_bootstrap.js",
  requiresCrossOriginIsolation: true,
  assets: [
    {
      id: "flutter_bootstrap.js",
      url: "https://assets.example/releases/flutter/flutter_bootstrap.js",
      kind: "script",
      role: "bootstrap",
      stage: "critical",
      bytes: 4096,
      sha256: "a".repeat(64),
      prepare: true,
    },
  ],
  prepareBudget: {
    maxBytes: 4096,
    maxConcurrency: 2,
    furthestStage: "fetch",
  },
  activation: {
    mode: "attach-view",
    hostSelector: "#app",
    routes: { "/app": "flutter_bootstrap.js" },
  },
  extensions: { cohort: "contract-ir" },
} satisfies Release;

const schemaVersions: readonly SchemaVersion[] = [1, 2];
const runtimes: readonly RuntimeKind[] = ["raw-wasm", "wasm-bindgen", "flutter-web"];
const frameworks: readonly FrameworkKind[] = ["none", "leptos", "dioxus", "flutter"];
const assetKinds: readonly AssetKind[] = ["wasm", "module", "script", "data", "font"];
const assetRoles: readonly AssetRole[] = ["bootstrap", "glue", "module", "fallback", "chunk", "asset"];
const assetStages: readonly AssetStage[] = ["critical", "optional", "lazy"];
const prepareStages: readonly PrepareStage[] = ["fetch", "compile"];
const activationModes: readonly ActivationMode[] = ["attach-view", "hydrate-islands", "mount-route", "run-app"];
const asset: Asset = v2.assets[0];

void [
  v1,
  v2,
  schemaVersions,
  runtimes,
  frameworks,
  assetKinds,
  assetRoles,
  assetStages,
  prepareStages,
  activationModes,
  asset,
];
