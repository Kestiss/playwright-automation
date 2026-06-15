import { expect, type Locator, type Page } from '@playwright/test';
import { seconds } from '@playwright-automation/core';

import { CheckoutAuthPanel } from '../components/checkout-auth-panel.js';
import { BasePage } from './base-page.js';

export const CART_URL_PREFIX = 'https://cart.ebay.com/';

export class CartPage extends BasePage {
  readonly itemTitle: Locator;
  readonly removeButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.itemTitle = page.locator("h3[class*='item-title']").first();
    this.removeButton = page.getByRole('button', { name: 'Remove' }).first();
    this.checkoutButton = page.locator("button[data-test-id='cta-top']");
  }

  async open(): Promise<void> {
    await this.openUrl(CART_URL_PREFIX);
    await this.expectOpened();
  }

  async expectOpened(): Promise<void> {
    await this.page.waitForURL(
      (url) => url.toString().startsWith(CART_URL_PREFIX),
      { timeout: seconds(10) },
    );
  }

  async expectItemTitle(expectedTitle: string): Promise<void> {
    await expect(this.itemTitle).toContainText(expectedTitle);
  }

  async beginCheckout(): Promise<CheckoutAuthPanel> {
    await expect(this.checkoutButton).toBeVisible();

    const checkoutAuthPanel = new CheckoutAuthPanel(this.page);
    await Promise.all([
      checkoutAuthPanel.expectOpened(),
      this.checkoutButton.click({ noWaitAfter: true }),
    ]);

    return checkoutAuthPanel;
  }

  async removeItem(): Promise<void> {
    await expect(this.removeButton).toBeVisible();
    await this.removeButton.click();
  }

  async expectItemRemoved(): Promise<void> {
    await expect(this.itemTitle).toBeHidden();
  }
}
