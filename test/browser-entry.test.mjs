import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const indexUrl = new URL('../index.mjs', import.meta.url);

test('the interface entry has no static Node imports', () => {
  const source = readFileSync(indexUrl, 'utf8');
  assert.doesNotMatch(source, /^import .*['"]node:/m);
});

test('a browser-like host fetches and freezes the authoritative JSON Schema', () => {
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $defs: { Release: { type: 'object' } },
  };
  const code = `
    globalThis.fetch = async (url, options) => {
      globalThis.__request = { url: String(url), options };
      return { ok: true, status: 200, json: async () => (${JSON.stringify(schema)}) };
    };
    delete globalThis.process;
    const module = await import(${JSON.stringify(`${indexUrl.href}?browser-test=1`)});
    if (!globalThis.__request.url.endsWith('/schemas/release.schema.json')) throw new Error('wrong schema URL');
    if (globalThis.__request.options.credentials !== 'omit') throw new Error('schema fetch sent credentials');
    if (!Object.isFrozen(module.releaseSchema) || !Object.isFrozen(module.releaseSchema.$defs)) {
      throw new Error('schema snapshot is mutable');
    }
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', code], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
