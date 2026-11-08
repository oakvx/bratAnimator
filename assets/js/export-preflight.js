/* Phase 7: non-blocking export preflight. It never uploads or changes project data.
 * Uses the same BratCore.parseLRC parser as the renderer; exportVideo remains
 * the final authority for codec, CORS, selected range and recording state.
 */
(function (root, factory) {
    "use strict";
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root && root.document) {
        root.BratExportPreflight = api;
        root.BratExportPreflightInstance = api.init(root.document, root);
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    "use strict";

    function assess(settings = {}, parse = () => []) {
        const lyrics = String(settings.lyrics || "");
        let lines = [];
        try {
            if (lyrics.trim()) lines = parse(lyrics, Boolean(settings.startFromZero)) || [];
        } catch (_) { lines = []; }
        const count = Array.isArray(lines) ? lines.length : 0;
        const checks = [];
        if (!lyrics.trim()) {
            checks.push({ status: "error", text: "No lyrics yet. Add timed LRC lyrics before exporting.", action: "timing" });
        } else if (!count) {
            checks.push({ status: "error", text: "No valid timed lyric lines. Check [MM:SS.xx] timestamps in Timing.", action: "timing" });
        } else {
            checks.push({ status: "ok", text: count + " timed lyric " + (count === 1 ? "line" : "lines") + " recognized." });
        }
        const hasRecorder = Boolean(settings.hasRecorder);
        const canFast = Boolean(settings.canFast);
        if (!hasRecorder && !canFast) {
            checks.push({ status: "error", text: "This browser has no supported video encoding pipeline." });
        } else {
            checks.push({ status: "ok", text: hasRecorder ? "Browser recording is available." : "Fast video encoding is available (codec support is checked when exporting)." });
        }
        if (settings.audioSelected && settings.audioLoaded && !hasRecorder) {
            checks.push({ status: "error", text: "Audio export requires browser MediaRecorder support." });
        } else if (settings.audioSelected && !settings.audioLoaded) {
            checks.push({ status: "warning", text: "No audio is loaded. Export will be silent unless you import an audio/video file.", action: "timing" });
        } else if (settings.audioSelected && settings.audioLoaded) {
            checks.push({ status: "ok", text: "Local audio is ready; merging audio may require real-time export." });
        } else {
            checks.push({ status: "ok", text: "Video-only export selected." });
        }
        const size = Number(settings.size);
        const fps = Number(settings.fps);
        if ((Number.isFinite(size) && size >= 1440) || (Number.isFinite(fps) && fps >= 60)) {
            checks.push({ status: "warning", text: "High resolution or 60 fps may use substantial memory. Consider base 1080 and 30 fps on slower devices." });
        } else {
            checks.push({ status: "ok", text: "Standard resolution and frame-rate settings." });
        }
        const errors = checks.filter(check => check.status === "error").length;
        const warnings = checks.filter(check => check.status === "warning").length;
        return Object.freeze({ state: errors ? "blocked" : warnings ? "warning" : "ready", errors, warnings, count, checks });
    }

    function createPreflight(document, win = root) {
        const $ = id => document.getElementById(id);
        const panel = $("exportPreflight");
        const list = $("exportPreflightList");
        const summary = $("exportPreflightSummary");
        const refreshButton = $("exportPreflightRefresh");
        const fixButton = $("exportPreflightFix");
        if (!panel || !list || !summary || !refreshButton || !fixButton) return null;

        function readSettings() {
            return {
                lyrics: $("lyricsInput")?.value || "",
                startFromZero: $("startFromZeroCheckbox")?.checked,
                hasRecorder: typeof win.MediaRecorder !== "undefined",
                canFast: Boolean(win.BratExport?.canAttemptFastExport?.(win)),
                audioSelected: Boolean($("includeAudioInExportCheckbox")?.checked),
                audioLoaded: Boolean($("includeAudioInExportCheckbox") && !$("includeAudioInExportCheckbox").disabled),
                size: $("exportSizeSelect")?.value || "1080",
                fps: $("exportFpsSelect")?.value || "30"
            };
        }

        function refresh() {
            const result = assess(readSettings(), (lyrics, startFromZero) =>
                win.BratCore?.parseLRC?.(lyrics, startFromZero) || []);
            panel.dataset.state = result.state;
            summary.textContent = result.errors
                ? result.errors + " blocking " + (result.errors === 1 ? "issue" : "issues") + " found. Check before exporting."
                : result.warnings
                    ? "No blocking issues found. " + result.warnings + " " + (result.warnings === 1 ? "warning" : "warnings") + " to review."
                    : "Basic checks passed. Final codec and media checks run during export.";
            const fragment = document.createDocumentFragment();
            for (const check of result.checks) {
                const item = document.createElement("li");
                item.className = "export-preflight-" + check.status;
                item.textContent = check.text;
                fragment.appendChild(item);
            }
            list.replaceChildren(fragment);
            fixButton.hidden = !result.checks.some(check => check.status === "error" && check.action === "timing");
            return result;
        }

        let scheduled = null;
        function schedule() {
            if (scheduled != null) win.clearTimeout(scheduled);
            scheduled = win.setTimeout(() => { scheduled = null; refresh(); }, 120);
        }
        refreshButton.addEventListener("click", refresh);
        fixButton.addEventListener("click", () => {
            document.querySelector('[data-open-tab="timing"]')?.click();
            $("lyricsInput")?.focus();
        });
        for (const id of ["lyricsInput", "startFromZeroCheckbox", "includeAudioInExportCheckbox", "exportSizeSelect", "exportFpsSelect"]) {
            const control = $(id);
            control?.addEventListener("input", schedule);
            control?.addEventListener("change", schedule);
        }
        // Audio decoding completes asynchronously, after file input change.
        // Watch only the existing audio-status message, not project/media data.
        const audioNote = $("exportAudioNote");
        if (audioNote && typeof win.MutationObserver === "function") {
            const observer = new win.MutationObserver(schedule);
            observer.observe(audioNote, { subtree: true, childList: true, characterData: true });
        }
        refresh();
        return Object.freeze({ refresh, readSettings });
    }
    return Object.freeze({ assess, createPreflight, init: (document = root.document, win = root) =>
        document ? createPreflight(document, win) : null });
});
