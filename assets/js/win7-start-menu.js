/* Brat Animator — Windows 7 Start menu (local-only navigation).
 * 7.css provides the glass/window components; this module owns behaviour.
 * No network calls, no project contents, and no browser-level OS shortcuts.
 */
(function (root, factory) {
    "use strict";
    const api = factory(root);
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root && root.document) {
        root.BratStartMenu = api;
        root.BratStartMenuInstance = api.init(root.document, root);
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    "use strict";
    function normalize(value) {
        return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it-IT").trim();
    }
    function matchesQuery(label, query) {
        return normalize(label).includes(normalize(query));
    }
    function createStartMenu(document, win = root) {
        const $ = id => document.getElementById(id);
        const menu = $("studioStartMenu");
        const start = $("studioStartButton");
        const search = $("studioStartSearch");
        const empty = $("studioStartEmpty");
        const results = $("studioStartResults");
        if (!menu || !start || !search || !results || !empty) return null;
        const entries = Array.from(results.querySelectorAll("button[data-start-view],button[data-start-action]"));
        const visibleEntries = () => entries.filter(button => !button.hidden && !button.disabled);

        function filter() {
            const query = search.value;
            for (const button of entries) {
                button.hidden = !matchesQuery(button.dataset.startKeywords || button.textContent, query);
            }
            empty.hidden = visibleEntries().length > 0;
            return visibleEntries();
        }
        function isOpen() { return !menu.hidden; }
        function open() {
            if (document.body.classList.contains("studio-editor-open")) return;
            menu.hidden = false;
            start.setAttribute("aria-expanded", "true");
            search.value = "";
            filter();
            search.focus();
        }
        function close(restoreFocus = false) {
            if (!isOpen()) return;
            menu.hidden = true;
            start.setAttribute("aria-expanded", "false");
            if (restoreFocus) start.focus();
        }
        function toggle() { if (isOpen()) close(true); else open(); }

        function invoke(button) {
            const view = button.dataset.startView;
            const action = button.dataset.startAction;
            close();
            if (action === "close") {
                win.BratWin7ShellInstance?.close();
                return;
            }
            win.BratWin7ShellInstance?.restore();
            if (view) win.BratStudio?.show(view);
            else if (action === "new") $("studioNewProject")?.click();
            else if (action === "account") $("studioNavAccount")?.click();
        }

        start.addEventListener("click", event => {
            event.stopPropagation();
            toggle();
        });
        menu.addEventListener("click", event => {
            const button = event.target.closest("button[data-start-view],button[data-start-action]");
            if (button && menu.contains(button) && !button.hidden && !button.disabled) invoke(button);
        });
        search.addEventListener("input", filter);
        menu.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                close(true);
            } else if (event.key === "ArrowDown" && event.target === search) {
                const first = visibleEntries()[0];
                if (first) { event.preventDefault(); first.focus(); }
            } else if (event.key === "ArrowUp" && event.target === search) {
                const last = visibleEntries().at(-1);
                if (last) { event.preventDefault(); last.focus(); }
            } else if (event.key === "Enter" && event.target === search) {
                const first = visibleEntries()[0];
                if (first) { event.preventDefault(); invoke(first); }
            }
        });
        document.addEventListener("pointerdown", event => {
            if (isOpen() && !menu.contains(event.target) && !start.contains(event.target)) close();
        });
        win.addEventListener?.("brat:studio-view", () => close());
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && isOpen()) close(true);
        });
        start.setAttribute("aria-expanded", "false");
        filter();
        return Object.freeze({ open, close, toggle, filter, isOpen });
    }
    return Object.freeze({ normalize, matchesQuery, createStartMenu, init: (document = root.document, win = root) =>
        document ? createStartMenu(document, win) : null });
});
