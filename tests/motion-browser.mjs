// Real-canvas geometry regression. Run with node tests/motion-browser.mjs.
// Uses installed Chrome directly; no package installation or project server required.
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profile = await mkdtemp(path.join(tmpdir(), "brat-motion-canvas-"));
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const child = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
let ws;
let cdp;
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
    let sequence = 0;
    const pending = new Map();
    ws.addEventListener("message", event => {
        const message = JSON.parse(event.data);
        if (!message.id) return;
        const entry = pending.get(message.id);
        if (!entry) return;
        pending.delete(message.id);
        clearTimeout(entry.timeout);
        if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
        else entry.resolve(message.result);
    });
    cdp = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++sequence;
        const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
        pending.set(id, { resolve, reject, timeout });
        ws.send(JSON.stringify({ id, method, params }));
    });
    const source = await readFile(path.join(root, "assets/js/motion.js"), "utf8");
    await cdp("Runtime.evaluate", { expression: source });
    const result = await cdp("Runtime.evaluate", {
        returnByValue: true,
        expression: `(${function () {
            const checks = [];
            const source = "Testo 👩🏽‍🚀 e\u0301 molto lungo che si divide in righe visive 漢字かな";
            for (const [width, height] of [[320, 320], [390, 844], [1280, 720]]) {
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                for (const mode of ["stretch-x", "stretch-y", "elastic"]) {
                    const entrance = { mode, duration: 320, intensity: 0.3, randomAngles: true, angle: 15 };
                    const layout = BratMotion.createLayout(ctx, source, width, height, {
                        fontScale: 2, fontFamily: "Arial, sans-serif", stretch: 1.3, stretchY: 1.3,
                        letterSpacing: 4, positionX: 0.98, verticalPosition: -0.3, entrance
                    }, { seed: 456, lineId: "real-metrics", beatPulseMax: 0.1, translation: "Traduzione orizzontale del testo" });
                    for (const phase of [0, 0.045, 0.1, 0.16, 0.32, 1]) {
                        ctx.clearRect(0, 0, width, height);
                        ctx.font = `400 ${layout.fontSize}px ${layout.fontFamily}`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.letterSpacing = `${layout.letterSpacing}px`;
                        for (const row of layout.rows) {
                            const transform = BratMotion.getRowTransform(entrance, phase, 1, 0, row.angle);
                            ctx.save();
                            ctx.translate(row.x, row.y);
                            ctx.rotate(transform.rotation);
                            ctx.scale(layout.stretchX * transform.scaleX * 1.1, layout.stretchY * transform.scaleY * 1.1);
                            ctx.fillText(row.text, 0, 0);
                            ctx.restore();
                        }
                        ctx.font = `400 ${layout.translationFontSize}px ${layout.translationFontFamily}`;
                        for (const row of layout.translationRows) ctx.fillText(row.text, row.x, row.y);
                        const pixels = ctx.getImageData(0, 0, width, height).data;
                        let count = 0;
                        let minX = width, minY = height, maxX = 0, maxY = 0;
                        for (let y = 0; y < height; y += 1) {
                            for (let x = 0; x < width; x += 1) {
                                if (pixels[(y * width + x) * 4 + 3] < 16) continue;
                                count += 1;
                                minX = Math.min(minX, x); minY = Math.min(minY, y);
                                maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
                            }
                        }
                        if (!count) throw new Error("Expected visible text pixels");
                        if (minX < width * 0.05 - 2 || maxX > width * 0.95 + 2 || minY < height * 0.05 - 2 || maxY > height * 0.95 + 2) {
                            throw new Error(JSON.stringify({ width, height, mode, phase, minX, maxX, minY, maxY, bounds: layout.totalBounds }));
                        }
                        checks.push({ width, height, mode, phase, rows: layout.rows.length });
                    }
                }
            }
            const ctx = document.createElement("canvas").getContext("2d");
            const first = BratMotion.createLayout(ctx, source, 390, 390, { entrance: { randomAngles: true } }, { seed: 12, lineId: "same" });
            const second = BratMotion.createLayout(ctx, source, 390, 390, { entrance: { randomAngles: true } }, { seed: 12, lineId: "same" });
            if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("Canvas layout changed across repeat rendering");
            return { frames: checks.length, sizes: 3, modes: 3, deterministic: true };
        }.toString()})()`
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    console.log("PASS actual Chrome canvas geometry:", JSON.stringify(result.result.value));
} finally {
    try { await cdp?.("Browser.close"); } catch {}
    ws?.close();
    if (child.exitCode === null) child.kill();
}
