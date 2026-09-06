// The release contract in one place: validate a document, normalize v1 into v2's shape, and
// answer the two questions every host asks — "what may I prepare, in what order?" and "what
// does activation mean for this release?".
//
// Structure is the schema's job. This module owns the invariants a schema cannot express:
// identity, ordering, budget coherence, and the per-runtime rules about what may be prepared
// at all. All of them fail closed, because each one is a way for a page to do something on a
// visitor's behalf that the visitor did not ask for.

import { validateAgainst } from './validate.mjs';

export class LoaderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LoaderError';
    this.code = code;
  }
}

export const CURRENT_SCHEMA_VERSION = 2;

/** Preparation order: entrypoint roles first, then critical, then optional. Never lazy. */
const STAGE_ORDER = { critical: 0, optional: 1, lazy: 2 };
const ROLE_ORDER = { bootstrap: 0, glue: 1, module: 2, chunk: 3, fallback: 4, asset: 5 };

/** v1 said only `prepare: true|false`; v2 grades it. A v1 document keeps meaning exactly what it meant. */
export function stageOf(asset) {
  return asset.stage ?? (asset.prepare ? 'critical' : 'lazy');
}

export function roleOf(asset, release) {
  if (asset.role) return asset.role;
  if (asset.id === release.entrypoint) return release.runtime === 'flutter-web' ? 'bootstrap' : release.runtime === 'wasm-bindgen' ? 'glue' : 'module';
  return asset.kind === 'wasm' ? 'module' : 'asset';
}

export function assetKey(asset) {
  return `${asset.url}#${asset.sha256}`;
}

export function releaseKey(release) {
  return `${release.appId}@${release.release}`;
}

/**
 * A URL that satisfies the schema pattern can still be unparseable, or point somewhere this
 * page is not allowed to fetch from. Report either as a declared LoaderError rather than
 * leaking the parser's TypeError to the caller.
 */
export function assertAssetUrl(raw, origins) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new LoaderError('origin', 'Asset URL is not a parseable absolute URL');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.href !== raw ||
    !origins.includes(url.origin)
  ) {
    throw new LoaderError('origin', `Asset URL must be canonical HTTPS on an allowed origin: ${raw}`);
  }
  return url;
}

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
}

/** Invariants no JSON Schema can state. Returns a list of problems; empty means coherent. */
export function releaseProblems(release) {
  const problems = [];

  const entry = release.assets.find((a) => a.id === release.entrypoint);
  if (!entry) {
    problems.push(`entrypoint \`${release.entrypoint}\` is not one of the declared assets`);
    return problems;
  }
  const expectedKind = release.runtime === 'raw-wasm' ? 'wasm' : release.runtime === 'wasm-bindgen' ? 'module' : 'script';
  if (entry.kind !== expectedKind) {
    problems.push(`entrypoint kind \`${entry.kind}\` does not match runtime \`${release.runtime}\` (expected \`${expectedKind}\`)`);
  }

  const ids = new Set();
  const urls = new Set();
  for (const asset of release.assets) {
    if (ids.has(asset.id)) problems.push(`duplicate asset id \`${asset.id}\``);
    if (urls.has(asset.url)) problems.push(`duplicate asset url \`${asset.url}\``);
    ids.add(asset.id);
    urls.add(asset.url);
    if (asset.stage && asset.stage !== 'lazy' && !asset.prepare) {
      problems.push(`asset \`${asset.id}\` is staged \`${asset.stage}\` but marked prepare:false — a host would never reach it`);
    }
  }

  if (release.runtime === 'wasm-bindgen') {
    const hasModule = release.assets.some((a) => roleOf(a, release) === 'module' && a.kind === 'wasm');
    if (!hasModule) problems.push('a wasm-bindgen release needs a companion wasm module beside its glue');
  }

  if (release.prepareBudget) {
    const needed = release.assets
      .filter((a) => a.prepare && stageOf(a) === 'critical')
      .reduce((sum, a) => sum + a.bytes, 0);
    if (needed > release.prepareBudget.maxBytes) {
      problems.push(
        `prepareBudget.maxBytes ${release.prepareBudget.maxBytes} cannot cover the ${needed} critical bytes: preparation would always be truncated`,
      );
    }
    if (release.runtime === 'flutter-web' && release.prepareBudget.furthestStage === 'compile') {
      problems.push('flutter-web releases prepare fetch-only: the generated bootstrap owns compilation, so a separately compiled module has nowhere to go');
    }
  }

  if (release.activation) {
    const allowed = {
      'flutter-web': ['attach-view', 'run-app'],
      'wasm-bindgen': ['hydrate-islands', 'mount-route', 'run-app'],
      'raw-wasm': ['run-app'],
    }[release.runtime];
    if (!allowed.includes(release.activation.mode)) {
      problems.push(`runtime \`${release.runtime}\` cannot activate as \`${release.activation.mode}\` (expected one of ${allowed.join(', ')})`);
    }
    if (release.activation.mode === 'hydrate-islands' && !(release.activation.islands ?? []).length) {
      problems.push('hydrate-islands activation must name the islands it hydrates');
    }
    if (release.activation.mode === 'mount-route') {
      for (const [route, target] of Object.entries(release.activation.routes ?? {})) {
        if (!ids.has(target)) problems.push(`route \`${route}\` maps to \`${target}\`, which is not a declared asset`);
      }
      if (!Object.keys(release.activation.routes ?? {}).length) problems.push('mount-route activation must declare at least one route');
    }
  }

  return problems;
}

/**
 * Validate, check the invariants, enforce the origin allowlist, and return a frozen,
 * detached snapshot. The caller's object is never retained or mutated.
 */
export function parseRelease(input, origins, schema) {
  const structural = validateAgainst(input, schema);
  if (structural.length) {
    throw new LoaderError('manifest', `Release does not match release-v${CURRENT_SCHEMA_VERSION} schema:\n  ${structural.join('\n  ')}`);
  }
  const release = structuredClone(input);
  for (const asset of release.assets) assertAssetUrl(asset.url, origins);

  const problems = releaseProblems(release);
  if (problems.length) throw new LoaderError('manifest', `Release is not coherent:\n  ${problems.join('\n  ')}`);

  freezeDeep(release);
  return release;
}

/**
 * What preparation may take, in the order it should take it.
 *
 * `prepare: false` is never included — that is the v1 authority and it still decides. Lazy
 * assets are excluded even when marked preparable. `variant` drops the startup path this
 * runtime will not use, so a Flutter page does not pull both the WasmGC module and the full
 * JS fallback.
 */
export function preparableAssets(release, { variant = 'module' } = {}) {
  const drop = variant === 'module' ? 'fallback' : 'module';
  return release.assets
    .filter((asset) => asset.prepare && stageOf(asset) !== 'lazy')
    .filter((asset) => !(release.runtime === 'flutter-web' && roleOf(asset, release) === drop))
    .map((asset) => ({ asset, role: roleOf(asset, release), stage: stageOf(asset) }))
    .sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
    .map((entry) => entry.asset);
}

/** The asset a route activates, longest declared prefix first. */
export function chunkForRoute(release, route) {
  const routes = release.activation?.routes ?? {};
  if (routes[route]) return routes[route];
  const prefix = Object.keys(routes)
    .filter((r) => route === r || route.startsWith(r.endsWith('/') ? r : `${r}/`))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? routes[prefix] : null;
}
