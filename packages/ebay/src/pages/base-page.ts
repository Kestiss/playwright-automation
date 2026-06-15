import type { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async openUrl(url: string): Promise<void> {
    await this.page.goto(url);
  }
}
