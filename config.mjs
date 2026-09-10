// Semantic contract for the JSON form produced from a repository's .ores-wasm.toml.
// Raw TOML parsing belongs at a host/tooling boundary; this module stays dependency-free and
// is shared by browser/Node consumers through the owls-interfaces package.

import { validateAgainst } from './validate.mjs';
import { LoaderError } from './release.mjs';

async function loadConfigSchema() {
  const url = new URL('./schemas/ores-wasm-config.schema.json', import.meta.url);
  if (globalThis.process?.versions?.node) {
    const { readFileSync } = await import('node:fs');
    return JSON.parse(readFileSync(url, 'utf8'));
  }
  const response = await fetch(url, {
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
  });
  if (!response.ok) throw new Error(`Unable to load the OWLS config schema: HTTP ${response.status}`);
  return response.json();
}

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

export const configSchema = freezeDeep(await loadConfigSchema());

const NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/u;
const HOST_TARGET = /^hosts\.([A-Za-z][A-Za-z0-9_-]{0,63})\.(enabled|releaseManifest|allowedOrigins|prepare\.(?:trigger|maxBytes|maxConcurrency|furthestStage)|activation\.policy)$/u;
const EXTENSION_TARGET = /^extensions(?:\.[A-Za-z][A-Za-z0-9_-]{0,63})+$/u;

function repoPathProblem(value) {
  if (value === '.') return null;
  if (value.includes('\\')) return 'must use portable forward-slash repository paths';
  if (value.startsWith('/') || /^[A-Za-z]:\//u.test(value)) return 'must be relative to the repository root';
  if (value.split('/').some((segment) => segment === '..')) return 'must not traverse above the repository root';
  if (value.includes('\0')) return 'must not contain NUL';
  return null;
}

function manifestProblem(value) {
  if (!value.startsWith('https://')) return repoPathProblem(value);
  let url;
  try {
    url = new URL(value);
  } catch {
    return 'must be a repository-relative path or canonical HTTPS URL';
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.href !== value) {
    return 'remote manifests must use canonical HTTPS without credentials, query strings, or fragments';
  }
  return null;
}

function originProblem(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return 'must be a canonical HTTPS origin';
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.origin !== value) {
    return 'must be a canonical HTTPS origin with no path, credentials, query, or fragment';
  }
  return null;
}

function targetInfo(config, target) {
  const host = target.match(HOST_TARGET);
  if (host) {
    const [, hostId, field] = host;
    if (!(hostId in config.hosts)) return { problem: `references unknown host \`${hostId}\`` };
    const type = field === 'enabled'
      ? 'bool'
      : field === 'allowedOrigins'
        ? 'array'
        : field === 'prepare.maxBytes' || field === 'prepare.maxConcurrency'
          ? 'integer'
          : 'string';
    return { type };
  }
  if (EXTENSION_TARGET.test(target)) return { type: null };
  return {
    problem: 'must target an allowed host setting or extensions.*; arbitrary object mutation is forbidden',
  };
}

/** Cross-field invariants that JSON Schema cannot express. */
export function configProblems(config) {
  const problems = [];
  const hosts = Object.entries(config.hosts ?? {});
  if (config.enabled && hosts.length === 0) problems.push('enabled configuration must declare at least one host');
  if (config.enabled && !hosts.some(([, host]) => host.enabled !== false)) {
    problems.push('enabled configuration must leave at least one host enabled');
  }

  for (const [id, host] of hosts) {
    if (!NAME.test(id)) problems.push(`host id \`${id}\` must match ${NAME}`);
    if (host.root !== undefined) {
      const issue = repoPathProblem(host.root);
      if (issue) problems.push(`hosts.${id}.root ${issue}`);
    }
    const manifestIssue = manifestProblem(host.releaseManifest);
    if (manifestIssue) problems.push(`hosts.${id}.releaseManifest ${manifestIssue}`);
    for (const origin of host.allowedOrigins ?? []) {
      const issue = originProblem(origin);
      if (issue) problems.push(`hosts.${id}.allowedOrigins entry \`${origin}\` ${issue}`);
    }
    const prepare = host.prepare;
    if (prepare?.trigger === 'disabled' && (
      prepare.maxBytes !== undefined || prepare.maxConcurrency !== undefined || prepare.furthestStage !== undefined
    )) {
      problems.push(`hosts.${id}.prepare cannot declare budgets or stages when trigger is disabled`);
    }
    if (host.kind === 'flutter' && prepare?.furthestStage === 'compile') {
      problems.push(`hosts.${id}.prepare.furthestStage must be fetch for flutter hosts`);
    }
  }

  const envNames = new Set();
  for (const [id, declaration] of Object.entries(config.env ?? {})) {
    if (!NAME.test(id)) problems.push(`env declaration id \`${id}\` must match ${NAME}`);
    if (envNames.has(declaration.env)) problems.push(`environment key \`${declaration.env}\` is declared more than once`);
    envNames.add(declaration.env);
    const info = targetInfo(config, declaration.target);
    if (info.problem) {
      problems.push(`env.${id}.target ${info.problem}`);
    } else if (info.type && declaration.type !== info.type) {
      problems.push(`env.${id}.type \`${declaration.type}\` cannot target ${declaration.target}; expected \`${info.type}\``);
    }
  }
  return problems;
}

