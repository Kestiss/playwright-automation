import type { Page } from '@playwright/test';

type DiagnosticStep = {
  timestamp: string;
  message: string;
};

const stepsByPage = new WeakMap<Page, DiagnosticStep[]>();
const activePagesByRootPage = new WeakMap<Page, Page>();

function createTimestamp(): string {
  return new Date().toISOString();
}

export function rememberDiagnosticStep(page: Page, message: string): void {
  const steps = stepsByPage.get(page) ?? [];

  steps.push({
    timestamp: createTimestamp(),
    message,
  });

  if (steps.length > 20) {
    steps.shift();
  }

  stepsByPage.set(page, steps);
}

export function getDiagnosticSteps(page: Page): DiagnosticStep[] {
  return [...(stepsByPage.get(page) ?? [])];
}

export function setDiagnosticActivePage(rootPage: Page, activePage: Page): void {
  activePagesByRootPage.set(rootPage, activePage);
}

export function getDiagnosticActivePage(rootPage: Page): Page {
  return activePagesByRootPage.get(rootPage) ?? rootPage;
}

export function clearDiagnosticSteps(page: Page): void {
  stepsByPage.delete(page);
  activePagesByRootPage.delete(page);
}
