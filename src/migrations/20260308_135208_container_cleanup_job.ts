import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'processWasteCollectionEvents' BEFORE 'createCollectionExport';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'createCollectionImport' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'processWasteCollectionEvents' BEFORE 'createCollectionExport';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'createCollectionImport' BEFORE 'schedulePublish';
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection_slug" varchar DEFAULT 'news' NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_exports_fk";
  
  DROP INDEX "payload_locked_documents_rels_exports_id_idx";
  ALTER TABLE "waste_container_observations" ALTER COLUMN "photo_id" DROP NOT NULL;
  ALTER TABLE "waste_container_observations" ALTER COLUMN "cleaned_by_id" DROP NOT NULL;
  ALTER TABLE "exports" ALTER COLUMN "format" SET NOT NULL;
  ALTER TABLE "exports" ALTER COLUMN "collection_slug" SET DEFAULT 'news';
  ALTER TABLE "waste_container_observations" ADD COLUMN "vehicle_id" numeric;
  ALTER TABLE "waste_container_observations" ADD COLUMN "firm_id" numeric;
  ALTER TABLE "waste_container_observations" ADD COLUMN "collection_count" numeric;
  ALTER TABLE "payload_jobs" ADD COLUMN "meta" jsonb;
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "exports_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "imports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  ALTER TABLE "waste_container_observations" ALTER COLUMN "photo_id" SET NOT NULL;
  ALTER TABLE "waste_container_observations" ALTER COLUMN "cleaned_by_id" SET NOT NULL;
  ALTER TABLE "exports" ALTER COLUMN "format" DROP NOT NULL;
  ALTER TABLE "exports" ALTER COLUMN "collection_slug" DROP DEFAULT;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "exports_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exports_fk" FOREIGN KEY ("exports_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_exports_id_idx" ON "payload_locked_documents_rels" USING btree ("exports_id");
  ALTER TABLE "waste_container_observations" DROP COLUMN "vehicle_id";
  ALTER TABLE "waste_container_observations" DROP COLUMN "firm_id";
  ALTER TABLE "waste_container_observations" DROP COLUMN "collection_count";
  ALTER TABLE "payload_jobs" DROP COLUMN "meta";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";`)
}
