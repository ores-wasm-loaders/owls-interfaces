import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';

// Self-reference uses exactly the package-name export map used by npm consumers.
test('JavaScript package-name import resolves release and config runtime contracts', async () => {
  const contract = await import('@ores-wasm-loaders/owls-interfaces');
  assert.equal(typeof contract.parseRelease, 'function');
  assert.equal(typeof contract.releaseSchema, 'object');
  assert.ok(Object.isFrozen(contract.releaseSchema));
  assert.equal(typeof contract.parseOresWasmConfig, 'function');
  assert.equal(typeof contract.resolveOresWasmEnv, 'function');
  assert.equal(typeof contract.configSchema, 'object');
  assert.ok(Object.isFrozen(contract.configSchema));
});
test('published archive includes both peer authorities and every release/config projection', () => {
  const cwd = fileURLToPath(new URL('../', import.meta.url));
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {cwd, encoding:'utf8'}));
  const names = pack.files.map(file => file.path);
  for (const expected of [
    'index.mjs',
    'release.mjs',
    'config.mjs',
    'validate.mjs',
    'schemas/release.schema.json',
    'schemas/ores-wasm-config.schema.json',
    'contracts/main.tsp',
    'contracts/config.tsp',
    'typescript/index.d.ts',
    'typescript/index.ts',
    'typescript/config.ts',
    'rust/src/lib.rs',
    'rust/src/v2.rs',
    'rust/src/config.rs',
    'dart/lib/owls_interfaces.dart',
    'dart/lib/owls_config.dart',
    'go/contract.go',
    'go/config.go',
    'gleam/src/owls_interfaces.gleam',
    'gleam/src/owls_config.gleam',
  ]) assert.ok(names.includes(expected), expected);
  assert.ok(!names.some(path => /(^|\/)(node_modules|target|\.git|test|env|\.typespec-json-schema-validator)(\/|$)/.test(path)));
  assert.ok(pack.size < 2 * 1024 * 1024);
});
test('runtime export does not replace the TypeScript declaration entrypoint', async () => {
  const metadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  assert.equal(metadata.exports['.'].types, './typescript/index.d.ts');
  assert.equal(metadata.exports['.'].default, './index.mjs');
});
