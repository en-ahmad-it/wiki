import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
// Side-effect import: loads .env.test / .env.test.local / .env so DATABASE_URL
// (and everything else) is available here even outside CI.
import "./load-env";

let devServer: ChildProcess | null = null;

// Build and serve the app in production mode. CI exports NODE_ENV=test
// job-wide, which makes Next.js/React produce a non-standard (development
// flavored) build and can break the auth handler page only in CI. Forcing
// production makes CI behave exactly like a local `npm run build && start`.
// (Next.js also resolves `.env` the same way in both environments.)
const serverEnv = {
  ...process.env,
  NODE_ENV: "production" as const,
  PLAYWRIGHT: "1",
};

function assertPortFree(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tester = createServer();
    tester.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${port} is already in use. A previous server (or an unrelated ` +
              `process) is still listening, and the suite would silently test that ` +
              `stale server instead of the freshly built one. Stop it and re-run.\n` +
              `  Windows: Get-NetTCPConnection -LocalPort ${port} -State Listen | ` +
              `ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n` +
              `  Git Bash/WSL: npx kill-port ${port}`,
          ),
        );
      } else {
        reject(err);
      }
    });
    tester.once("listening", () => {
      tester.close(() => resolve());
    });
    tester.listen(port);
  });
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: serverEnv,
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${command} ${args.join(" ")} failed with code ${code}`),
        );
    });
    child.on("error", reject);
  });
}

async function prepareDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Locally it is read from .env/.env.test.local; " +
        "in CI it is provided by the Neon branch step.",
    );
  }

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);

  // 1) Seed a small, known set of articles.
  //    Fixed slugs + ON CONFLICT DO NOTHING make this idempotent and
  //    non-destructive: existing rows (a local dev database, or a previous
  //    run) are never truncated or overwritten. Without this, a fresh Neon
  //    branch (CI) has zero articles and the "view an article" tests silently
  //    assert nothing.
  try {
    await sql.query(
      `INSERT INTO "usersSync" (id, name, email) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      ["e2e-seed-user", "E2E Seed User", "e2e-seed-user@example.com"],
    );

    const seedArticles = [
      {
        title: "E2E Seed: Getting Started",
        slug: "e2e-seed-getting-started",
        content:
          "# Getting Started\n\nThis article is seeded by the Playwright global setup so the home page always has content.",
        summary:
          "A seeded article that guarantees the home page lists content.",
      },
      {
        title: "E2E Seed: Testing Guide",
        slug: "e2e-seed-testing-guide",
        content:
          "# Testing Guide\n\nEnd-to-end tests rely on this seeded article to exercise navigation.",
        summary: "Seeded article used for navigation assertions.",
      },
      {
        title: "E2E Seed: Architecture Notes",
        slug: "e2e-seed-architecture",
        content:
          "# Architecture Notes\n\nSeeded by test/e2e/global-setup.ts — test-side data only, no application code involved.",
        summary: "Seeded article covering the project architecture.",
      },
    ];

    for (const article of seedArticles) {
      await sql.query(
        `INSERT INTO articles (title, slug, content, summary, published, author_id)
         VALUES ($1, $2, $3, $4, true, $5)
         ON CONFLICT (slug) DO NOTHING`,
        [
          article.title,
          article.slug,
          article.content,
          article.summary,
          "e2e-seed-user",
        ],
      );
    }
    console.log("✅ Seed articles ensured (idempotent insert)");
  } catch (err) {
    throw new Error(
      `Failed to seed the E2E database. Tests that expect articles on the home page ` +
        `cannot pass without seed data. Underlying error: ${err}`,
    );
  }

  // 2) Ensure Postgres sequences are at or above the current max(id) to avoid
  //    duplicate-key errors when tests create rows (Neon branches or imported
  //    data can leave sequences behind the table max value). Best effort.
  try {
    console.log("🔁 Syncing articles sequence to MAX(id)...");
    await sql.query(
      `SELECT setval(pg_get_serial_sequence('articles','id'), COALESCE((SELECT MAX(id) FROM articles), 1), true);`,
    );
    console.log("✅ Sequence sync complete");
  } catch (err) {
    console.warn("⚠️ Failed to sync articles sequence:", err);
  }

  // 3) Bust the app's article-list cache. getArticles() caches under
  //    "articles:all" (shared Upstash instance, 60s TTL), so a cache entry from
  //    a previous run could hide the freshly seeded rows. Best effort.
  try {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.del("articles:all");
      console.log("✅ Invalidated articles:all cache");
    }
  } catch (err) {
    console.warn("⚠️ Failed to invalidate articles cache:", err);
  }
}

async function globalSetup() {
  // Fail fast (before the ~1 min build) if something is already listening on
  // port 3000. Otherwise `npm run start` dies with EADDRINUSE, waitForServer
  // "succeeds" against the stale server, and every test fails confusingly.
  await assertPortFree(3000);

  console.log("Building Next.js app...");
  await runCommand("npm", ["run", "build"]);

  console.log("Preparing test database...");
  await prepareDatabase();

  console.log("Starting production server...");
  devServer = spawn("npm", ["run", "start"], {
    env: serverEnv,
    stdio: "inherit",
    shell: true,
  });

  // Wait for server to be ready
  await waitForServer("http://localhost:3000", 120000);
  console.log("✅ Production server is ready");

  // Store the server process ID for teardown
  writeFileSync(
    join(process.cwd(), ".test-server-pid.json"),
    JSON.stringify({ pid: devServer.pid }, null, 2),
  );
}

async function waitForServer(url: string, timeout: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        return;
      }
    } catch (_error) {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Server did not start within ${timeout}ms`);
}

export default globalSetup;
