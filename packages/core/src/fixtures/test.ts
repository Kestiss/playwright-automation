import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { expect, test as base } from '@playwright/test';
import type {
  ConsoleMessage,
  Frame,
  Page,
  TestInfo,
} from '@playwright/test';

import { loadEnvironment } from '../config/env.js';
import type { TestEnvironment } from '../types/environment.js';
import {
  clearDiagnosticSteps,
  getDiagnosticActivePage,
  getDiagnosticSteps,
} from './diagnostic-steps.js';

interface CoreFixtures {
  env: TestEnvironment;
  _diagnostics: void;
}

type DiagnosticEntry = {
  timestamp: string;
  message: string;
};

function createTimestamp(): string {
  return new Date().toISOString();
}

function formatEntries(title: string, entries: DiagnosticEntry[]): string[] {
  if (entries.length === 0) {
    return [`${title}: none`];
  }

  return [
    title,
    ...entries.map((entry) => `  [${entry.timestamp}] ${entry.message}`),
  ];
}

function getHtmlReportUrl(testInfo: TestInfo): string | undefined {
  const packageName = testInfo.config.metadata?.packageName;

  if (typeof packageName !== 'string' || packageName.length === 0) {
    return undefined;
  }

  const reportDirectory = path.resolve(
    'playwright-report',
    packageName.replace(/[@/]/g, '-'),
  );

  return pathToFileURL(path.join(reportDirectory, 'index.html')).href;
}

async function buildFailureDiagnostics(
  page: Page,
  testInfo: TestInfo,
  navigations: DiagnosticEntry[],
  consoleErrors: DiagnosticEntry[],
): Promise<string> {
  const diagnosticPage = getDiagnosticActivePage(page);
  const lines: string[] = [];
  const htmlReportUrl = getHtmlReportUrl(testInfo);

  lines.push(`Test: ${testInfo.title}`);
  lines.push(`Status: ${testInfo.status}`);
  lines.push(`Expected status: ${testInfo.expectedStatus}`);
  lines.push(`Duration: ${testInfo.duration}ms`);
  lines.push(
    `Diagnostic page: ${diagnosticPage === page ? 'original test page' : 'active flow page'}`,
  );

  if (diagnosticPage.isClosed()) {
    lines.push('Page state: closed before diagnostics were collected');
  } else {
    lines.push(`Current URL: ${diagnosticPage.url()}`);

    try {
      lines.push(`Page title: ${await diagnosticPage.title()}`);
    } catch {
      lines.push('Page title: unavailable');
    }

    try {
      const headings = (await diagnosticPage.locator('h1, h2, h3').allTextContents())
        .map((heading) => heading.trim())
        .filter(Boolean)
        .slice(0, 5);
      lines.push(
        `Visible headings: ${headings.length > 0 ? headings.join(' | ') : 'none'}`,
      );
    } catch {
      lines.push('Visible headings: unavailable');
    }
  }

  lines.push(...formatEntries('Recent steps', getDiagnosticSteps(page)));
  lines.push(...formatEntries('Recent navigations', navigations));
  lines.push(...formatEntries('Console errors', consoleErrors));

  if (htmlReportUrl) {
    lines.push(`HTML report: ${htmlReportUrl}`);
  }

  return lines.join('\n');
}

function remember(entries: DiagnosticEntry[], message: string): void {
  entries.push({ timestamp: createTimestamp(), message });

  if (entries.length > 15) {
    entries.shift();
  }
}

export const apiTest = base.extend<Pick<CoreFixtures, 'env'>>({
  // eslint-disable-next-line no-empty-pattern
  env: async ({}, use: (environment: TestEnvironment) => Promise<void>) => {
    await use(loadEnvironment());
  },
});

export const test = base.extend<CoreFixtures>({
  // eslint-disable-next-line no-empty-pattern
  env: async ({}, use: (environment: TestEnvironment) => Promise<void>) => {
    await use(loadEnvironment());
  },
  _diagnostics: [
    async ({ page }, use, testInfo) => {
      const navigations: DiagnosticEntry[] = [];
      const consoleErrors: DiagnosticEntry[] = [];
      const pagesWithListeners = new Set<Page>();
      const cleanupCallbacks: Array<() => void> = [];

      clearDiagnosticSteps(page);

      const attachListeners = (trackedPage: Page): void => {
        if (pagesWithListeners.has(trackedPage)) {
          return;
        }

        pagesWithListeners.add(trackedPage);

        const handleNavigation = (frame: Frame): void => {
          if (frame !== trackedPage.mainFrame()) {
            return;
          }

          remember(navigations, frame.url());
        };

        const handleConsole = (message: ConsoleMessage): void => {
          if (message.type() !== 'error') {
            return;
          }

          remember(consoleErrors, message.text());
        };

        trackedPage.on('framenavigated', handleNavigation);
        trackedPage.on('console', handleConsole);

        cleanupCallbacks.push(() => {
          trackedPage.removeListener('framenavigated', handleNavigation);
          trackedPage.removeListener('console', handleConsole);
        });
      };

      for (const existingPage of page.context().pages()) {
        attachListeners(existingPage);
      }

      const handleNewPage = (newPage: Page): void => {
        attachListeners(newPage);
      };

      page.context().on('page', handleNewPage);

      await use();

      page.context().removeListener('page', handleNewPage);
      cleanupCallbacks.forEach((cleanup) => cleanup());

      if (testInfo.status === testInfo.expectedStatus) {
        clearDiagnosticSteps(page);
        return;
      }

      const diagnostics = await buildFailureDiagnostics(
        page,
        testInfo,
        navigations,
        consoleErrors,
      );

      console.error(`
Failure diagnostics
${diagnostics}
`);
      await testInfo.attach('failure-diagnostics', {
        body: diagnostics,
        contentType: 'text/plain',
      });
      clearDiagnosticSteps(page);
    },
    { auto: true },
  ],
});

export { expect };