/** Validate, normalize defaults, and freeze a semantic .ores-wasm configuration object. */
export function parseOresWasmConfig(input, schema = configSchema) {
  const structural = validateAgainst(input, schema);
  if (structural.length) {
    throw new LoaderError('config', `Configuration does not match ores-wasm-config-v1 schema:\n  ${structural.join('\n  ')}`);
  }
  const config = structuredClone(input);
  if (config.strict === undefined) config.strict = true;
  for (const host of Object.values(config.hosts)) if (host.enabled === undefined) host.enabled = true;
  const problems = configProblems(config);
  if (problems.length) throw new LoaderError('config', `Configuration is not coherent:\n  ${problems.join('\n  ')}`);
  return freezeDeep(config);
}

function coerceEnv(raw, type, envName) {
  if (typeof raw !== 'string') throw new LoaderError('config-env', `${envName} must be a string environment value`);
  switch (type) {
    case 'string': return raw;
    case 'integer': {
      if (!/^-?(?:0|[1-9][0-9]*)$/u.test(raw)) throw new LoaderError('config-env', `${envName} must be an integer`);
      const value = Number(raw);
      if (!Number.isSafeInteger(value)) throw new LoaderError('config-env', `${envName} is outside the safe integer range`);
      return value;
    }
    case 'double': {
      const value = Number(raw);
      if (raw.trim() === '' || !Number.isFinite(value)) throw new LoaderError('config-env', `${envName} must be a finite number`);
      return value;
    }
    case 'bool': {
      const normalized = raw.trim().toLowerCase();
      if (['true', 't', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
      if (['false', 'f', '0', 'no', 'n', 'off'].includes(normalized)) return false;
      throw new LoaderError('config-env', `${envName} must be a boolean`);
    }
    case 'json': {
      try { return JSON.parse(raw); } catch { throw new LoaderError('config-env', `${envName} must contain valid JSON`); }
    }
    case 'array': {
      let value;
      try { value = JSON.parse(raw); } catch { throw new LoaderError('config-env', `${envName} must contain a JSON array`); }
      if (!Array.isArray(value)) throw new LoaderError('config-env', `${envName} must contain a JSON array`);
      return value;
    }
    case 'map': {
      let value;
      try { value = JSON.parse(raw); } catch { throw new LoaderError('config-env', `${envName} must contain a JSON object`); }
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new LoaderError('config-env', `${envName} must contain a JSON object`);
      return value;
    }
    default: throw new LoaderError('config-env', `Unsupported env coercion type: ${type}`);
  }
}

function setTarget(root, target, value) {
  const parts = target.split('.');
  let node = root;
  for (const part of parts.slice(0, -1)) {
    const current = node[part];
    if (current === undefined) node[part] = {};
    else if (!current || typeof current !== 'object' || Array.isArray(current)) {
      throw new LoaderError('config-env', `Cannot assign ${target}: ${part} is not an object`);
    }
    node = node[part];
  }
  node[parts.at(-1)] = value;
}

/**
 * Apply explicitly declared environment overrides. This is the interop seam with flags-2-env:
 * .cli-flags.toml owns argv/aliases/defaults and emits env strings; .ores-wasm.toml owns where
 * those env strings land in loader configuration.
 */
export function resolveOresWasmEnv(input, environment = globalThis.process?.env ?? {}) {
  const base = Object.isFrozen(input) ? input : parseOresWasmConfig(input);
  const resolved = structuredClone(base);
  for (const declaration of Object.values(base.env ?? {})) {
    const raw = environment[declaration.env];
    if (raw === undefined) {
      if (declaration.required === true) throw new LoaderError('config-env', `Required environment variable ${declaration.env} is missing`);
      continue;
    }
    setTarget(resolved, declaration.target, coerceEnv(raw, declaration.type, declaration.env));
  }
  return parseOresWasmConfig(resolved);
}
