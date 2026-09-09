import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('CI emits and independently re-verifies a digest-bound Contract IR', async () => {
  const workflow = await readFile(new URL('.github/workflows/contract.yml', root), 'utf8');
  const declaredRef = workflow.match(/^\s*TSJSV_REF:\s*([0-9a-f]{40})\s*$/m)?.[1];
  const actionRef = workflow.match(
    /ORESoftware\/typespec-json-schema-validator@([0-9a-f]{40})/,
  )?.[1];

  assert.ok(declaredRef, 'validator source checkout must use an immutable commit');
  assert.equal(
    actionRef,
    declaredRef,
    'the verifier checkout and composite action must execute the same validator revision',
  );
  assert.match(workflow, /contract_ir:\s*\.typespec-json-schema-validator\/contract-ir\.json/);
  assert.match(workflow, /repository:\s*ORESoftware\/typespec-json-schema-validator/);
  assert.match(workflow, /ref:\s*\$\{\{ env\.TSJSV_REF \}\}/);
  assert.match(workflow, /git -C \.tools\/typespec-json-schema-validator rev-parse HEAD/);
  assert.match(workflow, /node scripts\/verify-contract-ir\.mjs/);
  assert.match(workflow, /node scripts\/check-language-projections\.mjs/);
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
