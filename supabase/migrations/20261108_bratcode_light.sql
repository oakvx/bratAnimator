-- Brat Animator / BRATCODE Light v1
-- Deploy in Supabase SQL editor. All project media remains local.
-- This script is idempotent for schema objects, but replace functions on upgrade.
CREATE TABLE IF NOT EXISTS public.bratcodes (
    code text PRIMARY KEY CHECK (code ~ '^[0-9A-F]{32}$'),
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS bratcodes_one_active_per_account
    ON public.bratcodes (owner_id)
    WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS bratcodes_expiry
    ON public.bratcodes (expires_at);

ALTER TABLE public.bratcodes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bratcodes FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.bratcode_rate_limits (
    principal_hash text PRIMARY KEY,
    window_start timestamptz NOT NULL DEFAULT now(),
    attempts integer NOT NULL DEFAULT 0
);
ALTER TABLE public.bratcode_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bratcode_rate_limits FROM PUBLIC, anon, authenticated;

-- Generate exactly one active code per authenticated user. Active codes are
-- server-side random 128-bit tokens; clients cannot choose or enumerate them.
CREATE OR REPLACE FUNCTION public.bratcode_create(p_snapshot jsonb)
RETURNS TABLE (code text, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_owner uuid := auth.uid();
    v_code text;
    v_expiry timestamptz;
BEGIN
    IF v_owner IS NULL THEN
        RAISE EXCEPTION 'Account required' USING ERRCODE = '28000';
    END IF;
    IF p_snapshot IS NULL OR jsonb_typeof(p_snapshot) <> 'object'
        OR octet_length(p_snapshot::text) > 180000
        OR coalesce(p_snapshot->>'type', '') <> 'bratcode-light'
        OR coalesce(p_snapshot->>'schemaVersion','') <> '1'
        OR p_snapshot ?| ARRAY['binary','assets','mediaBlobs','credentials','tokens','auth']
    THEN
        RAISE EXCEPTION 'Invalid or oversized BRATCODE Light snapshot';
    END IF;
    -- Owner-scoped advisory lock prevents concurrent requests bypassing the
    -- single-active-code constraint; unique index remains final safeguard.
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_owner::text, 771));
    UPDATE public.bratcodes b
    SET revoked_at = now()
    WHERE b.owner_id = v_owner AND b.revoked_at IS NULL AND b.expires_at <= now();

    IF EXISTS (
        SELECT 1 FROM public.bratcodes b
        WHERE b.owner_id = v_owner AND b.revoked_at IS NULL AND b.expires_at > now()
    ) THEN
        RAISE EXCEPTION 'Only one active BRATCODE is allowed';
    END IF;

    v_code := upper(replace(pg_catalog.gen_random_uuid()::text, '-', ''));
    v_expiry := now() + interval '24 hours';
    INSERT INTO public.bratcodes (code,owner_id,snapshot,expires_at)
    VALUES (v_code,v_owner,p_snapshot,v_expiry);
    RETURN QUERY SELECT v_code,v_expiry;
END;
$$;

CREATE OR REPLACE FUNCTION public.bratcode_active()
RETURNS TABLE (code text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT b.code, b.expires_at
    FROM public.bratcodes b
    WHERE b.owner_id = auth.uid()
      AND b.revoked_at IS NULL
      AND b.expires_at > now()
    ORDER BY b.created_at DESC LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.bratcode_revoke()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_removed integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Account required' USING ERRCODE = '28000';
    END IF;
    UPDATE public.bratcodes b SET revoked_at = now()
    WHERE b.owner_id = auth.uid() AND b.revoked_at IS NULL
      AND b.expires_at > now();
    GET DIAGNOSTICS v_removed = ROW_COUNT;
    RETURN v_removed > 0;
END;
$$;

-- Import is intentionally anonymous: any holder of a valid code can fetch
-- an independent JSON project copy during its 24-hour lifetime.
-- The 30/minute limiter is best-effort using gateway-supplied identity or
-- forwarded IP; deploy gateway-level limiting for stronger production safety.
CREATE OR REPLACE FUNCTION public.bratcode_import(p_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_code text;
    v_headers jsonb;
    v_identity text;
    v_principal text;
    v_attempts integer;
    v_snapshot jsonb;
BEGIN
    v_headers := coalesce(
        nullif(current_setting('request.headers', true), '')::jsonb,
        '{}'::jsonb
    );
    v_identity := coalesce(
        auth.uid()::text,
        nullif(split_part(v_headers->>'x-forwarded-for', ',', 1), ''),
        nullif(v_headers->>'cf-connecting-ip', ''),
        'anonymous'
    );
    v_principal := md5('bratcode:' || v_identity);
    INSERT INTO public.bratcode_rate_limits AS r (principal_hash,window_start,attempts)
    VALUES (v_principal, now(), 1)
    ON CONFLICT (principal_hash) DO UPDATE
    SET attempts = CASE
            WHEN r.window_start < now() - interval '1 minute' THEN 1
            ELSE r.attempts + 1
        END,
        window_start = CASE
            WHEN r.window_start < now() - interval '1 minute' THEN now()
            ELSE r.window_start
        END
    RETURNING attempts INTO v_attempts;
    IF v_attempts > 30 THEN
        RAISE EXCEPTION 'Too many BRATCODE imports; retry later';
    END IF;

    v_code := upper(regexp_replace(coalesce(p_code,''), '[^0-9A-Fa-f]', '', 'g'));
    IF length(v_code) <> 32 THEN RETURN NULL; END IF;

    SELECT b.snapshot INTO v_snapshot
    FROM public.bratcodes b
    WHERE b.code = v_code
      AND b.revoked_at IS NULL
      AND b.expires_at > now();
    RETURN v_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.bratcode_create(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bratcode_active() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bratcode_revoke() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bratcode_import(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bratcode_create(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bratcode_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bratcode_revoke() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bratcode_import(text) TO anon, authenticated;

-- Expiry is enforced in all RPCs. Physical cleanup is optional and can be
-- scheduled using Supabase pg_cron or performed by a trusted administrator:
-- DELETE FROM public.bratcodes WHERE expires_at < now() - interval '7 days';
-- DELETE FROM public.bratcode_rate_limits WHERE window_start < now() - interval '1 day';
