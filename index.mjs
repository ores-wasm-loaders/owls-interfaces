// owls-interfaces — versioned WASM release contracts for browser, Flutter and Rust hosts.
//
// The JSON Schema in `schemas/` is the wire authority; `contracts/main.tsp` is its
// independent TypeSpec peer. Hosts validate untrusted JSON with `parseRelease` before use.
import { readFileSync } from 'node:fs';

export {
  LoaderError,
  CURRENT_SCHEMA_VERSION,
  parseRelease,
  releaseProblems,
  assertAssetUrl,
  assetKey,
  releaseKey,
  preparableAssets,
  chunkForRoute,
  stageOf,
  roleOf,
} from './release.mjs';
export { validateAgainst } from './validate.mjs';

/** The release schema, for hosts that read it from this package rather than the CDN. */
export const releaseSchema = JSON.parse(readFileSync(new URL('./schemas/release.schema.json', import.meta.url), 'utf8'));

export const RUNTIMES = Object.freeze(['raw-wasm', 'wasm-bindgen', 'flutter-web']);
export const ACTIVATION_MODES = Object.freeze(['attach-view', 'hydrate-islands', 'mount-route', 'run-app']);
export const PREPARE_STAGES = Object.freeze(['fetch', 'compile']);
export const ASSET_KINDS = Object.freeze(['wasm', 'module', 'script', 'data', 'font']);
export const ASSET_ROLES = Object.freeze(['bootstrap', 'glue', 'module', 'fallback', 'chunk', 'asset']);
export const ASSET_STAGES = Object.freeze(['critical', 'optional', 'lazy']);
