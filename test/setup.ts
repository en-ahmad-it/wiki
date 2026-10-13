import dotenv from "dotenv";
import { afterEach, beforeEach, vi } from "vitest";

// Load base test env first, then local overrides written by global setup
dotenv.config({ quiet: true, path: ".env.test" });
dotenv.config({ quiet: true, path: ".env.test.local" });

// Mock Next.js redirect function
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(),
}));

// Mock the AI summarize service globally
vi.mock("@/ai/summarize", () => ({
  __esModule: true,
  default: vi.fn().mockResolvedValue("This is a test summary."),
  summarizeArticle: vi.fn().mockResolvedValue("This is a test summary."),
}));

// Setup and cleanup hooks can be added here

beforeEach(async () => {
  // Setup code before each test
});

afterEach(async () => {
  // Cleanup code after each test
});
