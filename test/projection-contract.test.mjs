import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('TypeScript source and declaration entrypoints are one checked-in projection', async () => {
  assert.equal(await read('typescript/index.ts'), await read('typescript/index.d.ts'));
});

test('the package archive includes every supported language projection', async () => {
  const metadata = JSON.parse(await read('package.json'));
  for (const pattern of ['typescript/**', 'rust/src/**', 'dart/lib/**', 'go/**', 'gleam/**']) {
    assert.ok(metadata.files.includes(pattern), `package files omit ${pattern}`);
  }
});

test('the projection audit covers all five languages and accepts no CLI overrides', async () => {
  const source = await read('scripts/check-language-projections.mjs');
  for (const path of [
    'typescript/index.ts',
    'rust/src/v2.rs',
    'dart/lib/owls_interfaces.dart',
    'go/contract.go',
    'gleam/src/owls_interfaces.gleam',
  ]) {
    assert.ok(source.includes(path), `projection audit omits ${path}`);
  }
  assert.match(source, /contractIr\.irId/);
  assert.match(source, /assertionDigest/);
  assert.match(source, /comparison-evidence-only/);
  assert.match(source, /precedence !== 'none'/);
  assert.doesNotMatch(source, /process\.argv/);
});

test('CI compiles every projection and binds the receipt to Contract IR admission', async () => {
  const workflow = await read('.github/workflows/contract.yml');
  for (const command of [
    'check-language-projections.mjs',
    'tsc --project typescript/tsconfig.json',
    'cargo +1.94.0 fmt --all -- --check',
    'cargo +1.94.0 clippy --locked --all-targets -- -D warnings',
    'cargo +1.94.0 test --locked',
    'go vet ./...',
    'go test ./...',
    'dart format lib bin',
    'git diff --exit-code -- lib bin',
    'dart analyze',
    'dart run bin/fixture_check.dart',
    'gleam format src',
    'git diff --exit-code -- src',
    'gleam check',
  ]) {
    assert.ok(workflow.includes(command), `workflow omits ${command}`);
  }
  assert.match(workflow, /include-hidden-files:\s*true/);
});
