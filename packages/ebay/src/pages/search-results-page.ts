import { expect, type Locator, type Page } from '@playwright/test';
import { seconds, setDiagnosticActivePage } from '@playwright-automation/core';

import { typeIntoField } from '../utils/type-into-field.js';
import { ProductPage } from './product-page.js';

type PriceRange = {
  keyword?: string | undefined;
  minimumPrice?: string | undefined;
  maximumPrice?: string | undefined;
};

export class SearchResultsPage {
  readonly brandCheckbox: (brand: string) => Locator;
  readonly minimumPriceInput: Locator;
  readonly maximumPriceInput: Locator;
  readonly submitPriceRangeButton: Locator;
  readonly resultCards: Locator;
  readonly resultsCount: Locator;
  readonly appliedFilterLabels: Locator;
  readonly noResultsHeading: Locator;
  readonly resultTitleLocator: (position: number) => Locator;
  readonly resultLinkLocator: (position: number) => Locator;

  constructor(private readonly page: Page) {
    this.brandCheckbox = (brand: string) =>
      page.locator(`li[name='Brand'] input[aria-label='${brand}']`);
    this.minimumPriceInput = page.locator("input[aria-label='Minimum Value in $']");
    this.maximumPriceInput = page.locator("input[aria-label='Maximum Value in $']");
    this.submitPriceRangeButton = page.locator("button[aria-label='Submit price range']");
    this.resultCards = page.locator('ul.srp-results > li.s-card');
    this.resultsCount = page.locator("div[class*='controls__count']").first();
    this.appliedFilterLabels = page.locator("li[class*='item--applied'] a div");
    this.noResultsHeading = page.locator("h3[class*='null-search']");
    this.resultTitleLocator = (position: number) =>
      this.getNthResultCard(position)
        .locator('.s-item__title, h3, [role="heading"]')
        .first();
    this.resultLinkLocator = (position: number) =>
      this.getNthResultCard(position).locator("a[href*='/itm/']").first();
  }

  async selectBrand(brand: string): Promise<void> {
    const brandCheckbox = this.brandCheckbox(brand);

    await expect(brandCheckbox).toBeVisible();
    await brandCheckbox.check();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async setPriceRange({
    minimumPrice,
    maximumPrice,
  }: PriceRange): Promise<void> {
    if (!minimumPrice && !maximumPrice) {
      throw new Error(
        'Provide minimumPrice, maximumPrice, or both when setting the price range.',
      );
    }

    await expect(this.minimumPriceInput).toBeVisible();
    await expect(this.maximumPriceInput).toBeVisible();

    if (minimumPrice) {
      await typeIntoField(this.minimumPriceInput, minimumPrice);
    }

    if (maximumPrice) {
      await typeIntoField(this.maximumPriceInput, maximumPrice);
    }

    await this.submitPriceRangeButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectKeywordSearchResults(keyword: string): Promise<void> {
    const normalizedKeyword = keyword.trim().toLowerCase();

    await expect(this.resultsCount).toContainText(
      new RegExp(
        String.raw`\d[\d,]*\+ results for ${this.escapeForRegExp(normalizedKeyword)}`,
        'i',
      ),
    );

    const searchKeyword = new URL(this.page.url()).searchParams.get('_nkw');
    expect(searchKeyword?.toLowerCase()).toBe(normalizedKeyword);
  }

  async expectPriceRangeApplied({
    keyword,
    minimumPrice,
    maximumPrice,
  }: PriceRange): Promise<void> {
    if (!minimumPrice && !maximumPrice) {
      throw new Error(
        'Provide minimumPrice, maximumPrice, or both when asserting the price range.',
      );
    }

    const url = new URL(this.page.url());

    if (keyword) {
      expect(url.searchParams.get('_nkw')?.toLowerCase()).toBe(
        keyword.toLowerCase(),
      );
    }

    if (minimumPrice) {
      expect(url.searchParams.get('_udlo')).toBe(minimumPrice);
    } else {
      expect(url.searchParams.get('_udlo')).toBeNull();
    }

    if (maximumPrice) {
      expect(url.searchParams.get('_udhi')).toBe(maximumPrice);
    } else {
      expect(url.searchParams.get('_udhi')).toBeNull();
    }

    await expect(this.appliedFilterLabels).toContainText([
      this.getExpectedPriceFilterLabel({ minimumPrice, maximumPrice }),
    ]);
  }

  async expectNoResults(): Promise<void> {
    await expect(this.noResultsHeading).toHaveText('No exact matches found');
  }

  async getNthResultTitle(position: number): Promise<string> {
    const titleLocator = this.resultTitleLocator(position);

    await expect(titleLocator).toBeVisible();

    return this.normalizeText(await titleLocator.innerText());
  }

  async openNthResult(position: number): Promise<ProductPage> {
    const resultCard = this.getNthResultCard(position);
    const resultLink = this.resultLinkLocator(position);

    await expect(resultCard).toBeVisible();
    await expect(resultLink).toBeVisible();

    const popupPromise = this.page.waitForEvent('popup', {
      timeout: seconds(10),
    });

    await resultLink.click({ noWaitAfter: true });

    const productPage = await popupPromise;
    await productPage.waitForLoadState('domcontentloaded');
    setDiagnosticActivePage(this.page, productPage);

    return new ProductPage(productPage);
  }

  private getNthResultCard(position: number): Locator {
    if (position < 1) {
      throw new Error(
        `Result position must be 1 or greater. Received: ${position}`,
      );
    }

    return this.resultCards.nth(position - 1);
  }

  private getExpectedPriceFilterLabel({
    minimumPrice,
    maximumPrice,
  }: PriceRange): string {
    if (minimumPrice && maximumPrice) {
      return `$${minimumPrice}.00 to $${maximumPrice}.00`;
    }

    if (minimumPrice) {
      return `Over $${minimumPrice}.00`;
    }

    if (maximumPrice) {
      return `Under $${maximumPrice}.00`;
    }

    throw new Error(
      'Price filter label requires a minimumPrice, maximumPrice, or both.',
    );
  }

  private escapeForRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalizeText(value: string): string {
    return value
      .replace(/Opens in a new window or tab/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
