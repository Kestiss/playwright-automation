import { apiTest as test } from '@playwright-automation/core';

import { cleanupOrders, placeAndVerifyOrders } from '../steps/orders-steps.js';
import { cleanupPets, createAndVerifyPets } from '../steps/pets-steps.js';

test.describe('Swagger Petstore API', () => {
  test('creates pets, places orders, cleans them up, and verifies 404 after deletion', async ({ request }) => {
    const pets = await createAndVerifyPets(request, 4);
    const orders = await placeAndVerifyOrders(request, pets, 2);

    await cleanupOrders(request, orders);
    await cleanupPets(request, pets);
  });
});
