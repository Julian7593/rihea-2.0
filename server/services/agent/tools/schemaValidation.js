function isType(value, expectedType) {
  if (expectedType === "array") return Array.isArray(value);
  if (expectedType === "null") return value === null;
  if (expectedType === "object") return value && typeof value === "object" && !Array.isArray(value);
  return typeof value === expectedType;
}

function formatPath(path) {
  return path || "root";
}

function validateNode(value, schema, path, errors) {
  if (!schema || typeof schema !== "object") return;

  if (schema.type && !isType(value, schema.type)) {
    errors.push(`Expected ${formatPath(path)} type "${schema.type}".`);
    return;
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0 && !schema.enum.includes(value)) {
    errors.push(`Field ${formatPath(path)} must be one of: ${schema.enum.join(", ")}.`);
  }

  if (schema.type === "string") {
    if (typeof schema.minLength === "number" && String(value).length < schema.minLength) {
      errors.push(`Field ${formatPath(path)} must have length >= ${schema.minLength}.`);
    }
    if (typeof schema.maxLength === "number" && String(value).length > schema.maxLength) {
      errors.push(`Field ${formatPath(path)} must have length <= ${schema.maxLength}.`);
    }
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(String(value))) {
        errors.push(`Field ${formatPath(path)} does not match required pattern.`);
      }
    }
  }

  if (schema.type === "number") {
    if (typeof schema.minimum === "number" && Number(value) < schema.minimum) {
      errors.push(`Field ${formatPath(path)} must be >= ${schema.minimum}.`);
    }
    if (typeof schema.maximum === "number" && Number(value) > schema.maximum) {
      errors.push(`Field ${formatPath(path)} must be <= ${schema.maximum}.`);
    }
  }

  if (schema.type === "array") {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      errors.push(`Field ${formatPath(path)} must contain at least ${schema.minItems} item(s).`);
    }
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
      errors.push(`Field ${formatPath(path)} must contain at most ${schema.maxItems} item(s).`);
    }
    if (schema.items && typeof schema.items === "object") {
      value.forEach((item, index) => {
        validateNode(item, schema.items, `${path}[${index}]`, errors);
      });
    }
  }

  if (schema.type === "object") {
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const key of required) {
      if (!(key in value)) {
        errors.push(`Missing required field "${path ? `${path}.` : ""}${key}".`);
      }
    }

    const properties = schema.properties && typeof schema.properties === "object" ? schema.properties : {};
    for (const [key, rule] of Object.entries(properties)) {
      if (!(key in value) || value[key] === undefined) continue;
      validateNode(value[key], rule, path ? `${path}.${key}` : key, errors);
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) {
          errors.push(`Unexpected field "${path ? `${path}.` : ""}${key}".`);
        }
      }
    }
  }
}

export function validateBySchema(payload, schema) {
  const errors = [];
  const safePayload = payload ?? {};
  if (!schema || typeof schema !== "object") {
    return { valid: true, errors };
  }

  validateNode(safePayload, schema, "", errors);
  return {
    valid: errors.length === 0,
    errors,
  };
}
