import type { Page } from '@playwright/test';
import { test } from '@playwright-automation/core';

import { EbayShoppingFlow } from '../flows/ebay-shopping-flow.js';
import {
  loadCheckoutDataRowsFromCsv,
  type CheckoutCsvData,
} from '../utils/checkout-csv-data.js';

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
  const ebayShoppingFlow = new EbayShoppingFlow(page);

  await ebayShoppingFlow.openHomePage();
  await ebayShoppingFlow.searchForProduct(checkoutData.search.keyword);

  if (checkoutData.search.brand) {
    await ebayShoppingFlow.filterByBrand(checkoutData.search.brand);
  }

  await ebayShoppingFlow.filterByPriceRange({
    minimumPrice: checkoutData.search.minimumPrice,
    maximumPrice: checkoutData.search.maximumPrice,
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
}
