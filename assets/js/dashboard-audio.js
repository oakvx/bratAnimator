/* Brat Animator — optional Windows 7 UI sound pack.
 * No Microsoft audio is shipped. See assets/sounds/windows7/README.md.
 * The editor/video export audio pipeline is deliberately not affected.
 */
(function (root) {
    "use strict";
    const KEY = "bratAnimator.dashboardSound.v1";
    const pack = root.BratWindows7SoundPack;
    const activeSamples = new Set();
    const missing = new Map();
    let enabled = true;
    let lastSound = 0;
    try { enabled = root.localStorage.getItem(KEY) !== "off"; } catch (_) {}

    function syncButtons() {
        root.document?.querySelectorAll("[data-dashboard-sound-toggle]").forEach(button => {
            button.setAttribute("aria-pressed", String(enabled));
            button.setAttribute("aria-label", enabled ? "Disattiva suoni della dashboard" : "Attiva suoni della dashboard");
            button.title = enabled ? "Suoni interfaccia attivi" : "Suoni interfaccia disattivati";
            button.textContent = enabled ? "Suoni attivi" : "Suoni disattivati";
        });
    }
    function setEnabled(next) {
        enabled = Boolean(next);
        try { root.localStorage.setItem(KEY, enabled ? "on" : "off"); } catch (_) {}
        if (!enabled) {
            for (const audio of activeSamples) audio.pause();
            activeSamples.clear();
        }
        syncButtons();
    }

    function sampleUrl(kind) {
        return root.BratWin7Assets?.getUrl("sound:" + kind) || (pack?.installed ? pack.resolve(kind) : null);
    }
    function play(kind = "click") {
        if (!enabled || typeof root.Audio !== "function") return;
        const url = sampleUrl(kind);
        const now = Date.now();
        if (!url || missing.get(kind) === url || now - lastSound < 35) return;
        lastSound = now;
        try {
            const audio = new root.Audio(new URL(url, root.document.baseURI).href);
            audio.volume = .42;
            audio.preload = "auto";
            activeSamples.add(audio);
            const cleanup = () => activeSamples.delete(audio);
            audio.addEventListener("ended", cleanup, { once: true });
            audio.addEventListener("error", () => {
                missing.set(kind, url);
                cleanup();
            }, { once: true });
            // A blocked autoplay attempt may succeed after the next gesture.
            audio.play()?.catch(cleanup);
        } catch (_) { /* Optional sound must not interrupt the UI. */ }
    }
    function isDashboardInteraction(target) {
        return Boolean(target?.closest?.(".studio-dashboard, .studio-modal, .studio-taskbar, .studio-start-menu, .studio-desktop, #studioEditorChrome"));
    }
    function soundForButton(button) {
        if (["studioWindowClose", "studioEditorClose"].includes(button.id)) return "close";
        if (["studioWindowMinimize", "studioEditorMinimize"].includes(button.id)) return "minimize";
        if (["studioWindowMaximize", "studioEditorMaximize"].includes(button.id)) return "maximize";
        if (button.id === "studioTaskbarApp" || button.id === "studioDesktopLauncher") return "restore";
        if (button.id === "studioStartButton") return "menu";
        if (button.dataset.startAction === "close") return "logoff";
        if (button.matches("[data-start-view], [data-studio-view], [data-studio-quick-view], .studio-project-card")) return "navigation";
        if (button.matches(".studio-accent-button, [id*='Confirm'], [id*='Submit']")) return "confirm";
        if (button.matches("[id*='Delete'], [id*='Clear']")) return "warning";
        return "click";
    }
    function handleClick(event) {
        if (!isDashboardInteraction(event.target)) return;
        const button = event.target.closest("button");
        if (!button || button.disabled) return;
        if (button.matches("[data-dashboard-sound-toggle]")) {
            const wasEnabled = enabled;
            setEnabled(!enabled);
            if (!wasEnabled) play("confirm");
            return;
        }
        play(soundForButton(button));
    }

    if (root.document) {
        root.document.addEventListener("click", handleClick, { capture: true });
        if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", syncButtons, { once: true });
        else syncButtons();
    }
    // Startup playback
    // may be blocked before the first gesture by browser autoplay policy.
    root.addEventListener?.("brat:studio-boot-finished", () => play("startup"));
    root.addEventListener?.("brat:studio-logon", () => play("logon"));
    root.addEventListener?.("brat:ui-notify", () => play("notify"));
    root.addEventListener?.("brat:ui-error", () => play("error"));
    root.addEventListener?.("brat:ui-recycle", () => play("recycle"));

    root.BratDashboardAudio = Object.freeze({
        isEnabled: () => enabled,
        setEnabled,
        play,
        soundForButton,
        packStatus: () => Object.freeze({
            installed: Object.keys(pack?.files || {}).some(kind => Boolean(sampleUrl(kind))),
            availableEvents: pack ? Object.keys(pack.files) : [],
            unavailableEvents: [...missing].filter(([kind, url]) => sampleUrl(kind) === url).map(([kind]) => kind)
        })
    });
})(typeof window !== "undefined" ? window : globalThis);
