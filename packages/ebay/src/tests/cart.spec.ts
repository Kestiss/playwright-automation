import { test } from '@playwright-automation/core';

import { EbayShoppingFlow } from '../flows/ebay-shopping-flow.js';

test.describe('eBay cart flow', () => {
  test(
    'search for Sony headphones, filter results, add item to the cart',
    { tag: ['@cart', '@smoke'] },
    async ({ page }) => {
      const ebayShoppingFlow = new EbayShoppingFlow(page);

      await ebayShoppingFlow.openHomePage();
      await ebayShoppingFlow.searchForProduct('Headphones');
      await ebayShoppingFlow.filterByBrand('Sony');
      await ebayShoppingFlow.filterByPriceRange({
        minimumPrice: '50',
        maximumPrice: '200',
      });
      await ebayShoppingFlow.openResult(3);
      await ebayShoppingFlow.addItemToCart();
      await ebayShoppingFlow.openCart();
    },
  );

  test('remove item from cart', { tag: '@cart' }, async ({ page }) => {
    const ebayShoppingFlow = new EbayShoppingFlow(page);

    await ebayShoppingFlow.addSearchResultToCartAndOpenCart();
    await ebayShoppingFlow.removeItemFromCart();
  });
});
