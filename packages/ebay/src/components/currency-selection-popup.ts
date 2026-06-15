import { expect, type Locator, type Page } from '@playwright/test';
import { seconds } from '@playwright-automation/core';

export class CurrencySelectionPopup {
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly continueButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page
      .locator("div.lightbox-dialog[data-test-id='dialog-test']")
      .filter({ has: page.locator('div.currency-selection') })
      .first();
    this.heading = this.dialog.locator("span[class='text-display']").first();
    this.continueButton = this.dialog.locator("button[class*='btn--primary']");
  }

  async expectOpened(): Promise<void> {
    await expect(this.dialog).toBeVisible();
    await expect(this.heading).toHaveText('Select a currency for this purchase');
    await expect(this.continueButton).toBeVisible();
    await expect(this.continueButton).toContainText("Continue in");
  }

  async continueWithSelectedCurrency(): Promise<void> {
    await this.expectOpened();

    await Promise.all([
      expect(this.dialog).toBeHidden({ timeout: seconds(30) }),
      this.continueButton.click(),
    ]);
  }
}
