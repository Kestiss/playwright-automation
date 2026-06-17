import type { Page } from '@playwright/test';

import { HomePage } from '../pages/home-page.js';
import type { CartPage } from '../pages/cart-page.js';
import type { SearchResultsPage } from '../pages/search-results-page.js';

export const DEFAULT_SEARCH_PRODUCT = 'iPhone black';
export const DEFAULT_RESULT_POSITION = 1;

export async function openHomePage(page: Page): Promise<HomePage> {
  const homePage = new HomePage(page);
  await homePage.open();
  await homePage.acceptCookieBannerIfNeeded();

  return homePage;
}

export async function openDefaultSearchResults(page: Page): Promise<SearchResultsPage> {
  const homePage = await openHomePage(page);
  const searchResultsPage = await homePage.searchFor(DEFAULT_SEARCH_PRODUCT);
  await searchResultsPage.expectKeywordSearchResults(DEFAULT_SEARCH_PRODUCT);
  return searchResultsPage;
}

export async function addSearchResultToCartAndOpenCart(
  page: Page,
  product = DEFAULT_SEARCH_PRODUCT,
  resultPosition = DEFAULT_RESULT_POSITION,
): Promise<CartPage> {
  const homePage = await openHomePage(page);
  const searchResultsPage = await homePage.searchFor(product);
  const productPage = await searchResultsPage.openNthResult(resultPosition);
  const popup = await productPage.addToCart();
  return popup.openCart();
}
