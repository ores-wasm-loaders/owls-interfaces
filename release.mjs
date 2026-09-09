// The release contract in one place: validate a document, normalize v1 into v2's shape, and
// answer the questions every host asks about preparation and activation.
//
// Structure is the schema's job. This module owns invariants a schema cannot express:
// identity, ordering, dependency-graph coherence, budget coherence, and per-runtime rules.

import { validateAgainst } from './validate.mjs';

export class LoaderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LoaderError';
    this.code = code;
  }
}

export const CURRENT_SCHEMA_VERSION = 2;
const STAGE_ORDER = { critical: 0, optional: 1, lazy: 2 };
const ROLE_ORDER = { bootstrap: 0, glue: 1, module: 2, chunk: 3, fallback: 4, asset: 5 };

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

function graphProblems(release, ids) {
  const problems = [];
  const assets = new Map();
  for (const asset of release.assets) if (!assets.has(asset.id)) assets.set(asset.id, asset);

  for (const asset of release.assets) {
    const seen = new Set();
    for (const dependency of asset.dependencies ?? []) {
      if (seen.has(dependency)) problems.push(`asset \`${asset.id}\` repeats dependency \`${dependency}\``);
      seen.add(dependency);
      if (dependency === asset.id) problems.push(`asset \`${asset.id}\` cannot depend on itself`);
      else if (!ids.has(dependency)) problems.push(`asset \`${asset.id}\` depends on missing asset \`${dependency}\``);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const reported = new Set();
  const visit = (id, path) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      const start = path.indexOf(id);
      const cycle = [...path.slice(start), id].join(' -> ');
      if (!reported.has(cycle)) problems.push(`asset dependency cycle: ${cycle}`);
      reported.add(cycle);
      return;
    }
    visiting.add(id);
    const asset = assets.get(id);
    if (asset) {
      for (const dependency of asset.dependencies ?? []) {
        if (assets.has(dependency) && dependency !== id) visit(dependency, [...path, id]);
      }
    }
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of assets.keys()) visit(id, []);
  return problems;
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
  problems.push(...graphProblems(release, ids));

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

export function preparableAssets(release, { variant = 'module' } = {}) {
  const drop = variant === 'module' ? 'fallback' : 'module';
  return release.assets
    .filter((asset) => asset.prepare && stageOf(asset) !== 'lazy')
    .filter((asset) => !(release.runtime === 'flutter-web' && roleOf(asset, release) === drop))
    .map((asset) => ({ asset, role: roleOf(asset, release), stage: stageOf(asset) }))
    .sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
    .map((entry) => entry.asset);
}

/** Return a dependency-first, duplicate-free closure ending with the requested asset. */
export function dependencyClosure(release, assetId) {
  const assets = new Map(release.assets.map((asset) => [asset.id, asset]));
  if (!assets.has(assetId)) throw new LoaderError('manifest', `Unknown dependency root \`${assetId}\``);
  const visiting = new Set();
  const visited = new Set();
  const ordered = [];
  const visit = (id) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new LoaderError('manifest', `Dependency cycle encountered while traversing \`${id}\``);
    const asset = assets.get(id);
    if (!asset) throw new LoaderError('manifest', `Dependency references missing asset \`${id}\``);
    visiting.add(id);
    for (const dependency of asset.dependencies ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
    ordered.push(asset);
  };
  visit(assetId);
  return ordered;
}

/** The asset id a route activates, longest declared prefix first. */
export function chunkForRoute(release, route) {
  const routes = release.activation?.routes ?? {};
  if (routes[route]) return routes[route];
  const prefix = Object.keys(routes)
    .filter((r) => route === r || route.startsWith(r.endsWith('/') ? r : `${r}/`))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? routes[prefix] : null;
}

/** Dependency-first asset closure for the resolved route target. */
export function dependencyClosureForRoute(release, route) {
  const assetId = chunkForRoute(release, route);
  return assetId ? dependencyClosure(release, assetId) : [];
}
