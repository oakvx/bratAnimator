// Optional real-browser regression for per-phrase styles and bilingual Music/Cinematic.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profile = await mkdtemp(path.join(tmpdir(), "brat-music-editor-"));
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
const browser = spawn(process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
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
    const results = await evaluate(() => {
        const check = (condition, message) => { if (!condition) throw new Error(message); };
        lyricsInput.value = "[00:00.00] first phrase\n[00:03.00] second phrase\n[00:06.00] third phrase";
        startFromZeroCheckbox.checked = false; useAudioTimingCheckbox.checked = false;
        state.audioBuffer = null; state.audioAnalysis = null;
        rebuildTimelineFromCurrentInputs();
        state.lyricRows[0].style = { fontFamily: "monospace", fontScale: 0.55, textColor: "#ff1010" };
        state.lyricRows[1].style = { fontFamily: "Georgia", fontScale: 1.7, textColor: "#10ff10" };
        state.lyricRows[0].translation = "prima frase con una traduzione sufficientemente lunga da andare a capo e mantenere lo spazio per tutte le righe";
        state.lyricRows[1].translation = "seconda frase";
        state.style.translation = { fontScale: 0.6, fontFamily: "serif", color: "#1212ff" };
        state.style.fontScale = 1; state.style.blur = 0; state.style.musicWordHighlight = false;
        state.style.musicAlign = "center"; state.style.musicScrollPosition = 0.5;
        state.style.beautifulSideVocals = true; state.style.safeZones = false;
        state.beatEffects = BratCore.normalizeBeatEffects({ enabled: false });
        const canvas = document.createElement("canvas"); canvas.width = 390; canvas.height = 844;
        const ctx = canvas.getContext("2d");
        const originalFill = ctx.fillText.bind(ctx);
        let calls = [];
        ctx.fillText = function (text, x, y) {
            const matrix = this.getTransform();
            calls.push({ text, x: matrix.a * x + matrix.c * y + matrix.e, y: matrix.b * x + matrix.d * y + matrix.f, scale: matrix.a, font: this.font, color: this.fillStyle });
            return originalFill(text, x, y);
        };
        const result = [];
        for (const mode of ["music", "beautiful"]) {
            state.style.lyricsMode = mode; calls = [];
            drawMusicSyncedScene(ctx, 390, 844, 1, { textOnly: true });
            const first = calls.find(call => call.text.includes("first"));
            const second = calls.find(call => call.text.includes("second"));
            const translation = calls.filter(call => call.color === "#1212ff");
            check(first?.font.includes("monospace"), `${mode}: phrase font missing ${JSON.stringify(first)}`);
            check(second?.font.includes("Georgia"), `${mode}: second phrase font missing`);
            check(first.color === "#ff1010" && second.color === "#10ff10", `${mode}: phrase colors missing`);
            check(parseFloat(second.font.match(/[\d.]+px/)[0]) > parseFloat(first.font.match(/[\d.]+px/)[0]), `${mode}: phrase sizes missing`);
            check(translation.length >= 3 && translation.every(call => call.font.includes("serif")), `${mode}: translations not wrapped/independent`);
            const firstTranslations = translation.filter(call => call.text !== "seconda frase");
            check(firstTranslations.every(call => call.y > first.y), `${mode}: translation not below original`);
            check(Math.max(...firstTranslations.map(call => call.y)) < second.y - 5, `${mode}: translated groups overlap`);
            state.beatEffects = BratCore.normalizeBeatEffects({ enabled: true, source: "manual", bpm: 120, textPulse: true, pulse: 0.1 });
            calls = []; drawMusicSyncedScene(ctx, 390, 844, 1, { textOnly: true });
            check(calls.some(call => Math.abs(call.scale - 1.1) < 0.0001), `${mode}: beat pulse missing`);
            state.beatEffects.enabled = false;
            result.push({ mode, wrappedTranslationRows: firstTranslations.length, firstFont: first.font, secondFont: second.font });
        }
        return result;
    });
    console.log("PASS bilingual phrase styles and text pulses:", JSON.stringify(results));
} finally {
    try { await cdp?.("Browser.close"); } catch {}
    ws?.close(); if (browser.exitCode === null) browser.kill(); server.close();
}
