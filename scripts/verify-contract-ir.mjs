import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const requireCondition = (condition, message) => {
  if (!condition) throw new Error(`Contract IR admission failed: ${message}`);
};

const validator = await import(
  new URL('.tools/typespec-json-schema-validator/src/index.mjs', root).href
);
const report = await readJson('.typespec-json-schema-validator/report.json');
const contractIr = await readJson('.typespec-json-schema-validator/contract-ir.json');

const verification = await validator.verifyContractIr({
  contractIr,
  report,
  typespec: new URL('contracts/main.tsp', root).pathname,
  generatedSchema: report?.inputs?.generatedJsonSchema?.input,
  authoredSchema: new URL('schemas/release.schema.json', root).pathname,
});

requireCondition(verification.status === 'passed', JSON.stringify(verification));
requireCondition(verification.admissible === true, 'verification did not admit the artifact');
requireCondition(contractIr.schema === validator.CONTRACT_IR_SCHEMA, 'unknown Contract IR schema');
requireCondition(contractIr.status === 'passed' && contractIr.admissible === true, 'artifact is a tombstone or failed result');
requireCondition(contractIr.editableAuthority === false, 'derived IR cannot be an editable authority');
requireCondition(contractIr.authorities?.typespec === 'independently-authored', 'TypeSpec authority provenance is missing');
requireCondition(contractIr.authorities?.jsonSchema === 'independently-authored', 'JSON Schema authority provenance is missing');
requireCondition(contractIr.authorities?.generatedJsonSchema === 'comparison-evidence-only', 'Schema B was promoted beyond evidence');
requireCondition(contractIr.authorities?.precedence === 'none', 'one authored authority was ranked above the other');
requireCondition(contractIr.admission?.receipt?.runId === report.runId, 'receipt runId binding does not match');
requireCondition(contractIr.admission?.receipt?.status === 'passed', 'bound receipt is not passing');
requireCondition(contractIr.admission?.receipt?.zeroUnexplainedFindings === true, 'bound receipt has unexplained findings');
requireCondition(contractIr.admission?.requirements?.exactInputDigests === true, 'exact-input admission was not enforced');
requireCondition(contractIr.admission?.requirements?.directDeclarationInventory === true, 'direct TypeSpec inventory was not enforced');
requireCondition(contractIr.admission?.requirements?.generatedSchemaComparison === true, 'Schema B comparison was not enforced');
requireCondition(contractIr.admission?.requirements?.differentialInstanceValidation === true, 'differential validation was not enforced');
requireCondition(contractIr.declarations.length === contractIr.admission.scope.admittedDeclarations, 'admitted declaration count is inconsistent');
requireCondition(contractIr.excludedDeclarations.length === contractIr.admission.scope.excludedDeclarations, 'excluded declaration count is inconsistent');
requireCondition(contractIr.outOfScopeDeclarations.length === contractIr.admission.scope.outOfScopeDeclarations, 'out-of-scope declaration count is inconsistent');

const authoredNames = new Set(
  contractIr.declarations.map((declaration) => declaration.names.authoredJsonSchema),
);
for (const requiredName of ['Release', 'Asset', 'PrepareBudget', 'Activation']) {
  requireCondition(authoredNames.has(requiredName), `required WASM loader declaration ${requiredName} was not admitted`);
}
for (const declaration of contractIr.declarations) {
  requireCondition(
    declaration.lanes.typespecGeneratedJsonSchema.role === 'comparison-evidence-only',
    `${declaration.id}: generated lane has the wrong authority role`,
  );
  requireCondition(
    declaration.lanes.authoredJsonSchema.role === 'independently-authored-authority',
    `${declaration.id}: authored JSON Schema lane has the wrong authority role`,
  );
}

process.stdout.write(`${JSON.stringify({
  schema: 'ores-wasm-loaders.contract-ir-admission/v1',
  status: 'passed',
  contractIrId: contractIr.irId,
  parityReceiptRunId: report.runId,
  admittedDeclarations: contractIr.declarations.length,
  scopeComplete: contractIr.admission.scope.complete,
})}\n`);
