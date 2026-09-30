"use server";
import redis from "@/cache";
import sendCelebrationEmail from "@/email/celebration-email";

const keyfor = (id: number) => `pageview:article:${id}`;
const milestones = [10, 50, 100, 1000, 10000];

export async function incrimentPageViews(articleId: number) {
  const articleKey = keyfor(articleId);
  const newval = await redis.incr(articleKey);

  const newVal = +newval;
  if (milestones.includes(newVal)) {
    sendCelebrationEmail(articleId, +newVal); // don't await so we don't block on sending the email, just send it
  }
  return +newval;
}
