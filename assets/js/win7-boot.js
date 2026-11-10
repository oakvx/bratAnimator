/* Play the original activity.bmp frames supplied in Personalizzazione. */
(function (win) {
    "use strict";
    const FRAME_COUNT = 105;
    const FRAME_SIZE = 200;
    const FRAME_MS = 65;
    const REDUCED_MS = 240;
    const document = win.document;
    const overlay = document.getElementById("studioBoot");
    const canvas = document.getElementById("studioBootFrames");
    const skip = document.getElementById("studioBootSkip");
    const context = canvas.getContext("2d");
    let frameRequest;
    let timer;
    let started = false;
    let ended = false;
    let resolveReady;

    function finish(reason) {
        if (ended) return;
        ended = true;
        win.cancelAnimationFrame(frameRequest);
        win.clearTimeout(timer);
        if (started && win.BratStudio?.getView() === "home" && !win.location.hash && !win.location.search
            && !document.querySelector(".studio-modal-backdrop:not([hidden])")) {
            win.BratWin7ShellInstance?.close();
        }
        overlay.close();
        overlay.hidden = true;
        const result = { reason, skipped: reason === "skipped" };
        win.dispatchEvent(new CustomEvent("brat:studio-boot-finished", { detail: result }));
        resolveReady(result);
    }

    async function start() {
        const frames = await win.BratWin7Assets.loadBoot();
        if (!frames || !context || ended) return finish("unavailable");

        const reduced = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const startedAt = win.performance.now();
        const duration = reduced ? REDUCED_MS : FRAME_COUNT * FRAME_MS;
        let lastFrame = -1;
        function paint(now) {
            const elapsed = Math.max(0, now - startedAt);
            const frame = reduced ? FRAME_COUNT - 1 : Math.min(FRAME_COUNT - 1, Math.floor(elapsed / FRAME_MS));
            if (lastFrame !== frame) {
                context.drawImage(frames, 0, frame * FRAME_SIZE, FRAME_SIZE, FRAME_SIZE, 0, 0, FRAME_SIZE, FRAME_SIZE);
                lastFrame = frame;
            }
            if (!reduced && !ended) frameRequest = win.requestAnimationFrame(paint);
        }

        paint(startedAt);
        overlay.hidden = false;
        overlay.showModal();
        started = true;
        timer = win.setTimeout(() => finish("completed"), duration);
    }

    skip.addEventListener("click", () => finish("skipped"));
    overlay.addEventListener("cancel", event => {
        event.preventDefault();
        finish("skipped");
    });
    win.BratBoot = Object.freeze({
        ready: new Promise(resolve => { resolveReady = resolve; }),
        isVisible: () => overlay.open
    });
    start().catch(() => finish("unavailable"));
})(window);
