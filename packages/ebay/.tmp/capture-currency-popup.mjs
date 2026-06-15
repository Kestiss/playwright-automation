import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';

function randomNumberBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createFutureExpirationDate() {
  const month = String(randomNumberBetween(1, 12)).padStart(2, '0');
  const year = new Date().getFullYear() + randomNumberBetween(2, 4);
  return `${month}/${String(year).slice(-2)}`;
}

const firstName = 'Jonas';
const lastName = 'Kazlauskas';
const checkoutData = {
  address: {
    email: `${firstName}.${lastName}${Date.now()}@gmail.com`,
    country: 'Lithuania',
    firstName,
    lastName,
    addressLine1: 'Gedimino pr. 12',
    city: 'Vilnius',
    postalCode: '01103',
    phoneNumber: `6${randomNumberBetween(1000000, 9999999)}`,
  },
  card: {
    cardNumber: '4111111111111111',
    expirationDate: createFutureExpirationDate(),
    securityCode: String(randomNumberBetween(100, 999)),
    firstName,
    lastName,
  },
};

const browser = await chromium.launch({
  headless: false,
  args: ['--start-maximized'],
});
const context = await browser.newContext({ viewport: null });
const page = await context.newPage();
page.setDefaultTimeout(90000);

try {
  await page.goto('https://www.ebay.com/');

  const acceptCookies = page.getByRole('button', { name: /accept/i });
  if (await acceptCookies.isVisible().catch(() => false)) {
    await acceptCookies.click();
  }

  await page.locator("input[title='Search']").fill('Headphones');
  await page.locator("button[id='gh-search-btn']").click();
  await page.waitForLoadState('domcontentloaded');

  const sonyCheckbox = page.locator("li[name='Brand'] input[aria-label='Sony']");
  await sonyCheckbox.waitFor({ state: 'visible' });
  await sonyCheckbox.check();
  await page.waitForLoadState('domcontentloaded');

  await page.locator("input[aria-label='Minimum Value in $']").fill('50');
  await page.locator("input[aria-label='Maximum Value in $']").fill('200');
  await page.locator("button[aria-label='Submit price range']").click();
  await page.waitForLoadState('domcontentloaded');

  const resultLink = page.locator("ul.srp-results > li.s-card a[href*='/itm/']").nth(2);
  await resultLink.waitFor({ state: 'visible' });
  const popupPromise = page.waitForEvent('popup');
  await resultLink.click({ noWaitAfter: true });
  const productPage = await popupPromise;
  await productPage.waitForLoadState('domcontentloaded');

  await productPage.getByRole('button', { name: 'Add to cart' }).click();
  await productPage.getByRole('link', { name: 'See in cart' }).click();
  await productPage.waitForURL((url) => url.toString().startsWith('https://cart.ebay.com/'));

  const checkoutButton = productPage.locator("button[data-test-id='cta-top']");
  await checkoutButton.waitFor({ state: 'visible' });
  await checkoutButton.click({ noWaitAfter: true });

  const authModal = productPage.locator('#identity-signin-modal');
  await authModal.waitFor({ state: 'visible' });
  const authFrame = productPage.frameLocator('#auth-iframe');
  const guestButton = authFrame.locator("button#modal-gxo-link[data-testid='modal-gxo-link']");
  await guestButton.waitFor({ state: 'visible' });
  await guestButton.click({ noWaitAfter: true });

  await productPage.waitForURL((url) => url.toString().startsWith('https://pay.ebay.com/'));
  await productPage.waitForLoadState('domcontentloaded');

  await productPage.locator('#email').fill(checkoutData.address.email);
  await productPage.locator('#country').selectOption({ label: checkoutData.address.country });
  await productPage.locator('#firstName').fill(checkoutData.address.firstName);
  await productPage.locator('#lastName').fill(checkoutData.address.lastName);
  await productPage.locator('#addressLine1').fill(checkoutData.address.addressLine1);
  await productPage.locator('#city').fill(checkoutData.address.city);
  await productPage.locator('#postalCode').fill(checkoutData.address.postalCode);
  await productPage.locator('#phoneNumber').fill(checkoutData.address.phoneNumber);
  await productPage.locator("[data-test-id='ADD_ADDRESS_SUBMIT']").click();
  await productPage.locator("form[name='address-form']").waitFor({ state: 'hidden' });

  const cardEntry = productPage.locator('.payment-entry--CC').first();
  await cardEntry.waitFor({ state: 'visible' });
  await cardEntry.getByLabel('Add new card').check({ force: true });
  await productPage.locator("form[name='credit-card-details']").waitFor({ state: 'visible' });

  await productPage.locator('#cardNumber').fill('4111 1111 1111 1111');
  await productPage.locator('#cardExpiryDate').fill(checkoutData.card.expirationDate);
  await productPage.locator('#securityCode').fill(checkoutData.card.securityCode);
  await productPage.locator('#cardHolderFirstName').fill(checkoutData.card.firstName);
  await productPage.locator('#cardHolderLastName').fill(checkoutData.card.lastName);
  await productPage.locator("[data-test-id='ADD_CARD']").click();

  const currencyDialog = productPage.locator("div.lightbox-dialog[data-test-id='dialog-test']").filter({
    has: productPage.locator('h2 span.BOLD'),
  }).first();
  await currencyDialog.waitFor({ state: 'visible' });

  const html = await currencyDialog.evaluate((node) => node.outerHTML);
  await fs.writeFile('/tmp/ebay-currency-popup.html', html, 'utf8');

  const candidateData = await currencyDialog.evaluate((root) => {
    const heading = root.querySelector('h2')?.textContent?.trim() ?? null;
    const inputs = [...root.querySelectorAll("input[name='selectedCurrency']")].map((input) => ({
      id: input.id,
      value: input.getAttribute('value'),
      checked: input.checked,
      describedBy: input.getAttribute('aria-describedby'),
      label: root.querySelector(`label[for='${input.id}']`)?.textContent?.trim() ?? null,
    }));
    const buttons = [...root.querySelectorAll('button')].map((button) => ({
      text: button.textContent?.trim() ?? null,
      className: button.className,
      ariaLabel: button.getAttribute('aria-label'),
      dataTestId: button.getAttribute('data-test-id'),
    }));
    return { heading, inputs, buttons };
  });
  await fs.writeFile('/tmp/ebay-currency-popup-candidates.json', JSON.stringify(candidateData, null, 2), 'utf8');

  await productPage.screenshot({ path: '/tmp/ebay-currency-popup.png', fullPage: false });
  console.log('Currency popup captured to /tmp/ebay-currency-popup.html');
  console.log('Candidate selectors saved to /tmp/ebay-currency-popup-candidates.json');
  console.log('Screenshot saved to /tmp/ebay-currency-popup.png');
  await productPage.waitForTimeout(15000);
} finally {
  await browser.close();
}
