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
    const EDITOR_MAXIMIZED = "studio-editor-maximized";
    function createShell(document, win = root) {
        const $ = id => document.getElementById(id);
        const body = document.body;
        const desktop = $("studioDesktop");
        const taskbar = $("studioTaskbarApp");
        const maximize = $("studioWindowMaximize");
        const editorMaximize = $("studioEditorMaximize");
        const showDesktopButton = $("studioShowDesktop");
        if (!desktop || !taskbar || !maximize) return null;
        let minimizedEditor = false;
        function isVisible() {
            return !body.classList.contains(MINIMIZED) && !body.classList.contains(CLOSED);
        }
        function setMaximizeLabel(button, isMaximized) {
            button?.setAttribute("aria-label", isMaximized ? "Restore" : "Maximize");
            button?.setAttribute("title", isMaximized ? "Ripristina" : "Ingrandisci");
        }
        function reflect() {
            const visible = isVisible();
            desktop.hidden = visible;
            taskbar.dataset.running = String(!body.classList.contains(CLOSED));
            taskbar.setAttribute("aria-pressed", String(visible));
            taskbar.setAttribute("aria-label", visible ? "Riduci a icona Brat Animator" : "Mostra Brat Animator");
            showDesktopButton?.setAttribute("aria-pressed", String(!visible));
            setMaximizeLabel(maximize, body.classList.contains(MAXIMIZED));
            setMaximizeLabel(editorMaximize, body.classList.contains(EDITOR_MAXIMIZED));
        }
        function layoutEditor() {
            if (body.classList.contains("studio-editor-open")) win.dispatchEvent(new win.Event("resize"));
        }
        function restore() {
            const reopenEditor = minimizedEditor;
            minimizedEditor = false;
            body.classList.remove(MINIMIZED, CLOSED);
            if (reopenEditor) win.BratStudio?.show("editor");
            reflect();
        }
        function showDesktop() {
            if (body.classList.contains("studio-editor-open")) {
                minimizedEditor = true;
                win.BratStudio?.show("home");
            }
            body.classList.remove(CLOSED);
            body.classList.add(MINIMIZED);
            reflect();
        }
        function minimize() {
            showDesktop();
            taskbar.focus();
        }
        function close() {
            minimizedEditor = false;
            if (body.classList.contains("studio-editor-open")) win.BratStudio?.show("home");
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
        taskbar.addEventListener("click", taskbarAction);
        for (const button of desktop.querySelectorAll(".studio-desktop-shortcut")) {
            function launch() {
                restore();
                if (button.dataset.desktopView) win.BratStudio?.show(button.dataset.desktopView);
            }
            button.addEventListener("dblclick", launch);
            button.addEventListener("click", event => {
                if (event.detail === 0 || win.matchMedia("(pointer: coarse)").matches) launch();
            });
        }
        showDesktopButton?.addEventListener("click", () => {
            if (isVisible()) showDesktop();
            else if (!body.classList.contains(CLOSED)) restore();
        });
        $("studioEditorMinimize")?.addEventListener("click", minimize);
        $("studioEditorClose")?.addEventListener("click", close);
        editorMaximize?.addEventListener("click", () => {
            body.classList.toggle(EDITOR_MAXIMIZED);
            reflect();
            layoutEditor();
        });
        for (const button of [maximize, editorMaximize]) {
            button?.closest(".title-bar")?.addEventListener("dblclick", event => {
                if (!event.target.closest("button")) button.click();
            });
        }
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
        win.addEventListener?.("brat:studio-view", reflect);
        reflect();
        return Object.freeze({ restore, minimize, close, toggleMaximize, state: () => ({
            minimized: body.classList.contains(MINIMIZED),
            closed: body.classList.contains(CLOSED),
            maximized: body.classList.contains(MAXIMIZED)
        })});
    }
    return Object.freeze({ createShell, init: () => root.document ? createShell(root.document) : null });
});
