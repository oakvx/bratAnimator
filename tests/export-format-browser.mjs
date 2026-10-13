// Optional actual-file browser regression audit: node tests/export-format-browser.mjs
// Requires Chrome, no npm packages. Uses an isolated TEMP browser profile.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifacts = await mkdtemp(path.join(tmpdir(), 'brat-export-format-audit-'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
    const target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try {
        const filename = target === root ? path.join(root, 'index.html') : target;
        res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(await readFile(filename));
    } catch { res.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--remote-debugging-port=0',
    `--user-data-dir=${path.join(artifacts, 'profile')}`, 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
let ws;
let closeBrowser;
let failures = 0;
const runtimeErrors = [];

try {
    let devtoolsPort;
    for (let retry = 0; retry < 120; retry += 1) {
        try { devtoolsPort = (await readFile(path.join(artifacts, 'profile', 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
        catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    assert.ok(devtoolsPort, 'Chrome DevTools did not start');
    const target = await (await fetch(`http://127.0.0.1:${devtoolsPort}/json/new?about:blank`, { method: 'PUT' })).json();
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
    let nextId = 1;
    const pending = new Map();
    ws.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        if (message.id) {
            const request = pending.get(message.id);
            if (!request) return;
            pending.delete(message.id);
            clearTimeout(request.timeout);
            message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result);
        } else if (message.method === 'Runtime.exceptionThrown') {
            runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
        }
    });
    const cdp = (method, params = {}) => new Promise((resolve, reject) => {
        const id = nextId++;
        const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 90000);
        pending.set(id, { resolve, reject, timeout });
        ws.send(JSON.stringify({ id, method, params }));
    });
    closeBrowser = () => cdp('Browser.close');
    const evaluate = async (fn, ...args) => {
        const result = await cdp('Runtime.evaluate', { expression: `(${fn.toString()})(...${JSON.stringify(args)})`, awaitPromise: true, returnByValue: true });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
        return result.result.value;
    };
    const test = async (name, fn) => {
        try { console.log(`PASS ${name}: ${JSON.stringify(await fn())}`); }
        catch (error) { failures += 1; console.error(`FAIL ${name}: ${error.stack || error}`); }
    };
    await cdp('Page.enable');
    await cdp('Runtime.enable');
    await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('bratAnimator.permissionNotice.dismissed.v1','true');localStorage.setItem('bratAnimator.tutorial.seen.v1','true');` });
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp('Page.navigate', { url: origin });
    let ready = false;
    for (let retry = 0; retry < 100; retry += 1) {
        ready = await evaluate(() => typeof exportVideo === 'function' && typeof BratTiming !== 'undefined' && document.readyState === 'complete');
        if (ready) break;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'app did not load');
    await evaluate(() => {
        window.auditAssert = (condition, detail) => { if (!condition) throw new Error(detail); };
        window.auditSelect = (preset, base = 1080, quick = false) => {
            exportSizeSelect.value = String(base);
            exportSizeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            if (quick) document.querySelector(`[data-preset-quick="${preset}"]`).click();
            else {
                formatPresetSelect.value = preset;
                formatPresetSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return { selected: formatPresetSelect.value, dimensions: getExportDimensions(), preview: { width: previewCanvas.width, height: previewCanvas.height }, label: document.getElementById('stageFormatLabel').textContent };
        };
        window.auditDecode = async ({ blob, filename }) => {
            auditAssert(blob.size > 0, `empty export ${filename}`);
            if (blob.type === 'image/png') {
                const image = await createImageBitmap(blob);
                const result = { filename, type: blob.type, bytes: blob.size, width: image.width, height: image.height };
                image.close();
                return result;
            }
            const video = document.createElement('video');
            const url = URL.createObjectURL(blob);
            try {
                const loaded = new Promise((resolve, reject) => {
                    const timer = setTimeout(() => reject(new Error(`metadata timed out: ${filename}`)), 15000);
                    video.onloadedmetadata = () => { clearTimeout(timer); resolve(); };
                    video.onerror = () => { clearTimeout(timer); reject(new Error(`video decode failed ${filename}: ${video.error?.message}`)); };
                });
                video.src = url;
                await loaded;
                return { filename, type: blob.type, bytes: blob.size, width: video.videoWidth, height: video.videoHeight };
            } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
        };
        window.auditExport = async kind => {
            const captured = new Promise((resolve, reject) => {
                window.auditDownloadTimeout = setTimeout(() => reject(new Error(`${kind} did not export: ${exportStatus.textContent}`)), 60000);
                downloadBlob = (blob, filename) => { clearTimeout(window.auditDownloadTimeout); resolve({ blob, filename }); };
            });
            const operation = kind === 'png' ? exportCurrentFramePng() : kind === 'preview' ? exportPreviewClip() : exportVideo();
            await operation;
            const result = await auditDecode(await captured);
            auditAssert(!state.exportInProgress, 'export flag not reset');
            return result;
        };
        stopPlayback();
        state.audioBuffer = null;
        state.audioAnalysis = null;
        state.background.kind = 'none';
        state.backgroundElement = null;
        state.backgroundExportSafe = true;
        includeAudioInExportCheckbox.checked = false;
        useAudioTimingCheckbox.checked = false;
        startFromZeroCheckbox.checked = false;
        state.animationMode = 'line';
        animationModeSelect.value = 'line';
        state.style.lyricsMode = 'brat';
        state.style.safeZones = false;
        exportFpsSelect.value = '24';
        lyricsInput.value = '[00:00.00] Ciao\n[00:00.10]';
        rebuildTimelineFromCurrentInputs();
        state.pausedElapsedSec = 0.05;
    });
    for (const [preset, base, width, height] of [
        ['vertical', 1080, 1080, 1920], ['story', 1080, 1080, 1920],
        ['landscape', 1080, 1920, 1080], ['square', 1080, 1080, 1080],
        ['vertical', 720, 720, 1280], ['landscape', 720, 1280, 720], ['square', 720, 720, 720]
    ]) {
        await test(`${preset} ${base} PNG has actual selected dimensions`, () => evaluate(async (preset, base, width, height) => {
            const selected = auditSelect(preset, base);
            const output = await auditExport('png');
            auditAssert(output.width === width && output.height === height, JSON.stringify({ selected, output, expected: [width, height] }));
            return { selected, output };
        }, preset, base, width, height));
        if (base === 1080) {
            await test(`${preset} ${base} encoded video has actual selected dimensions`, () => evaluate(async (preset, base, width, height) => {
                const selected = auditSelect(preset, base);
                const output = await auditExport('video');
                auditAssert(output.width === width && output.height === height, JSON.stringify({ selected, output, expected: [width, height] }));
                return { selected, output };
            }, preset, base, width, height));
        }
    }
    await test('changing only base size immediately resizes preview and exports', () => evaluate(async () => {
        auditSelect('vertical', 1080);
        exportSizeSelect.value = '720';
        exportSizeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        const output = await auditExport('png');
        auditAssert(output.width === 720 && output.height === 1280, JSON.stringify(output));
        auditAssert(previewCanvas.width === 720 && previewCanvas.height === 1280, JSON.stringify({ preview: [previewCanvas.width, previewCanvas.height], output }));
        return { preview: [previewCanvas.width, previewCanvas.height], output };
    }));
    for (const [preset, width, height] of [['square', 720, 720], ['vertical', 720, 1280], ['landscape', 1280, 720]]) {
        await test(`${preset} quick preset affects real PNG export`, () => evaluate(async (preset, width, height) => {
            const selected = auditSelect(preset, 720, true);
            const output = await auditExport('png');
            auditAssert(output.width === width && output.height === height, JSON.stringify({ selected, output }));
            return { selected, output };
        }, preset, width, height));
    }
    await test('quick preset immediately refreshes the visible format label', () => evaluate(() => {
        auditSelect('square', 1080);
        const selected = auditSelect('vertical', 1080, true);
        auditAssert(selected.label === `${selected.dimensions.width} × ${selected.dimensions.height}`, JSON.stringify(selected));
        return selected;
    }));
    await test('vertical WebM preview has actual selected dimensions', () => evaluate(async () => {
        auditSelect('vertical', 720);
        const output = await auditExport('preview');
        auditAssert(output.type === 'video/webm' && output.width === 720 && output.height === 1280, JSON.stringify(output));
        return output;
    }));
    await test('cover PNG is always 3000 by 3000', () => evaluate(async () => {
        auditSelect('cover', 720, true);
        const output = await auditExport('png');
        auditAssert(output.width === 3000 && output.height === 3000, JSON.stringify(output));
        return output;
    }));
    await test('no uncaught JavaScript errors', async () => { assert.deepEqual(runtimeErrors, []); return runtimeErrors; });
} catch (error) {
    failures += 1;
    console.error(error.stack || error);
} finally {
    await closeBrowser?.().catch(() => {});
    ws?.close();
    browser.kill();
    server.close();
    console.log(`Browser artifacts: ${artifacts}`);
}
process.exitCode = failures ? 1 : 0;
