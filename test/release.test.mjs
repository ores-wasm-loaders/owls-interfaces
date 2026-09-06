import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseRelease,
  releaseProblems,
  releaseSchema,
  preparableAssets,
  chunkForRoute,
  stageOf,
  roleOf,
  assetKey,
  releaseKey,
  assertAssetUrl,
  validateAgainst,
  LoaderError,
} from '../index.mjs';

const here = new URL('.', import.meta.url).pathname;
const ORIGINS = ['https://assets.ores-wasm-loaders.test'];
const load = (name) => JSON.parse(readFileSync(join(here, '..', 'fixtures/valid', name), 'utf8'));
const valid = readdirSync(join(here, '..', 'fixtures/valid')).map(load);
const parse = (doc, origins = ORIGINS) => parseRelease(doc, origins, releaseSchema);

test('every fixture parses, and a v1 document still does', () => {
  assert.equal(valid.length, 4);
  for (const doc of valid) assert.ok(parse(doc));
  const v1 = load('legacy-v1.json');
  assert.equal(v1.schemaVersion, 1);
  const parsed = parse(v1);
  // v2 adds fields; it never requires them, and v1's `prepare` still decides preparability.
  assert.deepEqual(preparableAssets(parsed).map((a) => a.id), ['main-wasm']);
  assert.equal(stageOf(parsed.assets[0]), 'critical');
  assert.equal(stageOf(parsed.assets[1]), 'lazy');
  assert.equal(roleOf(parsed.assets[0], parsed), 'module');
});

test('preparation order puts entrypoints first, then critical, then optional — never lazy', () => {
  const leptos = parse(load('leptos.json'));
  const order = preparableAssets(leptos).map((a) => a.role);
  assert.deepEqual(order.slice(0, 2), ['glue', 'module']);
  assert.equal(preparableAssets(leptos).some((a) => stageOf(a) === 'lazy'), false);

  const flutter = parse(load('flutter.json'));
  const ids = preparableAssets(flutter, { variant: 'module' }).map((a) => a.id);
  assert.ok(ids.includes('main.dart.wasm'), 'the WasmGC module is prepared');
  assert.ok(!ids.includes('main.dart.js'), 'the JS fallback is not fetched alongside it');
  const fallback = preparableAssets(flutter, { variant: 'fallback' }).map((a) => a.id);
  assert.ok(fallback.includes('main.dart.js') && !fallback.includes('main.dart.wasm'));
});

test('an asset URL must be canonical HTTPS on an allowed origin', () => {
  assert.ok(assertAssetUrl('https://assets.ores-wasm-loaders.test/a.wasm', ORIGINS));
  for (const bad of [
    'http://assets.ores-wasm-loaders.test/a.wasm',
    'https://elsewhere.example/a.wasm',
    'https://user:pw@assets.ores-wasm-loaders.test/a.wasm',
    'https://assets.ores-wasm-loaders.test/a.wasm?v=2',
    'https://assets.ores-wasm-loaders.test/a.wasm#frag',
    'not a url',
  ]) {
    assert.throws(() => assertAssetUrl(bad, ORIGINS), LoaderError, bad);
  }
});

