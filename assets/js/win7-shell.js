/* Windows 7-inspired application shell. Visual/interaction layer only.
 * Neither editor state nor project/media storage is touched by window actions.
 */
(function (root, factory) {
    "use strict";
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root && root.document) { root.BratWin7Shell = api; api.init(); }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    "use strict";
    const MINIMIZED = "studio-window-minimized";
    const CLOSED = "studio-window-closed";
    const MAXIMIZED = "studio-window-maximized";
    function createShell(document, win = root) {
        const $ = id => document.getElementById(id);
        const body = document.body;
        const desktop = $("studioDesktop");
        const taskbar = $("studioTaskbarApp");
        const maximize = $("studioWindowMaximize");
        if (!desktop || !taskbar || !maximize) return null;
        function isVisible() {
            return !body.classList.contains(MINIMIZED) && !body.classList.contains(CLOSED);
        }
        function reflect() {
            const visible = isVisible();
            desktop.hidden = visible || body.classList.contains("studio-editor-open");
            taskbar.setAttribute("aria-pressed", String(visible));
            maximize.setAttribute("aria-label",body.classList.contains(MAXIMIZED)?"Restore":"Maximize");
            maximize.setAttribute("title",body.classList.contains(MAXIMIZED)?"Ripristina":"Ingrandisci");
        }
        function restore() {
            body.classList.remove(MINIMIZED, CLOSED);
            reflect();
        }
        function minimize() {
            body.classList.remove(CLOSED);
            body.classList.add(MINIMIZED);
            reflect();
            $("studioTaskbarApp")?.focus();
        }
        function close() {
            body.classList.remove(MINIMIZED);
            body.classList.add(CLOSED);
            reflect();
            $("studioDesktopLauncher")?.focus();
        }
        function toggleMaximize() {
            body.classList.toggle(MAXIMIZED);
            restore();
        }
        function taskbarAction() {
            if (isVisible()) minimize();
            else restore();
        }
        $("studioWindowMinimize").addEventListener("click", minimize);
        maximize.addEventListener("click", toggleMaximize);
        $("studioWindowClose").addEventListener("click", close);
        $("studioTaskbarApp").addEventListener("click", taskbarAction);
        $("studioStartButton").addEventListener("click", restore);
        $("studioDesktopLauncher").addEventListener("click", restore);
        document.querySelectorAll("[data-click-target]").forEach(button => {
            button.addEventListener("click", () => {
                $(button.dataset.clickTarget)?.click();
            });
        });
        function clock() {
            const target = $("studioTaskbarClock");
            if (!target) return;
            const time = new Date();
            target.textContent = new Intl.DateTimeFormat("it-IT", {hour:"2-digit",minute:"2-digit"}).format(time);
            target.title = new Intl.DateTimeFormat("it-IT",{dateStyle:"full",timeStyle:"short"}).format(time);
        }
        clock();
        // Passive clock update; window/controls otherwise use event handlers.
        if (win.setInterval) win.setInterval(clock, 60000);
        win.addEventListener?.("brat:studio-view", event => {
            if (event.detail?.view === "editor") restore();
            reflect();
        });
        reflect();
        return Object.freeze({ restore, minimize, close, toggleMaximize, state: () => ({
            minimized: body.classList.contains(MINIMIZED),
            closed: body.classList.contains(CLOSED),
            maximized: body.classList.contains(MAXIMIZED)
        })});
    }
    return Object.freeze({ createShell, init: () => root.document ? createShell(root.document) : null });
});
