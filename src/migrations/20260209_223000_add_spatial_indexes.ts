import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- Create spatial indexes for geospatial queries (GIST index for PostGIS)
  CREATE INDEX "waste_containers_location_idx" ON "waste_containers" USING GIST ("location");
  CREATE INDEX "signals_location_idx" ON "signals" USING GIST ("location");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   -- Drop spatial indexes
  DROP INDEX IF EXISTS "waste_containers_location_idx";
  DROP INDEX IF EXISTS "signals_location_idx";
  `)
}
