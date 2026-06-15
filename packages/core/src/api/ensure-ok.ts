import type { APIResponse } from '@playwright/test';

export async function ensureOk(response: APIResponse): Promise<void> {
  if (response.ok()) {
    return;
  }

  const body = await response.text();
  throw new Error(
    `Expected a successful API response but got ${response.status()} ${response.statusText()}.\n${body}`,
  );
}
