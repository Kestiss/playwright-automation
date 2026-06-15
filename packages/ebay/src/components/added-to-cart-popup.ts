import { expect, type Locator, type Page } from '@playwright/test';

import { CartPage } from '../pages/cart-page.js';

export class AddedToCartPopup {
  readonly heading: Locator;
  readonly container: Locator;
  readonly itemTitle: Locator;
  readonly seeInCartLink: Locator;

  constructor(private readonly page: Page) {
    this.container = page.locator("[class*='keyboard-trap--active']").first();
    this.heading = this.container.getByRole('heading', {
      name: 'Added to cart',
    });
    this.itemTitle = this.container
      .locator("[class='item-details_card--title'] [class='ux-textspans']")
      .first();
    this.seeInCartLink = this.container.getByRole('link', {
      name: 'See in cart',
    });
  }

  async expectOpened(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async expectItemTitle(expectedTitle: string): Promise<void> {
    await expect(this.itemTitle).toContainText(expectedTitle);
  }

  async openCart(): Promise<CartPage> {
    const cartPage = new CartPage(this.page);

    await Promise.all([
      cartPage.expectOpened(),
      this.seeInCartLink.click({ noWaitAfter: true }),
    ]);

    return cartPage;
  }
}
