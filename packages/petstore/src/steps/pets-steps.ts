import { expect, loadEnvironment } from '@playwright-automation/core';
import type { APIRequestContext } from '@playwright/test';

import { createPet, deletePet, getPet, getPetResponse } from '../endpoints/pets-endpoints.js';
import { deleteWithVerification } from '../support/delete-helper.js';
import { loadJsonTemplate } from '../support/load-json-template.js';
import { renderTemplate } from '../support/render-template.js';
import type { Pet } from '../types/petstore.js';

const petTemplate = loadJsonTemplate<unknown>(
  new URL('../test-data/pet.json', import.meta.url),
);

export async function createAvailablePet(
  request: APIRequestContext,
  index: number,
): Promise<Pet> {
  const petPayload = createPetPayload(index);

  return createPet(request, petPayload);
}

export async function createAndVerifyPets(
  request: APIRequestContext,
  count: number,
): Promise<Pet[]> {
  const pets: Pet[] = [];

  for (let index = 0; index < count; index += 1) {
    const pet = await createAvailablePet(request, index);
    await verifyPetAvailable(request, pet.id);
    pets.push(pet);
  }

  return pets;
}

export async function verifyPetAvailable(
  request: APIRequestContext,
  petId: number,
): Promise<void> {
  const fetchedPet = await getPet(request, petId);

  expectAvailable(fetchedPet, petId);
}

export async function cleanupPets(
  request: APIRequestContext,
  pets: Pet[],
): Promise<void> {
  const failures = [];
  const apiKey = loadEnvironment().petstore.apiKey;

  for (const pet of pets) {
    const failure = await deleteWithVerification({
      deleteAction: () => deletePet(request, pet.id, apiKey),
      getAction: () => getPetResponse(request, pet.id),
      resourceId: pet.id,
      resourceType: 'pet',
    });

    if (failure) {
      failures.push(failure);
    }
  }

  expect(failures, 'pet deletion').toEqual([]);
}

function createPetPayload(index: number): Pet {
  const id = uniqueId(10_000 + index);

  return renderTemplate<Pet>(petTemplate, {
    id,
    categoryId: 20_000 + index,
    categoryName: `category-${index}`,
    name: `playwright-pet-${id}`,
    photoUrl: `https://example.test/pets/${id}.jpg`,
    tagId: 30_000 + index,
    tagName: `tag-${index}`,
    status: 'available',
  });
}

function expectAvailable(pet: Pet, petId: number): void {
  if (pet.status !== 'available') {
    throw new Error(
      `Expected pet ${petId} to have status "available", received "${pet.status}".`,
    );
  }
}

function uniqueId(offset: number): number {
  return (Date.now() % 10_000_000) + offset;
}
