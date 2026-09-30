import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  summary: text("summary"),
  imageUrl: text("image_url"),
  published: boolean("published").default(false).notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => usersSync.id),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

export const usersSync = pgTable("usersSync", {
  id: text("id").primaryKey(), // Stack Auth user ID
  name: text("name"),
  email: text("email"),
});

export type User = typeof usersSync.$inferSelect;

const schema = { articles, usersSync };
export default schema;
