import fs from 'node:fs';

const templateCache = new Map<string, unknown>();

export function loadJsonTemplate<T>(templateUrl: URL): T {
  const cacheKey = templateUrl.href;
  const cached = templateCache.get(cacheKey);

  if (cached) {
    return cached as T;
  }

  const template = JSON.parse(fs.readFileSync(templateUrl, 'utf-8')) as T;
  templateCache.set(cacheKey, template);
  return template;
}
