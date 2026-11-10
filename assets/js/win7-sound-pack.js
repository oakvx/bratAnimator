/* Windows 7 sound pack integration contract.
 * This file contains FILE NAMES ONLY — no Microsoft recordings.
 * Once you legally obtain the WAV files, place them in
 * assets/sounds/windows7/ and ask Codex to set installed to true.
 * Keep this file before dashboard-audio.js in index.html.
 */
(function (root, factory) {
    "use strict";
    const pack = factory();
    if (typeof module === "object" && module.exports) module.exports = pack;
    if (root) root.BratWindows7SoundPack = pack;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";
    const files = Object.freeze({
        startup: "startup.wav",
        logon: "logon.wav",
        logoff: "logoff.wav",
        navigation: "navigation-start.wav",
        menu: "menu-open.wav",
        click: "menu-command.wav",
        confirm: "confirm.wav",
        notify: "notify.wav",
        warning: "exclamation.wav",
        error: "critical-stop.wav",
        recycle: "recycle.wav",
        minimize: "minimize.wav",
        maximize: "maximize.wav",
        restore: "restore.wav",
        close: "close.wav"
    });
    // TODO(WIN7-SOUNDS): Switch to true ONLY when the corresponding WAV
    // recordings have been placed under basePath. Missing files fall back
    // to the current synthetic UI tone, and never block navigation.
    const installed = false;
    const basePath = "assets/sounds/windows7/";
    function resolve(kind) {
        return Object.prototype.hasOwnProperty.call(files, kind)
            ? basePath + files[kind]
            : null;
    }
    return Object.freeze({ installed, basePath, files, resolve });
});
