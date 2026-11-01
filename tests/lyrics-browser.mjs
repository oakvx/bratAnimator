// Browser regression: native lyric timing, imports, provider switching and persistence.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profile = await mkdtemp(path.join(tmpdir(), "brat-lyrics-"));
const server = createServer(async (req, res) => {
    const target = path.resolve(root, "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname));
    if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const filename = target === root ? path.join(root, "index.html") : target;
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
    try { res.writeHead(200, { "Content-Type": types[path.extname(filename)] || "application/octet-stream", "Cache-Control": "no-store" }); res.end(await readFile(filename)); }
    catch { res.writeHead(404).end(); }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const browser = spawn(process.env.CHROME_PATH || (process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : "chromium"), ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
let ws, cdp;
try {
    let port;
    for (let attempt = 0; attempt < 120; attempt += 1) {
        try { port = (await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]; break; }
        catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    assert.ok(port, "Chrome failed to start");
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
    const pending = new Map(); let sequence = 0;
    ws.addEventListener("message", event => {
        const message = JSON.parse(event.data); const entry = pending.get(message.id); if (!entry) return;
        pending.delete(message.id); clearTimeout(entry.timeout);
        message.error ? entry.reject(new Error(JSON.stringify(message.error))) : entry.resolve(message.result);
    });
    cdp = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++sequence; const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
        pending.set(id, { resolve, reject, timeout }); ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async fn => {
        const result = await cdp("Runtime.evaluate", { expression: `(${fn.toString()})()`, awaitPromise: true, returnByValue: true });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
        return result.result.value;
    };
    await cdp("Page.enable");
    await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "sessionStorage.setItem('bratAnimator.permissionNotice.dismissed.v1','true');localStorage.setItem('bratAnimator.tutorial.seen.v1','true');" });
    await cdp("Page.navigate", { url: `http://127.0.0.1:${server.address().port}` });
    for (let attempt = 0; attempt < 100; attempt += 1) {
        if (await evaluate(() => Boolean(window.BratEditor && typeof drawMusicSyncedScene === "function"))) break;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    const imports = await evaluate(async () => {
        const check = (value, message) => { if (!value) throw new Error(message); };
        const close = (actual, expected, message) => check(Math.abs(actual - expected) < 1e-8, `${message}: ${actual} != ${expected}`);
        const source = `<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttm="http://www.w3.org/ns/ttml#metadata" xmlns:lrc="http://lrc.red/lyric-ttml-internal"><body dur="20s"><div begin="10.000" end="19.000"><p begin="10.123" end="15.000"><span begin="10.200" end="10.800">Hello</span> <span begin="12.000" end="12.300">wor</span><span begin="12.300" end="13.700">ld</span><span ttm:role="x-bg" begin="11.000" end="14.000">(<span begin="11.200" end="13.000">echo</span>)</span><span ttm:role="x-translation">ignored translation</span></p></div></body></tt>`;
        const result = BratLyrics.parse(source, 'example.ttml');
        check(result.rows.length === 2, 'TTML lead/background rows');
        check(result.rows[0].text === 'Hello world', 'TTML whitespace and secondary roles');
        check(result.rows[1].text.includes('[bg]'), 'TTML background role');
        startFromZeroCheckbox.checked = false;
        useAudioTimingCheckbox.checked = false;
        await loadLrcFile(new File([source], 'example.ttml', { type: 'application/ttml+xml' }));
        const lead = state.timeline.find(line => line.role === 'lead');
        close(lead.timestamp, 10.123, 'track-absolute TTML line start');
        close(lead.timedWords[0].start, 10.2, 'native word start');
        close(lead.timedWords[0].end, 10.8, 'native word end');
        close(lead.timedWords[1].start, 12, 'first syllable starts word');
        close(lead.timedWords[1].end, 13.7, 'last syllable ends word');
        close(lead.chars.find(char => char.startChar === 9).timestamp, 12.3, 'syllable character onset');
        close(lead.displayEnd, 15, 'overlapping native line is not cut off by background');
        const bg = state.timeline.find(line => line.role === 'background');
        close(bg.timedWords[0].start, 11.2, 'background native onset with parentheses');
        close(bg.timedWords[0].end, 13, 'background native end with parentheses');
        check(lead.timedWords.every(word => word.explicitEnd), 'native word ends bypass estimates');
        const project = JSON.parse(JSON.stringify(buildProjectPayload()));
        restoreProjectSettings(project);
        close(state.timeline[0].timedWords[0].end, 10.8, 'native end survives project restore');
        const previous = lyricsInput.value;
        await loadLrcFile(new File(['<tt><broken>'], 'broken.ttml'));
        check(lyricsInput.value === previous, 'invalid import leaves current lyrics intact');
        check(lyricsImportStatus.textContent.includes('failed'), 'invalid import visible status');
        const standard = BratLyrics.parse('<tt xmlns="http://www.w3.org/ns/ttml"><body begin="1s"><div begin="2s"><p begin="3s" dur="2s"><span begin="200ms" dur="500ms">Nested</span></p></div></body></tt>');
        close(standard.rows[0].time, 6, 'standard TTML parent-relative timing');
        close(standard.rows[0].timing.words[0].start, 6.2, 'relative word start');
        close(standard.rows[0].timing.words[0].end, 6.7, 'TTML dur');
        for (const invalid of ['<tt>', '<tt><body><p begin="wrong">Bad</p></body></tt>', '<!DOCTYPE tt><tt/>']) {
            let failed = false;
            try { BratLyrics.parse(invalid, 'song.ttml'); } catch { failed = true; }
            check(failed, 'invalid TTML is rejected');
        }
        const yaml = 'version: "1.0"\nmetadata: {title: Sample, artist: Singer}\nlines:\n  - text: Hi again\n    start_ms: 1234\n    end_ms: 5000\n    words:\n      - {text: "Hi ", start_ms: 1400, end_ms: 1900}\n      - {text: again, start_ms: 3200, end_ms: 4800}';
        const transfer = new DataTransfer(); transfer.setData('text/plain', yaml);
        const paste = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: transfer });
        lyricsInput.dispatchEvent(paste);
        check(paste.defaultPrevented, 'structured paste is imported');
        close(state.timeline[0].timedWords[1].end, 4.8, 'YAML pasted native end');
        close(state.timeline[0].timestamp, 1.234, 'YAML pasted line precision');
        check(state.metadata.trackName === 'Sample', 'YAML metadata loaded');
        const badPaste = new DataTransfer(); badPaste.setData('text/plain', 'version: "2.0"\nmetadata: {}');
        const goodLyrics = lyricsInput.value;
        lyricsInput.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: badPaste }));
        check(lyricsInput.value === goodLyrics, 'invalid YAML paste is non-destructive');
        return { ttmlRows: result.rows.length, explicitWordEnd: lead.timedWords[1].end, yamlLineStart: state.timeline[0].timestamp };
    });
    console.log('PASS TTML/YAML file import, paste, native intervals and project persistence:', JSON.stringify(imports));
    const providers = await evaluate(async () => {
        const check = (value, message) => { if (!value) throw new Error(message); };
        const waitUntil = async predicate => {
            for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 30)); }
            throw new Error('UI request did not finish');
        };
        const originalFetch = window.fetch;
        const calls = [];
        let release;
        window.fetch = async (url, options) => {
            calls.push({ url, headers: options.headers });
            if (url.includes('lrclib.net')) {
                if (url.includes('slow')) return new Promise(resolve => { release = () => resolve(new Response(JSON.stringify([{ id: 9, trackName: 'Stale result', syncedLyrics: '[00:01] Old' }]))); });
                return new Response(JSON.stringify([{ id: 7, trackName: 'Library song', artistName: 'Singer', syncedLyrics: '[00:01] Legacy', lyricsfile: 'version: "1.0"\nmetadata: {}\nlines: [{text: Native, start_ms: 1000, end_ms: 3000, words: [{text: Native, start_ms: 1100, end_ms: 2900}]}]' }]));
            }
            if (url.includes('search.json')) return new Response(JSON.stringify({ hits: [{ isrc: 'GBABC1234567', title: 'Red song', artist: 'Singer', album: 'Album' }] }));
            if (url.endsWith('.json')) return new Response(JSON.stringify({ title: 'Red song', artist: 'Singer', duration: 12 }));
            return new Response('version: "1.0"\nmetadata: {}\nlines: [{text: Red, start_ms: 1200, end_ms: 4000, words: [{text: Red, start_ms: 1300, end_ms: 3700}]}]');
        };
        try {
            lyricsProviderSelect.value = 'lrclib';
            searchQueryInput.value = 'library song';
            await runSongSearch();
            document.querySelector('.use-lrc-btn').click();
            await waitUntil(() => state.metadata.source === 'lrclib');
            check(state.timeline[0].timedWords[0].end === 2.9, 'LRCLIB native YAML preferred');
            lyricsProviderSelect.value = 'lrc.red';
            lyricsProviderSelect.dispatchEvent(new Event('change', { bubbles: true }));
            check(!document.querySelector('.use-lrc-btn'), 'provider switch clears previous results');
            searchQueryInput.value = 'red song';
            await runSongSearch();
            check(lrclibResults.textContent.includes('lrc.red'), 'result source attribution');
            document.querySelector('.use-lrc-btn').click();
            await waitUntil(() => state.metadata.source === 'lrc.red');
            check(state.timeline[0].timedWords[0].end === 3.7, 'lrc.red native end loaded');
            check(document.querySelector('#lyricsSourceCredit a').href === 'https://lrc.red/s/GBABC1234567', 'persistent attribution links to source');
            check(!document.getElementById('lyricsSourceCredit').hidden, 'source visible after loading');
            check(!document.getElementById('stageSourceCredit').hidden, 'source attribution stays beside preview in all tabs');
            const payload = JSON.parse(JSON.stringify(buildProjectPayload()));
            lyricsProviderSelect.value = 'lrclib';
            restoreProjectSettings(payload);
            check(lyricsProviderSelect.value === 'lrc.red', 'source selection saved in project');
            check(state.timeline[0].timedWords[0].end === 3.7, 'provider native end survives restore');
            check(calls.some(call => call.headers['X-Client-ID']), 'lrc.red client identification');
            lyricsProviderSelect.value = 'lrclib';
            searchQueryInput.value = 'slow';
            const pending = runSongSearch();
            await waitUntil(() => !!release);
            lyricsProviderSelect.value = 'lrc.red';
            lyricsProviderSelect.dispatchEvent(new Event('change', { bubbles: true }));
            release(); await pending;
            check(!lrclibResults.textContent.includes('Stale result'), 'stale search ignored after provider switch');
            return { requests: calls.length, selectedProvider: lyricsProviderSelect.value, savedWordEnd: state.timeline[0].timedWords[0].end };
        } finally { window.fetch = originalFetch; }
    });
    console.log('PASS LRCLIB/lrc.red switching, loading, attribution and cancellation:', JSON.stringify(providers));
    for (const width of [1440, 390]) {
        await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 500 });
        const layout = await evaluate(() => {
            showTab('lyrics');
            const rect = lyricsProviderSelect.getBoundingClientRect();
            return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, sourceWidth: rect.width, sourceRight: rect.right };
        });
        assert.ok(layout.scrollWidth <= layout.width, 'source selector must not cause horizontal overflow');
        assert.ok(layout.sourceWidth > 0 && layout.sourceRight <= layout.width, 'source selector fits the panel');
        console.log('PASS responsive source selector:', JSON.stringify(layout));
    }
} finally {
    try { await cdp?.('Browser.close'); } catch {}
    ws?.close(); if (browser.exitCode === null) browser.kill(); server.close();
}
