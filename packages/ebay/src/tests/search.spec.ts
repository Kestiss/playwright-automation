import { test } from '@playwright-automation/core';

import { EbayShoppingFlow } from '../flows/ebay-shopping-flow.js';

test.describe('eBay search flow', () => {
  test(
    'shows no exact matches for an unknown search term',
    { tag: ['@search', '@negative'] },
    async ({ page }) => {
      const ebayShoppingFlow = new EbayShoppingFlow(page);

      await ebayShoppingFlow.openHomePage();
      await ebayShoppingFlow.searchForProduct('dlfkjdskl');
      await ebayShoppingFlow.expectNoResults();
    },
  );

  test(
    'shows results count and keyword for search',
    { tag: '@search' },
    async ({ page }) => {
      const ebayShoppingFlow = new EbayShoppingFlow(page);
      const keyword = 'speakers';

      await ebayShoppingFlow.openHomePage();
      await ebayShoppingFlow.searchForProduct(keyword);
      await ebayShoppingFlow.expectKeywordSearchResults(keyword);
    },
  );
});
