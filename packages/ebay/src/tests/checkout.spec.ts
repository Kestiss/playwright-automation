import { test } from '@playwright-automation/core';

import { EbayShoppingFlow } from '../flows/ebay-shopping-flow.js';
import { createCheckoutTestData } from '../utils/checkout-test-data.js';

test.describe('eBay checkout flow', () => {
  test(
    'user begins guest checkout and fails to make payment',
    { tag: '@checkout' },
    async ({ page }) => {
      const ebayShoppingFlow = new EbayShoppingFlow(page);
      const checkoutData = createCheckoutTestData();

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
      await ebayShoppingFlow.beginCheckout();
      await ebayShoppingFlow.continueCheckoutAsGuest();
      await ebayShoppingFlow.fillGuestCheckoutAddress(checkoutData.address);
      await ebayShoppingFlow.submitGuestCheckoutAddress();
      await ebayShoppingFlow.fillNewCardDetails(checkoutData.card);
      await ebayShoppingFlow.submitNewCardDetails();
      await ebayShoppingFlow.confirmPaymentAndExpectFailure();
    },
  );

  test(
    'user returns to cart and removes the item after the checkout attempt',
    { tag: '@checkout' },
    async ({ page }) => {
      const ebayShoppingFlow = new EbayShoppingFlow(page);
      const checkoutData = createCheckoutTestData();

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
      await ebayShoppingFlow.beginCheckout();
      await ebayShoppingFlow.continueCheckoutAsGuest();
      await ebayShoppingFlow.fillGuestCheckoutAddress(checkoutData.address);
      await ebayShoppingFlow.submitGuestCheckoutAddress();
      await ebayShoppingFlow.fillNewCardDetails(checkoutData.card);
      await ebayShoppingFlow.submitNewCardDetails();
      await ebayShoppingFlow.confirmPaymentAndExpectFailure();
      await ebayShoppingFlow.returnToCart();
      await ebayShoppingFlow.removeItemFromCart();
    },
  );
});
