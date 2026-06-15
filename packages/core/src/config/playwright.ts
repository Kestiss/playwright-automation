import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@playwright/test';
import type {
  PlaywrightTestConfig,
  PlaywrightTestOptions,
  PlaywrightWorkerOptions,
} from '@playwright/test';

import { loadEnvironment } from './env.js';
import { seconds } from '../time/seconds.js';

interface SharedConfigOptions {
  packageName: string;
  testDir: string;
  outputDir?: string;
  timeout?: number;
  expect?: PlaywrightTestConfig['expect'];
  use?: Partial<PlaywrightTestOptions & PlaywrightWorkerOptions>;
  projects?: PlaywrightTestConfig['projects'];
}

export function createPlaywrightConfig({
  packageName,
  testDir,
  outputDir = 'test-results',
  timeout = 60_000,
  expect,
  use,
  projects,
}: SharedConfigOptions) {
  const environment = loadEnvironment();
  const isHeadlessRun = process.env.HEADLESS === 'true' || !!process.env.CI;
  const reportDirectory = path.join(
    'playwright-report',
    packageName.replace(/[@/]/g, '-'),
  );
  const htmlReportLinkReporter = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../reporters/html-report-link.ts',
  );

  return defineConfig({
    testDir,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    ...(process.env.CI ? { workers: 1 } : {}),
    timeout,
    expect: {
      timeout: seconds(15),
      ...expect,
    },
    reporter: [
      ['list'],
      ['html', { open: 'never', outputFolder: reportDirectory }],
      [htmlReportLinkReporter, { outputFolder: reportDirectory }],
    ],
    outputDir,
    use: {
      headless: isHeadlessRun,
      actionTimeout: seconds(15),
      navigationTimeout: seconds(30),
      trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      ...use,
    },
    metadata: {
      packageName,
      testEnvironment: environment.target,
    },
    ...(projects ? { projects } : {}),
  });
}
