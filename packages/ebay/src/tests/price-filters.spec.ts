import { test } from '@playwright-automation/core';

import {
  DEFAULT_SEARCH_PRODUCT,
  EbayShoppingFlow,
} from '../flows/ebay-shopping-flow.js';

async function openDefaultSearchResults(
  ebayShoppingFlow: EbayShoppingFlow,
): Promise<void> {
  await ebayShoppingFlow.openHomePage();
  await ebayShoppingFlow.searchForProduct(DEFAULT_SEARCH_PRODUCT);
}

test.describe('eBay price filters', () => {
  test(
    'applies only the minimum price filter',
    { tag: '@filters' },
    async ({ page }) => {
      const ebayShoppingFlow = new EbayShoppingFlow(page);

      await openDefaultSearchResults(ebayShoppingFlow);
      await ebayShoppingFlow.filterByPriceRange({ minimumPrice: '50' });
      await ebayShoppingFlow.expectPriceRangeApplied({
        keyword: DEFAULT_SEARCH_PRODUCT,
        minimumPrice: '50',
      });
    },
  );

  test(
    'applies only the maximum price filter',
    { tag: '@filters' },
    async ({ page }) => {
      const ebayShoppingFlow = new EbayShoppingFlow(page);

      await openDefaultSearchResults(ebayShoppingFlow);
      await ebayShoppingFlow.filterByPriceRange({ maximumPrice: '200' });
      await ebayShoppingFlow.expectPriceRangeApplied({
        keyword: DEFAULT_SEARCH_PRODUCT,
        maximumPrice: '200',
      });
    },
  );

  test(
    'applies minimum and maximum price filters',
    { tag: '@filters' },
    async ({ page }) => {
      const ebayShoppingFlow = new EbayShoppingFlow(page);

      await openDefaultSearchResults(ebayShoppingFlow);
      await ebayShoppingFlow.filterByPriceRange({
        minimumPrice: '50',
        maximumPrice: '200',
      });
      await ebayShoppingFlow.expectPriceRangeApplied({
        keyword: DEFAULT_SEARCH_PRODUCT,
        minimumPrice: '50',
        maximumPrice: '200',
      });
    },
  );
});
