/* Optional SQL integration check: Deno + an isolated, in-memory PostgreSQL.
   Run: deno run --allow-read --allow-env --allow-sys tests/tiktok-database.mjs */
import { PGlite } from "npm:@electric-sql/pglite@0.5.15";

const db = new PGlite();
try {
    await db.exec(`
        CREATE SCHEMA auth;
        CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_app_meta_data jsonb);
        CREATE ROLE anon;
        CREATE ROLE authenticated;
        CREATE ROLE service_role BYPASSRLS;
    `);
    for (const file of [
        "../supabase/migrations/20261108000200_tiktok_link.sql",
        "../supabase/migrations/20261108000300_tiktok_login.sql",
        "../supabase/tests/tiktok_auth.sql"
    ]) {
        await db.exec(await Deno.readTextFile(new URL(file, import.meta.url)));
    }
    console.log("PostgreSQL migrations, single-use proofs, callback tickets, expiry, rate limit and privileges — PASS");
} finally {
    await db.close();
}
