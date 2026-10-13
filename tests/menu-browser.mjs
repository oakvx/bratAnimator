// Optional actual-file browser regression audit: node tests/menu-browser.mjs
// Requires Chrome, no npm packages. Uses an isolated TEMP browser profile.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifacts = await mkdtemp(path.join(tmpdir(), 'brat-menu-audit-'));
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
    await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('bratAnimator.permissionNotice.dismissed.v1','true');` });
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
        window.auditClick = id => document.getElementById(id).click();
        window.auditText = text => {
            lyricsInput.value = text;
            lyricsInput.dispatchEvent(new Event('input', { bubbles: true }));
        };
        window.auditActive = () => document.querySelector('.editor-tab.active')?.dataset.openTab;
        window.auditSet = (input, value, type = 'change') => {
            input.value = value;
            input.dispatchEvent(new Event(type, { bubbles: true }));
        };
        window.auditEffectFrame = (time, size = 320) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');
            drawScene(ctx, size, size, time, { guides: false });
            const pixels = ctx.getImageData(0, 0, size, size).data;
            let hash = 2166136261;
            for (const value of pixels) hash = Math.imul(hash ^ value, 16777619) >>> 0;
            return { canvas, pixels, hash, pixel: (x, y) => [...ctx.getImageData(x, y, 1, 1).data].slice(0, 3) };
        };
    });
    await test('first visit uses a quiet invitation, five tabs and closed advanced controls', () => evaluate(() => {
        auditAssert(document.querySelectorAll('.editor-tab').length === 5, 'wrong number of tabs');
        auditAssert(document.querySelectorAll('.editor-tab .step-number').length === 4, 'project must not be numbered');
        auditAssert(document.getElementById('tutorialOverlay').classList.contains('hidden'), 'automatic tutorial');
        auditAssert(!document.getElementById('welcomeCard').hidden, 'missing invitation');
        auditAssert(!document.querySelector('.advanced-block[open]'), 'advanced controls start open');
        auditAssert(document.getElementById('lyricsPicker').open, 'initial lyrics choice is hidden');
        auditAssert(lyricsInput.closest('#section-lyrics') && lrcDropZone.closest('#section-lyrics'), 'entry methods split');
        auditAssert(document.querySelectorAll('#lyricsInput').length === 1, 'duplicate lyrics source');
        auditAssert(formatPresetSelect.closest('#section-design'), 'format outside appearance');
        return { tabs: [...document.querySelectorAll('.tab-label')].map(n => n.textContent), invitation: true };
    }));
    const welcomeScreenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(artifacts, 'first-visit.png'), Buffer.from(welcomeScreenshot.data, 'base64'));
    await test('export dock opens review without starting a download, even with no lyrics', () => evaluate(() => {
        let downloads = 0;
        window.auditOriginalDownload = downloadBlob;
        downloadBlob = () => { downloads += 1; };
        auditClick('dockExportBtn');
        auditAssert(auditActive() === 'export' && !state.exportInProgress && !downloads, 'dock started export');
        auditClick('exportVideoBtn');
        auditAssert(auditActive() === 'lyrics', 'missing lyrics did not open Text');
        auditAssert(!document.getElementById('lyricsError').hidden && document.activeElement === lyricsInput, 'missing inline error');
        downloadBlob = window.auditOriginalDownload;
        return { downloads, active: auditActive() };
    }));
    await test('example remains available after dismissing invitation and plays from stage', () => evaluate(() => {
        auditClick('dismissWelcomeBtn');
        auditAssert(document.getElementById('welcomeCard').hidden, 'dismiss did not hide invitation');
        auditAssert(loadDemoBtn.getClientRects().length > 0, 'demo became unavailable');
        loadDemoBtn.click();
        auditAssert(state.timeline.length > 0 && document.getElementById('lyricsError').hidden, 'example not loaded');
        auditAssert(!document.getElementById('lyricsPicker').open, 'example did not compact the picker');
        auditAssert(document.activeElement === lyricsInput, 'example focus is hidden');
        playPauseBtn.click();
        auditAssert(state.isPlaying, 'stage cannot play');
        playPauseBtn.click();
        auditAssert(!state.isPlaying, 'stage cannot pause');
        return { lines: state.timeline.length };
    }));
    await test('full lyrics stay openly editable and choosing another song keeps current edits', () => evaluate(() => {
        navigateEditor('lyrics');
        auditText(Array.from({ length: 40 }, (_, i) => '[00:' + String(i).padStart(2, '0') + '.00] Editable line ' + i).join('\n'));
        const picker = document.getElementById('lyricsPicker');
        auditAssert(!picker.open && lyricsInput.getClientRects().length, 'full editor hidden after choice');
        auditAssert(lyricsInput.clientHeight >= 320 && lyricsInput.scrollHeight <= lyricsInput.clientHeight + 2, 'full lyrics require nested scrolling');
        auditAssert(!document.getElementById('cleanLrcBtn').closest('details'), 'text tools are collapsed');
        const before = lyricsInput.value;
        auditClick('lyricsPickerSummary');
        auditAssert(picker.open && loadDemoBtn.getClientRects().length, 'cannot choose other lyrics');
        auditAssert(lyricsInput.value === before, 'reopening discarded edits');
        auditClick('lyricsPickerSummary');
        navigateEditor('timing');
        auditAssert(!document.getElementById('splitLrcRowBtn').closest('details'), 'row tools are collapsed');
        auditAssert(getComputedStyle(document.getElementById('lrcRows')).maxHeight === 'none', 'line list is truncated');
        const editor = document.querySelector('.line-editor');
        auditAssert(editor.compareDocumentPosition(audioFileInput) & Node.DOCUMENT_POSITION_FOLLOWING, 'audio hides line editor');
        return { rows: state.timeline.length, editorHeight: lyricsInput.style.height };
    }));
    await test('paste, import and line edits update the same source; shifting supports undo/redo', () => evaluate(async () => {
        auditText('[00:01.00] Hello\n[00:02.00] World');
        auditAssert(state.timeline.length === 2, 'paste not parsed');
        await loadLrcFile(new File(['[00:01.00] Imported\n[00:02.00] Song'], 'test.lrc', { type: 'text/plain' }));
        auditAssert(!document.getElementById('lyricsPicker').open, 'import did not compact choices');
        auditClick('tab-timing');
        const input = document.querySelector('.lrc-row .lrc-text');
        auditSet(input, 'Edited');
        auditAssert(lyricsInput.value.includes('Edited'), 'line edit did not reach source');
        const before = lyricsInput.value;
        auditClick('shiftForwardBtn');
        auditAssert(lyricsInput.value.includes('[00:01.50]'), 'shift did not apply');
        auditClick('undoBtn');
        auditAssert(lyricsInput.value === before, 'undo lost lyrics');
        auditClick('redoBtn');
        auditAssert(lyricsInput.value.includes('[00:01.50]'), 'redo lost shift');
        return { lyrics: lyricsInput.value };
    }));
    await test('lyrics search loads into Text and YouTube links stay separate', () => evaluate(async () => {
        const original = searchLRCLIB;
        searchLRCLIB = async () => [{ artistName: 'Test artist', trackName: 'Test song', duration: 2, syncedLyrics: '[00:00.00] Found lyrics' }];
        try {
            navigateEditor('lyrics');
            auditClick('lyricsPickerSummary');
            auditSet(searchQueryInput, 'Test artist - Test song', 'input');
            await runSongSearch();
            document.querySelector('.use-lrc-btn').click();
            auditAssert(lyricsInput.value.includes('Found lyrics'), 'search selection not loaded');
            auditAssert(!document.getElementById('lyricsPicker').open, 'search choice did not compact');
            auditClick('lyricsPickerSummary');
            auditSet(searchQueryInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'input');
            await runSongSearch();
            auditAssert(!document.getElementById('useReferenceBtn').hidden, 'no reference guidance');
            auditClick('useReferenceBtn');
            auditAssert(auditActive() === 'timing' && document.getElementById('referenceDetails').open, 'wrong reference destination');
            auditAssert(document.getElementById('youtubeUrlInput').value.includes('dQw4w9WgXcQ'), 'link not transferred');
            auditAssert(lyricsInput.value.includes('Found lyrics'), 'reference flow replaced lyrics');
        } finally { searchLRCLIB = original; }
        return { active: auditActive() };
    }));
    await test('plain text can be timed manually with the existing sync tools', () => evaluate(() => {
        navigateEditor('lyrics');
        auditText('First phrase\nSecond phrase');
        plainLyricsInput.value = '';
        auditClick('manualSyncLinkBtn');
        auditAssert(auditActive() === 'timing' && plainLyricsInput.value === lyricsInput.value, 'manual sync entry did not prefill text');
        startTapSync();
        tapNextLine();
        tapNextLine();
        finishTapSync();
        auditAssert(parseLRC(lyricsInput.value, false).length === 2, 'manual sync did not write timestamps');
        document.getElementById('advancedSyncDetails').open = false;
        return { lyrics: lyricsInput.value };
    }));
    await test('all new strings and tab labels are translated in EN/RU/ZH', () => evaluate(() => {
        for (const lang of ['en', 'ru', 'zh']) {
            for (const [key, values] of Object.entries(BRAT_MENU_COPY)) {
                auditAssert(BratI18n.translations[lang][key] && values.length === 3, 'missing translation: ' + lang + '/' + key);
            }
            for (const node of document.querySelectorAll('[data-i18n]')) {
                auditAssert(BratI18n.translations[lang][node.dataset.i18n], 'untranslated label: ' + node.dataset.i18n);
            }
            BratI18n.applyLanguage(lang);
            auditAssert(document.querySelector('#tab-lyrics .tab-label').textContent === BratI18n.translate(lang, 'tabText'), 'tab not translated');
            auditAssert(document.getElementById('exportSoundSummary').textContent === BratI18n.translate(lang, 'soundSilent'), 'summary not translated');
            commandPaletteInput.value = BratI18n.translate(lang, 'reviewExport');
            renderCommandPalette();
            auditAssert(commandPaletteList.querySelector('button')?.textContent === BratI18n.translate(lang, 'reviewExport'), 'command search not translated');
        }
        BratI18n.applyLanguage('en');
        return ['en', 'ru', 'zh'];
    }));
    await test('format and audio review follows live controls', () => evaluate(() => {
        navigateEditor('design');
        auditSet(formatPresetSelect, 'vertical');
        auditSet(exportSizeSelect, '720');
        auditAssert(previewCanvas.width === 720 && previewCanvas.height === 1280, 'preview wrong size');
        auditAssert(document.getElementById('exportFormatSummary').textContent.includes('720×1280'), 'summary stale');
        auditAssert(document.getElementById('stageFormatLabel').textContent === '720 × 1280', 'stage label stale');
        navigateEditor('export');
        auditAssert(document.getElementById('exportSoundSummary').textContent.includes('Silent'), 'no-audio summary unclear');
        return { format: document.getElementById('exportFormatSummary').textContent };
    }));
    await test('project and preset JSON retain the v4 settings', () => evaluate(() => {
        const before = buildProjectPayload();
        const after = JSON.parse(JSON.stringify(before));
        auditAssert(after.version === 4, 'schema changed');
        restoreProjectSettings(after);
        auditAssert(lyricsInput.value === before.lyrics && formatPresetSelect.value === before.formatPreset, 'round trip lost settings');
        return { version: after.version };
    }));
    await test('effect controls persist, reset and undo together with the project', () => evaluate(() => {
        const before = buildProjectPayload();
        try {
            navigateEditor('design');
            document.getElementById('visualEffectsDetails').open = true;
            auditAssert(starSizeInput.disabled && shakeIntensityInput.disabled, 'disabled effects expose active sliders');
            auditSet(motionBlurInput, '55', 'input');
            auditSet(shakeModeSelect, 'impact');
            auditSet(shakeIntensityInput, '62', 'input');
            auditSet(shakeSpeedInput, '150', 'input');
            starEnabledCheckbox.click();
            auditSet(starPointsSelect, '5');
            auditSet(starSizeInput, '14', 'input');
            auditSet(starSpeedInput, '80', 'input');
            auditAssert(!starSizeInput.disabled && !shakeIntensityInput.disabled, 'enabled effects stay disabled');
            const effects = JSON.stringify(state.style.effects);
            auditAssert(state.style.effects.motionBlur === 0.55 && state.style.effects.star.points === 5, 'controls ignored');
            auditAssert(JSON.stringify(JSON.parse(localStorage.getItem('bratAnimator.project.v4')).style.effects) === effects, 'autosave lost effects');
            auditAssert(JSON.stringify(BratCore.buildPresetPayload(buildProjectPayload()).style.effects) === effects, 'preset lost effects');
            auditClick('resetVisualEffectsBtn');
            auditAssert(state.style.effects.motionBlur === 0 && !starEnabledCheckbox.checked, 'reset left effects on');
            auditClick('undoBtn');
            auditAssert(JSON.stringify(state.style.effects) === effects && starEnabledCheckbox.checked, 'undo did not restore effects');
            auditAssert(JSON.stringify(JSON.parse(localStorage.getItem('bratAnimator.project.v4')).style.effects) === effects, 'undo left autosave stale');
            return JSON.parse(effects);
        } finally { restoreProjectSettings(before); document.getElementById('visualEffectsDetails').open = false; }
    }));
    await test('star inverts actual solid, gradient, swapped and image backgrounds', () => evaluate(async () => {
        const before = buildProjectPayload();
        const originalElement = state.backgroundElement;
        try {
            auditText('[00:00.00] Test\n[00:01.00] Again');
            state.animationMode = 'phrase';
            state.style.lyricsMode = 'brat';
            state.style.effects = BratCore.normalizeVisualEffects({ star: { enabled: true, size: 0.18, x: 0.25, y: 0.18 } });
            state.style.backgroundFill = { type: 'solid', color2: '#2846a3', angle: 135 };
            state.backgroundElement = null;
            const center = { x: Math.floor(28.8 + (320 - 57.6) * 0.25), y: Math.floor(28.8 + (320 - 57.6) * 0.18) };
            const check = (label, time = 0.8) => {
                state.style.effects.star.enabled = false;
                const base = auditEffectFrame(time).pixel(center.x, center.y);
                state.style.effects.star.enabled = true;
                const inverted = auditEffectFrame(time).pixel(center.x, center.y);
                auditAssert(base.every((value, i) => Math.abs(255 - value - inverted[i]) <= 1), label + ' not inverted: ' + base + ' / ' + inverted);
                return { label, base, inverted };
            };
            const results = [check('solid')];
            state.style.backgroundFill.type = 'linear';
            results.push(check('linear'));
            state.style.backgroundFill.type = 'radial';
            results.push(check('radial'));
            state.style.colorSwap = { enabled: true, unit: 'line', interval: 1 };
            results.push(check('swapped', 1.4));
            const imageCanvas = document.createElement('canvas');
            imageCanvas.width = imageCanvas.height = 320;
            const imageCtx = imageCanvas.getContext('2d');
            imageCtx.fillStyle = '#2a547e'; imageCtx.fillRect(0, 0, 320, 320);
            const image = new Image(); image.src = imageCanvas.toDataURL(); await image.decode();
            state.background = BratCore.defaultBackground({ background: { kind: 'image', target: 'background' } });
            state.backgroundElement = image;
            results.push(check('image'));
            return results;
        } finally { state.backgroundElement = originalElement; restoreProjectSettings(before); }
    }));
    await test('star rotation, all shake modes and temporal blur affect rendered pixels', () => evaluate(() => {
        const before = buildProjectPayload();
        try {
            auditText('[00:00.00] Shake\n[00:04.00] Next');
            state.animationMode = 'phrase'; state.style.lyricsMode = 'brat';
            state.style.effects = BratCore.normalizeVisualEffects({ star: { enabled: true, size: 0.18, speed: 0.4 } });
            auditAssert(auditEffectFrame(0.6).hash !== auditEffectFrame(0.8).hash, 'star does not rotate');
            state.style.effects.star.speed = 0;
            auditAssert(auditEffectFrame(1).hash === auditEffectFrame(1.2).hash, 'zero star speed still moves');
            state.style.effects.star.enabled = false;
            for (const mode of ['soft', 'impact', 'sway']) {
                state.style.effects.shake = { mode, intensity: 0.9, speed: 1.5 };
                auditAssert(auditEffectFrame(0.08).hash !== auditEffectFrame(0.15).hash, mode + ' did not move');
            }
            const impact = state.style.effects.shake = { mode: 'impact', intensity: 1, speed: 1 };
            const early = getVisualShake(0.02, 320, 320, impact);
            const late = getVisualShake(0.8, 320, 320, impact);
            auditAssert(Math.hypot(early.x, early.y) > Math.hypot(late.x, late.y) * 100, 'impact does not decay');
            state.timeline = []; auditAssert(getVisualShake(0, 320, 320, impact).x === 0, 'impact without lyrics is invalid');
            rebuildTimelineFromCurrentInputs();
            state.style.effects.shake.mode = 'soft';
            const sharp = auditEffectFrame(0.43);
            state.style.effects.motionBlur = 0.9;
            const blurred = auditEffectFrame(0.43);
            let changed = 0;
            for (let i = 0; i < sharp.pixels.length; i += 4) if (Math.abs(sharp.pixels[i] - blurred.pixels[i]) > 3 || Math.abs(sharp.pixels[i + 1] - blurred.pixels[i + 1]) > 3) changed += 1;
            auditAssert(changed > 200, 'motion blur did not create a visible trail');
            return { changedPixels: changed };
        } finally { restoreProjectSettings(before); }
    }));
    await test('effects render identically after seeking and in preview/export across lyric modes', () => evaluate(() => {
        const before = buildProjectPayload();
        try {
            auditText('[00:00.00] Motion blur\n[00:02.00] Inverse star');
            state.style.effects = BratCore.normalizeVisualEffects({ motionBlur: 0.75, shake: { mode: 'soft' }, star: { enabled: true } });
            state.style.safeZones = false;
            const results = [];
            for (const mode of ['brat', 'music', 'beautiful']) {
                state.style.lyricsMode = mode;
                const first = auditEffectFrame(0.9, previewCanvas.width);
                auditEffectFrame(1.6);
                const second = auditEffectFrame(0.9, previewCanvas.width);
                auditAssert(first.hash === second.hash, mode + ' depends on frame history');
                renderPreviewAt(0.9);
                const pixels = previewCtx.getImageData(0, 0, previewCanvas.width, previewCanvas.height).data;
                // The preview is vertical at this point; compare to an export canvas of the same dimensions.
                const exported = document.createElement('canvas'); exported.width = previewCanvas.width; exported.height = previewCanvas.height;
                const ctx = exported.getContext('2d'); drawScene(ctx, exported.width, exported.height, 0.9, { guides: false });
                const output = ctx.getImageData(0, 0, exported.width, exported.height).data;
                auditAssert(pixels.every((value, i) => value === output[i]), mode + ' preview and export differ');
                results.push(mode);
            }
            return results;
        } finally { restoreProjectSettings(before); }
    }));
    await test('expanded effects panel is usable on desktop and narrow screens', async () => {
        const before = await evaluate(() => buildProjectPayload());
        try {
            await evaluate(() => {
                auditText('[00:00.00] brat\n[00:03.00] animator');
                auditSet(formatPresetSelect, 'square');
                writeStyleControls({ ...state.style, effects: BratCore.normalizeVisualEffects({ motionBlur: 0.55, shake: { mode: 'soft', intensity: 0.35 }, star: { enabled: true, size: 0.14 } }) });
                navigateEditor('design');
                document.getElementById('visualEffectsDetails').open = true;
                renderPreviewAt(0.8);
            });
            for (const [label, width, height] of [['desktop', 1440, 900], ['narrow', 390, 844]]) {
                await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
                await evaluate(() => {
                    const details = document.getElementById('visualEffectsDetails');
                    const area = document.querySelector('.editor-section.active');
                    area.scrollTop += details.getBoundingClientRect().top - area.getBoundingClientRect().top;
                    auditAssert(area.scrollWidth <= area.clientWidth + 1, 'effects controls overflow horizontally');
                    auditAssert(motionBlurInput.getBoundingClientRect().width > 180, 'effect slider too narrow');
                });
                await new Promise(resolve => setTimeout(resolve, 100));
                const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
                await writeFile(path.join(artifacts, 'effects-' + label + '.png'), Buffer.from(screenshot.data, 'base64'));
            }
            return { widths: [1440, 390] };
        } finally {
            await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
            await evaluate(before => { restoreProjectSettings(before); document.getElementById('visualEffectsDetails').open = false; }, before);
        }
    });
    await test('canceling destructive actions preserves the current edit', () => evaluate(() => {
        const original = window.confirm;
        const before = lyricsInput.value;
        let confirmations = 0;
        window.confirm = () => { confirmations += 1; return false; };
        try { auditClick('clearSavedBtn'); auditClick('resetBtn'); }
        finally { window.confirm = original; }
        auditAssert(confirmations === 2 && lyricsInput.value === before, 'cancel did not preserve edit');
        return { confirmations };
    }));
    await test('optional guide has four steps, traps focus and closes with Escape', async () => {
        await evaluate(() => {
            auditClick('tutorialBtn');
            auditAssert(document.getElementById('tutorialProgress').textContent === '1 / 4', 'wrong tour length');
            auditClick('tutorialNextBtn');
            auditAssert(auditActive() === 'timing', 'guide out of sync');
            document.getElementById('tutorialNextBtn').focus();
        });
        await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        await evaluate(() => auditAssert(document.activeElement.id === 'tutorialSkipBtn', 'guide focus escaped'));
        await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        return evaluate(() => {
            auditAssert(document.getElementById('tutorialOverlay').classList.contains('hidden') && document.activeElement.id === 'tutorialBtn', 'guide did not return focus');
            return { closed: true };
        });
    });
    await test('tab keys move focus and selection together', async () => {
        await evaluate(() => { auditClick('tab-lyrics'); document.getElementById('tab-lyrics').focus(); });
        await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
        return evaluate(() => {
            auditAssert(auditActive() === 'timing' && document.activeElement.id === 'tab-timing', 'arrow navigation broken');
            return { active: auditActive() };
        });
    });
    await test('utility menu and command dialog restore keyboard focus', async () => {
        await evaluate(() => {
            document.querySelector('#moreMenu > summary').click();
            auditAssert(document.getElementById('permissionLink').getClientRects().length > 0, 'permission link inaccessible');
            auditClick('commandPaletteBtn');
        });
        await new Promise(resolve => setTimeout(resolve, 80));
        await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        return evaluate(() => {
            auditAssert(document.getElementById('commandPalette').classList.contains('hidden'), 'commands did not close');
            auditAssert(document.activeElement === document.querySelector('#moreMenu > summary'), 'focus returned to hidden command button');
            return { focus: document.activeElement.tagName };
        });
    });
    await test('E shortcut opens review without rendering', async () => {
        await evaluate(() => { navigateEditor('lyrics'); document.activeElement.blur(); });
        await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'e', code: 'KeyE', windowsVirtualKeyCode: 69 });
        return evaluate(() => {
            auditAssert(auditActive() === 'export' && !state.exportInProgress, 'shortcut rendered immediately');
            return { active: auditActive() };
        });
    });
    // Encode real short exports; intercept only the file download.
    await test('video exports succeed silently and with loaded audio', () => evaluate(async () => {
        auditText('[00:00.00] Hi\n[00:00.15]');
        auditSet(formatPresetSelect, 'square');
        auditSet(exportSizeSelect, '720');
        const originalEffects = state.style.effects;
        writeStyleControls({ ...state.style, effects: BratCore.normalizeVisualEffects({ motionBlur: 0.6, shake: { mode: 'soft', intensity: 0.2 }, star: { enabled: true, size: 0.18 } }) });
        const original = downloadBlob;
        const outputs = [];
        const blobs = [];
        window.auditExportBlobs = blobs;
        downloadBlob = (blob, filename) => { blobs.push(blob); outputs.push({ bytes: blob.size, type: blob.type, filename }); };
        try {
            await exportVideo();
            auditAssert(outputs.length === 1 && outputs[0].bytes > 0, 'silent export failed: ' + exportStatus.textContent);
            const samples = 8000;
            const buffer = new ArrayBuffer(44 + samples * 2);
            const wav = new DataView(buffer);
            const ascii = (offset, text) => [...text].forEach((char, index) => wav.setUint8(offset + index, char.charCodeAt(0)));
            ascii(0, 'RIFF'); wav.setUint32(4, 36 + samples * 2, true); ascii(8, 'WAVE');
            ascii(12, 'fmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true);
            wav.setUint16(22, 1, true); wav.setUint32(24, 8000, true); wav.setUint32(28, 16000, true);
            wav.setUint16(32, 2, true); wav.setUint16(34, 16, true); ascii(36, 'data'); wav.setUint32(40, samples * 2, true);
            for (let i = 0; i < samples; i += 1) wav.setInt16(44 + i * 2, Math.sin(i * 2 * Math.PI * 440 / 8000) * 8000, true);
            await processAudioFile(new File([buffer], 'tone.wav', { type: 'audio/wav' }));
            includeAudioInExportCheckbox.checked = true;
            includeAudioInExportCheckbox.dispatchEvent(new Event('change'));
            auditAssert(shouldIncludeAudioInExport() && document.getElementById('exportSoundSummary').textContent.includes('included'), 'audio summary stale');
            await exportVideo();
            auditAssert(outputs.length === 2 && outputs[1].bytes > 0, 'audio export failed: ' + exportStatus.textContent);
            includeAudioInExportCheckbox.checked = false;
            includeAudioInExportCheckbox.dispatchEvent(new Event('change'));
            auditAssert(document.getElementById('exportSoundSummary').textContent.includes('Silent'), 'unchecked audio still promised');
            for (const blob of blobs) {
                const video = document.createElement('video');
                video.muted = true;
                const url = URL.createObjectURL(blob);
                try {
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('exported video did not decode')), 5000);
                        video.onloadeddata = () => { clearTimeout(timeout); resolve(); };
                        video.onerror = () => { clearTimeout(timeout); reject(new Error('invalid exported video')); };
                        video.src = url;
                    });
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error('exported video did not present a frame')), 5000);
                        video.requestVideoFrameCallback(() => { clearTimeout(timeout); video.pause(); resolve(); });
                        video.play().catch(error => { clearTimeout(timeout); reject(error); });
                    });
                    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d'); ctx.drawImage(video, 0, 0);
                    const radius = Math.min(canvas.width, canvas.height) * 0.18 / 2;
                    const x = Math.floor(radius + (canvas.width - radius * 2) * 0.84);
                    const y = Math.floor(radius + (canvas.height - radius * 2) * 0.18);
                    const pixel = [...ctx.getImageData(x, y, 1, 1).data].slice(0, 3);
                    const rgb = state.style.bgColor.match(/[a-f0-9]{2}/gi).map(value => parseInt(value, 16));
                    auditAssert(pixel.every((value, i) => Math.abs(value - (255 - rgb[i])) < 24), 'export ' + blobs.indexOf(blob) + ' lost inverse star: ' + pixel + ' / bg ' + rgb);
                    outputs[blobs.indexOf(blob)].starPixel = pixel;
                } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); }
            }
        } finally { downloadBlob = original; writeStyleControls({ ...state.style, effects: originalEffects }); }
        return outputs;
    }));
    const exportedFiles = await evaluate(() => Promise.all((window.auditExportBlobs || []).map(blob => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({ data: reader.result.slice(reader.result.lastIndexOf(',') + 1), type: blob.type });
        reader.readAsDataURL(blob);
    }))));
    for (const [index, file] of exportedFiles.entries()) {
        await writeFile(path.join(artifacts, 'effects-export-' + index + (file.type.includes('mp4') ? '.mp4' : '.webm')), Buffer.from(file.data, 'base64'));
    }
    for (const [label, width, height, mobile] of [
        ['desktop-1280', 1280, 720, false], ['desktop-1440', 1440, 900, false],
        ['desktop-1920', 1920, 1080, false], ['zoom-200', 720, 450, false], ['mobile', 390, 844, true]
    ]) {
        await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: label === 'zoom-200' ? 2 : 1, mobile });
        for (const section of ['lyrics', 'timing', 'design', 'export', 'project']) {
            await test(label + ' / ' + section + ' remains usable', () => evaluate(section => {
                navigateEditor(section);
                const area = document.querySelector('.editor-section.active');
                area.scrollTop = 0;
                const tabs = document.querySelector('.editor-tabs');
                auditAssert(document.documentElement.scrollWidth <= window.innerWidth + 1, 'horizontal page overflow');
                auditAssert(area.clientHeight > 80 && area.clientWidth > 200, 'unusable editing area');
                auditAssert(parseFloat(getComputedStyle(document.querySelector('.editor-tab')).fontSize) >= 13, 'small tab labels');
                auditAssert(tabs.getBoundingClientRect().height > 40, 'tabs missing');
                if (window.innerWidth > 900) {
                    const transport = document.querySelector('.stage-transport').getBoundingClientRect();
                    auditAssert(transport.top >= 0 && transport.bottom <= window.innerHeight, 'playback outside viewport');
                }
                return { area: [area.clientWidth, area.clientHeight], tabHeight: tabs.clientHeight };
            }, section));
            if (label === 'desktop-1440') {
                await new Promise(resolve => setTimeout(resolve, 350));
                const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
                await writeFile(path.join(artifacts, 'section-' + section + '.png'), Buffer.from(screenshot.data, 'base64'));
            }
        }
        await evaluate(() => navigateEditor('lyrics'));
        await new Promise(resolve => setTimeout(resolve, 350));
        const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        await writeFile(path.join(artifacts, label + '.png'), Buffer.from(screenshot.data, 'base64'));
    }
    await test('old canvas tab preference restores Appearance without changing the project', async () => {
        await evaluate(() => {
            localStorage.setItem('bratAnimator.activeSidebarTab', 'canvas');
            saveProjectSettings();
        });
        await cdp('Page.reload');
        await new Promise(resolve => setTimeout(resolve, 700));
        return evaluate(() => {
            if (document.querySelector('.editor-tab.active').dataset.openTab !== 'design') throw new Error('legacy tab not remapped');
            if (!lyricsInput.value.includes('Hi')) throw new Error('autosave lost');
            if (document.getElementById('lyricsPicker').open) throw new Error('restored lyrics picker expanded');
            if (!document.getElementById('tutorialOverlay').classList.contains('hidden')) throw new Error('tour reopened');
            return { active: document.querySelector('.editor-tab.active').dataset.openTab };
        });
    });
    await test('clearing the current project removes autosave but keeps saved snapshots', async () => {
        const result = await evaluate(() => {
            saveSnapshot();
            const snapshots = loadSnapshots().length;
            const original = window.confirm;
            window.confirm = () => true;
            try { clearSavedProject(); } finally { window.confirm = original; }
            return { snapshots, remaining: loadSnapshots().length, lyrics: lyricsInput.value, autosave: localStorage.getItem('bratAnimator.project.v4') };
        });
        assert.ok(result.snapshots > 0);
        assert.equal(result.remaining, result.snapshots);
        assert.equal(result.lyrics, '');
        assert.equal(result.autosave, null);
        assert.equal(await evaluate(() => document.getElementById('lyricsPicker').open), true);
        return result;
    });
    await test('no uncaught JavaScript errors', async () => { assert.deepEqual(runtimeErrors, []); return runtimeErrors; });
} catch (error) {
    failures += 1;
    console.error(error.stack || error);
} finally {
    await closeBrowser?.().catch(() => {});
    ws?.close();
    browser.kill();
    server.close();
    console.log('Browser artifacts: ' + artifacts);
}
process.exitCode = failures ? 1 : 0;
