# E2E Tests with Playwright

This directory contains end-to-end tests for the Wikimasters application using Playwright with Neon branch management for database isolation.

## Overview

The E2E test suite covers:

- **Authentication flows** (sign in, sign up, protected routes)
- **Article CRUD operations** (create, read, update, delete)
- **Authorization** (users can only edit their own articles)
- **Form validation**
- **Navigation flows**

## Test Architecture

### Authentication Strategy

Tests use Playwright's [authentication storage state](https://playwright.dev/docs/auth) pattern:

1. **Setup Project** (`auth.setup.ts`): Runs once before all tests
   - Logs in using Stack authentication
   - Saves authenticated state to `playwright/.auth/user.json`

2. **Test Projects**:
   - **chromium-authenticated**: Uses saved auth state for article tests
   - **chromium-unauthenticated**: No auth state for testing auth flows

### Database Isolation with Neon Branches

Each test suite creates an isolated Neon branch:

1. Before tests: Create new Neon branch
2. Run migrations on the branch
3. Seed the database with test data
4. Run tests against the isolated database
5. After tests: Delete the Neon branch

This ensures complete test isolation without affecting your development or production databases.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.test.local.example .env.test.local
```

Edit `.env.test.local` and fill in the required values:

#### Required Variables

**Neon Database:**

```bash
NEON_PROJECT_ID=your-neon-project-id
```

Get this from: https://console.neon.tech/

**Stack Authentication:**

```bash
NEXT_PUBLIC_STACK_PROJECT_ID=your-stack-project-id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your-stack-publishable-key
STACK_SECRET_SERVER_KEY=your-stack-secret-key
```

Get these from: https://app.stack-auth.com/

**Test User Credentials:**

```bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=your-test-password
```

Create a test user in your Stack project first, then add the credentials here.

**Other Required Services:**

```bash
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 3. Create a Test User in Stack

1. Go to your Stack project dashboard
2. Navigate to Users section
3. Create a new user with the email/password you specified in `.env.test.local`
4. Verify the user is active

### 4. Install Playwright Browsers

```bash
npx playwright install chromium
```

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

This will:

1. Start the development server
2. Run the authentication setup
3. Run all test files
4. Generate an HTML report

### Run Tests in UI Mode

```bash
npm run test:e2e:ui
```

Interactive mode with visual test runner - great for debugging!

### Run Tests in Debug Mode

```bash
npm run test:e2e:debug
```

Step through tests with the Playwright inspector.

### Run Specific Test Files

```bash
# Run only auth tests
npx playwright test auth.spec.ts

# Run only article tests
npx playwright test articles.spec.ts
```

### Run Specific Tests

```bash
# Run tests matching a pattern
npx playwright test -g "should create a new article"
```

## Test Files

### `auth.setup.ts`

Authentication setup that runs before all tests. Handles Stack login and saves the authentication state.

### `auth.spec.ts`

Tests for authentication flows:

- Sign in/up button visibility
- Navigation to Stack auth pages
- Protected route enforcement
- Public page access

### `articles.spec.ts`

Tests for article CRUD operations:

- Creating articles with authentication
- Updating own articles
- Deleting articles
- Form validation
- Authorization checks
- Navigation between pages

## Troubleshooting

### Authentication Fails

If you see authentication errors:

1. **Check credentials**: Verify `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env.test.local`
2. **Verify Stack user**: Ensure the test user exists in your Stack project
3. **Check screenshot**: Look at `playwright/.auth/auth-error.png` for visual debugging
4. **Update selectors**: If Stack's UI changed, update selectors in `auth.setup.ts`

### Database Connection Errors

If Neon branch creation fails:

1. **Verify NEON_PROJECT_ID**: Check it's correct in `.env.test.local`
2. **Check Neon CLI**: Run `npx neonctl auth list` to verify authentication
3. **API limits**: Ensure you haven't hit Neon's branch limits
4. **Network**: Verify internet connection for API calls

### Tests Timing Out

If tests are slow or timing out:

1. **AI summarization**: Article creation uses Anthropic AI which can be slow
   - Tests use 20s timeout for article operations
2. **Network speed**: Slow network can affect Stack auth and Neon API calls
3. **Development server**: Ensure `npm run dev` starts successfully

### Stack Auth UI Changed

If Stack updates their authentication UI:

1. Open `test/e2e/auth.setup.ts`
2. Update the selectors for email/password inputs
3. Update the submit button selector
4. Test locally with `npm run test:e2e:debug`

## CI/CD Integration

For GitHub Actions or other CI platforms:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e
  env:
    NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    # ... other env vars
```

Add all required environment variables as secrets in your CI platform.

## Best Practices

1. **Keep test user separate**: Use a dedicated test account, not your personal account
2. **Clean data**: Tests create articles with timestamps to avoid conflicts
3. **Isolation**: Each test suite gets its own Neon branch
4. **Unique titles**: Tests use `Date.now()` to ensure unique article titles
5. **Timeouts**: Increased timeouts account for AI summarization (20s for article operations)

## Directory Structure

```
test/
├── e2e/                   # E2E tests
│   ├── README.md          # This file
│   ├── auth.setup.ts      # Authentication setup
│   ├── auth.spec.ts       # Authentication tests
│   ├── articles.spec.ts   # Article CRUD tests
│   ├── global-setup.ts    # Global setup (Neon branch creation)
│   └── global-teardown.ts # Global teardown (Neon branch deletion)
├── unit/                  # Unit tests
│   ├── articles.test.ts   # Article actions unit tests
│   └── example.test.ts    # Example unit tests
├── mocks/                 # Test mocks
├── utils/                 # Test utilities (Neon branch manager)
└── setup.ts               # Vitest setup

playwright/
└── .auth/                 # Saved authentication state (gitignored)
    └── user.json          # Logged-in user session

playwright.config.ts       # Playwright configuration
vitest.config.ts          # Vitest configuration
.env.test.local           # Test environment variables (gitignored)
.env.test.local.example   # Template for environment variables
```

## Learn More

- [Playwright Documentation](https://playwright.dev)
- [Neon Branching](https://neon.tech/docs/guides/branching)
- [Stack Authentication](https://docs.stack-auth.com)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
