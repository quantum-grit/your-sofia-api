import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "waste_container_observations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"container_id" integer NOT NULL,
  	"photo_id" integer NOT NULL,
  	"cleaned_by_id" integer NOT NULL,
  	"cleaned_at" timestamp(3) with time zone NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "waste_container_observations_id" integer;
  ALTER TABLE "waste_container_observations" ADD CONSTRAINT "waste_container_observations_container_id_waste_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."waste_containers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "waste_container_observations" ADD CONSTRAINT "waste_container_observations_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "waste_container_observations" ADD CONSTRAINT "waste_container_observations_cleaned_by_id_users_id_fk" FOREIGN KEY ("cleaned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "waste_container_observations_container_idx" ON "waste_container_observations" USING btree ("container_id");
  CREATE INDEX "waste_container_observations_photo_idx" ON "waste_container_observations" USING btree ("photo_id");
  CREATE INDEX "waste_container_observations_cleaned_by_idx" ON "waste_container_observations" USING btree ("cleaned_by_id");
  CREATE INDEX "waste_container_observations_updated_at_idx" ON "waste_container_observations" USING btree ("updated_at");
  CREATE INDEX "waste_container_observations_created_at_idx" ON "waste_container_observations" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_waste_container_observations_fk" FOREIGN KEY ("waste_container_observations_id") REFERENCES "public"."waste_container_observations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_waste_container_observatio_idx" ON "payload_locked_documents_rels" USING btree ("waste_container_observations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "waste_container_observations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "waste_container_observations" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_waste_container_observations_fk";
  
  DROP INDEX "payload_locked_documents_rels_waste_container_observatio_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "waste_container_observations_id";`)
}
