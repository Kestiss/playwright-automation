import { test } from '@playwright-automation/core';
import type { Page } from '@playwright/test';

import { ChallengePage } from '../pages/challenge-page.js';

const CHALLENGE_TIMEOUT_MESSAGE =
  'eBay kept the automated session on /splashui/challenge and never returned to the results page within 60 seconds.';

export function skipIfChallengePersists(challengeResolved: boolean): void {
  test.skip(!challengeResolved, CHALLENGE_TIMEOUT_MESSAGE);
}

export async function resolveChallengeOrSkip(page: Page): Promise<void> {
  const challengeResolved = await new ChallengePage(page).waitUntilResolved();
  skipIfChallengePersists(challengeResolved);
}
