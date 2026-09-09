import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowUrl = new URL('../.github/workflows/contract.yml', import.meta.url);

test('the peer-authority gate pins one exact validator revision everywhere', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const envMatch = workflow.match(/^\s*TSJSV_REF:\s*([0-9a-f]{40})\s*$/m);
  const actionMatch = workflow.match(
    /uses:\s*ORESoftware\/typespec-json-schema-validator@([0-9a-f]{40})/,
  );

  assert.ok(envMatch, 'TSJSV_REF must be a full immutable commit SHA');
  assert.ok(actionMatch, 'the composite action must be pinned to a full commit SHA');
  assert.equal(
    actionMatch[1],
    envMatch[1],
    'checkout and composite-action validator revisions must be identical',
  );
  assert.match(workflow, /ref:\s*\$\{\{ env\.TSJSV_REF \}\}/);
  assert.match(workflow, /git -C \.tools\/typespec-json-schema-validator rev-parse HEAD/);
  assert.match(workflow, /node scripts\/verify-contract-ir\.mjs/);
  assert.match(workflow, /node scripts\/check-language-projections\.mjs/);
  assert.doesNotMatch(
    workflow,
    /ORESoftware\/typespec-json-schema-validator@(?:main|master|v\d+)/,
  );
});
