import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LoaderError,
  dependencyClosure,
  dependencyClosureForRoute,
  parseRelease,
  releaseSchema,
} from '../index.mjs';

const ORIGIN = 'https://assets.example.test';
const sha = (digit) => digit.repeat(64);
const asset = (id, overrides = {}) => ({
  id,
  url: `${ORIGIN}/releases/r1/${id}`,
  kind: 'wasm',
  role: 'chunk',
  stage: 'lazy',
  bytes: 10,
  sha256: sha('a'),
  prepare: false,
  ...overrides,
});

function release() {
  return {
    schemaVersion: 2,
    appId: 'dioxus-pilot',
    release: 'r1',
    runtime: 'wasm-bindgen',
    framework: 'dioxus',
    entrypoint: 'app.js',
    assets: [
      asset('app.js', {
        kind: 'module',
        role: 'glue',
        stage: 'critical',
        prepare: true,
        sha256: sha('1'),
      }),
      asset('app_bg.wasm', {
        role: 'module',
        stage: 'critical',
        prepare: true,
        sha256: sha('2'),
      }),
      asset('shared.wasm', { sha256: sha('3') }),
      asset('route-app.wasm', {
        dependencies: ['shared.wasm'],
        sha256: sha('4'),
      }),
      asset('route-reports.wasm', {
        dependencies: ['shared.wasm', 'route-app.wasm'],
        sha256: sha('5'),
      }),
    ],
    prepareBudget: {
      maxBytes: 20,
      maxConcurrency: 2,
      furthestStage: 'fetch',
    },
    activation: {
      mode: 'mount-route',
      routes: {
        '/app': 'route-app.wasm',
        '/app/reports': 'route-reports.wasm',
      },
    },
  };
}

function parse(candidate = release()) {
  return parseRelease(candidate, [ORIGIN], releaseSchema);
}

test('dependency closure is dependency-first and duplicate-free', () => {
  const admitted = parse();
  assert.deepEqual(
    dependencyClosure(admitted, 'route-reports.wasm').map(({ id }) => id),
    ['shared.wasm', 'route-app.wasm', 'route-reports.wasm'],
  );
  assert.deepEqual(
    dependencyClosureForRoute(admitted, '/app/reports/2026').map(({ id }) => id),
    ['shared.wasm', 'route-app.wasm', 'route-reports.wasm'],
  );
  assert.deepEqual(
    dependencyClosureForRoute(admitted, '/unknown'),
    [],
  );
});

test('legacy manifests with no dependency edges remain valid', () => {
  const candidate = release();
  for (const item of candidate.assets) delete item.dependencies;
  const admitted = parse(candidate);
  assert.deepEqual(
    dependencyClosureForRoute(admitted, '/app').map(({ id }) => id),
    ['route-app.wasm'],
  );
});

test('missing, duplicate, self and cyclic dependency edges fail closed', () => {
  const cases = [
    {
      name: 'missing',
      mutate(candidate) {
        candidate.assets.find(({ id }) => id === 'route-app.wasm').dependencies = ['missing.wasm'];
      },
      match: /depends on missing asset/,
    },
    {
      name: 'duplicate',
      mutate(candidate) {
        candidate.assets.find(({ id }) => id === 'route-app.wasm').dependencies = ['shared.wasm', 'shared.wasm'];
      },
      match: /repeats dependency/,
    },
    {
      name: 'self',
      mutate(candidate) {
        candidate.assets.find(({ id }) => id === 'route-app.wasm').dependencies = ['route-app.wasm'];
      },
      match: /cannot depend on itself/,
    },
    {
      name: 'cycle',
      mutate(candidate) {
        candidate.assets.find(({ id }) => id === 'shared.wasm').dependencies = ['route-app.wasm'];
      },
      match: /asset dependency cycle/,
    },
  ];

  for (const scenario of cases) {
    const candidate = release();
    scenario.mutate(candidate);
    assert.throws(
      () => parse(candidate),
      (error) => error instanceof LoaderError && error.code === 'manifest' && scenario.match.test(error.message),
      scenario.name,
    );
  }
});

test('direct closure lookup rejects an unknown root even after admission', () => {
  const admitted = parse();
  assert.throws(
    () => dependencyClosure(admitted, 'missing.wasm'),
    (error) => error instanceof LoaderError && error.code === 'manifest' && /Unknown dependency root/.test(error.message),
  );
});
