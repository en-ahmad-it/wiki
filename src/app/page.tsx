import { WikiCard } from "@/components/ui/wiki-card";
import { ensureUserExists } from "@/db/ensure-user";
import { getArticles } from "@/lib/data/articles";
import { hexclaveServerApp } from "@/stack/server";

export default async function Home() {
  const articles = await getArticles();
  const user = await hexclaveServerApp.getUser();

  if (user) {
    await ensureUserExists(user);
  }

  return (
    <div>
      <main className="max-w-2xl mx-auto mt-10 flex flex-col gap-6">
        {articles.map(({ title, id, createdAt, summary, author }) => (
          <WikiCard
            title={title}
            author={author ? author : "Unknown"}
            date={createdAt}
            summary={summary}
            href={`/wiki/${id}`}
            key={id}
          />
        ))}
      </main>
    </div>
  );
}
