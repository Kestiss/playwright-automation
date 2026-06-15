import { expect, type Locator, type Page } from '@playwright/test';
import { seconds } from '@playwright-automation/core';

import { CurrencySelectionPopup } from '../components/currency-selection-popup.js';
import { typeIntoField } from '../utils/type-into-field.js';
import { CartPage } from './cart-page.js';

export const GUEST_CHECKOUT_URL_PREFIX = 'https://pay.ebay.com/';

export type GuestCheckoutAddress = {
  email: string;
  country?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateOrProvince?: string;
  postalCode: string;
  phoneNumber: string;
};

export type NewCardDetails = {
  cardNumber: string;
  expirationDate: string;
  securityCode: string;
  firstName?: string;
  lastName?: string;
};

const createAddressLocators = (page: Page) => ({
  form: page.locator("form[name='address-form']"),
  emailInput: page.locator('#email'),
  countrySelect: page.locator('#country'),
  firstNameInput: page.locator('#firstName'),
  lastNameInput: page.locator('#lastName'),
  addressLine1Input: page.locator('#addressLine1'),
  addressLine2Input: page.locator('#addressLine2'),
  cityInput: page.locator('#city'),
  stateOrProvinceSelect: page.locator('#stateOrProvince'),
  postalCodeInput: page.locator('#postalCode'),
  phoneNumberInput: page.locator('#phoneNumber'),
  doneButton: page.locator("[data-test-id='ADD_ADDRESS_SUBMIT']"),
});

type AddressLocators = ReturnType<typeof createAddressLocators>;

const createCardLocators = (page: Page) => {
  const entry = page.locator('.payment-entry--CC').first();

  return {
    entry,
    radio: entry.getByLabel('Add new card'),
    form: page.locator("form[name='credit-card-details']"),
    cardNumberInput: page.locator('#cardNumber'),
    cardExpiryDateInput: page.locator('#cardExpiryDate'),
    securityCodeInput: page.locator('#securityCode'),
    cardHolderFirstNameInput: page.locator('#cardHolderFirstName'),
    cardHolderLastNameInput: page.locator('#cardHolderLastName'),
    doneButton: page.locator("[data-test-id='ADD_CARD']"),
  };
};

type CardLocators = ReturnType<typeof createCardLocators>;

const createPaymentLocators = (page: Page) => ({
  confirmAndPayButton: page.locator("[data-test-id='CONFIRM_AND_PAY_BUTTON']"),
  errorNotice: page.locator("[data-test-id='NOTIFICATIONS']"),
});

type PaymentLocators = ReturnType<typeof createPaymentLocators>;

export class PayPage {
  readonly checkoutHeading: Locator;
  readonly address: AddressLocators;
  readonly card: CardLocators;
  readonly payment: PaymentLocators;

  constructor(private readonly page: Page) {
    this.checkoutHeading = page
      .getByRole('heading', { name: 'Checkout' })
      .first();
    this.address = createAddressLocators(page);
    this.card = createCardLocators(page);
    this.payment = createPaymentLocators(page);
  }

  async expectOpened(): Promise<void> {
    await this.page.waitForURL(
      (url) => url.toString().startsWith(GUEST_CHECKOUT_URL_PREFIX),
      { timeout: seconds(60) },
    );
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillGuestAddress(address: GuestCheckoutAddress): Promise<void> {
    await this.expectAddressFormOpened();

    await this.address.emailInput.fill(address.email);

    if (address.country) {
      await this.address.countrySelect.selectOption({ label: address.country });
    }

    await typeIntoField(this.address.firstNameInput, address.firstName);
    await typeIntoField(this.address.lastNameInput, address.lastName);
    await this.address.addressLine1Input.fill(address.addressLine1);

    if (address.addressLine2) {
      await this.address.addressLine2Input.fill(address.addressLine2);
    }

    await this.address.cityInput.fill(address.city);

    if (address.stateOrProvince) {
      await this.selectStateOrProvince(address.stateOrProvince);
    }

    await this.address.postalCodeInput.fill(address.postalCode);
    await this.address.phoneNumberInput.fill(address.phoneNumber);
  }

  async submitGuestAddress(): Promise<void> {
    await this.expectAddressFormOpened();
    await expect(this.address.doneButton).toBeVisible();
    await this.address.doneButton.click();
    await expect(this.address.form).toBeHidden({ timeout: seconds(30) });
  }

  async fillNewCardDetails(card: NewCardDetails): Promise<void> {
    await this.selectAddNewCard();

    await typeIntoField(
      this.card.cardNumberInput,
      card.cardNumber,
      this.formatCardNumber(card.cardNumber),
    );
    await typeIntoField(this.card.cardExpiryDateInput, card.expirationDate);
    await typeIntoField(this.card.securityCodeInput, card.securityCode);

    if (card.firstName) {
      await typeIntoField(this.card.cardHolderFirstNameInput, card.firstName);
    }

    if (card.lastName) {
      await typeIntoField(this.card.cardHolderLastNameInput, card.lastName);
    }
  }

  async submitNewCardDetails(): Promise<void> {
    await expect(this.card.form).toBeVisible();
    await expect(this.card.doneButton).toBeVisible();

    const currencySelectionPopup = new CurrencySelectionPopup(this.page);
    await Promise.all([
      currencySelectionPopup.expectOpened(),
      this.card.doneButton.click(),
    ]);
    await currencySelectionPopup.continueWithSelectedCurrency();
  }

  async confirmAndExpectPaymentFailure(): Promise<void> {
    await expect(this.payment.confirmAndPayButton).toBeVisible();

    await Promise.all([
      expect(this.payment.errorNotice).toContainText(
        'Please check your payment details or use a different payment method.',
      ),
      this.payment.confirmAndPayButton.click(),
    ]);
  }

  async returnToCart(): Promise<CartPage> {
    const cartPage = new CartPage(this.page);

    await cartPage.open();

    return cartPage;
  }

  private async expectAddressFormOpened(): Promise<void> {
    await expect(this.address.form).toBeVisible();
  }

  private async selectAddNewCard(): Promise<void> {
    await expect(this.card.entry).toBeVisible();
    await expect(this.card.radio).toBeVisible();

    await Promise.all([
      expect(this.card.form).toBeVisible(),
      this.card.radio.check({ force: true }),
    ]);
  }

  private formatCardNumber(cardNumber: string): string {
    return cardNumber
      .replace(/\s+/g, '')
      .replace(/(.{4})(?=.)/g, '$1 ')
      .trim();
  }

  private async selectStateOrProvince(stateOrProvince: string): Promise<void> {
    try {
      await this.address.stateOrProvinceSelect.selectOption({
        label: stateOrProvince,
      });
      return;
    } catch {
      await this.address.stateOrProvinceSelect.selectOption({
        value: stateOrProvince.toUpperCase(),
      });
    }
  }
}
