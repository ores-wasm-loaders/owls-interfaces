// A dependency-free validator for the JSON Schema subset `release.schema.json` uses.
//
// It replaces generated validation code because the loading layer is the first thing a page
// runs. This is deliberately NOT a general JSON Schema implementation: unsupported keywords
// fail closed instead of silently weakening either independent contract authority.

const KNOWN = new Set([
  '$schema', '$id', '$ref', '$defs', 'title', 'description', 'default',
  'type', 'enum', 'const', 'properties', 'additionalProperties', 'unevaluatedProperties',
  'required', 'items', 'minItems', 'maxItems', 'minLength', 'maxLength', 'pattern',
  'minimum', 'maximum', 'not',
]);

const typeOf = (v) =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;

function resolve(ref, root) {
  if (!ref.startsWith('#/')) throw new Error(`unsupported $ref \`${ref}\``);
  let node = root;
  for (const part of ref.slice(2).split('/')) {
    node = node?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
    if (node === undefined) throw new Error(`unresolvable $ref \`${ref}\``);
  }
  return node;
}

function accepts(value, schema, root) {
  return check(value, schema, '', [], root).length === 0;
}

function check(value, schema, path, out, root) {
  if (schema === true) return out;
  if (schema === false) {
    out.push(`${path || '$'}: rejected by false schema`);
    return out;
  }
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    out.push(`${path || '$'}: schema node must be an object or boolean`);
    return out;
  }
  if (schema.$ref) return check(value, resolve(schema.$ref, root), path, out, root);
  for (const key of Object.keys(schema)) {
    if (!KNOWN.has(key)) out.push(`${path || '$'}: schema uses unsupported keyword \`${key}\``);
  }
  if (schema.not !== undefined && accepts(value, schema.not, root)) {
    out.push(`${path || '$'}: value matched a forbidden schema`);
    return out;
  }
  if (schema.type !== undefined) {
    const actual = typeOf(value);
    const ok = schema.type === 'number' ? actual === 'integer' || actual === 'number' : actual === schema.type;
    if (!ok) {
      out.push(`${path || '$'}: expected ${schema.type}, got ${actual}`);
      return out;
    }
  }
  if (schema.const !== undefined && value !== schema.const) out.push(`${path || '$'}: expected ${JSON.stringify(schema.const)}`);
  if (schema.enum !== undefined && !schema.enum.includes(value)) {
    out.push(`${path || '$'}: ${JSON.stringify(value)} is not one of ${schema.enum.join(', ')}`);
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) out.push(`${path || '$'}: shorter than ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) out.push(`${path || '$'}: longer than ${schema.maxLength}`);
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) out.push(`${path || '$'}: does not match /${schema.pattern}/`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) out.push(`${path || '$'}: below minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) out.push(`${path || '$'}: above maximum ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) out.push(`${path || '$'}: needs at least ${schema.minItems} item(s)`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) out.push(`${path || '$'}: at most ${schema.maxItems} item(s)`);
    if (schema.items !== undefined) value.forEach((v, i) => check(v, schema.items, `${path}[${i}]`, out, root));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const name of schema.required ?? []) if (!(name in value)) out.push(`${path || '$'}: missing required property \`${name}\``);
    const props = schema.properties ?? {};
    for (const [key, child] of Object.entries(value)) {
      if (props[key] !== undefined) {
        check(child, props[key], path ? `${path}.${key}` : `$.${key}`, out, root);
        continue;
      }
      if (schema.additionalProperties !== undefined) {
        if (schema.additionalProperties === false) out.push(`${path || '$'}: unexpected property \`${key}\``);
        else if (schema.additionalProperties !== true) check(child, schema.additionalProperties, path ? `${path}.${key}` : `$.${key}`, out, root);
        continue;
      }
      if (schema.unevaluatedProperties !== undefined) {
        if (schema.unevaluatedProperties === false) out.push(`${path || '$'}: unexpected property \`${key}\``);
        else if (schema.unevaluatedProperties !== true) check(child, schema.unevaluatedProperties, path ? `${path}.${key}` : `$.${key}`, out, root);
      }
    }
  }
  return out;
}

/** Structural validation against the supported Draft 2020-12 subset. */
export function validateAgainst(value, schema) {
  return check(value, schema, '', [], schema);
}
