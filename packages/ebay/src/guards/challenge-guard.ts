import { test } from '@playwright-automation/core';

const CHALLENGE_TIMEOUT_MESSAGE =
  'eBay kept the automated session on /splashui/challenge and never returned to the results page within 60 seconds.';

export function skipIfChallengePersists(challengeResolved: boolean): void {
  test.skip(!challengeResolved, CHALLENGE_TIMEOUT_MESSAGE);
}
