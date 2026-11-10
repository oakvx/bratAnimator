const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const root = resolve(__dirname, "..");
const read = relative => readFileSync(resolve(root, relative), "utf8");
const base = "https://oakvx.github.io/bratAnimator/";
function meta(page, key, type = "name") {
    const escaped = key.replace(/[.*+?^$()|[\]{}]/g, "\\$&");
    return page.match(new RegExp('<meta\\s+' + type + '="' + escaped +
        '"\\s+content="([^"]+)"', 'i'))?.[1] || "";
}
function schema(page) {
    const match = page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(match, "Missing JSON-LD");
    return JSON.parse(match[1]);
}
test("home targets Free Brat Video Editor with real, readable copy", () => {
    const html = read("index.html");
    assert.match(html, /<title>Brat Animator [–-] Free Brat Video Editor Online<\/title>/);
    assert.match(meta(html, "description"), /Brat-style videos for free/i);
    assert.match(meta(html, "og:title", "property"), /Free Brat Video Editor/);
    assert.match(meta(html, "twitter:title"), /Free Brat Video Editor/);
    assert.match(html, /<h2>Free Brat Video Editor Online<\/h2>/);
    assert.match(html, /Free to use; publishing and redistribution require permission/);
    assert.match(html, /<link rel="canonical" href="https:\/\/oakvx.github.io\/bratAnimator\/"/);
});
test("indexed English and Italian pages have distinct meaningful descriptions", () => {
    const en = read("en/index.html");
    const it = read("it/index.html");
    assert.match(en, /<h1>Free Brat Video Editor Online/);
    assert.match(it, /<h1>Editor video Brat gratis online/);
    assert.match(meta(en, "description"), /multitrack timeline/);
    assert.match(meta(it, "description"), /editor video gratuito/);
    assert.match(en, /Free to use in your browser/);
    assert.match(it, /condizioni di utilizzo/);
    assert.match(it, /href="\.\.\/\?lang=it"/);
    assert.notEqual(meta(en, "description"), meta(it, "description"));
});
test("all localized pages and sitemap reciprocally declare their canonical language links", () => {
    const sitemap = read("sitemap.xml");
    const locales = ["en", "it", "ru", "zh"];
    const language = { en: "en", it: "it", ru: "ru", zh: "zh-CN" };
    for (const locale of ["", ...locales]) {
        const html = read((locale ? locale + "/" : "") + "index.html");
        for (const key of locales) {
            const fragment = 'hreflang="' + language[key] + '" href="' + base + key + '/"';
            assert.ok(html.includes(fragment), (locale || "home") + " missing " + fragment);
            assert.ok(sitemap.includes(fragment), "sitemap missing " + fragment);
        }
        const canonical = base + (locale ? locale + "/" : "");
        assert.ok(html.includes('rel="canonical" href="' + canonical + '"'));
        assert.ok(sitemap.includes("<loc>" + canonical + "</loc>"));
    }
});
test("JSON-LD describes genuine free browser editing and rights caveat", () => {
    const graph = schema(read("index.html"))["@graph"];
    const application = graph.find(x => x["@type"] === "WebApplication");
    assert.equal(application.isAccessibleForFree, true);
    assert.equal(application.offers.price, "0");
    assert.match(application.description, /Brat-style video editor/i);
    assert.match(application.description, /requires permission/i);
    assert.ok(application.featureList.some(v => /timeline/.test(v)));
    const faq = graph.find(x => x["@type"] === "FAQPage");
    assert.ok(faq.mainEntity.some(v => /free video editor/.test(v.name)));
    const italian = schema(read("it/index.html"));
    assert.ok(italian["@graph"].some(x => x["@type"] === "WebPage" && x.inLanguage === "it"));
});
test("PWA description remains truthful to supported output formats", () => {
    const manifest = JSON.parse(read("site.webmanifest"));
    assert.match(manifest.description, /Free browser-based Brat video editor/);
    assert.match(manifest.description, /MP4 or WebM/);
});
