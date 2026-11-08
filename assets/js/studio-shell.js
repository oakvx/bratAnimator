/* Brat Studio — small mobile-navigation enhancement, no rendering logic. */
(function () {
    "use strict";
    const panel = document.getElementById("panel");
    const toggle = document.getElementById("togglePanelBtn");
    const preview = document.getElementById("dockPreviewBtn");
    const stageShell = document.querySelector(".page-shell");
    const tabs = document.querySelector(".editor-tabs");
    const isMobile = () => window.matchMedia("(max-width: 980px)").matches;
    const behavior = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const reveal = (node) => {
        if (!node) return;
        window.requestAnimationFrame(() => node.scrollIntoView({ behavior: behavior(), block: "start" }));
    };
    toggle?.addEventListener("click", () => {
        if (isMobile() && panel && !panel.classList.contains("hidden")) reveal(tabs);
    });
    preview?.addEventListener("click", () => {
        if (!isMobile()) return;
        const source = document.getElementById("lyricsInput")?.value || "";
        // Keep validation in app.js: never jump away from the errors in the editor.
        if (/^\s*\[\d{1,2}:\d{2}(?:[.:]\d+)?\]/m.test(source)) reveal(stageShell);
    });
})();
