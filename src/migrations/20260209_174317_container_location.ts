import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- Add new columns (nullable initially to allow data migration)
  ALTER TABLE "waste_containers" ADD COLUMN "location" geometry(Point);
  ALTER TABLE "waste_containers" ADD COLUMN "address" varchar;
  
  -- Migrate existing data: Point format is ST_MakePoint(longitude, latitude)
  UPDATE "waste_containers" 
  SET "location" = ST_SetSRID(ST_MakePoint("location_longitude", "location_latitude"), 4326)
  WHERE "location_longitude" IS NOT NULL AND "location_latitude" IS NOT NULL;
  
  -- Migrate address field
  UPDATE "waste_containers" 
  SET "address" = "location_address"
  WHERE "location_address" IS NOT NULL;
  
  -- Make location NOT NULL after migration
  ALTER TABLE "waste_containers" ALTER COLUMN "location" SET NOT NULL;
  
  -- Create indexes
  CREATE INDEX "waste_containers_capacity_size_idx" ON "waste_containers" USING btree ("capacity_size");
  CREATE INDEX "waste_containers_waste_type_idx" ON "waste_containers" USING btree ("waste_type");
  CREATE INDEX "waste_containers_status_idx" ON "waste_containers" USING btree ("status");
  
  -- Drop old columns
  ALTER TABLE "waste_containers" DROP COLUMN "location_latitude";
  ALTER TABLE "waste_containers" DROP COLUMN "location_longitude";
  ALTER TABLE "waste_containers" DROP COLUMN "location_address";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   -- Drop indexes
  DROP INDEX "waste_containers_capacity_size_idx";
  DROP INDEX "waste_containers_waste_type_idx";
  DROP INDEX "waste_containers_status_idx";
  
  -- Add back old columns
  ALTER TABLE "waste_containers" ADD COLUMN "location_latitude" numeric;
  ALTER TABLE "waste_containers" ADD COLUMN "location_longitude" numeric;
  ALTER TABLE "waste_containers" ADD COLUMN "location_address" varchar;
  
  -- Migrate data back: Extract latitude and longitude from Point
  UPDATE "waste_containers" 
  SET 
    "location_latitude" = ST_Y("location"::geometry),
    "location_longitude" = ST_X("location"::geometry)
  WHERE "location" IS NOT NULL;
  
  -- Migrate address back
  UPDATE "waste_containers" 
  SET "location_address" = "address"
  WHERE "address" IS NOT NULL;
  
  -- Make old columns NOT NULL after migration
  ALTER TABLE "waste_containers" ALTER COLUMN "location_latitude" SET NOT NULL;
  ALTER TABLE "waste_containers" ALTER COLUMN "location_longitude" SET NOT NULL;
  
  -- Drop new columns
  ALTER TABLE "waste_containers" DROP COLUMN "location";
  ALTER TABLE "waste_containers" DROP COLUMN "address";`)
}
