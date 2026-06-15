import { expect } from '@playwright-automation/core';
import type { APIRequestContext, APIResponse } from '@playwright/test';

import type { Pet } from '../types/petstore.js';

export async function createPet(
  request: APIRequestContext,
  pet: Pet,
): Promise<Pet> {
  const response = await request.post('pet', {
    data: pet,
  });
  expect(response.status()).toBe(200);

  return (await response.json()) as Pet;
}

export async function getPet(
  request: APIRequestContext,
  petId: number,
): Promise<Pet> {
  const response = await getPetResponse(request, petId);
  expect(response.status()).toBe(200);

  return (await response.json()) as Pet;
}

export function getPetResponse(
  request: APIRequestContext,
  petId: number,
): Promise<APIResponse> {
  return request.get(`pet/${petId}`);
}

export function deletePet(
  request: APIRequestContext,
  petId: number,
  apiKey: string,
): Promise<APIResponse> {
  return request.delete(`pet/${petId}`, {
    headers: {
      api_key: apiKey,
    },
  });
}
