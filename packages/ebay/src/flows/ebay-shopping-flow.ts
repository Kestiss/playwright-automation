import { rememberDiagnosticStep } from '@playwright-automation/core';
import { test } from '@playwright/test';
import type { Page } from '@playwright/test';

import type { AddedToCartPopup } from '../components/added-to-cart-popup.js';
import type { CheckoutAuthPanel } from '../components/checkout-auth-panel.js';
import type { CartPage } from '../pages/cart-page.js';
import type {
  GuestCheckoutAddress,
  NewCardDetails,
  PayPage,
} from '../pages/pay-page.js';
import { skipIfChallengePersists } from '../guards/challenge-guard.js';
import { ChallengePage } from '../pages/challenge-page.js';
import { HomePage } from '../pages/home-page.js';
import type { ProductPage } from '../pages/product-page.js';
import type { SearchResultsPage } from '../pages/search-results-page.js';

type AddSearchResultToCartOptions = {
  product?: string;
  brand?: string;
  minimumPrice?: string;
  maximumPrice?: string;
  resultPosition?: number;
};

type PriceRange = {
  keyword?: string | undefined;
  minimumPrice?: string | undefined;
  maximumPrice?: string | undefined;
};

export const DEFAULT_SEARCH_PRODUCT = 'iPhone black';
export const DEFAULT_RESULT_POSITION = 1;

export class EbayShoppingFlow {
  private homePage: HomePage;
  private challengePage: ChallengePage;
  private searchResultsPage: SearchResultsPage | undefined;
  private productPage: ProductPage | undefined;
  private addedToCartPopup: AddedToCartPopup | undefined;
  private cartPage: CartPage | undefined;
  private checkoutAuthPanel: CheckoutAuthPanel | undefined;
  private payPage: PayPage | undefined;
  private selectedItemTitle: string | undefined;

  constructor(private readonly page: Page) {
    this.homePage = new HomePage(page);
    this.challengePage = new ChallengePage(page);
  }

  async openHomePage(): Promise<void> {
    await this.runStep('Open eBay home page', async () => {
      await this.homePage.open();
      await this.homePage.acceptCookieBannerIfNeeded();
    });
  }

  async searchForProduct(product: string): Promise<void> {
    await this.runStep(`Search for product: ${product}`, async () => {
      this.searchResultsPage = await this.homePage.searchFor(product);

      const challengeResolved = await this.challengePage.waitUntilResolved();
      skipIfChallengePersists(challengeResolved);
    });
  }

  async filterByBrand(brand: string): Promise<void> {
    await this.runStep(`Filter results by brand: ${brand}`, async () => {
      await this.getSearchResultsPage().selectBrand(brand);
    });
  }

  async filterByPriceRange(priceRange: PriceRange): Promise<void> {
    const priceDescription = [priceRange.minimumPrice, priceRange.maximumPrice]
      .filter(Boolean)
      .join(' - ');

    await this.runStep(`Apply price range: ${priceDescription}`, async () => {
      await this.getSearchResultsPage().setPriceRange(priceRange);
    });
  }

  async expectKeywordSearchResults(keyword: string): Promise<void> {
    await this.runStep(`Expect keyword search results: ${keyword}`, async () => {
      await this.getSearchResultsPage().expectKeywordSearchResults(keyword);
    });
  }

  async expectPriceRangeApplied(expectation: PriceRange): Promise<void> {
    await this.runStep('Expect price range to be applied', async () => {
      await this.getSearchResultsPage().expectPriceRangeApplied(expectation);
    });
  }

  async expectNoResults(): Promise<void> {
    await this.runStep('Expect no search results', async () => {
      await this.getSearchResultsPage().expectNoResults();
    });
  }

  async openResult(position: number): Promise<void> {
    await this.runStep(`Open search result ${position}`, async () => {
      this.selectedItemTitle =
        await this.getSearchResultsPage().getNthResultTitle(position);
      this.productPage =
        await this.getSearchResultsPage().openNthResult(position);
      await this.productPage.expectTitle(this.getSelectedItemTitle());
    });
  }

  async addItemToCart(): Promise<void> {
    await this.runStep('Add selected item to cart', async () => {
      this.addedToCartPopup = await this.getProductPage().addToCart();
      await this.addedToCartPopup.expectItemTitle(this.getSelectedItemTitle());
    });
  }

  async openCart(): Promise<void> {
    await this.runStep('Open cart', async () => {
      this.cartPage = await this.getAddedToCartPopup().openCart();
      await this.cartPage.expectItemTitle(this.getSelectedItemTitle());
    });
  }

