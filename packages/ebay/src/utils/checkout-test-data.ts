import type {
  GuestCheckoutAddress,
  NewCardDetails,
} from '../pages/pay-page.js';

type CheckoutTestDataOptions = {
  address?: Partial<GuestCheckoutAddress>;
  card?: Partial<NewCardDetails>;
};

const FIRST_NAMES = ['Jonas', 'Mantas', 'Lukas', 'Tomas', 'Domantas'] as const;
const LAST_NAMES = [
  'Grainys',
  'Kazlauskas',
  'Petraitis',
  'Saulenas',
  'Jankauskas',
] as const;

export function createCheckoutTestData(options: CheckoutTestDataOptions = {}): {
  address: GuestCheckoutAddress;
  card: NewCardDetails;
} {
  const firstName = options.address?.firstName ?? pickRandom(FIRST_NAMES);
  const lastName = options.address?.lastName ?? pickRandom(LAST_NAMES);

  const address = mergeDefined<GuestCheckoutAddress>(
    {
      email: `${firstName}.${lastName}@gmail.com`,
      country: 'Lithuania',
      firstName,
      lastName,
      addressLine1: `Gedimino pr. ${randomNumberBetween(10, 30)}`,
      city: 'Vilnius',
      postalCode: createPostalCode(),
      phoneNumber: createLithuanianPhoneNumber(),
    },
    options.address,
  );

  const card = mergeDefined<NewCardDetails>(
    {
      cardNumber: '4111111111111111',
      expirationDate: createFutureExpirationDate(),
      securityCode: String(randomNumberBetween(100, 999)),
      firstName,
      lastName,
    },
    options.card,
  );

  return { address, card };
}

function mergeDefined<T extends object>(base: T, overrides?: Partial<T>): T {
  if (!overrides) {
    return base;
  }

  const merged = { ...base };

  for (const [key, value] of Object.entries(overrides) as [
    keyof T,
    T[keyof T] | undefined,
  ][]) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }

  return merged;
}

function createPostalCode(): string {
  return String(randomNumberBetween(1000, 9999)).padStart(5, '0');
}

function createLithuanianPhoneNumber(): string {
  return `6${randomNumberBetween(1000000, 9999999)}`;
}

function createFutureExpirationDate(): string {
  const month = String(randomNumberBetween(1, 12)).padStart(2, '0');
  const year = new Date().getFullYear() + randomNumberBetween(2, 4);

  return `${month}/${String(year).slice(-2)}`;
}

function pickRandom<T>(items: readonly T[]): T {
  const item = items[randomNumberBetween(0, items.length - 1)];

  if (item === undefined) {
    throw new Error('Cannot pick a random value from an empty list.');
  }

  return item;
}

function randomNumberBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
