// owls-interfaces — versioned WASM release contracts for browser, Flutter and Rust hosts.
//
// The JSON Schema in `schemas/` is one independent wire authority; `contracts/main.tsp` is its
// independently authored TypeSpec peer. Hosts validate untrusted JSON with `parseRelease`
// before use. The schema is loaded from the authoritative file in both Node and browsers.

export {
  LoaderError,
  CURRENT_SCHEMA_VERSION,
  parseRelease,
  releaseProblems,
  assertAssetUrl,
  assetKey,
  releaseKey,
  preparableAssets,
  dependencyClosure,
  dependencyClosureForRoute,
  chunkForRoute,
  stageOf,
  roleOf,
} from './release.mjs';
export { validateAgainst } from './validate.mjs';

async function loadReleaseSchema() {
  const url = new URL('./schemas/release.schema.json', import.meta.url);
  if (globalThis.process?.versions?.node) {
    const { readFileSync } = await import('node:fs');
    return JSON.parse(readFileSync(url, 'utf8'));
  }

  const response = await fetch(url, {
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
  });
  if (!response.ok) {
    throw new Error(`Unable to load the OWLS release schema: HTTP ${response.status}`);
  }
  return response.json();
}

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

/** The immutable, independently authored release schema used by all JavaScript hosts. */
export const releaseSchema = freezeDeep(await loadReleaseSchema());

export const RUNTIMES = Object.freeze(['raw-wasm', 'wasm-bindgen', 'flutter-web']);
export const ACTIVATION_MODES = Object.freeze(['attach-view', 'hydrate-islands', 'mount-route', 'run-app']);
export const PREPARE_STAGES = Object.freeze(['fetch', 'compile']);
export const ASSET_KINDS = Object.freeze(['wasm', 'module', 'script', 'data', 'font']);
export const ASSET_ROLES = Object.freeze(['bootstrap', 'glue', 'module', 'fallback', 'chunk', 'asset']);
export const ASSET_STAGES = Object.freeze(['critical', 'optional', 'lazy']);
