# Phase 3 — Project library, temporary workspace, backups, BRATCODE Light

Status: feature branch; deployment requires review, browser QA and (for remote BRATCODE) Supabase configuration.

## Local project library

- Projects are versioned JSON records stored in IndexedDB, with multimedia
  references preserved in the existing media object store.
- The 20 saved-project limit is shared across all users/guest profiles within
  the same browser origin. One additional temporary project is permitted.
- The active project is either current (permanent) or temporary (recoverable).
  Project selection is a lightweight per-owner localStorage preference.
- When creating a new project from a full library, the previous current
  project is preserved and the next edit uses the temporary slot.
- Project switching, renaming, and promotion use IndexedDB transactions.
  Deletion requires an explicit confirmation in the Studio.
- A temporary project can be promoted only after a permanent slot becomes
  available. Promotion swaps it into the current slot without overwriting
  the previous current project.
- Browser storage quota and eviction remain uncontrolled. Never advertise
  IndexedDB as a guaranteed long-term backup.

## Backup lifecycle

- The existing complete portable package exporter produces .brat.zip containing
  the manifest and available media / fonts. It is the canonical offline backup.
- BRATCODE is explicitly NOT a complete media backup.
- Reminder metadata (edit counts / first edit / last backup / dismissal) is
  stored locally, without project text or cloud telemetry.
- A reminder is shown after 10 committed edits over 5 minutes, or 3 edits over
  20 minutes; dismissing hides it for 12 hours. Exporting the package resets
  the reminder.
- The temporary project displays a stronger warning about exporting backups
  and freeing a permanent slot.

## BRATCODE Light

1. Add the public URL and publishable key in assets/js/supabase-config.js.
2. Configure the Supabase authentication providers if users should create codes.
3. In the Supabase SQL editor execute:
   supabase/migrations/20261108201634_bratcode_light.sql
4. Confirm the four RPCs are exposed through the public schema:
   bratcode_create, bratcode_active, bratcode_revoke, bratcode_import.
5. Test generation as an authenticated account, anonymous import on another
   browser, code revocation, and expiry.
6. For production, add platform/gateway rate limiting, abuse monitoring and a
   maintenance job for expired rows; the SQL limiter is best effort.

Client-side safety:

- The code stores JSON only; uploaded audio, images, video, and font files are
  not included, and remote media URLs/asset IDs are removed.
- Code is a server-generated 128-bit opaque token, not a compressed payload.
- At most one active code per authenticated owner; 24-hour TTL enforced
  server-side; each code may be imported multiple times.
- Imports are independent, editable local copies, usable by guests.
- Backend calls are disabled if Supabase URL/key or RPC schema is missing.
- No project or media library is silently synchronized with Supabase.

Database security:

- Table RLS is enabled and direct anon/authenticated table privileges are
  revoked. Only narrow SECURITY DEFINER RPCs are granted.
- The client never uses a Supabase secret/service_role key.
- Rate limiting is best-effort based on PostgREST request headers. Do not
  rely on it as the only internet-facing abuse mitigation.
- Expiry is enforced immediately on every request (24-hour TTL). Physical
  cleanup can run daily using the privileged `public.bratcode_cleanup()` SQL
  function, callable from a trusted pg_cron job or SQL editor. It removes
  expired codes after a 7-day grace period and stale rate-limit counters.
  Never call it with browser credentials or publish service-role keys.

## Frutiger Aero dashboard

The Studio shell uses a dedicated CSS file and keeps the original editor
layout/timeline/canvas unmodified. Styling uses reflective translucent panels,
layered gradients, shadows, tactile hover/press transitions, and a bright
sky/aqua palette.

Short dashboard button sounds are synthesized with the Web Audio API locally.
The sound engine initializes only from direct user interaction; it is disabled
while the video editor is visible and cannot be mixed into video exports. A
persistent mute toggle appears in the Studio header and Settings.

No remote audio samples, CDN sound packs, or tracking scripts are involved.

## Important implementation boundaries

- Sound Hub and TikTok integrations are separate future phases.
- Google OAuth and email OTP cannot operate before real provider
  configuration; guest editing remains available.
- Project media orphan cleanup is deliberately deferred: deleting an asset
  shared by multiple projects without reference analysis can lose data.
- Previous PR #5 (Kinetic Collage auto-fit fix) is not merged or required here.
- Visual browser smoke tests do not substitute mobile Safari manual testing.

## Validation

- Run node --test and GitHub Actions.
- Run the Chrome smoke test with CHROME_PATH set.
- Validate 20 saved projects + temporary overflow; reload temporary;
  free a permanent slot and promote.
- Validate import .brat.zip doesn't discard the existing active project.
- Validate a long-edit reminder, dismissal and exported backup reset.
- Validate desktop/mobile Aero dashboard, sound toggle, mute persistence,
  and silence while the editor is open.
- Validate BRATCODE after configuring Supabase RPC; no server-side test
  claims success without a real database and providers.
