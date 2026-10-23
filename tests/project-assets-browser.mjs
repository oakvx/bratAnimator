// Optional real-browser check: node tests/project-assets-browser.mjs
// Tests classic scripts under file:// and a complete font/media package in a fresh offline profile.
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fontPath = process.env.FONT_PATH || (process.platform === 'win32' ? 'C:\\Windows\\Fonts\\arial.ttf' : '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
const temporary = await mkdtemp(path.join(tmpdir(), 'brat-package-browser-'));
const pagePath = path.join(temporary, 'assets-test.html');
await writeFile(pagePath, `<!doctype html><meta charset="utf-8"><title>Brat assets test</title><script src="${pathToFileURL(path.join(root, 'vendor/fflate.min.js'))}"></script><script src="${pathToFileURL(path.join(root, 'assets/js/project-assets.js'))}"></script>`);

async function inBrowser(profileName, run) {
    const profile = path.join(temporary, profileName);
    const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
    let socket;
    let cdp;
    try {
        let port;
        for (let retry = 0; retry < 100; retry += 1) {
            try { port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
            catch { await new Promise(resolve => setTimeout(resolve, 100)); }
        }
        assert.ok(port, 'Chrome did not start');
        const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
        socket = new WebSocket(target.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
        let id = 0;
        const pending = new Map();
        const errors = [];
        socket.addEventListener('message', event => {
            const response = JSON.parse(event.data);
            if (response.id) {
                const request = pending.get(response.id);
                if (!request) return;
                pending.delete(response.id);
                clearTimeout(request.timeout);
                response.error ? request.reject(new Error(JSON.stringify(response.error))) : request.resolve(response.result);
            } else if (response.method === 'Runtime.exceptionThrown') errors.push(response.params.exceptionDetails.exception?.description || response.params.exceptionDetails.text);
        });
        cdp = (method, params = {}) => new Promise((resolve, reject) => {
            const requestId = ++id;
            const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
            pending.set(requestId, { resolve, reject, timeout });
            socket.send(JSON.stringify({ id: requestId, method, params }));
        });
        const evaluate = async (fn, ...args) => {
            const result = await cdp('Runtime.evaluate', { expression: `(${fn.toString()})(...${JSON.stringify(args)})`, awaitPromise: true, returnByValue: true });
            if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
            return result.result.value;
        };
        await cdp('Runtime.enable');
        await cdp('Network.enable');
        await cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
        await cdp('Page.navigate', { url: pathToFileURL(pagePath).href });
        let ready = false;
        for (let retry = 0; retry < 100; retry += 1) {
            ready = await evaluate(() => typeof window.BratAssets?.importPackage === 'function' && document.readyState === 'complete');
            if (ready) break;
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        assert.ok(ready, 'Local classic scripts did not load offline under file://');
        await evaluate(() => {
            window.renderFontHash = family => {
                const canvas = document.createElement('canvas');
                canvas.width = 800; canvas.height = 150;
                const context = canvas.getContext('2d');
                context.font = `48px "${family}"`;
                context.fillText('BRAT · ciao mondo · stretching 123', 10, 90);
                let hash = 2166136261;
                for (const byte of context.getImageData(0, 0, canvas.width, canvas.height).data) hash = Math.imul(hash ^ byte, 16777619);
                return hash >>> 0;
            };
        });
        const result = await run(evaluate);
        assert.deepEqual(errors, [], 'Uncaught browser errors');
        return result;
    } finally {
        await cdp?.('Browser.close').catch(() => {});
        socket?.close();
        browser.kill();
    }
}

const fontBase64 = (await readFile(fontPath)).toString('base64');
const exported = await inBrowser('source-profile', evaluate => evaluate(async encoded => {
    const font = new Blob([Uint8Array.from(atob(encoded), character => character.charCodeAt(0))], { type: 'font/ttf' });
    const metadata = await BratAssets.registerFont(font, { id: 'custom-test', name: 'custom.ttf', assetId: 'font-asset' });
    await BratAssets.awaitFonts([metadata]);
    const payload = { version: 5, lyrics: '[00:00.00] ciao mondo', fonts: [metadata], audio: { source: 'local', name: 'clip.mp3', assetId: 'audio-asset' }, background: { kind: 'none' } };
    const records = new Map([['font-asset', { blob: font, name: 'custom.ttf', kind: 'font' }], ['audio-asset', { blob: new Blob(['offline audio bytes'], { type: 'audio/mpeg' }), name: 'clip.mp3', kind: 'audio' }]]);
    const packed = await BratAssets.exportPackage(payload, async id => records.get(id));
    const bytes = new Uint8Array(await packed.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
    return { encoded: btoa(binary), metadata, hash: renderFontHash(metadata.family), size: packed.size };
}, fontBase64));

const imported = await inBrowser('fresh-offline-profile', evaluate => evaluate(async (encoded, metadata) => {
    let unavailable = false;
    try { await BratAssets.awaitFonts([metadata]); } catch (error) { unavailable = error.code === 'FONT_UNAVAILABLE'; }
    if (!unavailable) throw new Error('A fresh profile unexpectedly has the custom font');
    const packed = new Blob([Uint8Array.from(atob(encoded), character => character.charCodeAt(0))]);
    const restored = await BratAssets.importPackage(packed);
    const records = new Map(restored.assets.map(asset => [asset.id, asset]));
    await BratAssets.prepareFonts(restored.payload.fonts, async id => records.get(id));
    await BratAssets.awaitFonts(restored.payload.fonts);
    return { hash: renderFontHash(metadata.family), audio: await records.get('audio-asset').blob.text(), count: restored.assets.length, fontReady: document.fonts.check(`48px "${metadata.family}"`) };
}, exported.encoded, exported.metadata));

assert.equal(imported.hash, exported.hash, 'The packaged font must render identically in the fresh offline profile');
assert.equal(imported.audio, 'offline audio bytes');
assert.equal(imported.count, 2);
assert.equal(imported.fontReady, true);
console.log(`PASS file:// classic scripts, custom font readiness and complete package round-trip in two offline profiles (${exported.size} bytes, font hash ${imported.hash})`);
console.log(`Browser artifacts: ${temporary}`);
