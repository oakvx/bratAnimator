/* Optional SQL integration check: Deno + an isolated, in-memory PostgreSQL.
   Run: deno run --allow-read --allow-env --allow-sys tests/tiktok-database.mjs */
import { PGlite } from "npm:@electric-sql/pglite@0.5.15";

const db = new PGlite();
try {
    await db.exec(`
        CREATE SCHEMA auth;
        CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_app_meta_data jsonb);
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
        CREATE ROLE anon;
        CREATE ROLE authenticated;
        CREATE ROLE service_role BYPASSRLS;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
    `);
    const migrationsUrl = new URL("../supabase/migrations/", import.meta.url);
    const migrations = [];
    for await (const entry of Deno.readDir(migrationsUrl)) {
        if (entry.isFile && /^\d+_.+\.sql$/.test(entry.name)) migrations.push(entry.name);
    }
    for (const name of migrations.sort()) await db.exec(await Deno.readTextFile(new URL(name, migrationsUrl)));
    await db.exec(await Deno.readTextFile(new URL("../supabase/tests/tiktok_auth.sql", import.meta.url)));
    const diagnostics = await db.exec(await Deno.readTextFile(new URL("../supabase/diagnostics/readiness.sql", import.meta.url)));
    if (diagnostics[0].rows.some(row => row.ready !== true) ||
        diagnostics[1].rows.some(row => row.anon_can_read !== false || row.member_can_read !== false)) {
        throw new Error("Deployment readiness or private table permissions failed");
    }
    console.log("PostgreSQL migrations, single-use proofs, callback tickets, expiry, rate limit and privileges — PASS");
} finally {
    await db.close();
}
