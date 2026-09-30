import { eq } from "drizzle-orm";
import db from "@/db";
import { articles, usersSync } from "@/db/schema";
import resend from "@/email";
import CelebrationTemplate from "./templates/celebration-template";

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export default async function sendCelebrationEmail(
  articleId: number,
  pageviews: number,
) {
  const response = await db
    .select({
      email: usersSync.email,
      id: usersSync.id,
      title: articles.title,
      name: usersSync.name,
    })
    .from(articles)
    .leftJoin(usersSync, eq(articles.authorId, usersSync.id))
    .where(eq(articles.id, articleId));

  const { email, id, title, name } = response[0];
  if (!email) {
    console.log(
      `❌ skipping sending a celebration for getting ${pageviews} on article ${articleId}, could not find email`,
    );
    return;
  }

  console.log(email);

  // OPTION 1: this only works if you've set up your own custom domain on Resend like I have
  // const emailRes = await resend.emails.send({
  //   from: "Wikimasters <noreply@mail.holt.courses>", // should be your domain
  //   to: email,
  //   subject: `✨ You article got ${pageviews} views! ✨`,
  //   html: "<h1>Congrats!</h1><p>You're an amazing author!</p>",
  // });

  // OPTION 2: If you haven't set up a custom domain (development/testing)
  // Uncomment this and comment out Option 1:
  const emailRes = await resend.emails.send({
    from: "Wikimasters <onboarding@resend.dev>", // I believe it only lets you send from Resend if you haven't set up your domain
    to: "akak678h@gmail.com", // unless you set up your own domain, you can only email yourself
    subject: `✨ You article got ${pageviews} views! ✨`,
    react: (
      <CelebrationTemplate
        articleTitle={title}
        articleUrl={`${BASE_URL}/wiki/${articleId}`}
        name={name ?? "Friend"}
        pageviews={pageviews}
      />
    ),
  });

  if (!emailRes.error) {
    console.log(
      `📧 sent ${id} a celebration for getting ${pageviews} on article ${articleId}`,
    );
  } else {
    console.log(
      `❌ error sending ${id} a celebration for getting ${pageviews} on article ${articleId}`,
      emailRes.error,
    );
  }
}