  async addSearchResultToCartAndOpenCart(
    options: AddSearchResultToCartOptions = {},
  ): Promise<void> {
    const product = options.product ?? DEFAULT_SEARCH_PRODUCT;
    const resultPosition = options.resultPosition ?? DEFAULT_RESULT_POSITION;

    await this.runStep('Add search result to cart and open cart', async () => {
      await this.openHomePage();
      await this.searchForProduct(product);

      if (options.brand) {
        await this.filterByBrand(options.brand);
      }

      if (options.minimumPrice || options.maximumPrice) {
        await this.filterByPriceRange({
          minimumPrice: options.minimumPrice,
          maximumPrice: options.maximumPrice,
        });
      }

      await this.openResult(resultPosition);
      await this.addItemToCart();
      await this.openCart();
    });
  }

  async beginCheckout(): Promise<void> {
    await this.runStep('Begin checkout from cart', async () => {
      this.checkoutAuthPanel = await this.getCartPage().beginCheckout();
    });
  }

  async continueCheckoutAsGuest(): Promise<void> {
    await this.runStep('Continue checkout as guest', async () => {
      this.payPage = await this.getCheckoutAuthPanel().continueAsGuest();

      const challengeResolved = await this.challengePage.waitUntilResolved();
      skipIfChallengePersists(challengeResolved);
    });
  }

  async fillGuestCheckoutAddress(address: GuestCheckoutAddress): Promise<void> {
    await this.runStep('Fill guest checkout address', async () => {
      await this.getPayPage().fillGuestAddress(address);
    });
  }

  async submitGuestCheckoutAddress(): Promise<void> {
    await this.runStep('Submit guest checkout address', async () => {
      await this.getPayPage().submitGuestAddress();
    });
  }

  async fillNewCardDetails(card: NewCardDetails): Promise<void> {
    await this.runStep('Fill new card details', async () => {
      await this.getPayPage().fillNewCardDetails(card);
    });
  }

  async submitNewCardDetails(): Promise<void> {
    await this.runStep('Submit new card details', async () => {
      await this.getPayPage().submitNewCardDetails();
    });
  }

  async confirmPaymentAndExpectFailure(): Promise<void> {
    await this.runStep('Confirm payment and expect failure', async () => {
      await this.getPayPage().confirmAndExpectPaymentFailure();
    });
  }

  async returnToCart(): Promise<void> {
    await this.runStep('Return to cart', async () => {
      this.cartPage = await this.getPayPage().returnToCart();
      await this.cartPage.expectItemTitle(this.getSelectedItemTitle());
    });
  }

  async removeItemFromCart(): Promise<void> {
    await this.runStep('Remove item from cart', async () => {
      await this.getCartPage().removeItem();
      await this.getCartPage().expectItemRemoved();
    });
  }

  private async runStep<T>(name: string, action: () => Promise<T>): Promise<T> {
    rememberDiagnosticStep(this.page, name);
    return test.step(name, action);
  }

  private getSearchResultsPage(): SearchResultsPage {
    if (!this.searchResultsPage) {
      throw new Error(
        'Search results page is not available yet. Search for a product first.',
      );
    }

    return this.searchResultsPage;
  }

  private getProductPage(): ProductPage {
    if (!this.productPage) {
      throw new Error(
        'Product page is not available yet. Open a search result first.',
      );
    }

    return this.productPage;
  }

  private getSelectedItemTitle(): string {
    if (!this.selectedItemTitle) {
      throw new Error(
        'Selected item title is not available yet. Open a search result first.',
      );
    }

    return this.selectedItemTitle;
  }

  private getAddedToCartPopup(): AddedToCartPopup {
    if (!this.addedToCartPopup) {
      throw new Error(
        'Added to cart popup is not available yet. Add the item to the cart first.',
      );
    }

    return this.addedToCartPopup;
  }

  private getCheckoutAuthPanel(): CheckoutAuthPanel {
    if (!this.checkoutAuthPanel) {
      throw new Error(
        'Checkout auth panel is not available yet. Begin checkout first.',
      );
    }

    return this.checkoutAuthPanel;
  }

  private getPayPage(): PayPage {
    if (!this.payPage) {
      throw new Error(
        'Pay page is not available yet. Continue checkout as guest first.',
      );
    }

    return this.payPage;
  }

  private getCartPage(): CartPage {
    if (!this.cartPage) {
      throw new Error('Cart page is not available yet. Open the cart first.');
    }

    return this.cartPage;
  }
}
