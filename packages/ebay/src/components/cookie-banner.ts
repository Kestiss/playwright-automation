import { expect, type Locator, type Page } from '@playwright/test';
import { seconds } from '@playwright-automation/core';

export class CookieBanner {
  readonly banner: Locator;
  readonly acceptButton: Locator;

  constructor(private readonly page: Page) {
    this.banner = page.locator('#gdpr-banner');
    this.acceptButton = page.locator('#gdpr-banner-accept');
  }

  async acceptIfNeeded(timeout = seconds(5)): Promise<void> {
    await this.banner.waitFor({ state: 'visible', timeout }).catch(() => null);

    if (await this.banner.isVisible().catch(() => false)) {
      await this.acceptButton.click();
      await expect(this.banner).toBeHidden();
    }
  }
}
