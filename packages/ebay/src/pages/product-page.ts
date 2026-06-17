import { expect, type Locator, type Page } from '@playwright/test';

import { AddedToCartPopup } from '../components/added-to-cart-popup.js';

export class ProductPage {
  readonly addToCartButton: Locator;
  readonly productTitle: Locator;

  constructor(private readonly page: Page) {
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.productTitle = page.locator(
      "h1[class='x-item-title__mainTitle'] span",
    ).first();
  }

  async expectTitle(expectedTitle: string): Promise<void> {
    await expect(this.productTitle).toContainText(expectedTitle);
  }

  async addToCart(): Promise<AddedToCartPopup> {
    const expectedTitle = await this.productTitle.innerText();

    await this.addToCartButton.click();

    const addedToCartPopup = new AddedToCartPopup(this.page);
    await addedToCartPopup.expectOpened();
    await addedToCartPopup.expectItemTitle(expectedTitle);

    return addedToCartPopup;
  }
}
