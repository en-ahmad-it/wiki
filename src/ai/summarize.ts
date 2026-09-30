import ollama from "ollama";

export default async function summarizeArticle(
  title: string,
  article: string,
): Promise<string> {
  if (!article || !article.trim()) {
    throw new Error("Article content is required to generate a summary.");
  }

  const prompt = `Summarize the following wiki article in 1-2 concise sentences. Focus on the main idea and the most important details a reader should remember. Do not add opinions or unrelated information. The point is that readers can see the summary a glance and decide if they want to read more.\n\nTitle:\n${title}\n\nArticle:\n${article}`;
  const response = await ollama.generate({
    model: "qwen3:0.6b",
    system: "You are an assistant that writes concise factual summaries.",
    prompt,
  });
  console.log("SUMMARY:", response.response);

  return (response.response ?? "").trim();
}
