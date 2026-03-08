import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_waste_containers_status" ADD VALUE 'pending';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "waste_containers" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "waste_containers" ALTER COLUMN "status" SET DEFAULT 'active'::text;
  DROP TYPE "public"."enum_waste_containers_status";
  CREATE TYPE "public"."enum_waste_containers_status" AS ENUM('active', 'full', 'maintenance', 'inactive');
  ALTER TABLE "waste_containers" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."enum_waste_containers_status";
  ALTER TABLE "waste_containers" ALTER COLUMN "status" SET DATA TYPE "public"."enum_waste_containers_status" USING "status"::"public"."enum_waste_containers_status";`)
}
