import WikiEditor from "@/components/wiki-editor";
import { hexclaveServerApp } from "@/stack/server";
export default async function NewArticlePage() {
  await hexclaveServerApp.getUser({ or: "redirect" });

  return <WikiEditor isEditing={false} />;
}
