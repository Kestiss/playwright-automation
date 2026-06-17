import { test } from '@playwright-automation/core';

import {
  DEFAULT_SEARCH_PRODUCT,
  openDefaultSearchResults,
} from '../shortcuts/shopping-actions.js';

test.describe('eBay price filters', () => {
  test(
    'applies only the minimum price filter',
    { tag: '@filters' },
    async ({ page }) => {
      const searchResultsPage = await openDefaultSearchResults(page);

      await searchResultsPage.setPriceRange({ minimumPrice: '50' });
      await searchResultsPage.expectPriceRangeApplied({
        keyword: DEFAULT_SEARCH_PRODUCT,
        minimumPrice: '50',
      });
    },
  );

  test(
    'applies only the maximum price filter',
    { tag: '@filters' },
    async ({ page }) => {
      const searchResultsPage = await openDefaultSearchResults(page);

      await searchResultsPage.setPriceRange({ maximumPrice: '200' });
      await searchResultsPage.expectPriceRangeApplied({
        keyword: DEFAULT_SEARCH_PRODUCT,
        maximumPrice: '200',
      });
    },
  );

  test(
    'applies minimum and maximum price filters',
    { tag: '@filters' },
    async ({ page }) => {
      const searchResultsPage = await openDefaultSearchResults(page);

      await searchResultsPage.setPriceRange({
        minimumPrice: '50',
        maximumPrice: '200',
      });
      await searchResultsPage.expectPriceRangeApplied({
        keyword: DEFAULT_SEARCH_PRODUCT,
        minimumPrice: '50',
        maximumPrice: '200',
      });
    },
  );
});
