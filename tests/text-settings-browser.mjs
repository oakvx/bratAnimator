// Optional Chrome regression audit: node tests/text-settings-browser.mjs
// Requires Chrome, no npm packages. Screenshots and isolated profile stay in TEMP.
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
const artifacts = await mkdtemp(path.join(tmpdir(), 'brat-text-settings-audit-'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
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
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${path.join(artifacts, 'profile')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
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
        } else if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    });
    const cdp = (method, params = {}) => new Promise((resolve, reject) => {
        const id = nextId++;
        const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
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
        ready = await evaluate(() => typeof fitTextLayout === 'function' && document.readyState === 'complete');
        if (ready) break;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'app did not load');
    await evaluate(() => window.BratStudio.show('editor'));
    await evaluate(() => {
        window.auditAssert = (condition, detail) => { if (!condition) throw new Error(detail); };
        window.auditInput = (id, value) => { const input = document.getElementById(id); input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true })); };
        window.auditHash = canvas => {
            let hash = 2166136261;
            for (const byte of canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data) hash = Math.imul(hash ^ byte, 16777619);
            return hash >>> 0;
        };
        stopPlayback();
        state.audioBuffer = null;
        state.audioAnalysis = null;
        state.background = { ...state.background, kind: 'none', target: 'background' };
        state.backgroundElement = null;
        state.backgroundExportSafe = true;
        useAudioTimingCheckbox.checked = false;
        startFromZeroCheckbox.checked = false;
        exportSizeSelect.value = '720';
        formatPresetSelect.value = 'square';
        applyFormatPreset();
        writeStyleControls({ ...state.style, fontScale: 1, lyricsMode: 'brat', safeZones: false, bgColor: '#8ace00', textColor: '#000000', colorSwap: { enabled: false }, backgroundFill: { type: 'solid', color2: '#315f4b', angle: 135 } }, 'line');
        lyricsInput.value = '[00:00.00] Una frase lunga per provare le impostazioni del testo\n[00:10.00] Torno';
        rebuildTimelineFromCurrentInputs();
        state.pausedElapsedSec = 5;
        renderPreviewAt(5);
    });
    await test('both settings triggers reopen hidden panel and focus text size', () => evaluate(() => {
        for (const id of ['textSettingsBtn', 'stageTextSettingsBtn']) {
            document.querySelector('[data-open-tab="lyrics"]').click();
            if (!panel.classList.contains('hidden')) togglePanelBtn.click();
            document.getElementById(id).click();
            auditAssert(!panel.classList.contains('hidden'), `${id} left panel hidden`);
            auditAssert(document.getElementById('section-design').classList.contains('active'), `${id} opened wrong tab`);
            auditAssert(document.getElementById('tab-design').getAttribute('aria-selected') === 'true', 'design aria-selected stale');
            auditAssert(document.activeElement === fontScaleInput, `${id} did not focus slider`);
            auditAssert(togglePanelBtn.getAttribute('aria-expanded') === 'true', 'panel aria-expanded stale');
            auditAssert(document.getElementById(id).getAttribute('aria-controls') === 'textSettings', 'trigger target missing');
        }
        return ['header', 'stage'];
    }));
    await test('10% updates preview, output, autosave and project restore', () => evaluate(async () => {
        const baseline = auditHash(previewCanvas);
        auditInput('fontScaleInput', 10);
        const smaller = auditHash(previewCanvas);
        auditAssert(baseline !== smaller, 'slider did not repaint preview');
        auditAssert(state.style.fontScale === 0.1 && fontScaleValue.textContent === '10%', 'state/output not updated');
        const payload = JSON.parse(JSON.stringify(buildProjectPayload()));
        await window.BratEditorWorkspace.flush();
        const saved = (await window.BratEditorWorkspace.store.getActive(window.BratEditorWorkspace.owner()))?.payload;
        auditAssert(payload.style.fontScale === 0.1 && saved?.style?.fontScale === 0.1, '10% not persisted to IndexedDB');
        auditInput('fontScaleInput', 100);
        restoreProjectSettings(payload);
        auditAssert(state.style.fontScale === 0.1 && fontScaleInput.value === '10' && fontScaleValue.textContent === '10%', 'restored scale/output mismatch');
        renderPreviewAt(5);
        auditAssert(auditHash(previewCanvas) === smaller, 'restored preview differs');
        return { scale: saved.style.fontScale, baseline, smaller };
    }));
    await test('presets and step buttons enforce 10–200% and disabled endpoints', () => evaluate(() => {
        for (const size of [50, 100, 125]) {
            document.querySelector(`[data-text-size="${size}"]`).click();
            auditAssert(Number(fontScaleInput.value) === size && state.style.fontScale === size / 100, `preset ${size} failed`);
            auditAssert(fontScaleValue.textContent === `${size}%`, 'preset output stale');
            for (const button of document.querySelectorAll('[data-text-size]')) auditAssert(button.getAttribute('aria-pressed') === String(Number(button.dataset.textSize) === size), 'preset aria-pressed stale');
        }
        auditInput('fontScaleInput', 12);
        textSizeDecreaseBtn.click();
        auditAssert(fontScaleInput.value === '10' && textSizeDecreaseBtn.disabled && !textSizeIncreaseBtn.disabled, 'minimum not clamped/disabled');
        textSizeDecreaseBtn.click();
        auditAssert(fontScaleInput.value === '10', 'disabled minimum changed size');
        textSizeIncreaseBtn.click();
        auditAssert(fontScaleInput.value === '15' && !textSizeDecreaseBtn.disabled, 'increase step is not five');
        auditInput('fontScaleInput', 198);
        textSizeIncreaseBtn.click();
        auditAssert(fontScaleInput.value === '200' && textSizeIncreaseBtn.disabled && !textSizeDecreaseBtn.disabled, 'maximum not clamped/disabled');
        textSizeIncreaseBtn.click();
        auditAssert(fontScaleInput.value === '200', 'disabled maximum changed size');
        textSizeDecreaseBtn.click();
        auditAssert(fontScaleInput.value === '195' && !textSizeIncreaseBtn.disabled, 'decrease step is not five');
        return { minimum: fontScaleInput.min, maximum: fontScaleInput.max, step: 5 };
    }));
    await test('reset restores text defaults and outputs while preserving colors and animation', () => evaluate(async () => {
        writeStyleControls({ ...state.style, fontFamily: 'Georgia, serif', fontScale: 0.1, blur: 0.2, verticalPosition: 0.2, stretch: 1.2, letterSpacing: 8, lineSpacing: 1.2, bgColor: '#123456', textColor: '#fedcba', wordAnimation: { mode: 'shake', intensity: 0.35, color: '#abcdef' } }, 'jitter');
        const before = { bgColor: state.style.bgColor, textColor: state.style.textColor, mode: state.animationMode, wordAnimation: { ...state.style.wordAnimation } };
        resetTextSettingsBtn.click();
        const actual = { fontFamily: state.style.fontFamily, fontScale: state.style.fontScale, blur: state.style.blur, verticalPosition: state.style.verticalPosition, stretch: state.style.stretch, letterSpacing: state.style.letterSpacing, lineSpacing: state.style.lineSpacing };
        const expected = { fontFamily: fontFamilySelect.options[0].value, fontScale: 1, blur: 1.05, verticalPosition: 0, stretch: 0.94, letterSpacing: 0, lineSpacing: 0.92 };
        auditAssert(JSON.stringify(actual) === JSON.stringify(expected), JSON.stringify(actual));
        const after = { bgColor: state.style.bgColor, textColor: state.style.textColor, mode: state.animationMode, wordAnimation: { ...state.style.wordAnimation } };
        auditAssert(JSON.stringify(after) === JSON.stringify(before), 'reset changed unrelated style');
        const outputs = ['fontScaleValue', 'blurValue', 'verticalPositionValue', 'stretchValue', 'letterSpacingValue', 'lineSpacingValue'].map(id => document.getElementById(id).textContent);
        auditAssert(JSON.stringify(outputs) === JSON.stringify(['100%', '1.05px', '0%', '94%', '0px', '92%']), JSON.stringify(outputs));
        await window.BratEditorWorkspace.flush();
        const saved = (await window.BratEditorWorkspace.store.getActive(window.BratEditorWorkspace.owner()))?.payload;
        auditAssert(saved?.style?.fontScale === 1, 'reset not saved to IndexedDB');
        return { actual, outputs };
    }));
    await test('long lyrics shrink proportionally and return to stable 100%', () => evaluate(() => {
        const ctx = document.createElement('canvas').getContext('2d');
        const text = 'Una frase piuttosto lunga che deve adattarsi alle dimensioni disponibili del video lasciando spazio intorno alle parole e mantenendo leggibile il testo.';
        const results = [];
        for (const [width, height] of [[512, 512], [1080, 1920], [1920, 1080]]) {
            state.style.fontScale = 1;
            const baseline = fitTextLayout(ctx, text, width, height);
            for (const scale of [0.1, 0.25, 0.5]) {
                state.style.fontScale = scale;
                const actual = fitTextLayout(ctx, text, width, height);
                auditAssert(Math.abs(actual.fontSize / baseline.fontSize - scale) < 1e-8, JSON.stringify({ scale, actual, baseline }));
                auditAssert(JSON.stringify(actual.lines) === JSON.stringify(baseline.lines), 'shrinking changed wrapping');
            }
            state.style.fontScale = 1;
            auditAssert(JSON.stringify(fitTextLayout(ctx, text, width, height)) === JSON.stringify(baseline), '100% layout drifted');
            results.push({ width, height, size: baseline.fontSize, lines: baseline.lines.length });
        }
        auditInput('fontScaleInput', 100);
        const baselineFrame = auditHash(previewCanvas);
        auditInput('fontScaleInput', 10);
        auditAssert(auditHash(previewCanvas) !== baselineFrame, '10% frame unchanged');
        auditInput('fontScaleInput', 100);
        auditAssert(auditHash(previewCanvas) === baselineFrame, 'returning to 100% changed frame');
        return results;
    }));
    await test('library preset restores 10% controls', () => evaluate(() => {
        auditInput('fontScaleInput', 10);
        auditInput('blurInput', 17);
        presetNameInput.value = 'text settings audit';
        savePresetBtn.click();
        const preset = loadUserPresets()[0];
        auditAssert(preset.style.fontScale === 0.1 && preset.style.blur === 0.17, 'library omitted text settings');
        auditInput('fontScaleInput', 125);
        auditInput('blurInput', 200);
        userPresetSelect.value = '0';
        loadPresetBtn.click();
        auditAssert(state.style.fontScale === 0.1 && fontScaleValue.textContent === '10%' && document.getElementById('blurValue').textContent === '0.17px', 'preset controls not restored');
        return { name: preset.name, scale: state.style.fontScale, blur: state.style.blur };
    }));
    await test('10% preview and real PNG export contain identical pixels', () => evaluate(async () => {
        writeStyleControls({ ...state.style, lyricsMode: 'brat', safeZones: false }, 'line');
        auditInput('fontScaleInput', 10);
        state.pausedElapsedSec = 5;
        renderPreviewAt(5);
        const preview = auditHash(previewCanvas);
        const originalDownload = downloadBlob;
        try {
            const download = new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('PNG export timed out')), 10000);
                downloadBlob = (blob, filename) => { clearTimeout(timer); resolve({ blob, filename }); };
            });
            await exportCurrentFramePng();
            const { blob, filename } = await download;
            const image = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            canvas.getContext('2d').drawImage(image, 0, 0);
            image.close();
            const png = auditHash(canvas);
            auditAssert(preview === png, JSON.stringify({ preview, png, filename }));
            auditAssert(canvas.width === previewCanvas.width && canvas.height === previewCanvas.height, 'export dimensions differ');
            return { filename, bytes: blob.size, width: canvas.width, height: canvas.height, preview, png };
        } finally { downloadBlob = originalDownload; }
    }));
    await test('10% music and cinematic lyrics render below the old 18px floor', () => evaluate(() => {
        const results = {};
        for (const mode of ['music', 'beautiful']) {
            writeStyleControls({ ...state.style, lyricsMode: mode, fontScale: 0.1 });
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 720;
            const ctx = canvas.getContext('2d');
            const sizes = [];
            const original = ctx.fillText;
            ctx.fillText = function (...args) {
                sizes.push(Number(this.font.match(/([\d.]+)px/)[1]));
                return original.apply(this, args);
            };
            drawScene(ctx, 720, 720, 5, { guides: false });
            auditAssert(sizes.length > 0 && Math.max(...sizes) < 18, JSON.stringify({ mode, sizes }));
            results[mode] = { min: Math.min(...sizes), max: Math.max(...sizes), calls: sizes.length };
        }
        writeStyleControls({ ...state.style, lyricsMode: 'brat' }, 'line');
        return results;
    }));
    const locales = {
        en: { settings: 'settings', textSettings: 'text settings', textSize: 'text size', smallerText: 'smaller text', largerText: 'larger text', resetTextSettings: 'reset text' },
        it: { settings: 'impostazioni', textSettings: 'impostazioni testo', textSize: 'dimensione testo', smallerText: 'riduci testo', largerText: 'ingrandisci testo', resetTextSettings: 'ripristina testo' },
        ru: { settings: 'настройки', textSettings: 'настройки текста', textSize: 'размер текста', smallerText: 'уменьшить текст', largerText: 'увеличить текст', resetTextSettings: 'сбросить настройки текста' },
        zh: { settings: '设置', textSettings: '文字设置', textSize: '文字大小', smallerText: '缩小文字', largerText: '放大文字', resetTextSettings: '重置文字设置' }
    };
    for (const [label, width, height, mobile] of [['desktop', 1440, 900, false], ['mobile', 390, 844, true], ['narrow', 320, 844, true]]) {
        await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
        await new Promise(resolve => setTimeout(resolve, 100));
        for (const [language, expected] of Object.entries(locales)) {
            await test(`${label} ${language} localized settings fit viewport`, () => evaluate(async (language, expected, viewportWidth) => {
                document.querySelector(`[data-lang="${language}"]`).click();
                document.getElementById('textSettingsBtn').click();
                window.dispatchEvent(new Event('resize'));
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                auditAssert(document.getElementById('textSettingsBtn').textContent === expected.settings, 'header translation missing');
                auditAssert(document.getElementById('stageTextSettingsBtn').textContent === expected.textSettings, 'stage translation missing');
                auditAssert(document.querySelector('#textSettings legend').textContent === expected.textSettings, 'legend translation missing');
                auditAssert(document.querySelector('label[for="fontScaleInput"]').textContent === expected.textSize, 'size label translation missing');
                auditAssert(textSizeDecreaseBtn.getAttribute('aria-label') === expected.smallerText, 'decrease aria-label untranslated');
                auditAssert(textSizeIncreaseBtn.getAttribute('aria-label') === expected.largerText, 'increase aria-label untranslated');
                auditAssert(resetTextSettingsBtn.textContent === expected.resetTextSettings, 'reset translation missing');
                auditAssert(document.querySelector('.text-size-presets').getAttribute('aria-label') === expected.textSize, 'preset aria-label untranslated');
                for (const id of fontScaleInput.getAttribute('aria-describedby').split(/\s+/)) auditAssert(Boolean(document.getElementById(id)?.textContent), `missing description ${id}`);
                const trigger = document.getElementById('textSettingsBtn');
                const rect = trigger.getBoundingClientRect();
                const legend = document.querySelector('#textSettings legend').getBoundingClientRect();
                const header = document.querySelector('.topbar').getBoundingClientRect();
                auditAssert(rect.width > 0 && rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1, `clipped settings trigger: ${JSON.stringify(rect.toJSON())}`);
                auditAssert(legend.top >= header.bottom - 1 && legend.bottom <= innerHeight, `settings legend behind header: ${JSON.stringify({ legend: legend.toJSON(), header: header.toJSON() })}`);
                auditAssert(trigger.scrollWidth <= trigger.clientWidth + 1, 'settings trigger text clipped');
                auditAssert(innerWidth <= viewportWidth + 1 && document.documentElement.scrollWidth <= viewportWidth + 1, JSON.stringify({ requestedWidth: viewportWidth, width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
                return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, trigger: rect.toJSON(), language: document.documentElement.lang };
            }, language, expected, width));
        }
        await evaluate(() => { document.querySelector('[data-lang="en"]').click(); document.getElementById('textSettingsBtn').click(); auditInput('fontScaleInput', 50); });
        await new Promise(resolve => setTimeout(resolve, 180));
        const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        const screenshotPath = path.join(artifacts, `${label}-text-settings.png`);
        await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
        console.log(`Screenshot: ${screenshotPath}`);
    }
    await test('Italian UI and language switching preserve lyrics and user labels', () => evaluate(async () => {
        const originalLyrics = lyricsInput.value;
        const originalPlainLyrics = plainLyricsInput.value;
        const results = document.getElementById('lrclibResults');
        const song = document.createElement('div');
        song.className = 'result-title'; song.textContent = 'green'; results.append(song);
        const snapshot = document.createElement('div'); snapshot.className = 'snapshot-details';
        const title = document.createElement('strong'); title.textContent = 'play'; snapshot.append(title); document.getElementById('snapshotList').append(snapshot);
        const preset = new Option('help', 'translation-preservation-test'); document.getElementById('userPresetSelect').append(preset);
        try {
            window.BratI18n.applyLanguage('it');
            await new Promise(resolve => setTimeout(resolve, 30));
            auditAssert(document.getElementById('cleanLrcBtn').textContent === 'pulisci LRC', 'legacy UI remains English');
            auditAssert(document.getElementById('tiltedElasticBtn').textContent === 'preset inclinato elastico', 'v5 UI untranslated');
            auditAssert(document.getElementById('stageZoomInBtn').getAttribute('aria-label') === 'aumenta zoom anteprima', 'accessible UI untranslated');
            auditAssert(lyricsInput.value === originalLyrics && plainLyricsInput.value === originalPlainLyrics, 'editable lyrics changed during translation');
            auditAssert(song.textContent === 'green' && title.textContent === 'play' && preset.textContent === 'help', 'user labels were translated');
            for (const language of ['en', 'ru', 'zh', 'it', 'en']) {
                window.BratI18n.applyLanguage(language);
                await new Promise(resolve => setTimeout(resolve, 10));
                auditAssert(document.getElementById('cleanLrcBtn').textContent === (language === 'it' ? 'pulisci LRC' : 'clean LRC'), `${language} did not reverse unkeyed Italian labels`);
                auditAssert(lyricsInput.value === originalLyrics && song.textContent === 'green' && title.textContent === 'play', 'language switch changed user content');
            }
            return { language: document.documentElement.lang, lyricsUnchanged: true, userLabelsUnchanged: true };
        } finally { song.remove(); snapshot.remove(); preset.remove(); }
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
