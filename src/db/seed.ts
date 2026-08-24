import { seed } from "drizzle-seed";
import db, { sql } from "./index";
import { articles, usersSync } from "./schema";

const SEED_COUNT = 25;
const SEED = 1337;

async function main() {
  try {
    console.log(`🌱 Starting DB seed with seed ${SEED}...`);

    console.log("🧹 Truncating articles table and restarting identity...");
    // Use TRUNCATE + RESTART IDENTITY so sequences are reset to match an empty table.
    // This is simpler and avoids needing to call setval later.
    await sql.query("TRUNCATE TABLE articles RESTART IDENTITY CASCADE;");

    console.log("🔎 Querying existing users...");
    let users = await db
      .select({ id: usersSync.id })
      .from(usersSync)
      .orderBy(usersSync.id);

    if (users.length === 0) {
      console.log("👤 No users found, inserting default seed user...");
      await db.insert(usersSync).values({
        id: "seed-user-001",
        name: "Seed User",
        email: "seed@example.com",
      });
      users = [{ id: "seed-user-001" }];
    }

    const ids = users.map((user) => user.id);
    console.log(`👥 Using ${users.length} user(s)`);

    console.log("🍩 Using drizzle-seed...");
    await seed(db, { articles }, { seed: SEED }).refine((funcs) => ({
      articles: {
        count: SEED_COUNT,
        columns: {
          authorId: funcs.valuesFromArray({
            values: ids,
            isUnique: false,
          }),
          content: funcs.valuesFromArray({
            values: [
              "*Sometimes I think the best way to debug JavaScript is to pretend the bug is shy.*\nI whisper `console.log` into its ear and if it doesn't blush I add more `console.log`.\nIf it still won't blush, I rename the file and call it \"ancient wisdom.md\" and hope for the best.",
              "**If a website loads slowly in the forest and no one's there to notice, is it still a performance problem?**\nI like to leave a `TODO: optimize` comment so future me has something to feel guilty about.\nOne day we'll invent a framework that fixes itself, and then we'll all feel obsolete and oddly relieved.",
              "Sometimes I imagine AI as a polite librarian that keeps rearranging your code into mysterious haikus.\nIt writes tests, then writes more tests for the tests, then asks me where it left my keys.\nI rewarded it with a coffee emoji and it returned my `null` reference with a sonnet.",
              'I like to think of CSS as a quiet conspiracy between `div`s and `float`.\nWhen they get together they whisper, "let\'s be unpredictable today," and the layout obliges.\nIf you catch them plotting, throw a `grid` at them and walk away slowly.',
              "There is nothing more spiritual than finally getting `npm install` to finish without errors.\nFor a moment you stand at the terminal and gaze into the dependency graph like it's a small, compliant cosmos.\nThen some transitive package updates and the quiet cosmos becomes chaos again.",
              '*A good commit message is like a fortune cookie: concise, mysterious, and slightly optimistic.*\nI once wrote "fix stuff" and the repo forgave me because the tests passed.\nAt the release party we all toasted with empty energy drink cans and the CI kept humming like a lullaby.',
              'When AI suggests a refactor, I nod like a Jedi and say "use the Force."\nThen I open the PR and watch the humans argue about semicolons.\nIf the argument ends in a 2–1 vote and a bike-shedding session, progress has been made.',
              'The best time to deploy is always after you\'ve gone home, fed your plants, and forgotten that you deployed.\nIf something goes wrong, call it a "surprise feature" and add it to the changelog under `enhancement`.\nEventually your users will love it, or you\'ll rename it to "beta until further notice."',
              "I entered a room once and the whiteboard asked for my opinion on the architecture.\nI drew a smiley face and wrote `microservices` under it because the smiley was clearly decoupled.\nThe next sprint we replaced the smiley with a service and everything worked *but* the coffee machine stopped responding.",
              "If code is poetry, then React is free verse and TypeScript is the editor who insists on footnotes.\nI like writing components that are tiny, honest, and slightly apologetic.\nWhen they render, they clap politely and the browser pretends it wasn't moved to tears.",
            ],
            isUnique: false,
          }),
          title: funcs.loremIpsum({
            sentencesCount: 1,
          }),
          imageUrl: funcs.default({ defaultValue: null }),
          published: funcs.default({ defaultValue: true }),
        },
        updatedAt: funcs.timestamp(),
        createdAt: funcs.timestamp(),
        slug: funcs.string({
          isUnique: true,
        }),
      },
    }));

    console.log(`✅ Inserted ${SEED_COUNT} article(s) into the database\n`);

    // Ensure the articles sequence is synced to the current MAX(id). This is a
    // safety measure in case the DB was imported or mutated in a way that left
    // the sequence behind the table's max value.
    try {
      await sql.query(
        `SELECT setval(pg_get_serial_sequence('articles','id'), COALESCE((SELECT MAX(id) FROM articles), 1), true);`,
      );
      console.log("✅ Sequence synced after seeding");
    } catch (err) {
      console.warn("⚠️ Failed to sync articles sequence after seeding:", err);
    }
  } catch (err) {
    console.error("💥 Seed failed:", err);
    process.exit(1);
  }
}

void main();
