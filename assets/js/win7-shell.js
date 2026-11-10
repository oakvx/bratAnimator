/* Windows 7-inspired application shell. Visual/interaction layer only.
 * Neither editor state nor project/media storage is touched by window actions.
 */
(function (root, factory) {
    "use strict";
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root && root.document) { root.BratWin7Shell = api; root.BratWin7ShellInstance = api.init(); }
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
        // Start button is now owned by win7-start-menu.js; the taskbar icon still restores the window.
        $("studioDesktopLauncher").addEventListener("click", restore);
        // Additional desktop shortcuts remain local: no filesystem access.
        document.querySelectorAll("[data-desktop-view]").forEach(button => {
            button.addEventListener("click", () => {
                restore();
                win.BratStudio?.show(button.dataset.desktopView);
            });
        });
        $("studioShowDesktop")?.addEventListener("click", taskbarAction);
        $("studioEditorMinimize")?.addEventListener("click", () => {
            win.BratStudio?.show("home");
            minimize();
        });
        $("studioEditorClose")?.addEventListener("click", () => {
            win.BratStudio?.show("home");
            close();
        });
        $("studioEditorMaximize")?.addEventListener("click", () => {
            // Editor's "maximize" expands the preview by toggling its inspector.
            const toggle = $("togglePanelBtn");
            toggle?.click();
            const expanded = document.body.classList.contains("panel-closed");
            $("studioEditorMaximize")?.setAttribute("aria-label", expanded ? "Restore" : "Maximize");
            $("studioEditorMaximize")?.setAttribute("title", expanded ? "Ripristina pannello" : "Espandi editor");
        });
        document.querySelectorAll("[data-click-target]").forEach(button => {
            button.addEventListener("click", () => {
                $(button.dataset.clickTarget)?.click();
            });
        });
        function clock() {
            const target = $("studioTaskbarClock");
            if (!target) return;
            const time = new Date();
            const hour = new Intl.DateTimeFormat("it-IT", {hour:"2-digit",minute:"2-digit"}).format(time);
            const date = new Intl.DateTimeFormat("it-IT", {day:"2-digit",month:"2-digit",year:"numeric"}).format(time);
            target.replaceChildren();
            const clockTime = document.createElement("time");
            clockTime.dateTime = time.toISOString();
            clockTime.textContent = hour;
            const clockDate = document.createElement("small");
            clockDate.textContent = date;
            target.append(clockTime, clockDate);
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
