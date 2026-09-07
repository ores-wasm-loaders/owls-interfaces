#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = resolve(root, '.typespec-json-schema-validator');
const irPath = resolve(evidenceDir, 'contract-ir.json');
const reportPath = resolve(evidenceDir, 'report.json');
const outputPath = resolve(evidenceDir, 'projection-receipt.json');

const languages = Object.freeze([
  Object.freeze({ language: 'typescript', source: 'typescript/index.ts' }),
  Object.freeze({ language: 'rust', source: 'rust/src/v2.rs' }),
  Object.freeze({ language: 'dart', source: 'dart/lib/owls_interfaces.dart' }),
  Object.freeze({ language: 'go', source: 'go/contract.go' }),
  Object.freeze({ language: 'gleam', source: 'gleam/src/owls_interfaces.gleam' }),
]);

const fail = (message) => {
  throw new Error(`language projection admission failed: ${message}`);
};
const sha256 = (input) => createHash('sha256').update(input).digest('hex');
const sorted = (values) => [...values].sort((left, right) => left.localeCompare(right));
const same = (left, right) =>
  left.length === right.length && left.every((value, index) => value === right[index]);
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

function expectedMarker(declaration) {
  const name = declaration?.names?.authoredJsonSchema;
  const kind = declaration?.kind;
  if (typeof name !== 'string' || !name) fail(`Contract IR declaration ${declaration?.id ?? '<unknown>'} has no authored name`);
  if (!['enum', 'model', 'scalar-like'].includes(kind)) fail(`${name}: unsupported Contract IR kind ${kind}`);

  if (kind === 'enum') {
    const values = declaration?.assertionSchema?.enum;
    if (!Array.isArray(values) || values.length === 0) fail(`${name}: enum has no admitted values`);
    return Object.freeze({ name, kind, members: sorted(values.map(String)) });
  }
  if (kind === 'model') {
    const properties = declaration?.assertionSchema?.properties ?? {};
    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
      fail(`${name}: model properties are not an object`);
    }
    return Object.freeze({ name, kind, members: sorted(Object.keys(properties)) });
  }
  return Object.freeze({ name, kind, members: [] });
}

function markersFromSource(source, sourcePath) {
  const markers = new Map();
  const pattern = /@contract-ir\s+([A-Za-z][A-Za-z0-9]*)\s+(enum|model|scalar-like)(?:\s+([^\r\n]*?))?\s*$/u;
  for (const [offset, line] of source.split(/\r?\n/u).entries()) {
    const match = line.match(pattern);
    if (!match) continue;
    const [, name, kind, rawMembers = ''] = match;
    if (markers.has(name)) fail(`${sourcePath}:${offset + 1}: duplicate marker for ${name}`);
    const members = rawMembers.trim() === '' ? [] : sorted(rawMembers.split('|').map((value) => value.trim()).filter(Boolean));
    if (new Set(members).size !== members.length) fail(`${sourcePath}:${offset + 1}: duplicate marker member for ${name}`);
    markers.set(name, Object.freeze({ name, kind, members, line: offset + 1 }));
  }
  return markers;
}

const contractIr = await readJson(irPath);
const report = await readJson(reportPath);
if (contractIr?.schema !== 'ores.typespec-json-schema-validator.contract-ir/v1') fail('unknown Contract IR schema');
if (contractIr?.status !== 'passed' || contractIr?.admissible !== true) fail('Contract IR is not admissible');
if (contractIr?.editableAuthority !== false) fail('Contract IR was promoted to editable authority');
if (contractIr?.authorities?.precedence !== 'none') fail('one authored authority has precedence');
if (contractIr?.admission?.receipt?.runId !== report?.runId) fail('Contract IR and parity receipt run IDs differ');
if (contractIr?.admission?.receipt?.zeroUnexplainedFindings !== true) fail('parity receipt has unexplained findings');

const expected = new Map();
for (const declaration of contractIr.declarations ?? []) {
  const marker = expectedMarker(declaration);
  if (expected.has(marker.name)) fail(`Contract IR repeats ${marker.name}`);
  expected.set(marker.name, marker);
}
if (expected.size === 0) fail('Contract IR admits no declarations');

const projectionReceipts = [];
for (const language of languages) {
  const absolutePath = resolve(root, language.source);
  const source = await readFile(absolutePath, 'utf8');
  const actual = markersFromSource(source, language.source);

  const missing = sorted([...expected.keys()].filter((name) => !actual.has(name)));
  const extra = sorted([...actual.keys()].filter((name) => !expected.has(name)));
  if (missing.length || extra.length) {
    fail(`${language.language}: declaration set differs; missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`);
  }

  for (const [name, expectedMarkerValue] of expected) {
    const actualMarker = actual.get(name);
    if (actualMarker.kind !== expectedMarkerValue.kind) {
      fail(`${language.language}:${actualMarker.line}: ${name} is ${actualMarker.kind}, expected ${expectedMarkerValue.kind}`);
    }
    if (!same(actualMarker.members, expectedMarkerValue.members)) {
      fail(
        `${language.language}:${actualMarker.line}: ${name} members differ; ` +
          `actual=[${actualMarker.members.join(', ')}] expected=[${expectedMarkerValue.members.join(', ')}]`,
      );
    }
  }

  projectionReceipts.push(Object.freeze({
    language: language.language,
    source: language.source,
    sourceSha256: sha256(source),
    declarations: actual.size,
  }));
}

const declarationDigests = Object.fromEntries(
  sorted(contractIr.declarations.map((declaration) => declaration.names.authoredJsonSchema)).map((name) => {
    const declaration = contractIr.declarations.find((candidate) => candidate.names.authoredJsonSchema === name);
    return [name, declaration.assertionDigest];
  }),
);
const receiptBody = Object.freeze({
  schema: 'ores-wasm-loaders.language-projection-receipt/v1',
  status: 'passed',
  admissible: true,
  editableAuthority: false,
  authorities: Object.freeze({
    typespec: 'independently-authored',
    jsonSchema: 'independently-authored',
    generatedJsonSchema: 'comparison-evidence-only',
    contractIr: 'downstream-admission-evidence',
    precedence: 'none',
  }),
  contractIrId: contractIr.irId,
  parityReceiptRunId: report.runId,
  declarations: expected.size,
  declarationDigests,
  projections: projectionReceipts,
});
const receipt = Object.freeze({
  ...receiptBody,
  receiptId: sha256(JSON.stringify(receiptBody)),
});
await mkdir(evidenceDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(receipt)}\n`);
