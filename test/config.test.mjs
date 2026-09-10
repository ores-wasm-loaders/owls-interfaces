import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  LoaderError,
  configSchema,
  parseOresWasmConfig,
  resolveOresWasmEnv,
} from '../index.mjs';

const fixture = async (name) => JSON.parse(await readFile(new URL(`../fixtures/config/valid/${name}.json`, import.meta.url), 'utf8'));

const expectConfigError = (fn, code = 'config') => {
  assert.throws(fn, (error) => error instanceof LoaderError && error.code === code);
};

test('config schema and normalized documents are deeply immutable', async () => {
  const config = parseOresWasmConfig(await fixture('browser'));
  assert.ok(Object.isFrozen(configSchema));
  assert.ok(Object.isFrozen(config));
  assert.ok(Object.isFrozen(config.hosts));
  assert.ok(Object.isFrozen(config.hosts.browser.prepare));
  assert.equal(config.hosts.browser.enabled, true);
});

test('one repository can describe browser, SSR, and Flutter hosts independently', async () => {
  const config = parseOresWasmConfig(await fixture('mixed-host'));
  assert.deepEqual(Object.keys(config.hosts).sort(), ['browser', 'mobile', 'server']);
  assert.equal(config.hosts.browser.root, '.');
  assert.equal(config.hosts.server.root, '.');
  assert.equal(config.hosts.mobile.kind, 'flutter');
});

test('flags-2-env-compatible strings override only explicitly declared config targets', async () => {
  const config = parseOresWasmConfig(await fixture('browser'));
  const resolved = resolveOresWasmEnv(config, {
    ORES_WASM_PREPARE_MAX_BYTES: '16777216',
    ORES_WASM_ALLOWED_ORIGINS: '["https://one.example","https://two.example"]',
  });
  assert.equal(resolved.hosts.browser.prepare.maxBytes, 16777216);
  assert.deepEqual(resolved.hosts.browser.allowedOrigins, ['https://one.example', 'https://two.example']);
  assert.ok(Object.isFrozen(resolved));
});

test('required env declarations fail closed and never fall through silently', async () => {
  const raw = await fixture('browser');
  raw.env.prepareMaxBytes.required = true;
  const config = parseOresWasmConfig(raw);
  expectConfigError(() => resolveOresWasmEnv(config, {}), 'config-env');
});

test('unsafe repository traversal and non-canonical asset origins are rejected', async () => {
  const traversal = await fixture('browser');
  traversal.hosts.browser.root = '../outside';
  expectConfigError(() => parseOresWasmConfig(traversal));

  const origin = await fixture('browser');
  origin.hosts.browser.allowedOrigins = ['https://assets.example.com/path'];
  expectConfigError(() => parseOresWasmConfig(origin));
});

test('env declarations cannot mutate arbitrary object paths or lie about target types', async () => {
  const arbitrary = await fixture('browser');
  arbitrary.env.prepareMaxBytes.target = 'hosts.browser.kind';
  expectConfigError(() => parseOresWasmConfig(arbitrary));

  const mismatch = await fixture('browser');
  mismatch.env.prepareMaxBytes.type = 'string';
  expectConfigError(() => parseOresWasmConfig(mismatch));
});

test('duplicate environment keys and Flutter compile preparation are rejected', async () => {
  const duplicate = await fixture('browser');
  duplicate.env.second = {
    env: 'ORES_WASM_PREPARE_MAX_BYTES',
    type: 'integer',
    target: 'hosts.browser.prepare.maxConcurrency',
  };
  expectConfigError(() => parseOresWasmConfig(duplicate));

  const flutter = await fixture('mixed-host');
  flutter.hosts.mobile.prepare.furthestStage = 'compile';
  expectConfigError(() => parseOresWasmConfig(flutter));
});

test('unknown fields and malformed env values fail closed at the boundary', async () => {
  const unknown = await fixture('browser');
  unknown.hosts.browser.surprise = true;
  expectConfigError(() => parseOresWasmConfig(unknown));

  const config = parseOresWasmConfig(await fixture('browser'));
  expectConfigError(() => resolveOresWasmEnv(config, { ORES_WASM_PREPARE_MAX_BYTES: '12.5' }), 'config-env');
});
