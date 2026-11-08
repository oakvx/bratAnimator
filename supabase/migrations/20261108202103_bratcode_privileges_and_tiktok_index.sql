-- Supabase gives anon direct default EXECUTE grants, independently of PUBLIC.
-- Restrict account RPCs explicitly; anonymous import is an intentional API.
REVOKE ALL ON FUNCTION public.bratcode_create(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bratcode_active() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bratcode_revoke() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bratcode_safe_json(jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bratcode_create(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bratcode_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bratcode_revoke() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bratcode_safe_json(jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bratcode_import(text) TO anon, authenticated;

CREATE INDEX IF NOT EXISTS tiktok_login_states_user_idx
    ON public.tiktok_login_states(user_id);
