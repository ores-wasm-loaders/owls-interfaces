// A dependency-free validator for the JSON Schema subset `release.schema.json` uses.
//
// It replaces the ajv-generated `generated-validate.js`, because dropping the build step is
// what lets this package be consumed as source: the loading layer is the first thing a page
// runs, and it must not drag a toolchain or a dependency tree in front of itself.
//
// It is deliberately NOT a general JSON Schema implementation. It supports exactly the
// keywords this schema uses and throws on any keyword it does not know, so the schema can
// never quietly mean less than it says.

const KNOWN = new Set([
  '$schema', '$id', '$ref', '$defs', 'title', 'description', 'default',
  'type', 'enum', 'const', 'properties', 'additionalProperties', 'required',
  'items', 'minItems', 'maxItems', 'minLength', 'maxLength', 'pattern', 'minimum', 'maximum',
]);

const typeOf = (v) =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;

function resolve(ref, root) {
  if (!ref.startsWith('#/')) throw new Error(`unsupported $ref \`${ref}\``);
  let node = root;
  for (const part of ref.slice(2).split('/')) {
    node = node?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
    if (!node) throw new Error(`unresolvable $ref \`${ref}\``);
  }
  return node;
}

function check(value, schema, path, out, root) {
  if (schema.$ref) return check(value, resolve(schema.$ref, root), path, out, root);
  for (const key of Object.keys(schema)) {
    if (!KNOWN.has(key)) out.push(`${path || '$'}: schema uses unsupported keyword \`${key}\``);
  }
  if (schema.type !== undefined) {
    const actual = typeOf(value);
    const ok = schema.type === 'number' ? actual === 'integer' || actual === 'number' : actual === schema.type;
    if (!ok) {
      out.push(`${path || '$'}: expected ${schema.type}, got ${actual}`);
      return out;
    }
  }
  if (schema.const !== undefined && value !== schema.const) out.push(`${path}: expected ${JSON.stringify(schema.const)}`);
  if (schema.enum !== undefined && !schema.enum.includes(value)) {
    out.push(`${path}: ${JSON.stringify(value)} is not one of ${schema.enum.join(', ')}`);
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) out.push(`${path}: shorter than ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) out.push(`${path}: longer than ${schema.maxLength}`);
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) out.push(`${path}: does not match /${schema.pattern}/`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) out.push(`${path}: below minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) out.push(`${path}: above maximum ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) out.push(`${path}: needs at least ${schema.minItems} item(s)`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) out.push(`${path}: at most ${schema.maxItems} item(s)`);
    if (schema.items) value.forEach((v, i) => check(v, schema.items, `${path}[${i}]`, out, root));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const name of schema.required ?? []) if (!(name in value)) out.push(`${path || '$'}: missing required property \`${name}\``);
    const props = schema.properties ?? {};
    for (const [key, child] of Object.entries(value)) {
      if (props[key]) check(child, props[key], `${path}.${key}`, out, root);
      else if (schema.additionalProperties === false) out.push(`${path || '$'}: unexpected property \`${key}\``);
    }
  }
  return out;
}

/** Structural validation against the schema. Returns the list of errors (empty when valid). */
export function validateAgainst(value, schema) {
  return check(value, schema, '', [], schema);
}
