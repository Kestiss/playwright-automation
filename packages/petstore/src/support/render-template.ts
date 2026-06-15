const PLACEHOLDER_PATTERN = /^\$\{([a-zA-Z0-9_]+)\}$/;
const INLINE_PLACEHOLDER_PATTERN = /\$\{([a-zA-Z0-9_]+)\}/g;

export function renderTemplate<T>(
  template: unknown,
  values: Record<string, unknown>,
): T {
  return renderValue(template, values) as T;
}

function renderValue(
  value: unknown,
  values: Record<string, unknown>,
): unknown {
  if (typeof value === 'string') {
    return renderString(value, values);
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderValue(item, values));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        renderValue(nestedValue, values),
      ]),
    );
  }

  return value;
}

function renderString(
  template: string,
  values: Record<string, unknown>,
): unknown {
  const exactPlaceholder = template.match(PLACEHOLDER_PATTERN);

  if (exactPlaceholder) {
    const placeholderKey = exactPlaceholder[1];

    if (!placeholderKey) {
      throw new Error(`Invalid template placeholder: "${template}".`);
    }

    return getValue(placeholderKey, values);
  }

  return template.replaceAll(INLINE_PLACEHOLDER_PATTERN, (_, key: string) => {
    return String(getValue(key, values));
  });
}

function getValue(key: string, values: Record<string, unknown>): unknown {
  if (!(key in values)) {
    throw new Error(`Missing template value for placeholder "${key}".`);
  }

  return values[key];
}
