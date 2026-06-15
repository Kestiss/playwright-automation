import fs from 'node:fs';

import dotenv from 'dotenv';
import { z } from 'zod';

import { resolveFromRepoRoot } from '../utils/repo-root.js';
import type { EnvironmentName, TestEnvironment } from '../types/environment.js';

const runtimeSchema = z.object({
  TEST_ENV: z.enum(['qa', 'stage', 'prod']).optional(),
});

const fileSchema = z.object({
  EBAY_BASE_URL: z.string().url(),
  PETSTORE_BASE_URL: z.string().url(),
  PETSTORE_API_KEY: z.string().min(1),
});

let cachedEnvironment: TestEnvironment | undefined;

function resolveEnvironmentName(): EnvironmentName {
  return runtimeSchema.parse(process.env).TEST_ENV ?? 'prod';
}

function loadEnvironmentFile(
  environmentName: EnvironmentName,
): Record<string, string> {
  const filePath = resolveFromRepoRoot(
    'config',
    'env',
    `.env.${environmentName}`,
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Environment file was not found: ${filePath}`);
  }

  return dotenv.parse(fs.readFileSync(filePath));
}

export function loadEnvironment(): TestEnvironment {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  const target = resolveEnvironmentName();
  const fileValues = loadEnvironmentFile(target);
  const merged = {
    ...fileValues,
    ...process.env,
  };
  const parsed = fileSchema.parse(merged);

  cachedEnvironment = {
    target,
    ebay: {
      baseUrl: parsed.EBAY_BASE_URL,
    },
    petstore: {
      baseUrl: parsed.PETSTORE_BASE_URL,
      apiKey: parsed.PETSTORE_API_KEY,
    },
  };

  return cachedEnvironment;
}
