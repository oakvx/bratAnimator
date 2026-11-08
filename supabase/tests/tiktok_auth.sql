-- Run after migrations against a disposable/local Supabase database.
-- All fixtures are rolled back; no real provider credentials are required.
BEGIN;
DO $$
DECLARE
    v_user uuid := gen_random_uuid();
    v_other uuid := gen_random_uuid();
    v_state text := repeat('1', 64);
    v_challenge text := repeat('2', 64);
    v_ticket text := repeat('3', 64);
    v_link jsonb;
    i integer;
BEGIN
    INSERT INTO auth.users(id) VALUES (v_user), (v_other);
    ASSERT NOT has_table_privilege('anon', 'public.tiktok_login_states', 'SELECT');
    ASSERT NOT has_table_privilege('authenticated', 'public.tiktok_connections', 'SELECT');
    ASSERT NOT has_table_privilege('authenticated', 'public.tiktok_identities', 'INSERT');
    ASSERT NOT has_function_privilege('anon', 'public.tiktok_redeem_login(text,text,text)', 'EXECUTE');
    ASSERT NOT has_function_privilege('authenticated', 'public.tiktok_complete_link(text,text,text,uuid)', 'EXECUTE');
    ASSERT NOT has_function_privilege('anon', 'public.tiktok_find_created_user(text)', 'EXECUTE');
    ASSERT NOT has_function_privilege('anon', 'public.bratcode_create(jsonb)', 'EXECUTE');
    ASSERT NOT has_function_privilege('anon', 'public.bratcode_active()', 'EXECUTE');
    ASSERT NOT has_function_privilege('anon', 'public.bratcode_revoke()', 'EXECUTE');
    ASSERT NOT has_function_privilege('anon', 'public.bratcode_safe_json(jsonb,integer)', 'EXECUTE');
    ASSERT has_function_privilege('authenticated', 'public.bratcode_create(jsonb)', 'EXECUTE');
    ASSERT has_function_privilege('anon', 'public.bratcode_import(text)', 'EXECUTE');

    ASSERT public.tiktok_start_login(v_state, v_challenge, repeat('4', 64));
    ASSERT public.tiktok_redeem_login(v_state, v_challenge, v_ticket) IS NULL;
    ASSERT public.tiktok_claim_login_state(v_state);
    ASSERT NOT public.tiktok_claim_login_state(v_state);
    UPDATE public.tiktok_login_states SET user_id = v_user, ticket_hash = v_ticket WHERE state_hash = v_state;
    ASSERT public.tiktok_redeem_login(v_state, repeat('f', 64), v_ticket) IS NULL;
    ASSERT public.tiktok_redeem_login(v_state, v_challenge, repeat('f', 64)) IS NULL;
    ASSERT public.tiktok_redeem_login(v_state, v_challenge, v_ticket) = v_user;
    ASSERT public.tiktok_redeem_login(v_state, v_challenge, v_ticket) IS NULL;

    FOR i IN 2..5 LOOP
        ASSERT public.tiktok_start_login(lpad(i::text, 64, '0'), v_challenge, repeat('4', 64));
    END LOOP;
    ASSERT NOT public.tiktok_start_login(repeat('a', 64), v_challenge, repeat('4', 64));
    UPDATE public.tiktok_login_states SET expires_at = now() - interval '1 second';
    ASSERT NOT public.tiktok_claim_login_state(lpad('2', 64, '0'));

    v_link := jsonb_build_object('open_id', 'test-tiktok-account', 'display_name', 'Test Creator',
        'avatar_url', '', 'scopes', 'user.info.basic', 'access_token', 'test-only-access',
        'refresh_token', 'test-only-refresh', 'access_expires_at', now() + interval '2 hours',
        'refresh_expires_at', now() + interval '30 days');
    INSERT INTO public.tiktok_link_states(state_hash, user_id, challenge)
        VALUES (v_state, v_user, v_challenge);
    ASSERT public.tiktok_claim_link_state(v_state) = v_user;
    ASSERT public.tiktok_claim_link_state(v_state) IS NULL;
    UPDATE public.tiktok_link_states SET ticket_hash = v_ticket, connection = v_link WHERE state_hash = v_state;
    ASSERT NOT public.tiktok_complete_link(v_state, v_challenge, v_ticket, v_other);
    ASSERT NOT public.tiktok_complete_link(v_state, v_challenge, repeat('f', 64), v_user);
    ASSERT public.tiktok_complete_link(v_state, v_challenge, v_ticket, v_user);
    ASSERT NOT public.tiktok_complete_link(v_state, v_challenge, v_ticket, v_user);
    ASSERT (SELECT display_name = 'Test Creator' FROM public.tiktok_connections WHERE user_id = v_user);

    UPDATE auth.users SET raw_app_meta_data = jsonb_build_object('tiktok_open_id', 'recoverable-id') WHERE id = v_user;
    ASSERT public.tiktok_find_created_user('recoverable-id') = v_user;
    ASSERT public.tiktok_find_created_user('unassigned-id') IS NULL;
END;
$$;
ROLLBACK;
