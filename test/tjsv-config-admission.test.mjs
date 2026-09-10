import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowUrl = new URL('../.github/workflows/config-contract.yml', import.meta.url);
const expectedDeclarations = Object.freeze([
  'Ores.WasmLoaders.ActivationPolicy',
  'Ores.WasmLoaders.ConfigActivation',
  'Ores.WasmLoaders.ConfigExtensions',
  'Ores.WasmLoaders.ConfigPrepare',
  'Ores.WasmLoaders.ConfigPrepareStage',
  'Ores.WasmLoaders.ConfigTarget',
  'Ores.WasmLoaders.ConfigVersion',
  'Ores.WasmLoaders.EnvDeclaration',
  'Ores.WasmLoaders.EnvDeclarationMap',
  'Ores.WasmLoaders.EnvKey',
  'Ores.WasmLoaders.EnvValueType',
  'Ores.WasmLoaders.HostConfig',
  'Ores.WasmLoaders.HostConfigMap',
  'Ores.WasmLoaders.HostKind',
  'Ores.WasmLoaders.OresWasmConfig',
  'Ores.WasmLoaders.PrepareTrigger',
  'Ores.WasmLoaders.RepoPath',
]);

test('config TJSV admission pins immutable source, peer authorities, and complete scope', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const validatorRef = workflow.match(/^\s*TSJSV_REF:\s*([0-9a-f]{40})\s*$/m)?.[1];
  assert.ok(validatorRef, 'TSJSV_REF must be one immutable commit SHA');

  const actionRefs = [...workflow.matchAll(
    /uses:\s*ORESoftware\/typespec-json-schema-validator(?:\/actions\/verify-contract-ir)?@([0-9a-f]{40})/g,
  )].map((match) => match[1]);
  assert.equal(actionRefs.length, 2, 'parity and Contract IR verification must both run');
  assert.ok(actionRefs.every((ref) => ref === validatorRef), 'all TJSV actions must use the audited source revision');

  assert.match(workflow, /typespec:\s*contracts\/config\.tsp/);
  assert.match(workflow, /schema:\s*schemas\/ores-wasm-config\.schema\.json/);
  assert.match(workflow, /config-instances\/OresWasmConfig\/valid/);
  assert.match(workflow, /generated_schema:\s*\.typespec-json-schema-validator\/config-generated\/typespec\.generated\.schema\.json/);
  assert.match(workflow, /verification:\s*\.typespec-json-schema-validator\/config-consumer-verification\.json/);
  for (const declaration of expectedDeclarations) {
    assert.ok(workflow.includes(`"${declaration}"`), `missing complete-scope admission for ${declaration}`);
  }
  assert.doesNotMatch(workflow, /typespec-json-schema-validator(?:\/actions\/verify-contract-ir)?@(?:main|master|v\d+)/);
});
