import { notFound } from "next/navigation";
import WikiArticleViewer from "@/components/wiki-article-viewer";
import { authorizeUserToEditArticle } from "@/db/authz";
import { getArticleById } from "@/lib/data/articles";
import { hexclaveServerApp } from "@/stack/server";

interface ViewArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ViewArticlePage({
  params,
}: ViewArticlePageProps) {
  const { id } = await params;

  // Determine whether the currently-logged-in user can edit this article.
  // If there's no logged-in user, `stackServerApp.getUser()` will return nullish
  // and `canEdit` will be false.
  let canEdit = false;
  try {
    const user = await hexclaveServerApp.getUser();
    if (user) {
      canEdit = await authorizeUserToEditArticle(user.id, +id);
    }
  } catch (_err) {
    // On error, default to not allowing edits. Keeps behavior safe.
    canEdit = false;
  }

  const article = await getArticleById(+id);

  if (!article) {
    notFound();
  }

  return <WikiArticleViewer article={article} canEdit={canEdit} />;
}
