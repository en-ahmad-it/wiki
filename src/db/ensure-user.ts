import db from "@/db/index";
import { usersSync } from "@/db/schema";

type StackUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
};
/**
 * Ensures the Stack Auth user exists in our local users table.
 * Call this before creating articles to ensure the foreign key reference works.
 */
export async function ensureUserExists(stackUser: StackUser): Promise<void> {
  await db
    .insert(usersSync)
    .values({
      id: stackUser.id,
      name: stackUser.displayName,
      email: stackUser.primaryEmail,
    })
    .onConflictDoUpdate({
      target: usersSync.id,
      set: {
        name: stackUser.displayName,
        email: stackUser.primaryEmail,
      },
    });
}
