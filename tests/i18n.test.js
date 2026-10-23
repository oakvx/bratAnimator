const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const italian = require("../assets/js/italian-ui.js");
const source = fs.readFileSync(require.resolve("../assets/js/i18n.js"), "utf8");

function loadI18n({ language = "en-US", saved = null, search = "", unavailableStorage = false } = {}) {
    const storage = new Map(saved ? [["bratAnimator.language", saved]] : []);
    const window = { navigator: { language }, location: { search } };
    const document = { documentElement: {}, querySelectorAll: () => [] };
    const localStorage = {
        getItem(key) { if (unavailableStorage) throw new Error("Storage unavailable"); return storage.get(key) ?? null; },
        setItem(key, value) { if (unavailableStorage) throw new Error("Storage unavailable"); storage.set(key, value); }
    };
    vm.runInNewContext(source, { window, document, localStorage, URLSearchParams });
    return { i18n: window.BratI18n, document, storage };
}

test("Italian browser locale is used only when no saved or URL preference exists", () => {
    assert.equal(loadI18n({ language: "it-IT" }).i18n.getSavedLanguage(), "it");
    assert.equal(loadI18n({ language: "it" }).i18n.getSavedLanguage(), "it");
    assert.equal(loadI18n({ language: "fr-FR" }).i18n.getSavedLanguage(), "en");
    for (const saved of ["en", "ru", "zh", "it"]) {
        assert.equal(loadI18n({ language: "it-IT", saved }).i18n.getSavedLanguage(), saved);
    }
    assert.equal(loadI18n({ language: "it-IT", saved: "ru", search: "?lang=en" }).i18n.getSavedLanguage(), "en");
    assert.equal(loadI18n({ language: "en-US", saved: "zh", search: "?lang=it" }).i18n.getSavedLanguage(), "it");
    const withUrl = loadI18n({ language: "en-US", search: "?lang=it" });
    withUrl.i18n.applyLanguage("en");
    assert.equal(withUrl.i18n.getSavedLanguage(), "en", "a language chosen in the session should take effect immediately");
});

test("Italian contains every existing translation key and persists a selected language", () => {
    const { i18n, document, storage } = loadI18n({ language: "it-IT" });
    assert.deepEqual(Object.keys(i18n.translations.it).sort(), Object.keys(i18n.translations.en).sort());
    assert.equal(i18n.t("settings"), "impostazioni");
    assert.equal(i18n.applyLanguage("it"), "it");
    assert.equal(document.documentElement.lang, "it");
    assert.equal(storage.get("bratAnimator.language"), "it");
    i18n.applyLanguage("zh");
    assert.equal(document.documentElement.lang, "zh-CN");
    assert.equal(i18n.getSavedLanguage(), "zh");
});

test("language remains usable when browser storage is unavailable", () => {
    const { i18n, document } = loadI18n({ language: "it-IT", unavailableStorage: true });
    assert.equal(i18n.getSavedLanguage(), "it");
    assert.equal(i18n.applyLanguage("it"), "it");
    assert.equal(document.documentElement.lang, "it");
    i18n.applyLanguage("en");
    assert.equal(i18n.getSavedLanguage(), "en");
});

test("Italian UI translates tutorial, accessibility and status copy without replacing user suffixes", () => {
    assert.equal(italian.translate("  play preview  "), "  riproduci anteprima  ");
    assert.equal(italian.translate("step 3 of 6"), "passaggio 3 di 6");
    assert.equal(italian.translate("save snapshot"), "salva una copia");
    assert.equal(italian.translate("Line 2: Invalid word timestamp"), "Riga 2: Timestamp di parola non valido");
    assert.equal(italian.translate("loaded: artist $& / $` / $' - green"), "caricato: artist $& / $` / $' - green");
    assert.equal(italian.translate("saved preset: my font - green"), "stile salvato: my font - green");
    assert.equal(italian.translate("This is a user lyric with the word green"), "This is a user lyric with the word green");
    assert.equal(italian.translate("fast MP4 export: 20% • estimated remaining 0:03"), "esportazione MP4 rapida: 20% • tempo rimanente stimato 0:03");
});
