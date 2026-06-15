import {
  createPlaywrightConfig,
  loadEnvironment,
  seconds,
} from '@playwright-automation/core';

process.env.TEST_ENV ??= 'prod';

const env = loadEnvironment();

export default createPlaywrightConfig({
  timeout: seconds(60),
  expect: {
    timeout: seconds(15),
  },
  packageName: '@playwright-automation/petstore',
  testDir: './src/tests',
  use: {
    baseURL: env.petstore.baseUrl,
    ignoreHTTPSErrors: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
