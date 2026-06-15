# Playwright Automation Monorepo

Playwright + TypeScript workspace for multiple, test modules while reusing shared infrastructure.

## What is included

- `packages/core`: reusable infrastructure such as environment loading, shared fixtures, shared Playwright config, and low-level helpers
- `packages/ebay`: web UI tests with page objects, components, flows, and split spec files
- `packages/petstore`: API tests with service-local clients and flows
- `pnpm` workspace catalogs: dependency versions are defined in one place
- GitHub Actions workflow scaffold

## Repository shape

```text
.
├── config/
│   └── env/
├── packages/
│   ├── petstore/
│   ├── core/
│   └── ebay/
└── .github/workflows/
```

## Structure

- Packages stay independent when they target unrelated systems.
- `core` stays small and reusable because it only contains generic test infrastructure.
- `pnpm-workspace.yaml` catalogs keep dependency versions centralized.

## Additional Notes and assumptions

- eBay has anti-bot and challenge pages; the project tries to include challenge handling, but it is not always stable, longer waits added to solve challenges manually.
- The checkout flow proceeds as far as possible without completing payment and expects the payment attempt to fail.
- After payment is failed, test goes straight to cart page via url, because there is no UI element to go back to cart. Alternatively, we could use browser's back functionality.
- GitHub workflow will fail as tests will not be passing due to eBay bot detection.

## Extension rules

- Generic, or duplicated code goes to `packages/core`.
- Module specific code goes to individual modules.
- New modules can easily be added.

## GitHub setup

The workflow installs dependencies, installs Playwright browsers, runs linting, type checking, and executes both test packages.

Replace the sample endpoints in `config/env` with your real systems before relying on the scaffold in CI.


## Environment switching

Environment files live under `config/env`:

- `config/env/.env.dev`
- `config/env/.env.stage`
- `config/env/.env.prod`

Select an environment with `TEST_ENV`:

```bash
TEST_ENV=stage pnpm run test:api
TEST_ENV=prod pnpm run test:web
```

`packages/core` loads the selected file, validates it with `zod`, and exposes a typed object to tests and configs.

## Setup

```bash
pnpm install
pnpm run playwright:install
```

You may need to install Firefox locally with:

```bash
pnpm --filter @playwright-automation/ebay exec playwright install firefox
```

## Workspace commands

```bash
pnpm run lint
pnpm run format
pnpm run format:write
pnpm run typecheck
pnpm run test:web
pnpm run test:web:headed
pnpm run test:web:headless
pnpm run test:web:ui
pnpm run test:api
pnpm run test
```

## Web test commands

Default behavior:

- `pnpm run test:web`
- `pnpm run test:web:headed`

Both run the web suite with `1` worker.

Headless local run:

```bash
pnpm run test:web:headless
```

Increase workers directly on the command line:

```bash
pnpm run test:web:headed --workers=4
pnpm run test:web:headless --workers=4
```

Run a single spec file:

```bash
pnpm run test:web:headed src/tests/search.spec.ts
pnpm run test:web:headless src/tests/cart.spec.ts --workers=2
pnpm run test:web:headed src/tests/checkout-csv.spec.ts
```

## Browser selection

The web package is configured with two Playwright projects:

- `chromium`
- `firefox`

By default, both run.

Run one or both browsers with Playwright project flags:

```bash
pnpm run test:web:headed --project=chromium
pnpm run test:web:headed --project=firefox
pnpm run test:web:headed --project=chromium --project=firefox
```

You can also select browsers through `PW_PROJECTS`:

```bash
PW_PROJECTS=chromium pnpm run test:web:headed
PW_PROJECTS=firefox pnpm run test:web:headed
PW_PROJECTS=chromium,firefox pnpm run test:web:headed
```

## Tag filtering

The web tests use Playwright `tag` metadata. Current tags include:

- `@cart`
- `@checkout`
- `@search`
- `@filters`
- `@smoke`
- `@negative`

Run by tag with `--grep`:

```bash
pnpm run test:web:headed --grep @search
pnpm run test:web:headed --grep @cart
pnpm run test:web:headed --grep @checkout
pnpm run test:web:headed --grep "@cart|@filters"
pnpm run test:web:headed --grep-invert @negative
```

Tags work the same in headless mode:

```bash
pnpm run test:web:headless --grep @search --workers=4
```

## CSV-backed input data

There is a dedicated CSV-backed checkout scenario in:

- `packages/ebay/src/tests/checkout-csv.spec.ts`

Its input file is:

- `packages/ebay/src/tests/data/checkout-payment-failure.csv`

## HTML report output

After a Playwright run, the console prints a `file://` link to the generated HTML report, for example:

```text
HTML report: file:///home/your-user/path/to/playwright-report/-playwright-automation-ebay/index.html
```

## API automation

Run only the API suite:

```bash
pnpm run test:api
```

Repeat the same API test multiple times:

```bash
pnpm --filter @playwright-automation/petstore exec playwright test src/tests/petstore.spec.ts --repeat-each=10
```

Possible additional API test cases, while utilizing the same endpoints:

- try to create a pet with an invalid payload or missing fields
- try to place an order for a non-existent pet
- try to delete the same order or pet twice
- try to retrieve an order or pet with invalid or non-existent ID
- try to create pet or order with the same ID
- try to change pet availability status
- try to change order status
