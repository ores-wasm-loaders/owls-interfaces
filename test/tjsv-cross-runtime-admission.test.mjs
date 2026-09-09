import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowUrl = new URL('../.github/workflows/contract.yml', import.meta.url);
const expectedDeclarations = Object.freeze([
  'Ores.WasmLoaders.Activation',
  'Ores.WasmLoaders.ActivationMode',
  'Ores.WasmLoaders.ApplicationId',
  'Ores.WasmLoaders.Asset',
  'Ores.WasmLoaders.AssetId',
  'Ores.WasmLoaders.AssetKind',
  'Ores.WasmLoaders.AssetRole',
  'Ores.WasmLoaders.AssetStage',
  'Ores.WasmLoaders.EntrypointId',
  'Ores.WasmLoaders.FrameworkKind',
  'Ores.WasmLoaders.HostSelector',
  'Ores.WasmLoaders.HttpsAssetUrl',
  'Ores.WasmLoaders.IslandName',
  'Ores.WasmLoaders.PrepareBudget',
  'Ores.WasmLoaders.PrepareStage',
  'Ores.WasmLoaders.RecordString',
  'Ores.WasmLoaders.RecordUnknown',
  'Ores.WasmLoaders.Release',
  'Ores.WasmLoaders.ReleaseId',
  'Ores.WasmLoaders.RuntimeKind',
  'Ores.WasmLoaders.SchemaVersion',
  'Ores.WasmLoaders.Sha256Hex',
  'Ores.WasmLoaders.ToolchainId',
]);

test('canonical TJSV admission binds peer authorities, runtime corpus, and complete consumer scope', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const validatorRef = workflow.match(/^\s*TSJSV_REF:\s*([0-9a-f]{40})\s*$/m)?.[1];
  assert.ok(validatorRef, 'TSJSV_REF must be one immutable commit SHA');

  const actionRefs = [...workflow.matchAll(
    /uses:\s*ORESoftware\/typespec-json-schema-validator(?:\/actions\/verify-contract-ir)?@([0-9a-f]{40})/g,
  )].map((match) => match[1]);
  assert.equal(actionRefs.length, 2, 'parity and downstream consumer verification must both run');
  assert.ok(actionRefs.every((ref) => ref === validatorRef), 'all TJSV actions must use the audited source revision');

  assert.match(workflow, /instances:\s*\.typespec-json-schema-validator\/instances/);
  assert.match(workflow, /cp fixtures\/valid\/\*\.json/);
  assert.match(workflow, /instances\/Release\/valid/);
  assert.match(workflow, /actions\/verify-contract-ir@[0-9a-f]{40}/);
  assert.match(workflow, /generated_schema:\s*\.typespec-json-schema-validator\/generated\/typespec\.generated\.schema\.json/);
  assert.match(workflow, /verification:\s*\.typespec-json-schema-validator\/consumer-verification\.json/);

  for (const declaration of expectedDeclarations) {
    assert.ok(workflow.includes(`"${declaration}"`), `missing complete-scope admission for ${declaration}`);
  }

  assert.match(workflow, /node scripts\/verify-contract-ir\.mjs/);
  assert.match(workflow, /node scripts\/check-language-projections\.mjs/);
  assert.doesNotMatch(workflow, /typespec-json-schema-validator(?:\/actions\/verify-contract-ir)?@(?:main|master|v\d+)/);
});
