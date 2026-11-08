/* Brat Animator — local procedural dashboard interaction sounds.
 * No samples, no requests, no audio files: Web Audio synthesis on user input.
 * Deliberately excluded from the video editor, timeline, canvas and exports.
 */
(function (root) {
    "use strict";
    const KEY = "bratAnimator.dashboardSound.v1";
    const AudioContextClass = root.AudioContext || root.webkitAudioContext;
    let enabled = true;
    let context = null;
    let lastSound = 0;
    try { enabled = root.localStorage.getItem(KEY) !== "off"; } catch (_) {}

    function syncButtons() {
        root.document.querySelectorAll("[data-dashboard-sound-toggle]").forEach(button => {
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
    function play(kind = "tap") {
        if (!enabled || !AudioContextClass) return;
        // AudioContext is instantiated only after a real click, never on page load.
        try {
            const currentTime = Date.now();
            if (currentTime - lastSound < 35) return;
            lastSound = currentTime;
            context ||= new AudioContextClass({ latencyHint: "interactive" });
            if (context.state === "suspended") context.resume().catch(() => {});
            const t = context.currentTime;
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const filter = context.createBiquadFilter();
            oscillator.type = kind === "open" ? "sine" : "triangle";
            filter.type = "lowpass";
            filter.frequency.value = 2100;
            // Soft, watery click: a quick descending pitch, very short decay.
            const start = kind === "open" ? 880 : kind === "confirm" ? 670 : 590;
            oscillator.frequency.setValueAtTime(start, t);
            oscillator.frequency.exponentialRampToValueAtTime(start * (kind === "open" ? .65 : .72), t + .105);
            gain.gain.setValueAtTime(.0001, t);
            gain.gain.exponentialRampToValueAtTime(kind === "confirm" ? .032 : .024, t + .007);
            gain.gain.exponentialRampToValueAtTime(.0001, t + .123);
            oscillator.connect(filter);
            filter.connect(gain);
            gain.connect(context.destination);
            oscillator.start(t);
            oscillator.stop(t + .132);
            oscillator.onended = () => {
                oscillator.disconnect(); filter.disconnect(); gain.disconnect();
            };
        } catch (_) { /* Browser sound support is optional; never block navigation. */ }
    }

    function isDashboardInteraction(target) {
        if (!target?.closest || !root.document.body) return false;
        if (root.document.body.classList.contains("studio-editor-open")) {
            // No sound effects while working inside the video editor.
            return false;
        }
        return Boolean(target.closest(".studio-nav, .studio-dashboard, .studio-modal"));
    }

    function handleClick(event) {
        const target = event.target;
        if (!isDashboardInteraction(target)) return;
        const button = target.closest("button");
        if (!button || button.disabled) return;
        if (button.matches("[data-dashboard-sound-toggle]")) {
            const wasEnabled = enabled;
            setEnabled(!enabled);
            if (!wasEnabled) play("confirm");
            return;
        }
        if (button.matches(".studio-accent-button, [id*='Confirm'], [id*='Submit']")) {
            play("confirm");
        } else if (button.matches("[data-studio-view], .studio-project-card")) {
            play("open");
        } else {
            play("tap");
        }
    }

    if (root.document) {
        root.document.addEventListener("click", handleClick, { capture: true });
        if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", syncButtons, { once:true });
        else syncButtons();
    }
    root.BratDashboardAudio = Object.freeze({ isEnabled: () => enabled, setEnabled, play });
})(typeof window !== "undefined" ? window : globalThis);
