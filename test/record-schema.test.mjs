import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseSchema, validateAgainst } from '../index.mjs';

test('record helper schemas match the TypeSpec emitter shape without changing behavior', () => {
  const stringRecord = releaseSchema.$defs.RecordString;
  assert.deepEqual(stringRecord.properties, {});
  assert.deepEqual(stringRecord.unevaluatedProperties, { type: 'string' });
  assert.equal('additionalProperties' in stringRecord, false);
  assert.deepEqual(validateAgainst({ '/app': 'chunks-app.wasm' }, stringRecord), []);
  assert.ok(
    validateAgainst({ '/app': 42 }, stringRecord).some((error) => error.includes('expected string')),
  );

  const unknownRecord = releaseSchema.$defs.RecordUnknown;
  assert.deepEqual(unknownRecord.properties, {});
  assert.deepEqual(unknownRecord.unevaluatedProperties, {});
  assert.equal('additionalProperties' in unknownRecord, false);
  assert.deepEqual(
    validateAgainst({ object: { nested: true }, list: [1, 'two'], scalar: 3 }, unknownRecord),
    [],
  );
});