test('the invariants a schema cannot express all fail closed', () => {
  const base = load('leptos.json');
  const mutate = (fn) => {
    const doc = structuredClone(base);
    fn(doc);
    return releaseProblems(doc);
  };

  assert.ok(mutate((d) => { d.entrypoint = 'nope'; })[0].includes('not one of the declared assets'));
  assert.ok(mutate((d) => { d.assets[0].kind = 'data'; }).some((p) => p.includes('does not match runtime')));
  assert.ok(mutate((d) => { d.assets.push({ ...d.assets[1] }); }).some((p) => p.includes('duplicate asset id')));
  assert.ok(mutate((d) => { d.prepareBudget.maxBytes = 10; }).some((p) => p.includes('always be truncated')));
  assert.ok(mutate((d) => { d.activation = { mode: 'attach-view' }; }).some((p) => p.includes('cannot activate')));
  assert.ok(mutate((d) => { d.activation = { mode: 'hydrate-islands' }; }).some((p) => p.includes('must name the islands')));
  assert.ok(mutate((d) => { d.assets[2].stage = 'critical'; d.assets[2].prepare = false; }).some((p) => p.includes('would never reach it')));

  const flutter = structuredClone(load('flutter.json'));
  flutter.prepareBudget.furthestStage = 'compile';
  assert.ok(releaseProblems(flutter).some((p) => p.includes('fetch-only')));

  const dioxus = structuredClone(load('dioxus.json'));
  dioxus.activation.routes['/ghost'] = 'no-such-asset';
  assert.ok(releaseProblems(dioxus).some((p) => p.includes('not a declared asset')));
});

test('parseRelease returns a frozen, detached snapshot', () => {
  const doc = load('leptos.json');
  const release = parse(doc);
  assert.ok(Object.isFrozen(release) && Object.isFrozen(release.assets) && Object.isFrozen(release.assets[0]));
  doc.appId = 'mutated-after-parse';
  assert.notEqual(release.appId, 'mutated-after-parse');
  assert.throws(() => parse({ ...doc, appId: 'Not Valid' }), /does not match/);
});

test('routes resolve by longest declared prefix', () => {
  const dioxus = parse(load('dioxus.json'));
  assert.equal(chunkForRoute(dioxus, '/app'), 'chunks-app.wasm');
  assert.equal(chunkForRoute(dioxus, '/app/reports/42'), 'chunks-reports.wasm');
  assert.equal(chunkForRoute(dioxus, '/marketing'), null);
});

test('identity keys are stable and content-addressed', () => {
  const r = parse(load('leptos.json'));
  assert.equal(releaseKey(r), `${r.appId}@${r.release}`);
  assert.equal(assetKey(r.assets[0]), `${r.assets[0].url}#${r.assets[0].sha256}`);
});

test('the validator refuses a schema keyword it does not implement', () => {
  const errors = validateAgainst({ a: 'x' }, { type: 'object', properties: { a: { type: 'string', format: 'email' } } });
  assert.ok(errors.some((e) => e.includes('unsupported keyword `format`')));
});

// --- the two authorities must describe the same release -----------------------------------

function tspFields(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const models = new Map();
  for (const m of text.matchAll(/\bmodel\s+([A-Za-z_]\w*)\s*\{([^}]*)\}/g)) {
    const fields = new Map();
    for (const line of m[2].split('\n')) {
      const f = line.trim().match(/^([A-Za-z_]\w*)(\?)?\s*:/);
      if (f) fields.set(f[1], !f[2]);
    }
    models.set(m[1], fields);
  }
  return models;
}

function schemaFields(node) {
  const required = new Set(node.required ?? []);
  return new Map(Object.keys(node.properties ?? {}).map((k) => [k, required.has(k)]));
}

test('the TypeSpec peer and the JSON Schema describe the same release', () => {
  const tsp = tspFields(readFileSync(join(here, '..', 'contracts/main.tsp'), 'utf8'));
  const pairs = [
    ['Release', releaseSchema],
    ['Asset', releaseSchema.$defs.asset],
    ['PrepareBudget', releaseSchema.properties.prepareBudget],
    ['Activation', releaseSchema.properties.activation],
  ];
  for (const [model, node] of pairs) {
    const a = tsp.get(model);
    const b = schemaFields(node);
    assert.ok(a, `TypeSpec has no model ${model}`);
    assert.deepEqual([...a.keys()].sort(), [...b.keys()].sort(), `${model}: field names differ between the authorities`);
    for (const [field, isRequired] of a) {
      assert.equal(isRequired, b.get(field), `${model}.${field}: required in one authority and optional in the other`);
    }
  }
});
