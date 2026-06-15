import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export function resolveRepoRoot(): string {
  return path.resolve(currentDirectory, '../../../../');
}

export function resolveFromRepoRoot(...segments: string[]): string {
  return path.join(resolveRepoRoot(), ...segments);
}
