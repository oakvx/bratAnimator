// Optional v5 editor audit: node tests/editor-v5-browser.mjs (Chrome, no npm packages).
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fontPath = process.env.FONT_PATH || (process.platform === 'win32' ? 'C:\\Windows\\Fonts\\arial.ttf' : '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
const artifacts = await mkdtemp(path.join(tmpdir(), 'brat-editor-v5-'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (request, response) => {
    const target = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (target !== root && !target.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    try { const filename = target === root ? path.join(root, 'index.html') : target; response.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(await readFile(filename)); }
    catch { response.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${path.join(artifacts, 'profile')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket, cdp, failures = 0;
const runtimeErrors = [];
try {
    let port;
    for (let retry = 0; retry < 240; retry += 1) { try { port = (await readFile(path.join(artifacts, 'profile', 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); } }
    assert.ok(port, 'Chrome did not start');
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let nextId = 0;
    const pending = new Map();
    socket.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        if (message.id) { const request = pending.get(message.id); if (!request) return; pending.delete(message.id); clearTimeout(request.timeout); message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result); }
        else if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    });
    cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 60000); pending.set(id, { resolve, reject, timeout }); socket.send(JSON.stringify({ id, method, params })); });
    const evaluate = async (fn, ...args) => { const result = await cdp('Runtime.evaluate', { expression: `(${fn.toString()})(...${JSON.stringify(args)})`, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
    const poll = async (fn, label, limit = 100) => { for (let attempt = 0; attempt < limit; attempt += 1) { if (await evaluate(fn)) return; await new Promise(resolve => setTimeout(resolve, 50)); } throw new Error(`Timed out: ${label}`); };
    const test = async (name, run) => { try { console.log(`PASS ${name}: ${JSON.stringify(await run())}`); } catch (error) { failures += 1; console.error(`FAIL ${name}: ${error.stack || error}`); } };
    const upload = async (selector, file) => { const document = await cdp('DOM.getDocument'); const node = await cdp('DOM.querySelector', { nodeId: document.root.nodeId, selector }); assert.ok(node.nodeId, selector); await cdp('DOM.setFileInputFiles', { nodeId: node.nodeId, files: [file] }); };
    await cdp('Page.enable'); await cdp('Runtime.enable');
    await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('bratAnimator.permissionNotice.dismissed.v1','true');localStorage.setItem('bratAnimator.tutorial.seen.v1','true');window.auditAssert=(condition,detail)=>{if(!condition)throw new Error(detail)};` });
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await cdp('Page.navigate', { url: origin });
    await poll(() => document.readyState === 'complete' && !!window.BratEditor, 'v5 editor ready');
    await evaluate(() => window.BratStudio.show('editor'));
    await test('fresh startup and simple/advanced preference', () => evaluate(() => {
        if (document.body.dataset.uiMode !== 'simple') throw new Error(`Fresh users should start simple, got ${document.body.dataset.uiMode}`);
        const select = document.getElementById('editorModeSelect'); select.value = 'advanced'; select.dispatchEvent(new Event('change', { bubbles: true }));
        if (document.body.dataset.uiMode !== 'advanced' || localStorage.getItem('bratAnimator.editorMode') !== 'advanced') throw new Error('advanced mode not persisted');
        return { mode: document.body.dataset.uiMode };
    }));
    await evaluate(() => {
        window.auditAssert = (condition, detail) => { if (!condition) throw new Error(detail); };
        window.auditInput = (id, value, event = 'change') => { const input = document.getElementById(id); if (input.type === 'checkbox') input.checked = value; else input.value = String(value); input.dispatchEvent(new Event(event, { bubbles: true })); };
        window.auditHash = canvas => { let hash = 2166136261; for (const byte of canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data) hash = Math.imul(hash ^ byte, 16777619); return hash >>> 0; };
        window.auditDownload = action => new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`download timeout: ${exportStatus.textContent} / ${document.getElementById('packageStatus').textContent}`)), 30000); downloadBlob = (blob, filename) => { clearTimeout(timer); window.auditLastDownload = { blob, filename }; resolve({ blob, filename }); }; action(); });
        auditInput('editorModeSelect', 'advanced');
        stopPlayback();
        restoreProjectSettings(BratCore.migrateProjectPayload({ version: 5, lyrics: '[00:00.00] this first phrase is intentionally long enough to wrap across several visual rows in the preview and remain readable\n[00:02.00] second phrase\n[00:04.00] final phrase', style: { fontScale: 1, blur: 0, lyricsMode: 'brat', safeZones: false }, animationMode: 'line', exportSize: '720', exportFps: '24', formatPreset: 'square', seed: 1234 }));
        startFromZeroCheckbox.checked = false; useAudioTimingCheckbox.checked = false; includeAudioInExportCheckbox.checked = false;
        seekTo(0.8); document.querySelector('[data-open-tab="design"]').click();
    });
    await test('global and selected phrase controls persist independently', () => evaluate(() => {
        auditInput('styleScopeSelect', 'project'); auditInput('fontScaleInput', 55, 'input'); auditInput('textColorInput', '#112233', 'input');
        auditAssert(Math.abs(state.style.fontScale - 0.55) < 0.001, 'global size');
        const first = state.lyricRows[0].id;
        auditInput('phraseSelect', first); auditInput('fontScaleInput', 35, 'input'); auditInput('textColorInput', '#aa2233', 'input');
        auditAssert(Math.abs(state.lyricRows[0].style.fontScale - 0.35) < 0.001, 'selected size missing');
        auditAssert(state.style.fontScale === 0.55 && state.style.textColor === '#112233', 'global defaults overwritten');
        const saved = structuredClone(buildProjectPayload()); restoreProjectSettings(saved);
        auditAssert(state.lyricRows[0].id === first && state.lyricRows[0].style.textColor === '#aa2233' && state.lyricRows[0].style.fontScale === 0.35, 'phrase settings not restored');
        return { global: state.style.fontScale, selected: state.lyricRows[0].style.fontScale, id: first };
    }));
    await test('row shift, duplicate, split, merge and undo preserve phrase identities and metadata', () => evaluate(() => {
        document.querySelector('[data-open-tab="lyrics"]').click();
        const original = structuredClone(buildProjectPayload()); const first = state.lyricRows[0]; first.translation = 'prima traduzione'; first.style.textColor = '#aa2233';
        refreshFromRows(state.lyricRows); setSelectedRowIndexes([0]);
        document.getElementById('shiftSelectedForwardBtn').click();
        auditAssert(state.lyricRows[0].id === first.id && state.lyricRows[0].time === 0.25, 'shift lost ID or timestamp');
        document.getElementById('duplicateLrcRowBtn').click();
        const duplicate = state.lyricRows.find(row => row.id !== first.id && row.text === first.text);
        auditAssert(duplicate && duplicate.id !== first.id && duplicate.translation === first.translation && duplicate.style.textColor === first.style.textColor, 'duplicate metadata');
        document.getElementById('undoBtn').click(); setSelectedRowIndexes([0]); renderLrcRows();
        const input = document.querySelector('.lrc-row[data-index="0"] .lrc-text'); input.focus(); input.setSelectionRange(10, 10); document.getElementById('splitLrcRowBtn').click();
        auditAssert(state.lyricRows[0].id === first.id && state.lyricRows[0].translation === 'prima traduzione', 'split first identity/translation');
        auditAssert(state.lyricRows[1].id !== first.id && !state.lyricRows[1].translation && state.lyricRows[1].style.textColor === '#aa2233', 'split second metadata');
        state.lyricRows[1].translation = 'seconda parte'; refreshFromRows(state.lyricRows); setSelectedRowIndexes([0]); document.getElementById('mergeLrcRowBtn').click();
        auditAssert(state.lyricRows[0].id === first.id && state.lyricRows[0].translation.includes('prima traduzione') && state.lyricRows[0].translation.includes('seconda parte'), 'merge metadata');
        const result = { count: state.lyricRows.length, id: state.lyricRows[0].id, translation: state.lyricRows[0].translation };
        restoreProjectSettings(original); return result;
    }));
    await test('plain and LRC translations associate and expose unmatched rows for manual assignment', () => evaluate(() => {
        const original = structuredClone(buildProjectPayload());
        auditInput('translationImportInput', 'prima\nseconda\nterza', 'input'); document.getElementById('associateTranslationsBtn').click();
        auditAssert(state.lyricRows.every((row, index) => row.translation === ['prima','seconda','terza'][index]), 'plain translation order');
        auditInput('translationImportInput', '[00:02.01] seconda aggiornata\n[00:09.00] da assegnare', 'input'); document.getElementById('associateTranslationsBtn').click();
        auditAssert(state.lyricRows[1].translation === 'seconda aggiornata', '20ms LRC matching');
        auditAssert(document.querySelectorAll('#unmatchedTranslations button').length === 1, 'unmatched row not exposed');
        auditInput('phraseSelect', state.lyricRows[2].id); document.querySelector('#unmatchedTranslations button').click();
        auditAssert(state.lyricRows[2].translation === 'da assegnare', 'manual assignment');
        const result = state.lyricRows.map(row => row.translation); restoreProjectSettings(original); return result;
    }));
    await test('tilted elastic preset keeps stable distinct angles for every wrapped visual row', () => evaluate(() => {
        auditInput('phraseSelect', state.lyricRows[0].id); document.getElementById('tiltedElasticBtn').click(); seekTo(0.8);
        const current = BratEditor.currentLayout(); const angles = current.layout.rows.map(row => row.angle);
        auditAssert(angles.length > 1 && new Set(angles).size === angles.length, `row angles ${JSON.stringify(angles)}`);
        auditAssert(current.style.entrance.mode === 'elastic' && current.style.entrance.duration === 320 && current.style.entrance.randomAngles && (current.row.style.animationMode || state.animationMode) === 'line', 'preset defaults');
        seekTo(1.2); auditAssert(JSON.stringify(BratEditor.currentLayout().layout.rows.map(row => row.angle)) === JSON.stringify(angles), 'seek changed angles');
        const saved = structuredClone(buildProjectPayload()); restoreProjectSettings(saved); seekTo(0.8);
        auditAssert(JSON.stringify(BratEditor.currentLayout().layout.rows.map(row => row.angle)) === JSON.stringify(angles), 'restore changed angles');
        const bounds = BratEditor.currentLayout().layout.totalBounds;
        auditAssert(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= previewCanvas.width && bounds.y + bounds.height <= previewCanvas.height, 'transformed layout clipped');
        return { rows: angles.length, angles, bounds };
    }));
    await test('preview and downloaded PNG render the same pixels', () => evaluate(async () => {
        document.querySelector('[data-open-tab="design"]').click(); seekTo(0.8); state.style.safeZones = false; renderPreviewAt(0.8);
        const before = auditHash(previewCanvas); const { blob, filename } = await auditDownload(() => document.getElementById('exportPngBtn').click());
        const bitmap = await createImageBitmap(blob); const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height; canvas.getContext('2d').drawImage(bitmap, 0, 0); bitmap.close();
        const after = auditHash(canvas); auditAssert(before === after, `PNG differs ${before}/${after}`);
        return { filename, width: canvas.width, height: canvas.height, hash: after };
    }));
    async function pointerGesture(selector, dx, dy, cancel = false) {
        const point = await evaluate(async selector => { const node = document.querySelector(selector); node.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); const rect = node.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }; }, selector);
        await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
        await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
        await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x + dx, y: point.y + dy, button: 'left', buttons: 1 });
        if (cancel) { await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); }
        await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x + dx, y: point.y + dy, button: 'left', clickCount: 1 });
    }
    await test('canvas pointer moves pause playback, create one undo entry and Escape cancels', async () => {
        await evaluate(() => { seekTo(0.8); previewCanvas.click(); window.auditBeforeStyle = JSON.stringify(state.lyricRows[0].style); window.auditBeforeUndo = state.undoStack.length; window.auditBeforeHash = auditHash(previewCanvas); const bounds = BratEditor.currentLayout().layout.totalBounds; window.auditBeforeCenter = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }; auditAssert(!document.getElementById('canvasEditOverlay').hidden, 'overlay absent'); });
        await pointerGesture('#canvasTextBox', 35, 16);
        const moved = await evaluate(() => { auditAssert(!state.isPlaying, 'drag did not pause'); auditAssert(state.undoStack.length === window.auditBeforeUndo + 1, 'drag undo count'); auditAssert(JSON.stringify(state.lyricRows[0].style) !== window.auditBeforeStyle, 'drag did not change position'); const result = structuredClone(state.lyricRows[0].style); const saved = buildProjectPayload(); auditAssert(saved.lyricRows[0].style.positionX === result.positionX, 'released transform not saved in project'); renderPreviewAt(0.8); const bounds = BratEditor.currentLayout().layout.totalBounds; auditAssert(bounds.x + bounds.width / 2 > auditBeforeCenter.x + 5 && bounds.y + bounds.height / 2 > auditBeforeCenter.y + 5, 'released transform not used by rendered layout'); auditAssert(auditHash(previewCanvas) !== auditBeforeHash, 'released transform did not change preview pixels'); document.getElementById('undoBtn').click(); auditAssert(JSON.stringify(state.lyricRows[0].style) === window.auditBeforeStyle, 'undo did not restore'); seekTo(0.8); auditAssert(auditHash(previewCanvas) === auditBeforeHash, 'undo did not restore preview pixels'); previewCanvas.click(); window.auditBeforeUndo = state.undoStack.length; return result; });
        await pointerGesture('#canvasTextBox', -28, 12, true);
        await evaluate(() => { auditAssert(state.undoStack.length === window.auditBeforeUndo && JSON.stringify(state.lyricRows[0].style) === window.auditBeforeStyle, 'Escape committed drag'); });
        return moved;
    });
    await test('corner resize, side stretch and arrow-key movement update the selected phrase', async () => {
        await evaluate(() => { seekTo(0.8); if (document.getElementById('canvasEditOverlay').hidden) previewCanvas.click(); window.auditScale = state.lyricRows[0].style.fontScale ?? state.style.fontScale; });
        await pointerGesture('[data-handle="se"]', 20, 20);
        await evaluate(() => { auditAssert(state.lyricRows[0].style.fontScale > window.auditScale, 'corner resize failed'); window.auditStretch = state.lyricRows[0].style.stretch ?? state.style.stretch; });
        await pointerGesture('[data-handle="e"]', 15, 0);
        return evaluate(() => { auditAssert(state.lyricRows[0].style.stretch > window.auditStretch, 'side stretch failed'); const box = document.getElementById('canvasTextBox'); const before = state.lyricRows[0].style.positionX ?? 0.5; box.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true })); auditAssert(state.lyricRows[0].style.positionX > before, 'keyboard move failed'); return state.lyricRows[0].style; });
    });
    await test('real TTF upload waits for loading and appears in both font selectors', async () => {
        await upload('#customFontInput', fontPath); await poll(() => state.fonts.length === 1, 'font upload');
        return evaluate(async () => { await BratAssets.awaitFonts(state.fonts); const font = state.fonts[0]; auditAssert([...fontFamilySelect.options].some(option => option.value === font.family), 'primary font option missing'); auditAssert([...document.getElementById('translationFontSelect').options].some(option => option.value === font.family), 'translation font option missing'); auditAssert(!!await loadMediaBlob(font.assetId), 'font blob not persisted'); return font; });
    });
    // A real WAV with a different frequency after 1 s catches cropped audio that starts at zero.
    const rate = 24000, duration = 6, wav = Buffer.alloc(44 + rate * duration * 2);
    wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
    for (let index = 0; index < rate * duration; index += 1) wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * (index < rate ? 440 : 880) * index / rate) * 12000), 44 + index * 2);
    const audioPath = path.join(artifacts, 'tone.wav'); await writeFile(audioPath, wav);
    await test('complete project UI exports and restores media, custom font, styles and translations', async () => {
        await upload('#audioFileInput', audioPath); await poll(() => !!state.audioBuffer && state.audio.assetId, 'audio decode');
        const exported = await evaluate(async () => { const result = await auditDownload(() => document.getElementById('exportPackageBtn').click()); window.auditPackage = result.blob; const unpacked = await BratAssets.importPackage(result.blob); auditAssert(unpacked.assets.length === 2, 'font/audio not bundled'); return { filename: result.filename, bytes: result.blob.size, assets: unpacked.assets.map(asset => asset.kind) }; });
        await evaluate(() => { const original = structuredClone(buildProjectPayload()); window.auditPackOriginal = original; state.lyricRows[0].text = 'temporary replacement'; const file = new File([window.auditPackage], 'roundtrip.brat.zip', { type: 'application/zip' }); const transfer = new DataTransfer(); transfer.items.add(file); const input = document.getElementById('importPackageInput'); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); });
        await poll(() => document.getElementById('packageStatus').textContent.includes('opened') || document.getElementById('packageStatus').textContent.includes('aperto'), 'package import');
        await evaluate(async () => { auditAssert(state.lyricRows[0].text === auditPackOriginal.lyricRows[0].text, 'lyrics not restored'); auditAssert(state.lyricRows[0].id === auditPackOriginal.lyricRows[0].id, 'IDs not restored'); auditAssert(state.fonts.length === 1 && state.audio.assetId !== auditPackOriginal.audio.assetId, 'asset IDs not isolated'); await BratAssets.awaitFonts(state.fonts); auditAssert(!!await loadMediaBlob(state.audio.assetId), 'audio missing after import'); });
        return exported;
    });
    await test('invalid interval is visible beside controls and blocks exporting', () => evaluate(async () => { auditInput('exportRangeCheckbox', true); auditInput('exportRangeStartInput', 3); auditInput('exportRangeEndInput', 2); auditAssert(document.getElementById('exportRangeError').textContent, 'range error absent'); auditAssert(!await BratEditor.prepareExport(), 'invalid range accepted'); auditInput('exportRangeStartInput', 1.8); auditInput('exportRangeEndInput', 2.3); auditAssert(await BratEditor.prepareExport(), 'valid range rejected'); return state.exportRange; }));
    await test('cropped MP4 encodes actual interval frames at the original animation times', () => evaluate(async () => {
        includeAudioInExportCheckbox.checked = false; auditInput('exportRangeStartInput', 1.8); auditInput('exportRangeEndInput', 2.3); exportFpsSelect.value = '24';
        const original = drawScene; const times = []; drawScene = function (ctx, width, height, time, options) { if (state.exportInProgress && ctx.canvas !== previewCanvas) times.push(time); return original(ctx, width, height, time, options); };
        let result; try { result = await auditDownload(() => document.getElementById('exportVideoBtn').click()); } finally { drawScene = original; }
        const video = document.createElement('video'); const url = URL.createObjectURL(result.blob);
        try { await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = () => reject(new Error(video.error?.message || 'decode failed')); video.src = url; }); auditAssert(Math.abs(video.duration - 0.5) < 0.15, `cropped duration ${video.duration}`); auditAssert(times.some(time => Math.abs(time - 1.8) < 0.001) && times.every(time => time >= 1.8 - 0.001 && time < 2.3 + 0.001), `absolute source times ${JSON.stringify(times)}`); return { filename: result.filename, type: result.blob.type, duration: video.duration, frames: times.length, first: times[0], last: times.at(-1), width: video.videoWidth, height: video.videoHeight }; } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
    }));
    await test('cropped audio starts at the selected source offset', () => evaluate(async () => {
        includeAudioInExportCheckbox.checked = true; auditInput('exportRangeStartInput', 1); auditInput('exportRangeEndInput', 1.7);
        const result = await auditDownload(() => document.getElementById('exportVideoBtn').click());
        const context = new AudioContext();
        try { const buffer = await context.decodeAudioData(await result.blob.arrayBuffer()); const samples = buffer.getChannelData(0); const begin = Math.floor(samples.length * 0.25), end = Math.floor(samples.length * 0.75); let crossings = 0; for (let index = begin + 1; index < end; index += 1) if (samples[index - 1] <= 0 && samples[index] > 0) crossings += 1; const frequency = crossings / ((end - begin) / buffer.sampleRate); auditAssert(Math.abs(frequency - 880) < 30, `expected cropped 880 Hz, got ${frequency}`); auditAssert(buffer.duration >= 0.55 && buffer.duration <= 1, `audio duration ${buffer.duration}`); return { filename: result.filename, type: result.blob.type, duration: buffer.duration, frequency }; } finally { await context.close(); }
    }));
    await test('Italian controls and saved editor mode survive reload', async () => {
        await evaluate(() => { const button = document.querySelector('[data-lang="it"]'); auditAssert(button, 'Italian language button missing'); button.click(); auditAssert(document.documentElement.lang === 'it', 'Italian language not applied'); auditAssert(document.getElementById('tiltedElasticBtn').textContent === 'preset inclinato elastico', 'v5 strings not localized'); saveProjectSettings(); });
        await evaluate(() => { window.auditReloadMarker = true; });
        await cdp('Page.reload', { ignoreCache: true }); await poll(() => !window.auditReloadMarker && document.readyState === 'complete' && !!window.BratEditor, 'reload');
        await evaluate(() => window.BratStudio.show('editor'));
        return evaluate(() => { const result = { language: document.documentElement.lang, mode: document.body.dataset.uiMode, savedLanguage: localStorage.getItem('bratAnimator.language'), savedMode: localStorage.getItem('bratAnimator.editorMode') }; auditAssert(result.language === 'it' && result.mode === 'advanced', `preferences lost on reload: ${JSON.stringify(result)}`); return result; });
    });
    for (const [label, width, height, mobile] of [['desktop', 1440, 1000, false], ['mobile', 390, 844, true], ['narrow', 320, 844, true]]) {
        await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
        await test(`${label} v5 settings fit viewport`, () => evaluate(async width => { document.querySelector('[data-open-tab="design"]').click(); document.getElementById('textSettings').scrollIntoView({ block: 'start', behavior: 'instant' }); window.dispatchEvent(new Event('resize')); await document.fonts.ready; await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); const offenders = [...document.querySelectorAll('body *')].filter(node => { const rect = node.getBoundingClientRect(); return rect.width > 0 && rect.right > width + 1; }).slice(0, 8).map(node => ({ tag: node.tagName, id: node.id, class: node.className, right: node.getBoundingClientRect().right })); auditAssert(document.documentElement.scrollWidth <= width + 1, `horizontal overflow ${document.documentElement.scrollWidth}/${width}: ${JSON.stringify(offenders)}`); for (const id of ['editorModeSelect','styleScopeSelect','phraseSelect','fontScaleInput','entranceModeSelect','randomAngleInput']) { const node = document.getElementById(id); const rect = node.getBoundingClientRect(); auditAssert(rect.width > 0 && rect.left >= -1 && rect.right <= innerWidth + 1, `clipped ${id}: ${JSON.stringify(rect.toJSON())}`); } return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth }; }, width));
        const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); const screenshotPath = path.join(artifacts, `${label}-editor-v5.png`); await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64')); console.log(`Screenshot: ${screenshotPath}`);
    }
    await test('no uncaught JavaScript errors', async () => { assert.deepEqual(runtimeErrors, []); return runtimeErrors; });
} catch (error) { failures += 1; console.error(error.stack || error); }
finally { await cdp?.('Browser.close').catch(() => {}); socket?.close(); browser.kill(); server.close(); console.log(`Browser artifacts: ${artifacts}`); }
process.exitCode = failures ? 1 : 0;
