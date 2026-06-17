import { test } from '@playwright-automation/core';

import { addSearchResultToCartAndOpenCart, openHomePage } from '../shortcuts/shopping-actions.js';

test.describe('eBay cart flow', () => {
  test('search for Sony headphones, filter results, add item to the cart',
    { tag: ['@cart', '@smoke'] },
    async ({ page }) => {
      const homePage = await openHomePage(page);
      const searchResultsPage = await homePage.searchFor('Headphones');
      await searchResultsPage.selectBrand('Sony');
      await searchResultsPage.setPriceRange({ minimumPrice: '50', maximumPrice: '200' });
      const productPage = await searchResultsPage.openNthResult(3);
      const popup = await productPage.addToCart();
      await popup.openCart();
    },
  );

  test('remove item from cart', { tag: '@cart' }, async ({ page }) => {
    const cartPage = await addSearchResultToCartAndOpenCart(page);
    await cartPage.removeItem();
    await cartPage.expectItemRemoved();
  });
});
