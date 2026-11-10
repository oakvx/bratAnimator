/* Real 7.css application menubar; no hand-drawn replacement buttons.
 * Commands delegate to existing app actions, preserving project state.
 */
(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root?.document) {
        root.BratWin7WindowMenu = api;
        root.BratWin7WindowMenuInstance = api.init(root.document, root);
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";
    const VIEWS = Object.freeze({
        home: "home", editor: "editor", timeline: "editor",
        projects: "projects", sounds: "sounds", settings: "settings",
        share: "share"
    });
    function createMenu(document, win = globalThis) {
        const menu = document.getElementById("studioWin7MenuBar");
        if (!menu) return null;
        const headings = Array.from(menu.children).filter(node => node.getAttribute("aria-haspopup") === "true");
        let selected = null;
        const $ = id => document.getElementById(id);
        function close() {
            if (selected) selected.setAttribute("aria-expanded", "false");
            selected = null;
        }
        function open(node) {
            if (!headings.includes(node)) return false;
            close();
            selected = node;
            node.setAttribute("aria-expanded", "true");
            node.focus();
            return true;
        }
        function toggle(node) {
            if (selected === node) { close(); return false; }
            return open(node);
        }
        function run(command) {
            close();
            if (command === "help") return $("studioAddressHelp")?.click();
            if (command === "about") {
                const dialog = $("studioAboutDialog");
                if (dialog) {
                    dialog.hidden = false;
                    $("studioAboutClose")?.focus();
                }
                return;
            }
            if (command === "close") return win.BratWin7ShellInstance?.close();
            if (command === "minimize") return win.BratWin7ShellInstance?.minimize();
            if (command === "maximize") return win.BratWin7ShellInstance?.toggleMaximize();
            if (command === "new") return $("studioNewProject")?.click();
            if (VIEWS[command]) {
                win.BratWin7ShellInstance?.restore();
                win.BratStudio?.show(VIEWS[command]);
                if (command === "timeline") document.querySelector('[data-open-tab="tracks"]')?.click();
                if (command === "sounds") $("studioSoundImport")?.focus();
                return;
            }
            return false;
        }
        menu.addEventListener("click", event => {
            const button = event.target.closest("button[data-win7-command]");
            if (button && menu.contains(button)) {
                event.preventDefault();
                run(button.dataset.win7Command);
                return;
            }
            const heading = event.target.closest('[aria-haspopup="true"]');
            if (heading && menu.contains(heading)) {
                event.stopPropagation();
                toggle(heading);
            }
        });
        menu.addEventListener("keydown", event => {
            const heading = event.target.closest('[aria-haspopup="true"]');
            if (event.key === "Escape") { event.preventDefault(); close(); heading?.focus(); return; }
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                const current = Math.max(0, headings.indexOf(heading));
                const step = event.key === "ArrowRight" ? 1 : -1;
                open(headings[(current + step + headings.length) % headings.length]);
                return;
            }
            if (event.key === "ArrowDown" && heading) {
                event.preventDefault();
                open(heading);
                heading.querySelector('button[data-win7-command]')?.focus();
                return;
            }
            if ((event.key === "Enter" || event.key === " ") && heading === event.target) {
                event.preventDefault();
                toggle(heading);
                heading.querySelector('button[data-win7-command]')?.focus();
            }
        });
        document.addEventListener("pointerdown", event => {
            if (!menu.contains(event.target)) close();
        });
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && !$("studioAboutDialog")?.hidden) {
                $("studioAboutDialog").hidden = true;
                $("studioWin7MenuBar")?.focus();
            }
            if (event.altKey && event.key.toLowerCase() === "f" &&
                document.body.classList.contains("studio-dashboard-open")) {
                event.preventDefault();
                open(headings[0]);
            }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n" &&
                document.body.classList.contains("studio-dashboard-open") &&
                !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
                event.preventDefault();
                run("new");
            }
        });
        $("studioAboutClose")?.addEventListener("click", () => { $("studioAboutDialog").hidden = true; });
        $("studioAboutDialog")?.addEventListener("click", event => {
            if (event.target === $("studioAboutDialog")) $("studioAboutDialog").hidden = true;
        });
        win.addEventListener?.("brat:studio-view", close);
        return Object.freeze({ open, close, toggle, run, isOpen: () => Boolean(selected) });
    }
    return Object.freeze({ VIEWS, createMenu, init: createMenu });
});
