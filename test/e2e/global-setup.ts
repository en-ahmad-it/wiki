import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

// ...existing code...

let devServer: ChildProcess | null = null;

async function globalSetup() {
  // ...existing code...

  // ...existing code...

  // Build and start the production server for tests
  console.log("Building Next.js app...");
  await new Promise((resolve, reject) => {
    const build = spawn("npm", ["run", "build"], {
      env: { ...process.env, PLAYWRIGHT: "1" },
      stdio: "inherit",
      shell: true,
    });
    build.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`npm run build failed with code ${code}`));
    });
  });

  console.log("Starting production server...");
  devServer = spawn("npm", ["run", "start"], {
    env: { ...process.env, PLAYWRIGHT: "1" },
    stdio: "inherit",
    shell: true,
  });

  // Wait for server to be ready
  await waitForServer("http://localhost:3000", 120000);
  console.log("✅ Dev server is ready");

  // Ensure Postgres sequences are at or above the current max(id) to avoid
  // duplicate-key errors when tests create rows. Some Neon branch operations
  // or inherited data can leave sequences behind the table max value.
  try {
    // Import the Neon client dynamically to avoid alias/resolution issues.
    // Use the DATABASE_URL already loaded into process.env by the dotenv calls above.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL || "");
    console.log(
      "🔁 Syncing articles sequence to MAX(id) to avoid PK collisions...",
    );
    await sql.query(
      `SELECT setval(pg_get_serial_sequence('articles','id'), COALESCE((SELECT MAX(id) FROM articles), 1), true);`,
    );
    console.log("✅ Sequence sync complete");
  } catch (err) {
    console.warn("⚠️ Failed to sync articles sequence:", err);
  }

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
