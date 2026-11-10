/* Brat Animator — optional Windows 7 UI sound pack with local fallback.
 * No Microsoft audio is shipped. See assets/sounds/windows7/README.md.
 * The editor/video export audio pipeline is deliberately not affected.
 */
(function (root) {
    "use strict";
    const KEY = "bratAnimator.dashboardSound.v1";
    const AudioContextClass = root.AudioContext || root.webkitAudioContext;
    const pack = root.BratWindows7SoundPack;
    const activeSamples = new Set();
    const missing = new Set();
    let enabled = true;
    let context = null;
    let lastSound = 0;
    try { enabled = root.localStorage.getItem(KEY) !== "off"; } catch (_) {}

    function syncButtons() {
        root.document?.querySelectorAll("[data-dashboard-sound-toggle]").forEach(button => {
            button.setAttribute("aria-pressed", String(enabled));
            button.setAttribute("aria-label", enabled ? "Disattiva suoni della dashboard" : "Attiva suoni della dashboard");
            button.title = enabled ? "Suoni interfaccia attivi" : "Suoni interfaccia disattivati";
            button.textContent = enabled ? "♪ Suoni on" : "♪ Suoni off";
        });
    }
    function setEnabled(next) {
        enabled = Boolean(next);
        try { root.localStorage.setItem(KEY, enabled ? "on" : "off"); } catch (_) {}
        syncButtons();
    }

    function fallbackTone(kind) {
        if (!AudioContextClass) return;
        try {
            context ||= new AudioContextClass({ latencyHint: "interactive" });
            if (context.state === "suspended") context.resume().catch(() => {});
            const t = context.currentTime;
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const filter = context.createBiquadFilter();
            const alert = kind === "error" || kind === "warning";
            oscillator.type = alert ? "triangle" : kind === "open" || kind === "startup" ? "sine" : "triangle";
            filter.type = "lowpass";
            filter.frequency.value = alert ? 1400 : 2100;
            const start = alert ? 390 : kind === "open" ? 880 : kind === "confirm" ? 670 : 590;
            oscillator.frequency.setValueAtTime(start, t);
            oscillator.frequency.exponentialRampToValueAtTime(start * (alert ? .55 : .72), t + .105);
            gain.gain.setValueAtTime(.0001, t);
            gain.gain.exponentialRampToValueAtTime(kind === "confirm" ? .032 : .024, t + .007);
            gain.gain.exponentialRampToValueAtTime(.0001, t + .123);
            oscillator.connect(filter);
            filter.connect(gain);
            gain.connect(context.destination);
            oscillator.start(t);
            oscillator.stop(t + .132);
            oscillator.onended = () => {
                oscillator.disconnect();
                filter.disconnect();
                gain.disconnect();
            };
        } catch (_) { /* Optional sound never blocks the interface. */ }
    }

    function trySample(kind) {
        const url = pack?.installed && pack.resolve(kind);
        if (!url || missing.has(kind) || typeof root.Audio !== "function") return false;
        try {
            const audio = new root.Audio(new URL(url, root.document.baseURI).href);
            audio.volume = .42;
            audio.preload = "auto";
            activeSamples.add(audio);
            let failed = false;
            const cleanup = () => activeSamples.delete(audio);
            const failedSample = () => {
                if (failed) return;
                failed = true;
                missing.add(kind);
                cleanup();
                fallbackTone(kind);
            };
            audio.addEventListener("ended", cleanup, { once: true });
            audio.addEventListener("error", failedSample, { once: true });
            const attempt = audio.play();
            if (attempt?.catch) attempt.catch(failedSample);
            return true;
        } catch (_) {
            missing.add(kind);
            return false;
        }
    }

    function play(kind = "click") {
        if (!enabled) return;
        const now = Date.now();
        if (now - lastSound < 35) return;
        lastSound = now;
        if (!trySample(kind)) fallbackTone(kind);
    }
    function isDashboardInteraction(target) {
        if (!target?.closest || !root.document?.body) return false;
        if (root.document.body.classList.contains("studio-editor-open")) return false;
        return Boolean(target.closest(".studio-nav, .studio-dashboard, .studio-modal, .studio-taskbar, .studio-start-menu, .studio-desktop"));
    }
    function soundForButton(button) {
        if (button.id === "studioWindowClose") return "close";
        if (button.id === "studioWindowMinimize") return "minimize";
        if (button.id === "studioWindowMaximize") return "maximize";
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
    // Future boot animation can emit these semantic events. Startup playback
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
            installed: Boolean(pack?.installed),
            availableEvents: pack ? Object.keys(pack.files) : [],
            unavailableEvents: [...missing]
        })
    });
})(typeof window !== "undefined" ? window : globalThis);
