-- Phase 5 / TikTok Login Kit account link
-- Apply with Supabase SQL editor or migrations (not client-side JS).
-- Only the service_role can read OAuth state, refresh/access tokens or links.
CREATE TABLE IF NOT EXISTS public.tiktok_link_states (
    state_hash text PRIMARY KEY CHECK (state_hash ~ '^[0-9a-f]{64}$'),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '8 minutes')
);
CREATE INDEX IF NOT EXISTS tiktok_link_states_user_created_idx
    ON public.tiktok_link_states (user_id, created_at DESC);
ALTER TABLE public.tiktok_link_states ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tiktok_link_states FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.tiktok_link_states TO service_role;

CREATE TABLE IF NOT EXISTS public.tiktok_connections (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    open_id text NOT NULL,
    display_name text NOT NULL DEFAULT '',
    avatar_url text NOT NULL DEFAULT '',
    scopes text NOT NULL DEFAULT 'user.info.basic',
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    access_expires_at timestamptz NOT NULL,
    refresh_expires_at timestamptz NOT NULL,
    connected_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tiktok_connections_open_id_unique
    ON public.tiktok_connections(open_id);
ALTER TABLE public.tiktok_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tiktok_connections FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tiktok_connections TO service_role;

-- Atomically consume an unexpired CSRF state. No replay or double callback.
-- SECURITY DEFINER calls use qualified names, with no public EXECUTE grant.
CREATE OR REPLACE FUNCTION public.tiktok_claim_link_state(p_state_hash text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    DELETE FROM public.tiktok_link_states
    WHERE state_hash = p_state_hash AND expires_at > now()
    RETURNING user_id INTO v_user_id;
    RETURN v_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.tiktok_claim_link_state(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tiktok_claim_link_state(text) TO service_role;

-- Optional housekeeping; scheduling needs an explicitly authorized job.
CREATE OR REPLACE FUNCTION public.tiktok_link_cleanup()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_deleted integer;
BEGIN
    DELETE FROM public.tiktok_link_states WHERE expires_at < now();
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;
REVOKE ALL ON FUNCTION public.tiktok_link_cleanup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tiktok_link_cleanup() TO service_role;
