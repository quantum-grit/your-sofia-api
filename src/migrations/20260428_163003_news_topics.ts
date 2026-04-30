import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "news" ALTER COLUMN "topic" DROP DEFAULT;
  ALTER TABLE "news" ALTER COLUMN "topic" DROP NOT NULL;
  ALTER TABLE "news" ALTER COLUMN "topic" SET DATA TYPE text;
  DROP TYPE "public"."enum_news_topic";
  CREATE TYPE "public"."enum_news_topic" AS ENUM('alerts', 'release-notes');
  ALTER TABLE "news" ALTER COLUMN "topic" SET DATA TYPE "public"."enum_news_topic" USING "topic"::"public"."enum_news_topic";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news" ALTER COLUMN "topic" SET DATA TYPE text;
  ALTER TABLE "news" ALTER COLUMN "topic" SET DEFAULT 'city-events'::text;
  DROP TYPE "public"."enum_news_topic";
  CREATE TYPE "public"."enum_news_topic" AS ENUM('festivals', 'street-closure', 'city-events', 'alerts');
  ALTER TABLE "news" ALTER COLUMN "topic" SET DEFAULT 'city-events'::"public"."enum_news_topic";
  ALTER TABLE "news" ALTER COLUMN "topic" SET DATA TYPE "public"."enum_news_topic" USING "topic"::"public"."enum_news_topic";
  ALTER TABLE "news" ALTER COLUMN "topic" SET NOT NULL;`)
}
