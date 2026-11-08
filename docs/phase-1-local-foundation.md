# Phase 1 — Local-first workspace foundation

Status: implemented on a feature branch; review and browser QA required before merge.

## Scope

The existing static editor is retained, including LRC/TTML handling, canvas preview,
media loading, export, v5 packages and the existing service worker. No backend,
Supabase, account UI, dashboard or TikTok integration is added in this phase.

- A versioned IndexedDB database (bratAnimator.workspace.v1) stores editable
  project JSON with owner IDs and project IDs. Projects and media remain local.
- A debounced 700 ms autosave writes the active guest project as guest/current.
  Changes are serialized so late writes cannot overwrite newer ones.
- The 20 saved projects + 1 temporary project global browser-profile limits
  are enforced by the storage API. The library UI and temporary-project workflow
  will be introduced in Phase 3.
- The pre-existing media blob database (bratAnimator.media.v1) is retained to
  preserve project references. No audio/video bytes are uploaded to any server.
- At startup, a saved IndexedDB project is restored. Legacy localStorage v2–v5
  projects are imported automatically if needed. Legacy copies are removed only
  after a confirmed IndexedDB write.
- If an IndexedDB read/write fails, the app retains or writes a localStorage
  recovery copy when possible and reports fallback/error explicitly.
- The existing clear autosave control discards queued writes, removes the
  active IndexedDB record, and clears the old localStorage keys.
- Autosave is also flushed on tab hiding and pagehide as a best effort. Browser
  shutdown is not guaranteed to finish async writes; for durable portability,
  export a complete .brat.zip backup.

## Data ownership / future migration

Owner IDs default to guest until Phase 2 introduces session management.
Future logged-in owners can use a stable user ID with the same storage API.
The project limit is global to the browser profile, not per account. Logical
owner separation is not encryption or a security boundary.

### Store record

The IndexedDB object store named projects uses key as its primary key, with
key = JSON.stringify([ownerId, projectId]). Each record has ownerId,
projectId, kind (saved or temporary), title, updatedAt, and payload.

The editor currently uses only projectId current. The storage layer already
supports saveProject, getProject, listProjects, deleteProject, and
estimateStorage, ready for Phase 3's library management.

The existing snapshot/preset mechanisms remain in localStorage for backwards
compatibility, to be migrated or explicitly retired during the library phase.
Existing audio/background/fonts retain their own blob database identifiers.

### Important storage limitations

- IndexedDB is device + browser profile + origin specific. Logging into
  Brat Animator on another device will not restore local projects.
- The browser can evict local data; storage quotas differ by browser and
  device. A complete portable backup is still essential.
- Projects currently have a 5 MiB JSON safety limit; this does not include
  multimedia blobs kept separately.
- The localStorage fallback is intended only for recovery after IndexedDB
  failure and may itself fail due to browser quotas. This error is surfaced.
- Concurrent editing in multiple tabs is not yet conflict-resolved. Avoid
  using two editing tabs for the same workspace until multi-tab coordination
  lands in a later phase.

## Manual QA

1. Open a fresh browser profile. Edit lyrics and style. Wait until the badge
   reads saved locally; reload and verify the changes remain.
2. Open the same page offline after PWA caching; the current editor should
   still load and save, subject to browser support.
3. With a preexisting v5 localStorage project and no workspace database,
   reload and verify content, timing, styles and media references migrate.
4. Reload a project whose audio/background is in the existing media IndexedDB.
   Confirm playback/preview works and the refs are not lost.
5. Edit a project, immediately navigate to another tab, return and reload.
   Verify the latest committed edit is restored.
6. Use clear autosave and reload. The previous active project must not
   return. Imported/saved media blobs are not purged by this action.
7. Disable IndexedDB or simulate quota errors. Verify the fallback/error
   badge is visible and export remains available.
8. On mobile, background and restore the page; confirm the editor remains
   responsive and recovers from persisted state.

## Automated checks

Run: node --test tests/local-workspace.test.js and node --test.
Tests cover validation, owner separation, quotas, debouncing, failed writes
and deletion ordering with an in-memory IndexedDB-compatible test double.

## Out of scope

No real account registration, Google/TikTok OAuth, cloud sync, BRATCODE,
Sound Hub, full project dashboard or account logout UI. These remain phases
2–7 of the product plan. Do not advertise them as already working.
