import { test } from '@playwright-automation/core';

import { openHomePage } from '../shortcuts/shopping-actions.js';

test.describe('eBay search flow', () => {
  test(
    'shows no exact matches for an unknown search term',
    { tag: ['@search', '@negative'] },
    async ({ page }) => {
      const homePage = await openHomePage(page);
      const searchResultsPage = await homePage.searchFor('dlfkjdskl');

      await searchResultsPage.expectNoResults();
    },
  );

  test(
    'shows results count and keyword for search',
    { tag: '@search' },
    async ({ page }) => {
      const keyword = 'speakers';
      const homePage = await openHomePage(page);
      const searchResultsPage = await homePage.searchFor(keyword);

      await searchResultsPage.expectKeywordSearchResults(keyword);
    },
  );
});
