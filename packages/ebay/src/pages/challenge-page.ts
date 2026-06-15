import type { Page } from '@playwright/test';

const CHALLENGE_PATHS = ['/splashui/challenge', '/splashui/captcha'];

export class ChallengePage {
  constructor(private readonly page: Page) {}

  private isChallengeUrl(url: string): boolean {
    return CHALLENGE_PATHS.some((path) => url.includes(path));
  }

  isOpen(): boolean {
    return this.isChallengeUrl(this.page.url());
  }

  async waitUntilResolved(timeout = 60_000): Promise<boolean> {
    if (!this.isOpen()) {
      return true;
    }

    const challengeResolved = await this.page
      .waitForURL((url) => !this.isChallengeUrl(url.toString()), {
        timeout,
      })
      .then(() => true)
      .catch(() => false);

    if (challengeResolved) {
      await this.page.waitForLoadState('domcontentloaded');
    }

    return challengeResolved;
  }
}
