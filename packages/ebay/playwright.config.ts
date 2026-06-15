import { devices, type PlaywrightTestConfig } from '@playwright/test';
import {
  createPlaywrightConfig,
  loadEnvironment,
  seconds,
} from '@playwright-automation/core';

process.env.TEST_ENV ??= 'prod';

const env = loadEnvironment();
const isHeadlessRun = process.env.HEADLESS === 'true' || !!process.env.CI;
const selectedProjects = (process.env.PW_PROJECTS ?? 'chromium, firefox')
  .split(',')
  .map((project) => project.trim())
  .filter(Boolean);

const allProjects: NonNullable<PlaywrightTestConfig['projects']> = [
  {
    name: 'chromium',
    use: isHeadlessRun
      ? {
          ...devices['Desktop Chrome'],
        }
      : {
          browserName: 'chromium',
          viewport: null,
          launchOptions: {
            args: ['--start-maximized'],
          },
        },
  },
  {
    name: 'firefox',
    use: isHeadlessRun
      ? {
          ...devices['Desktop Firefox'],
        }
      : {
          browserName: 'firefox',
          viewport: { width: 1440, height: 900 },
        },
  },
];

const projects = allProjects.filter(
  (project) => project.name && selectedProjects.includes(project.name),
);

export default createPlaywrightConfig({
  timeout: seconds(60),
  expect: {
    timeout: seconds(15),
  },
  packageName: '@playwright-automation/ebay',
  testDir: './src/tests',
  use: {
    baseURL: env.ebay.baseUrl,
  },
  projects,
});
