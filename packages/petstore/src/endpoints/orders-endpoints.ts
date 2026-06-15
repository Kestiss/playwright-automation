import { expect } from '@playwright-automation/core';
import type { APIRequestContext, APIResponse } from '@playwright/test';

import type { Order } from '../types/petstore.js';

export async function placeOrder(
  request: APIRequestContext,
  order: Order,
): Promise<Order> {
  const response = await request.post('store/order', {
    data: order,
  });
  expect(response.status()).toBe(200);

  return (await response.json()) as Order;
}

export async function getOrder(
  request: APIRequestContext,
  orderId: number,
): Promise<Order> {
  const response = await getOrderResponse(request, orderId);
  expect(response.status()).toBe(200);

  return (await response.json()) as Order;
}

export function getOrderResponse(
  request: APIRequestContext,
  orderId: number,
): Promise<APIResponse> {
  return request.get(`store/order/${orderId}`);
}

export function deleteOrder(
  request: APIRequestContext,
  orderId: number,
  apiKey: string,
): Promise<APIResponse> {
  return request.delete(`store/order/${orderId}`, {
    headers: {
      api_key: apiKey,
    },
  });
}
