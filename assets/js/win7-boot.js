/* Windows 7-inspired boot animation controller.
 * The visual intro is part of the UI shell only; no OS services are emulated.
 * It never delays loading the actual editor or touches saved projects.
 */
(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root?.document) {
        root.BratWin7Boot = api;
        root.BratBoot = api.init(root.document, root);
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";
    const DEFAULT_MS = 2100;
    const REDUCED_MS = 240;
    function createBoot(document, win = globalThis, config = {}) {
        const overlay = document.getElementById("studioBoot");
        if (!overlay) return null;
        const skipButton = document.getElementById("studioBootSkip");
        const progress = document.getElementById("studioBootProgress");
        const reduced = Boolean(win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
        const duration = Math.max(0, Number.isFinite(config.duration) ? config.duration :
            reduced ? REDUCED_MS : DEFAULT_MS);
        let ended = false;
        let skipped = false;
        let timer;
        let progressTimer;
        let resolveReady;
        const ready = new Promise(resolve => { resolveReady = resolve; });

        function finish(reason = "completed") {
            if (ended) return false;
            ended = true;
            skipped = reason === "skipped";
            win.clearTimeout?.(timer);
            win.clearInterval?.(progressTimer);
            if (progress) progress.value = 100;
            overlay.classList.add("is-finishing");
            overlay.hidden = true;
            overlay.setAttribute("aria-hidden", "true");
            document.body?.classList.remove("studio-booting");
            document.body?.classList.add("studio-boot-complete");
            skipButton?.removeEventListener("click", skip);
            document.removeEventListener("keydown", onKey);
            progress?.setAttribute("aria-valuenow", "100");
            win.dispatchEvent?.(new win.CustomEvent("brat:studio-boot-finished", {
                detail: { reason, skipped }
            }));
            resolveReady({ reason, skipped });
            return true;
        }
        function skip() { finish("skipped"); }
        function onKey(event) {
            if (event.key === "Escape" && !event.altKey && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                skip();
            }
        }
        overlay.hidden = false;
        overlay.setAttribute("aria-hidden", "false");
        document.body?.classList.add("studio-booting");
        document.addEventListener("keydown", onKey);
        skipButton?.addEventListener("click", skip);
        if (progress) {
            progress.value = 0;
            progress.setAttribute("aria-valuenow", "0");
        }
        const startedAt = Date.now();
        if (duration > 0 && progress) {
            progressTimer = win.setInterval?.(() => {
                const ratio = Math.min(1, (Date.now() - startedAt) / duration);
                // The final 10% is reserved for the transition to the editor.
                const value = Math.round(ratio * 90);
                progress.value = value;
                progress.setAttribute("aria-valuenow", String(value));
            }, 70);
        }
        timer = win.setTimeout?.(() => finish(), duration);
        return Object.freeze({
            ready, skip, finish,
            isVisible: () => !ended,
            wasSkipped: () => skipped,
            duration
        });
    }
    return Object.freeze({ DEFAULT_MS, REDUCED_MS, createBoot, init: createBoot });
});
