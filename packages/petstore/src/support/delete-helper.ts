import type { APIResponse } from '@playwright/test';

type CleanupFailure = {
  resourceType: 'order' | 'pet';
  resourceId: number;
  message: string;
};

const DELETE_ATTEMPTS = 3;
const DELETE_RETRY_DELAY_MS = 500;

export async function deleteWithVerification({
  deleteAction,
  getAction,
  resourceId,
  resourceType,
}: {
  deleteAction: () => Promise<APIResponse>;
  getAction: () => Promise<APIResponse>;
  resourceId: number;
  resourceType: 'order' | 'pet';
}): Promise<CleanupFailure | undefined> {
  let lastDeleteStatus: number | undefined;
  let lastGetStatus: number | undefined;

  for (let attempt = 1; attempt <= DELETE_ATTEMPTS; attempt += 1) {
    const deleteResponse = await deleteAction();
    lastDeleteStatus = deleteResponse.status();

    const getResponse = await getAction();
    lastGetStatus = getResponse.status();

    if (lastGetStatus === 404) {
      return undefined;
    }

    if (attempt < DELETE_ATTEMPTS) {
      await delay(DELETE_RETRY_DELAY_MS * attempt);
    }
  }

  return {
    resourceType,
    resourceId,
    message: `Cleanup failed after ${DELETE_ATTEMPTS} attempts. Last delete status: ${lastDeleteStatus}, last get status: ${lastGetStatus}.`,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
