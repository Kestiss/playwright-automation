import type { Page } from '@playwright/test';
import { test } from '@playwright-automation/core';

import {
  loadCheckoutDataRowsFromCsv,
  type CheckoutCsvData,
} from '../utils/checkout-csv-data.js';
import { openHomePage } from '../shortcuts/shopping-actions.js';

const checkoutRows = loadCheckoutDataRowsFromCsv(
  new URL('./data/checkout-payment-failure.csv', import.meta.url),
);

test.describe('eBay checkout flow', () => {
  checkoutRows.forEach((checkoutData: CheckoutCsvData, index: number) => {
    test(
      `csv row ${index + 1}: user begins guest checkout and fails to make payment`,
      { tag: '@csv' },
      async ({ page }) => {
        await runCheckoutPaymentFailureScenario(page, checkoutData);
      },
    );
  });
});

async function runCheckoutPaymentFailureScenario(
  page: Page,
  checkoutData: CheckoutCsvData,
): Promise<void> {
  const homePage = await openHomePage(page);
  const searchResultsPage = await homePage.searchFor(checkoutData.search.keyword);

  if (checkoutData.search.brand) {
    await searchResultsPage.selectBrand(checkoutData.search.brand);
  }

  await searchResultsPage.setPriceRange({
    minimumPrice: checkoutData.search.minimumPrice,
    maximumPrice: checkoutData.search.maximumPrice,
  });

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
}
