/* Brat Animator — privacy-preserving local backup reminder metadata.
 * Tracks edit activity per browser/project without collecting project contents.
 */
(function (root) {
    "use strict";
    const PREFIX = "bratAnimator.backup.v1.";
    const MS = 1000;
    function key(ownerId, projectId) { return PREFIX + encodeURIComponent(ownerId || "guest") + "." + encodeURIComponent(projectId || "current"); }
    function read(ownerId, projectId) {
        try {
            const data = JSON.parse(root.localStorage.getItem(key(ownerId, projectId)) || "{}");
            if (data && typeof data === "object") return data;
        } catch (_) {}
        return {};
    }
    function write(ownerId, projectId, data) {
        try { root.localStorage.setItem(key(ownerId, projectId), JSON.stringify(data)); }
        catch (_) {}
    }
    function recordEdit(ownerId, projectId) {
        const data = read(ownerId, projectId);
        const now = Date.now();
        const value = {
            ...data, firstEdit: data.firstEdit || now,
            lastEdit: now, changes: Math.min(10000, (Number(data.changes) || 0) + 1)
        };
        write(ownerId, projectId, value);
        return value;
    }
    function markBackup(ownerId, projectId) {
        const data = read(ownerId, projectId);
        write(ownerId, projectId, {
            ...data, lastBackup: Date.now(), firstEdit: 0, changes: 0,
            dismissedUntil: 0
        });
    }
    function dismiss(ownerId, projectId) {
        const data = read(ownerId, projectId);
        write(ownerId, projectId, { ...data, dismissedUntil: Date.now() + 12 * 60 * 60 * MS });
    }
    function shouldRemind(ownerId, projectId) {
        const data = read(ownerId, projectId);
        const now = Date.now();
        if (!data.firstEdit || now < Number(data.dismissedUntil || 0)) return false;
        if (data.lastBackup && data.lastEdit <= data.lastBackup) return false;
        const age = now - data.firstEdit;
        const edits = Number(data.changes) || 0;
        return (edits >= 10 && age >= 5 * 60 * MS) ||
            (edits >= 3 && age >= 20 * 60 * MS);
    }
    if (root.addEventListener) {
        root.addEventListener("brat:local-save", event => {
            const { ownerId, projectId } = event.detail || {};
            recordEdit(ownerId, projectId);
            root.dispatchEvent(new Event("brat:backup-reminder-state"));
        });
        root.addEventListener("brat:backup-exported", () => {
            const workspace = root.BratEditorWorkspace;
            if (!workspace) return;
            markBackup(workspace.owner(), workspace.projectId?.() || "current");
            root.dispatchEvent(new Event("brat:backup-reminder-state"));
        });
    }
    root.BratBackupReminders = Object.freeze({ read, recordEdit, markBackup, dismiss, shouldRemind });
})(typeof window !== "undefined" ? window : globalThis);
