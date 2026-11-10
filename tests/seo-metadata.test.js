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
test("home visibly brands Brat Animator while retaining searchable free-editor metadata", () => {
    const html = read("index.html");
    assert.match(html, /<title>Brat Animator — Brat Video Editor<\/title>/);
    assert.match(meta(html, "description"), /Brat-style videos for free/i);
    assert.doesNotMatch(meta(html, "og:title", "property"), /Free/i);
    assert.match(meta(html, "og:title", "property"), /Brat Video Editor/);
    assert.match(meta(html, "twitter:title"), /Brat Video Editor/);
    assert.doesNotMatch(html, /class="studio-seo-intro"/);
    assert.match(html, /<div id="studioHomeView"/);
    assert.match(html, /<link rel="canonical" href="https:\/\/oakvx.github.io\/bratAnimator\/"/);
});
test("indexed English and Italian pages have distinct meaningful descriptions", () => {
    const en = read("en/index.html");
    const it = read("it/index.html");
    assert.match(en, /<h1>Brat Animator — Brat Video Studio/);
    assert.match(it, /<h1>Brat Animator — Studio Video Brat/);
    assert.match(meta(en, "description"), /multitrack timeline/);
    assert.match(meta(it, "description"), /editor video gratuito/);
    assert.doesNotMatch(en.slice(en.indexOf("<body>")), /Free Brat Video Editor|Free to use in your browser/);
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
    assert.ok(application.alternateName.includes("Free Brat Video Editor"), "Free search term remains in structured SEO data");
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

test("free keywords stay searchable but not in visible English or Italian headings", () => {
    const en = read("en/index.html");
    const it = read("it/index.html");
    const home = read("index.html");
    assert.match(en, /<title>Brat Animator — Brat Video Editor Online/);
    assert.match(it, /<title>Brat Animator — Studio Video Brat Online/);
    for (const page of [en, it]) {
        const body = page.slice(page.indexOf("<body>"));
        assert.doesNotMatch(body, /<h[1-6][^>]*>[^<]*(?:Free|gratis|gratuito)/i);
    }
    assert.doesNotMatch(home, /<section class="studio-seo-intro"/);
});
