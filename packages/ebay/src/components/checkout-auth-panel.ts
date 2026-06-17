import {
  expect,
  type FrameLocator,
  type Locator,
  type Page,
} from '@playwright/test';

import { resolveChallengeOrSkip } from '../guards/challenge-guard.js';
import { PayPage } from '../pages/pay-page.js';

export class CheckoutAuthPanel {
  readonly popup: Locator;
  readonly authIframe: Locator;
  readonly authFrame: FrameLocator;
  readonly signInHeading: Locator;
  readonly guestSubtitle: Locator;
  readonly guestCheckoutButton: Locator;

  constructor(private readonly page: Page) {
    this.popup = page.locator('#identity-signin-modal').first();
    this.authIframe = this.popup.locator('#auth-iframe');
    this.authFrame = page.frameLocator('#auth-iframe');

    this.signInHeading = this.authFrame.locator('#modal-welcome-msg');
    this.guestSubtitle = this.authFrame.locator("[data-testid='guest-subtitle']");
    this.guestCheckoutButton = this.authFrame.locator(
      "button[data-testid='modal-gxo-link']",
    );
  }

  async expectOpened(): Promise<void> {
    await expect(this.popup).toBeVisible();
    await expect(this.authIframe).toBeVisible();
    await expect(this.signInHeading).toHaveText('Sign in for faster checkout');
    await expect(this.guestSubtitle).toHaveText(
      "You can create an account once you've checked out.",
    );
    await expect(this.guestCheckoutButton).toBeVisible();
  }

  async continueAsGuest(): Promise<PayPage> {
    await this.expectOpened();
    await expect(this.guestCheckoutButton).toBeEnabled();
    await this.guestCheckoutButton.scrollIntoViewIfNeeded();

    const payPage = new PayPage(this.page);
    await Promise.all([
      payPage.expectOpened(),
      this.guestCheckoutButton.click({ noWaitAfter: true }),
    ]);
    await resolveChallengeOrSkip(this.page);

    return payPage;
  }
}
