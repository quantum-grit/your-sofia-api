import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "signals" ADD COLUMN "reporter_id" integer;
  ALTER TABLE "signals" ADD CONSTRAINT "signals_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "signals_reporter_idx" ON "signals" USING btree ("reporter_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "signals" DROP CONSTRAINT "signals_reporter_id_users_id_fk";
  
  DROP INDEX "signals_reporter_idx";
  ALTER TABLE "signals" DROP COLUMN "reporter_id";`)
}
