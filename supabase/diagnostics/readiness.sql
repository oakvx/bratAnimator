-- Read-only deployment readiness checks for BRATCODE Light and TikTok.
-- Execute in Supabase SQL Editor AFTER both versioned migrations.
-- This script does not retrieve, reveal or modify tokens, project content,
-- auth accounts, client secrets or source IPs.
SELECT 'bratcodes RLS' AS check_name,
       coalesce((SELECT relrowsecurity FROM pg_catalog.pg_class
                 WHERE oid=to_regclass('public.bratcodes')),false) AS ready
UNION ALL
SELECT 'bratcode limiter RLS',
       coalesce((SELECT relrowsecurity FROM pg_catalog.pg_class
                 WHERE oid=to_regclass('public.bratcode_rate_limits')),false)
UNION ALL
SELECT 'TikTok connections RLS',
       coalesce((SELECT relrowsecurity FROM pg_catalog.pg_class
                 WHERE oid=to_regclass('public.tiktok_connections')),false)
UNION ALL
SELECT 'TikTok OAuth states RLS',
       coalesce((SELECT relrowsecurity FROM pg_catalog.pg_class
                 WHERE oid=to_regclass('public.tiktok_link_states')),false)
UNION ALL
SELECT 'BRATCODE create RPC',
       to_regprocedure('public.bratcode_create(jsonb)') IS NOT NULL
UNION ALL
SELECT 'BRATCODE import RPC',
       to_regprocedure('public.bratcode_import(text)') IS NOT NULL
UNION ALL
SELECT 'BRATCODE cleanup RPC',
       to_regprocedure('public.bratcode_cleanup()') IS NOT NULL
UNION ALL
SELECT 'TikTok CSRF claim RPC',
       to_regprocedure('public.tiktok_claim_link_state(text)') IS NOT NULL
UNION ALL
SELECT 'TikTok cleanup RPC',
       to_regprocedure('public.tiktok_link_cleanup()') IS NOT NULL
ORDER BY check_name;

-- The following checks verify that anonymous users cannot read sensitive
-- tables directly. This is a metadata-only check and never selects rows.
SELECT table_name,
       pg_catalog.has_table_privilege('anon', to_regclass('public.' || table_name), 'SELECT') AS anon_can_read,
       pg_catalog.has_table_privilege('authenticated', to_regclass('public.' || table_name), 'SELECT') AS member_can_read
FROM (VALUES ('bratcodes'),('bratcode_rate_limits'),
             ('tiktok_connections'),('tiktok_link_states')) AS t(table_name)
ORDER BY table_name;
