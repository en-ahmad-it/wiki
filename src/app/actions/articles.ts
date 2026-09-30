"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import summarizeArticle from "@/ai/summarize";
import redis from "@/cache";
import { authorizeUserToEditArticle } from "@/db/authz";
import { ensureUserExists } from "@/db/ensure-user";
import db from "@/db/index";
import { articles } from "@/db/schema";
import { hexclaveServerApp } from "@/stack/server";

// Server actions for articles (stubs)
// TODO: Replace with real database operations when ready

export type CreateArticleInput = {
  title: string;
  content: string;
  authorId: string;
  imageUrl?: string;
};

export type UpdateArticleInput = {
  title?: string;
  content?: string;
  imageUrl?: string;
};

export async function createArticle(data: CreateArticleInput) {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    throw new Error("❌ Unauthorized");
  }

  await ensureUserExists(user);

  console.log("✨ createArticle called:", data);
  const summary = await summarizeArticle(data.title || "", data.content || "");
  const response = await db
    .insert(articles)
    .values({
      title: data.title,
      content: data.content,
      slug: `${Date.now()}`,
      published: true,
      authorId: user.id,
      imageUrl: data.imageUrl ?? undefined,
      summary: summary ?? undefined,
    })
    .returning({ id: articles.id });

  const articleId = response[0]?.id;
  await redis.del("articles:all");
  return { success: true, message: "Article create logged", id: articleId };
}

export async function updateArticle(id: string, data: UpdateArticleInput) {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    throw new Error("❌ Unauthorized");
  }

  if (!(await authorizeUserToEditArticle(user.id, +id))) {
    throw new Error("❌ Forbidden");
  }

  console.log("📝 updateArticle called:", { id, ...data });
  const summary = await summarizeArticle(data.title || "", data.content || "");
  const _response = await db
    .update(articles)
    .set({
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl ?? undefined,
      summary: summary ?? undefined,
    })
    .where(eq(articles.id, +id));
  await redis.del("articles:all");

  return { success: true, message: `Article ${id} update logged` };
}

export async function deleteArticle(id: string) {
  const user = await hexclaveServerApp.getUser();
  if (!user) {
    throw new Error("❌ Unauthorized");
  }

  if (!(await authorizeUserToEditArticle(user.id, +id))) {
    throw new Error("❌ Forbidden");
  }

  console.log("🗑️ deleteArticle called:", id);

  const _response = await db.delete(articles).where(eq(articles.id, +id));
  await redis.del("articles:all");

  return { success: true, message: `Article ${id} delete logged (stub)` };
}

// Form-friendly server action: accepts FormData from a client form and calls deleteArticle
export async function deleteArticleForm(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (!id) {
    throw new Error("Missing article id");
  }

  await deleteArticle(String(id));
  // After deleting, redirect the user back to the homepage.
  redirect("/");
}
