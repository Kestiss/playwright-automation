import { expect, loadEnvironment } from '@playwright-automation/core';
import type { APIRequestContext } from '@playwright/test';

import {
  deleteOrder,
  getOrder,
  getOrderResponse,
  placeOrder,
} from '../endpoints/orders-endpoints.js';
import { deleteWithVerification } from '../support/delete-helper.js';
import { loadJsonTemplate } from '../support/load-json-template.js';
import { renderTemplate } from '../support/render-template.js';
import type { Order, Pet } from '../types/petstore.js';

const orderTemplate = loadJsonTemplate<unknown>(
  new URL('../test-data/order.json', import.meta.url),
);

export async function placeOrderForPet(
  request: APIRequestContext,
  petId: number,
  uniqueIndex: number,
  quantity: number,
): Promise<Order> {
  const orderPayload = createOrderPayload(petId, uniqueIndex, quantity);

  return placeOrder(request, orderPayload);
}

export async function placeAndVerifyOrders(
  request: APIRequestContext,
  pets: Pet[],
  ordersPerPet: number,
): Promise<Order[]> {
  const orders: Order[] = [];
  let nextOrderIndex = 0;

  for (const pet of pets) {
    for (let orderIndex = 0; orderIndex < ordersPerPet; orderIndex += 1) {
      const order = await placeOrderForPet(
        request,
        pet.id,
        nextOrderIndex,
        orderIndex + 1,
      );
      nextOrderIndex += 1;

      await verifyOrderCreated(request, order.id);
      orders.push(order);
    }
  }

  return orders;
}

export async function verifyOrderCreated(
  request: APIRequestContext,
  orderId: number,
): Promise<void> {
  const fetchedOrder = await getOrder(request, orderId);

  expectPlaced(fetchedOrder, orderId);
}

export async function cleanupOrders(
  request: APIRequestContext,
  orders: Order[],
): Promise<void> {
  const failures = [];
  const apiKey = loadEnvironment().petstore.apiKey;

  for (const order of orders) {
    const failure = await deleteWithVerification({
      deleteAction: () => deleteOrder(request, order.id, apiKey),
      getAction: () => getOrderResponse(request, order.id),
      resourceId: order.id,
      resourceType: 'order',
    });

    if (failure) {
      failures.push(failure);
    }
  }

  expect(failures, 'order deletion').toEqual([]);
}

function createOrderPayload(
  petId: number,
  uniqueIndex: number,
  quantity: number,
): Order {
  const id = uniqueId(50_000 + uniqueIndex);

  return renderTemplate<Order>(orderTemplate, {
    id,
    petId,
    quantity,
    shipDate: new Date(Date.now() + quantity * 60_000).toISOString(),
    status: 'placed',
    complete: false,
  });
}

function expectPlaced(order: Order, orderId: number): void {
  if (order.status !== 'placed') {
    throw new Error(
      `Expected order ${orderId} to have status "placed", received "${order.status}".`,
    );
  }
}

function uniqueId(offset: number): number {
  return (Date.now() % 10_000_000) + offset;
}
