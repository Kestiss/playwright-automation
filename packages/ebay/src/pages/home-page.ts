import { expect, type Locator, type Page } from '@playwright/test';
import { seconds } from '@playwright-automation/core';

import { CookieBanner } from '../components/cookie-banner.js';
import { BasePage } from './base-page.js';
import { SearchResultsPage } from './search-results-page.js';

export class HomePage extends BasePage {
  readonly cookieBanner: CookieBanner;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cookieBanner = new CookieBanner(page);
    this.searchInput = page.locator("input[title='Search']");
    this.searchButton = page.locator("button[id='gh-search-btn']");
  }

  async open(): Promise<void> {
    await this.openUrl('/');
  }

  async acceptCookieBannerIfNeeded(timeout = seconds(5)): Promise<void> {
    await this.cookieBanner.acceptIfNeeded(timeout);
  }

  async searchFor(searchTerm: string): Promise<SearchResultsPage> {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(searchTerm);
    await this.searchButton.click();
    await this.page.waitForLoadState('domcontentloaded');

    return new SearchResultsPage(this.page);
  }
}
