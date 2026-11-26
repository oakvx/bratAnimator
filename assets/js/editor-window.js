/* finestra editor windows 7: menu, toolbar e menu compatto su telefono.
 * non tocca lo stato del progetto: ogni comando clicca i controlli che esistono già.
 */
(function (root) {
    "use strict";
    const document = root.document;
    const $ = id => document.getElementById(id);
    const menu = $("editorMenuBar");
    const toolbar = $("editorToolbar");
    const toggle = $("editorMenuToggle");
    if (!menu || !toolbar) return;

    const nav = () => root.BratEditorNav;
    const click = id => $(id)?.click();
    const focusLater = id => root.requestAnimationFrame(() => $(id)?.focus({ preventScroll: false }));

    function closeCompactMenu() {
        document.body.classList.remove("editor-menu-open");
        toggle?.setAttribute("aria-expanded", "false");
    }

    const commands = {
        "new": () => click("studioNewProject"),
        "projects": () => root.BratStudio?.show("projects"),
        "snapshot": () => { nav()?.openTab("project"); focusLater("snapshotNameInput"); },
        "bundle": () => { nav()?.openTab("project"); $("packageSettings")?.scrollIntoView({ block: "start" }); },
        "close-editor": () => click("studioEditorClose"),
        "undo-text": () => click("undoBtn"),
        "redo-text": () => click("redoBtn"),
        "undo-timeline": () => click("studioTlUndo"),
        "redo-timeline": () => click("studioTlRedo"),
        "fit": () => click("stageFitBtn"),
        "fullscreen": () => click("stageFullscreenBtn"),
        "about": () => {
            const dialog = $("studioAboutDialog");
            if (!dialog) return;
            dialog.hidden = false;
            $("studioAboutClose")?.focus();
        }
    };

    const bar = root.BratWin7WindowMenu?.createMenuBar(menu, {
        run(command) { closeCompactMenu(); commands[command]?.(); },
        document,
        win: root
    });
    // i bottoni con id propri (demo, lingua, tema…) hanno già i loro listener in app.js
    menu.addEventListener("click", event => {
        if (event.target.closest("button:not([data-win7-command]), a")) closeCompactMenu();
    });

    toggle?.addEventListener("click", () => {
        const open = !document.body.classList.contains("editor-menu-open");
        document.body.classList.toggle("editor-menu-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        if (!open) bar?.close();
    });

    const actions = {
        studio: () => root.BratStudio?.show("home"),
        play: () => click("stagePlayBtn"),
        split: () => click("studioTlSplit"),
        export: () => { nav()?.openTab("export"); focusLater("exportVideoBtn"); }
    };
    toolbar.addEventListener("click", event => {
        const button = event.target.closest("[data-editor-action]");
        if (button) actions[button.dataset.editorAction]?.();
    });

    // il bottone riproduci della toolbar segue lo stato del player dell'anteprima
    const stagePlay = $("stagePlayBtn");
    const toolbarPlay = $("toolbarPlayBtn");
    function syncPlay() {
        if (!stagePlay || !toolbarPlay) return;
        const playing = stagePlay.getAttribute("aria-pressed") === "true";
        toolbarPlay.setAttribute("aria-pressed", String(playing));
        const key = playing ? "toolPause" : "toolPlay";
        toolbarPlay.dataset.i18n = key;
        const label = root.BratI18n?.translate?.(root.BratI18n.getSavedLanguage(), key);
        toolbarPlay.textContent = label || (playing ? "Pausa" : "Riproduci");
    }
    if (stagePlay && toolbarPlay) {
        new root.MutationObserver(syncPlay).observe(stagePlay, { attributes: true, attributeFilter: ["aria-pressed"] });
        syncPlay();
    }

    root.matchMedia?.("(min-width: 900px)").addEventListener?.("change", event => {
        if (event.matches) { closeCompactMenu(); bar?.close(); }
    });
    root.addEventListener("brat:studio-view", closeCompactMenu);
    root.BratEditorWindow = Object.freeze({ commands: Object.keys(commands), closeCompactMenu, menu: bar });
})(typeof globalThis !== "undefined" ? globalThis : window);
