-- Login state and identity mapping are accessible only to the Edge Function.
CREATE TABLE public.tiktok_identities (
    open_id text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tiktok_identities_user_idx ON public.tiktok_identities(user_id);
ALTER TABLE public.tiktok_identities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tiktok_identities FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.tiktok_identities TO service_role;

-- Recover an account if Auth creation succeeded but the mapping write failed.
-- Only server-managed app metadata is trusted, never the synthetic email alone.
CREATE FUNCTION public.tiktok_find_created_user(p_open_id text)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
    SELECT id FROM auth.users
    WHERE raw_app_meta_data->>'tiktok_open_id' = p_open_id
    LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.tiktok_find_created_user(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tiktok_find_created_user(text) TO service_role;

CREATE TABLE public.tiktok_login_states (
    state_hash text PRIMARY KEY CHECK (state_hash ~ '^[0-9a-f]{64}$'),
    challenge text NOT NULL CHECK (challenge ~ '^[0-9a-f]{64}$'),
    requester_hash text NOT NULL CHECK (requester_hash ~ '^[0-9a-f]{64}$'),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    callback_claimed boolean NOT NULL DEFAULT false,
    ticket_hash text CHECK (ticket_hash ~ '^[0-9a-f]{64}$'),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '8 minutes')
);
CREATE INDEX tiktok_login_requester_idx ON public.tiktok_login_states(requester_hash, created_at DESC);
ALTER TABLE public.tiktok_login_states ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tiktok_login_states FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tiktok_login_states TO service_role;

-- Serialize starts per requester so parallel requests cannot bypass the limit.
CREATE FUNCTION public.tiktok_start_login(p_state_hash text, p_challenge text, p_requester_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_requester_hash, 0));
    DELETE FROM public.tiktok_login_states WHERE created_at < now() - interval '20 minutes';
    IF (SELECT count(*) FROM public.tiktok_login_states
        WHERE requester_hash = p_requester_hash AND created_at > now() - interval '10 minutes') >= 5 THEN
        RETURN false;
    END IF;
    INSERT INTO public.tiktok_login_states(state_hash, challenge, requester_hash)
        VALUES (p_state_hash, p_challenge, p_requester_hash);
    RETURN true;
END;
$$;

-- The callback and the browser redemption are separate, single-use transitions.
CREATE FUNCTION public.tiktok_claim_login_state(p_state_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    UPDATE public.tiktok_login_states SET callback_claimed = true
    WHERE state_hash = p_state_hash AND NOT callback_claimed AND expires_at > now();
    RETURN FOUND;
END;
$$;

CREATE FUNCTION public.tiktok_redeem_login(p_state_hash text, p_challenge text, p_ticket_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id uuid;
BEGIN
    -- Retain the consumed row until housekeeping so it still counts for throttling.
    UPDATE public.tiktok_login_states SET expires_at = now()
    WHERE state_hash = p_state_hash AND challenge = p_challenge
        AND ticket_hash = p_ticket_hash
        AND callback_claimed AND user_id IS NOT NULL AND expires_at > now()
    RETURNING user_id INTO v_user_id;
    RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.tiktok_start_login(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tiktok_claim_login_state(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tiktok_redeem_login(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tiktok_start_login(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.tiktok_claim_login_state(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.tiktok_redeem_login(text, text, text) TO service_role;

-- Account linking also requires the initiating browser AND a callback ticket.
-- Defer saving credentials until the browser has confirmed the return.
ALTER TABLE public.tiktok_link_states
    ADD COLUMN challenge text CHECK (challenge ~ '^[0-9a-f]{64}$'),
    ADD COLUMN ticket_hash text CHECK (ticket_hash ~ '^[0-9a-f]{64}$'),
    ADD COLUMN callback_claimed boolean NOT NULL DEFAULT false,
    ADD COLUMN connection jsonb;

CREATE OR REPLACE FUNCTION public.tiktok_claim_link_state(p_state_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id uuid;
BEGIN
    UPDATE public.tiktok_link_states SET callback_claimed = true
    WHERE state_hash = p_state_hash AND NOT callback_claimed
        AND challenge IS NOT NULL AND expires_at > now()
    RETURNING user_id INTO v_user_id;
    RETURN v_user_id;
END;
$$;

CREATE FUNCTION public.tiktok_complete_link(p_state_hash text, p_challenge text, p_ticket_hash text, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_link jsonb;
BEGIN
    DELETE FROM public.tiktok_link_states
    WHERE state_hash = p_state_hash AND challenge = p_challenge
        AND ticket_hash = p_ticket_hash AND user_id = p_user_id
        AND callback_claimed AND connection IS NOT NULL AND expires_at > now()
    RETURNING connection INTO v_link;
    IF v_link IS NULL THEN RETURN false; END IF;
    IF EXISTS (SELECT 1 FROM public.tiktok_identities
        WHERE open_id = v_link->>'open_id' AND user_id <> p_user_id) THEN
        RAISE EXCEPTION 'TikTok identity already assigned';
    END IF;
    INSERT INTO public.tiktok_connections(user_id, open_id, display_name, avatar_url, scopes,
        access_token, refresh_token, access_expires_at, refresh_expires_at, updated_at)
    VALUES (p_user_id, v_link->>'open_id', v_link->>'display_name', v_link->>'avatar_url', v_link->>'scopes',
        v_link->>'access_token', v_link->>'refresh_token', (v_link->>'access_expires_at')::timestamptz,
        (v_link->>'refresh_expires_at')::timestamptz, now())
    ON CONFLICT (user_id) DO UPDATE SET
        open_id = EXCLUDED.open_id, display_name = EXCLUDED.display_name, avatar_url = EXCLUDED.avatar_url,
        scopes = EXCLUDED.scopes, access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token,
        access_expires_at = EXCLUDED.access_expires_at, refresh_expires_at = EXCLUDED.refresh_expires_at,
        updated_at = EXCLUDED.updated_at;
    RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.tiktok_complete_link(text, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tiktok_complete_link(text, text, text, uuid) TO service_role;
