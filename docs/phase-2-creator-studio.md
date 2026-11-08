# Brat Animator — Phase 2: Creator Studio and authentication

This phase adds a visible Creator Studio without replacing the existing
lyric-video editor or merging the separate Kinetic Collage PR #5.

## Implemented UI

- Full desktop dashboard/sidebar, simplified mobile dashboard, a dedicated
  editor view and a "← Studio" return control.
- Working Home, Editor, Projects, Settings navigation. Sound Hub and BRATCODE
  currently display honest "coming later" states.
- Recent local project cards and a new-project action. Existing projects are
  archived locally before starting a new project, if capacity permits.
- Logically separated guest/account workspaces based on authenticated
  Supabase user IDs, not manually entered emails.
- Autosave in local IndexedDB; no automatic project cloud sync.
- Optional transfer of the guest project into an account without overwriting
  an existing account project.
- Logout choice: keep locally or delete the account's local project records,
  with additional confirmation for destructive deletion.
- Existing static PWA and current video editor stay functional.

## Current limitations

The Phase 2 dashboard uses project ID current as the active editable project
and archive-prefixed IDs for earlier saved projects. The 20-project global
limit is enforced at storage level. If archiving would exceed the limit, the
new-project operation stops with an explanatory error. The 21st temporary
project UI, full library management and backup reminders are scheduled for
Phase 3. Nothing is silently deleted to make room.

Audio/background/font references remain in the existing media IndexedDB.
Deleting an account library removes its project JSON but does not yet
garbage-collect orphaned media blobs: that requires shared-reference analysis
before deletion and is deferred to Phase 3.

## Connect Supabase Auth (required for real login)

The account UI is visible even before Supabase is configured, but it will not
pretend to authenticate users. Guests can use the editor immediately.

1. Create a project on the Supabase free tier.
2. Copy your project URL and public publishable (or legacy anon) key. NEVER
   use service_role keys, secret keys, refresh tokens, or OAuth secrets in
   the browser.
3. Edit assets/js/supabase-config.js with your public URL and key.
4. Enable the Email provider and the Google provider. Configure Google Cloud
   OAuth credentials/consent and the Supabase OAuth callback URI.
5. Set the Supabase Site URL and redirect allowlist to include
   https://oakvx.github.io/bratAnimator/ and any authorized dev origins.
6. For a true numeric email OTP, set the Supabase Magic Link / OTP email
   template to include the token variable (commonly double curly braces,
   dot Token) rather than just the link variable. Configure SMTP
   appropriately for public usage and verify sending quotas.
7. The app lazy-loads the supported Supabase browser SDK from its CDN only
   when authentication is configured. Without configuration, it makes no
   authentication network requests and remains usable in guest mode.

Production OAuth and email delivery require provider-side configuration.
Frontend buttons cannot activate them by themselves.

## Manual QA before merging

- [ ] Desktop dashboard/sidebar and complete existing editor.
- [ ] Mobile bottom navigation, full-workspace editor, return control.
- [ ] Guest autosave, reload, recent project card and new-project archive.
- [ ] Switching to an archived project preserves the previous active work.
- [ ] Sign in with Google, email/password and OTP after Supabase is configured.
- [ ] Sign up requiring email confirmation.
- [ ] Logout "keep" preserves the account's local project.
- [ ] Logout "delete" clears only that account, without affecting guests.
- [ ] Transfer guest project only into an empty account active slot.
- [ ] On reloading an authenticated session: resume last local project.
- [ ] Browser quota errors, media references, offline guest operation.

## Validation

Run node --test and the PR syntax checks in GitHub Actions.
Browser-based OAuth and visual/mobile QA require a configured Supabase project.
