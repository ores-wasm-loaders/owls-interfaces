import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const validatorRef = '3171025cbe03a7026a71ce94eea18c910e1431b2';

test('CI emits and independently re-verifies a digest-bound Contract IR', async () => {
  const workflow = await readFile(new URL('.github/workflows/contract.yml', root), 'utf8');
  assert.match(workflow, new RegExp(`ORESoftware/typespec-json-schema-validator@${validatorRef}`));
  assert.match(workflow, /contract_ir:\s*\.typespec-json-schema-validator\/contract-ir\.json/);
  assert.match(workflow, /repository:\s*ORESoftware\/typespec-json-schema-validator/);
  assert.match(workflow, new RegExp(`ref:\s*${validatorRef}`));
  assert.match(workflow, /node scripts\/verify-contract-ir\.mjs/);
  assert.match(workflow, /include-hidden-files:\s*true/);
});

test('the downstream verifier preserves peer authority and exact-evidence rules', async () => {
  const source = await readFile(new URL('scripts/verify-contract-ir.mjs', root), 'utf8');
  assert.match(source, /verifyContractIr/);
  assert.match(source, /exactInputDigests/);
  assert.match(source, /directDeclarationInventory/);
  assert.match(source, /generatedSchemaComparison/);
  assert.match(source, /differentialInstanceValidation/);
  assert.match(source, /comparison-evidence-only/);
  assert.match(source, /independently-authored/);
  assert.match(source, /precedence === 'none'/);
  assert.doesNotMatch(source, /process\.argv/);
});
