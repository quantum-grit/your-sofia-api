import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- Add new columns (nullable initially to allow data migration)
  ALTER TABLE "signals" ADD COLUMN "title" varchar;
  ALTER TABLE "signals" ADD COLUMN "description" varchar;
  ALTER TABLE "signals" ADD COLUMN "location" geometry(Point);
  ALTER TABLE "signals" ADD COLUMN "address" varchar;
  
  -- Migrate localized title and description (take Bulgarian or first available locale)
  UPDATE "signals" s
  SET 
    "title" = (
      SELECT sl."title" 
      FROM "signals_locales" sl 
      WHERE sl."_parent_id" = s.id 
      ORDER BY CASE WHEN sl."_locale" = 'bg' THEN 0 ELSE 1 END, sl.id 
      LIMIT 1
    ),
    "description" = (
      SELECT sl."description" 
      FROM "signals_locales" sl 
      WHERE sl."_parent_id" = s.id 
      ORDER BY CASE WHEN sl."_locale" = 'bg' THEN 0 ELSE 1 END, sl.id 
      LIMIT 1
    );
  
  -- Migrate location data: Point format is ST_MakePoint(longitude, latitude) with SRID 4326
  UPDATE "signals" 
  SET "location" = ST_SetSRID(ST_MakePoint("location_longitude", "location_latitude"), 4326)
  WHERE "location_longitude" IS NOT NULL AND "location_latitude" IS NOT NULL;
  
  -- Migrate address field
  UPDATE "signals" 
  SET "address" = "location_address"
  WHERE "location_address" IS NOT NULL;
  
  -- Make title NOT NULL after migration
  ALTER TABLE "signals" ALTER COLUMN "title" SET NOT NULL;
  
  -- Create indexes
  CREATE INDEX "signals_category_idx" ON "signals" USING btree ("category");
  CREATE INDEX "signals_status_idx" ON "signals" USING btree ("status");
  CREATE INDEX "signals_reporter_unique_id_idx" ON "signals" USING btree ("reporter_unique_id");
  
  -- Drop localized table and old location columns
  ALTER TABLE "signals_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "signals_locales" CASCADE;
  ALTER TABLE "signals" DROP COLUMN "location_latitude";
  ALTER TABLE "signals" DROP COLUMN "location_longitude";
  ALTER TABLE "signals" DROP COLUMN "location_address";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   -- Recreate localized table
  CREATE TABLE "signals_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  -- Add foreign key constraint
  ALTER TABLE "signals_locales" ADD CONSTRAINT "signals_locales_parent_id_fk" 
    FOREIGN KEY ("_parent_id") REFERENCES "public"."signals"("id") ON DELETE cascade ON UPDATE no action;
  
  -- Create unique index
  CREATE UNIQUE INDEX "signals_locales_locale_parent_id_unique" 
    ON "signals_locales" USING btree ("_locale","_parent_id");
  
  -- Migrate title and description back to localized table (create Bulgarian locale entry)
  INSERT INTO "signals_locales" ("title", "description", "_locale", "_parent_id")
  SELECT 
    s."title",
    s."description",
    'bg'::_locales,
    s.id
  FROM "signals" s
  WHERE s."title" IS NOT NULL;
  
  -- Drop indexes
  DROP INDEX "signals_category_idx";
  DROP INDEX "signals_status_idx";
  DROP INDEX "signals_reporter_unique_id_idx";
  
  -- Add back old location columns
  ALTER TABLE "signals" ADD COLUMN "location_latitude" numeric;
  ALTER TABLE "signals" ADD COLUMN "location_longitude" numeric;
  ALTER TABLE "signals" ADD COLUMN "location_address" varchar;
  
  -- Migrate data back: Extract latitude and longitude from Point
  UPDATE "signals" 
  SET 
    "location_latitude" = ST_Y("location"::geometry),
    "location_longitude" = ST_X("location"::geometry)
  WHERE "location" IS NOT NULL;
  
  -- Migrate address back
  UPDATE "signals" 
  SET "location_address" = "address"
  WHERE "address" IS NOT NULL;
  
  -- Drop new columns
  ALTER TABLE "signals" DROP COLUMN "title";
  ALTER TABLE "signals" DROP COLUMN "description";
  ALTER TABLE "signals" DROP COLUMN "location";
  ALTER TABLE "signals" DROP COLUMN "address";`)
}
