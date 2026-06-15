import { expect, type Locator } from '@playwright/test';

export async function typeIntoField(
  field: Locator,
  value: string,
  expectedValue: string = value,
): Promise<void> {
  await field.click();
  await field.clear();
  await field.pressSequentially(value);
  await expect(field).toHaveValue(expectedValue);
}
