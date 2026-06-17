import { test } from '@playwright-automation/core';

import { createCheckoutTestData } from '../utils/checkout-test-data.js';
import { openHomePage } from '../shortcuts/shopping-actions.js';

test.describe('eBay checkout flow', () => {
  test(
    'user begins guest checkout and fails to make payment',
    { tag: '@checkout' },
    async ({ page }) => {
      const checkoutData = createCheckoutTestData();
      const homePage = await openHomePage(page);
      const searchResultsPage = await homePage.searchFor('Headphones');
      await searchResultsPage.selectBrand('Sony');
      await searchResultsPage.setPriceRange({ minimumPrice: '50', maximumPrice: '200' });
      const productPage = await searchResultsPage.openNthResult(3);
      const popup = await productPage.addToCart();
      const cartPage = await popup.openCart();
      const checkoutAuthPanel = await cartPage.beginCheckout();
      const payPage = await checkoutAuthPanel.continueAsGuest();
      await payPage.fillGuestAddress(checkoutData.address);
      await payPage.submitGuestAddress();
      await payPage.fillNewCardDetails(checkoutData.card);
      await payPage.submitNewCardDetails();
      await payPage.confirmAndExpectPaymentFailure();
    },
  );

  test(
    'user returns to cart and removes the item after the checkout attempt',
    { tag: '@checkout' },
    async ({ page }) => {
      const checkoutData = createCheckoutTestData();
      const homePage = await openHomePage(page);
      const searchResultsPage = await homePage.searchFor('Headphones');
      await searchResultsPage.selectBrand('Sony');
      await searchResultsPage.setPriceRange({ minimumPrice: '50', maximumPrice: '200' });
      const productPage = await searchResultsPage.openNthResult(3);
      const popup = await productPage.addToCart();
      const cartPage = await popup.openCart();
      const checkoutAuthPanel = await cartPage.beginCheckout();
      const payPage = await checkoutAuthPanel.continueAsGuest();
      await payPage.fillGuestAddress(checkoutData.address);
      await payPage.submitGuestAddress();
      await payPage.fillNewCardDetails(checkoutData.card);
      await payPage.submitNewCardDetails();
      await payPage.confirmAndExpectPaymentFailure();
      const returnedCartPage = await payPage.returnToCart();
      await returnedCartPage.removeItem();
      await returnedCartPage.expectItemRemoved();
    },
  );
});
