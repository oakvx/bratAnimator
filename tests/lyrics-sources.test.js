const test = require("node:test");
const assert = require("node:assert/strict");
const sources = require("../assets/js/lyrics-sources.js");
const yaml = 'version: "1.0"\nmetadata: {title: Example, artist: Singer}\nlines:\n  - text: Hi\n    start_ms: 1234\n    end_ms: 2345\n    words: [{text: Hi, start_ms: 1234, end_ms: 2345}]';
const json = data => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });

test("both sources encode queries and identify this browser client", async () => {
    const calls = [];
    const client = sources.createClient(async (url, options) => {
        calls.push({ url, options });
        return url.includes("lrclib.net") ? json([{ id: 123, trackName: "Example", syncedLyrics: "[00:01] Hi" }]) : json({ hits: [{ isrc: "GBABC1234567", title: "Example", artist: "Singer", album: "Album" }, { isrc: '<script>' }] });
    });
    const lrclib = await client.search("Singer & title", "lrclib");
    const red = await client.search("Singer & title", "lrc.red");
    assert.match(calls[0].url, /q=Singer%20%26%20title$/);
    assert.equal(calls[0].options.headers["Lrclib-Client"], sources.CLIENT);
    assert.equal(calls[1].options.headers["X-Client-ID"], sources.CLIENT);
    assert.equal(lrclib[0].source, "lrclib");
    assert.equal(red.length, 1);
    assert.equal(red[0].trackName, "Example");
    assert.equal(red[0].sourceUrl, "https://lrc.red/s/GBABC1234567");
});

test("LRCLIB prefers Lyricsfile word intervals and falls back for legacy or malformed records", async () => {
    const client = sources.createClient(() => { throw new Error("No network needed"); });
    const result = await client.load({ source: "lrclib", lyricsfile: yaml, syncedLyrics: "[00:01] legacy" });
    assert.equal(result.rows[0].timing.words[0].end, 2.345);
    const fallback = await client.load({ source: "lrclib", lyricsfile: "invalid", syncedLyrics: "[00:01] legacy" });
    assert.equal(fallback.lyrics, "[00:01] legacy");
    await assert.rejects(client.load({ source: "lrclib", instrumental: true }), /No usable lyrics/);
});

test("lrc.red loads track metadata and native YAML with sequential requests", async () => {
    const calls = [];
    const client = sources.createClient(async url => {
        calls.push(url);
        return url.endsWith(".json") ? json({ title: "Example detail", sync: "word", files: { lyricsfile: "https://untrusted.example/song.yaml" } }) : new Response(yaml);
    });
    const result = await client.load({ source: "lrc.red", isrc: "GBABC1234567" });
    assert.equal(result.item.trackName, "Example detail");
    assert.equal(result.rows[0].timing.words[0].start, 1.234);
    assert.deepEqual(calls, ["https://lrc.red/s/GBABC1234567.json", "https://lrc.red/s/GBABC1234567.lyricsfile.yaml"]);
});

test("lrc.red falls back to TTML and LRC when richer formats are unavailable", async () => {
    const calls = [];
    const client = sources.createClient(async url => {
        calls.push(url);
        if (url.endsWith(".json")) return json({ title: "Example" });
        if (url.endsWith(".lrc")) return new Response("[00:01] Hi");
        return new Response("Not found", { status: 404 });
    });
    const result = await client.load({ source: "lrc.red", isrc: "GBABC1234567" });
    assert.equal(result.format, "lrc");
    assert.equal(calls.length, 4);
    assert.ok(calls[2].endsWith(".ttml"));
});

test("rate limits honor Retry-After and stop fallback requests", async () => {
    let calls = 0;
    const client = sources.createClient(async url => {
        calls++;
        return url.endsWith(".json") ? json({}) : new Response("Slow down", { status: 429, headers: { "Retry-After": "120" } });
    });
    await assert.rejects(client.load({ source: "lrc.red", isrc: "GBABC1234567" }), /retry in 120s/);
    assert.equal(calls, 2);
    await assert.rejects(client.search("Example", "lrc.red"), /retry later/);
    assert.equal(calls, 2);
});

test("aborted requests and malformed responses are reported without loading data", async () => {
    const controller = new AbortController();
    controller.abort();
    const client = sources.createClient(async () => json({ wrong: true }));
    await assert.rejects(client.search("Example", "lrclib", { signal: controller.signal }), { name: "AbortError" });
    await assert.rejects(client.search("Example", "lrclib"), /Invalid LRCLIB/);
    await assert.rejects(client.search("Example", "lrc.red"), /Invalid lrc.red/);
});
