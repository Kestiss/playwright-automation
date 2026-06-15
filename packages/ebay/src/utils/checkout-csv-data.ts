import { readFileSync } from 'node:fs';

import type {
  GuestCheckoutAddress,
  NewCardDetails,
} from '../pages/pay-page.js';

export type CheckoutCsvData = {
  search: {
    keyword: string;
    brand?: string;
    minimumPrice?: string;
    maximumPrice?: string;
  };
  address: GuestCheckoutAddress;
  card: NewCardDetails;
};

export function loadCheckoutDataFromCsv(
  csvFile: URL | string,
): CheckoutCsvData {
  const [row] = loadCheckoutDataRowsFromCsv(csvFile);

  if (!row) {
    throw new Error('Expected at least one checkout data row in the CSV file.');
  }

  return row;
}

export function loadCheckoutDataRowsFromCsv(
  csvFile: URL | string,
): CheckoutCsvData[] {
  const content = readFileSync(csvFile, 'utf8');
  const rows = parseCsv(content);

  if (rows.length === 0) {
    throw new Error('Expected at least one checkout data row in the CSV file.');
  }

  return rows.map(mapCsvRowToCheckoutData);
}

function mapCsvRowToCheckoutData(
  row: Record<string, string>,
): CheckoutCsvData {
  const brand = optionalValue(row.brand);
  const minimumPrice = optionalValue(row.minimumPrice);
  const maximumPrice = optionalValue(row.maximumPrice);
  const country = optionalValue(row.country);
  const addressLine2 = optionalValue(row.addressLine2);
  const stateOrProvince = optionalValue(row.stateOrProvince);
  const cardFirstName = optionalValue(row.cardFirstName);
  const cardLastName = optionalValue(row.cardLastName);

  return {
    search: {
      keyword: requiredValue(row.keyword, 'keyword'),
      ...(brand ? { brand } : {}),
      ...(minimumPrice ? { minimumPrice } : {}),
      ...(maximumPrice ? { maximumPrice } : {}),
    },
    address: {
      email: requiredValue(row.email, 'email'),
      firstName: requiredValue(row.firstName, 'firstName'),
      lastName: requiredValue(row.lastName, 'lastName'),
      addressLine1: requiredValue(row.addressLine1, 'addressLine1'),
      city: requiredValue(row.city, 'city'),
      postalCode: requiredValue(row.postalCode, 'postalCode'),
      phoneNumber: requiredValue(row.phoneNumber, 'phoneNumber'),
      ...(country ? { country } : {}),
      ...(addressLine2 ? { addressLine2 } : {}),
      ...(stateOrProvince ? { stateOrProvince } : {}),
    },
    card: {
      cardNumber: requiredValue(row.cardNumber, 'cardNumber'),
      expirationDate: requiredValue(row.expirationDate, 'expirationDate'),
      securityCode: requiredValue(row.securityCode, 'securityCode'),
      ...(cardFirstName ? { firstName: cardFirstName } : {}),
      ...(cardLastName ? { lastName: cardLastName } : {}),
    },
  };
}

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content
    .split('\n')
    .map((line) => line.replace(/\r$/, '').trim())
    .filter(Boolean);

  const [headerLine, ...dataLines] = lines;

  if (!headerLine) {
    return [];
  }

  const headers = parseCsvLine(headerLine);

  return dataLines.map((line) => {
    const values = parseCsvLine(line);

    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? '']),
    );
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === undefined) {
      continue;
    }

    if (character === '"') {
      const nextCharacter = line[index + 1];

      if (insideQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (character === ',' && !insideQuotes) {
      values.push(currentValue);
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue);

  return values;
}

function requiredValue(value: string | undefined, fieldName: string): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing required checkout CSV value: ${fieldName}`);
  }

  return normalizedValue;
}

function optionalValue(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}
