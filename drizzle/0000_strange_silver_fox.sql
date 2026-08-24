CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"published" boolean DEFAULT false NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "usersSync" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_usersSync_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."usersSync"("id") ON DELETE no action ON UPDATE no action;