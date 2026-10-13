// Optional browser regression audit: node tests/natural-timing-browser.mjs
// Requires Chrome, no npm packages. All browser data and screenshots stay in TEMP.
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
const artifacts = await mkdtemp(path.join(tmpdir(), 'brat-natural-timing-audit-'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
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
    for (let retry = 0; retry < 100; retry += 1) {
        const ready = await evaluate(() => typeof BratTiming !== 'undefined' && typeof getVisibleTextAt === 'function' && document.readyState === 'complete');
        if (ready) break;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    await evaluate(() => {
        window.auditAssert = (condition, detail) => { if (!condition) throw new Error(detail); };
        window.auditSetLyrics = (text, mode = 'typewriter') => {
            stopPlayback();
            state.audioBuffer = null;
            state.audioAnalysis = null;
            state.background.kind = 'none';
            state.backgroundElement = null;
            writeTimingControls({ speed: 1 });
            startFromZeroCheckbox.checked = false;
            useAudioTimingCheckbox.checked = false;
            state.style.lyricsMode = 'brat';
            lyricsDisplayModeSelect.value = 'brat';
            state.animationMode = mode;
            animationModeSelect.value = mode;
            state.style.safeZones = false;
            safeZonesCheckbox.checked = false;
            state.style.backgroundFill = { type: 'solid', color2: '#315f4b', angle: 135 };
            backgroundFillTypeSelect.value = 'solid';
            lyricsInput.value = text;
            rebuildTimelineFromCurrentInputs();
            updateMeta();
        };
        window.auditFrame = (time, preview = false) => {
            const canvas = preview ? previewCanvas : document.createElement('canvas');
            canvas.width = previewCanvas.width;
            canvas.height = previewCanvas.height;
            if (preview) renderPreviewAt(time);
            else drawScene(canvas.getContext('2d', { alpha: false }), canvas.width, canvas.height, time, { guides: false });
            const bytes = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            let hash = 2166136261;
            for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619);
            return hash >>> 0;
        };
    });
    await test('short phrase leaves a stable pause and next onset intact', () => evaluate(() => {
        auditSetLyrics('[00:00.00] Ciao\n[00:10.00] Torno');
        const line = state.timeline[0];
        auditAssert(line.vocalEnd < 3 && line.slotEnd === 10 && line.displayEnd === 10, JSON.stringify(line));
        const paused = getVisibleTextAt(5);
        auditAssert(paused.text === 'Ciao' && paused.active === false, JSON.stringify(paused));
        auditAssert(getVisibleTextAt(10).line.text === 'Torno', 'next onset moved');
        return { vocalEnd: line.vocalEnd, slotEnd: line.slotEnd, paused: { text: paused.text, active: paused.active } };
    }));
    await test('prolonged vowel extends sound rather than typewriter reveal', () => evaluate(() => {
        auditSetLyrics('[00:00.00] Ciao\n[00:10.00] Torno');
        const normal = state.timeline[0].timedWords[0];
        auditSetLyrics('[00:00.00] Ciaoooooooo\n[00:10.00] Torno');
        const prolonged = state.timeline[0].timedWords[0];
        auditAssert(prolonged.end > normal.end && prolonged.revealEnd < prolonged.end, JSON.stringify({ normal, prolonged }));
        auditAssert(Math.abs(prolonged.revealEnd - normal.revealEnd) < 0.15, 'repeated vowel slowed ordinary reveal');
        return { normalEnd: normal.end, prolongedEnd: prolonged.end, revealEnd: prolonged.revealEnd };
    }));
    await test('karaoke keeps highlighted prefix between words and after vocals', () => evaluate(() => {
        auditSetLyrics('[00:00.00] Ciao, amico.\n[00:10.00] Torno');
        const line = state.timeline[0];
        const first = line.timedWords[0];
        const second = line.timedWords[1];
        auditAssert(second.start > first.end, 'comma did not create a pause');
        const ratio = getMusicHighlightRatio(line, 0, (first.end + second.start) / 2);
        auditAssert(ratio > 0 && ratio < 1, `karaoke reset in pause: ${ratio}`);
        auditAssert(getMusicHighlightRatio(line, 0, 5) === 1, 'completed line not fully highlighted');
        return { punctuationPause: second.start - first.end, ratio };
    }));
    await test('pulse, jitter and current-word effects stop after vocals', () => evaluate(() => {
        const hashes = {};
        for (const mode of ['typewriter', 'jitter', 'pulse']) {
            auditSetLyrics('[00:00.00] Ciao amico\n[00:10.00] Torno', mode);
            const first = auditFrame(5);
            const second = auditFrame(7);
            auditAssert(first === second, `${mode} still moving in final pause: ${first} vs ${second}`);
            hashes[mode] = first;
        }
        for (const mode of ['progress', 'fade', 'scale', 'pop', 'glow', 'shake', 'color']) {
            state.style.lyricsMode = 'music';
            state.style.wordAnimation.mode = mode;
            const first = auditFrame(5);
            const second = auditFrame(7);
            auditAssert(first === second, `${mode} word effect still moving in final pause`);
            hashes[`word-${mode}`] = first;
        }
        return hashes;
    }));
    await test('palette is held during pauses and explicit blank rows', () => evaluate(() => {
        const result = {};
        for (const unit of ['line', 'word', 'letter']) {
            auditSetLyrics('[00:00.00] Ciao\n[00:02.00] Buongiorno amico\n[00:04.00]\n[00:10.00] Torno');
            state.style.colorSwap = { enabled: true, unit, interval: 1 };
            const before = getPaletteStepIndex(3.99, getVisibleTextAt(3.99));
            const blank = getPaletteStepIndex(5, getVisibleTextAt(5));
            const later = getPaletteStepIndex(8, getVisibleTextAt(8));
            auditAssert(blank === before && later === blank, JSON.stringify({ unit, before, blank, later }));
            auditAssert(getVisibleTextAt(5).text === '', 'empty timestamp did not clear lyrics');
            result[unit] = { before, blank, later };
        }
        auditSetLyrics('[00:00.00] Ciao amico caro\n[00:10.00] Torno', 'phrase');
        state.style.colorSwap = { enabled: true, unit: 'word', interval: 1 };
        const phraseVisible = getVisibleTextAt(0.01);
        const phraseStep = getPaletteStepIndex(0.01, phraseVisible);
        auditAssert(phraseVisible.text === 'Ciao amico caro' && phraseStep === 0, JSON.stringify({ text: phraseVisible.text, phraseStep }));
        const secondStart = state.timeline[0].timedWords[1].start;
        const secondStep = getPaletteStepIndex(secondStart + 0.001, getVisibleTextAt(secondStart + 0.001));
        auditAssert(secondStep === 1, `phrase palette did not follow second-word onset: ${secondStep}`);
        result.phraseWords = { phraseStep, secondStep };
        state.style.colorSwap.enabled = false;
        return result;
    }));
    await test('speed control preserves explicit enhanced onsets and terminal end', () => evaluate(() => {
        auditSetLyrics('[00:00.00]<00:00.50>Ciao <00:03.00>amico<00:05.00>\n[00:10.00] Torno');
        const original = state.timeline[0].timedWords.map(word => word.start);
        timingSpeedInput.value = '2';
        timingSpeedInput.dispatchEvent(new Event('input', { bubbles: true }));
        const changed = state.timeline[0].timedWords.map(word => word.start);
        auditAssert(JSON.stringify(original) === JSON.stringify(changed), JSON.stringify({ original, changed }));
        auditAssert(state.timeline[0].vocalEnd === 5 && state.timing.speed === 2, 'explicit end moved or slider not applied');
        return { onsets: changed, vocalEnd: state.timeline[0].vocalEnd, speed: state.timing.speed };
    }));
    await test('last display uses media length even with audio-guidance disabled', () => evaluate(() => {
        auditSetLyrics('[00:00.00] Ciao');
        state.audioBuffer = { duration: 20 };
        state.audioAnalysis = { duration: 20, usable: false, frames: [] };
        useAudioTimingCheckbox.checked = false;
        rebuildTimelineFromCurrentInputs();
        auditAssert(state.timeline[0].displayEnd === 20, JSON.stringify(state.timeline[0]));
        auditAssert(getVisibleTextAt(15).text === 'Ciao' && getVisibleTextAt(15).active === false, 'last text not held until media end');
        const result = { vocalEnd: state.timeline[0].vocalEnd, displayEnd: state.timeline[0].displayEnd };
        state.audioBuffer = null;
        state.audioAnalysis = null;
        return result;
    }));
    await test('speed and lyrics language persist in JSON, autosave, snapshots and legacy restore', () => evaluate(() => {
        auditSetLyrics('[00:00.00] Ciao\n[00:10.00] Torno');
        timingLanguageSelect.value = 'it';
        timingLanguageSelect.dispatchEvent(new Event('change', { bubbles: true }));
        timingSpeedInput.value = '1.55';
        timingSpeedInput.dispatchEvent(new Event('input', { bubbles: true }));
        const payload = JSON.parse(JSON.stringify(buildProjectPayload()));
        auditAssert(payload.version === 4 && payload.timing.speed === 1.55, 'JSON missing speed');
        auditAssert(payload.timing.language === 'it', 'speed control discarded lyrics language');
        saveProjectSettings();
        const saved = JSON.parse(localStorage.getItem('bratAnimator.project.v4'));
        auditAssert(saved.timing.speed === 1.55, 'autosave missing speed');
        auditAssert(saved.timing.language === 'it', 'autosave missing lyrics language');
        snapshotNameInput.value = 'natural timing audit';
        saveSnapshot();
        const snapshot = loadSnapshots()[0].payload;
        auditAssert(snapshot.timing.speed === 1.55, 'snapshot missing speed');
        auditAssert(snapshot.timing.language === 'it', 'snapshot missing lyrics language');
        timingLanguageSelect.value = 'en';
        timingLanguageSelect.dispatchEvent(new Event('change', { bubbles: true }));
        timingSpeedInput.value = '0.5';
        timingSpeedInput.dispatchEvent(new Event('input', { bubbles: true }));
        restoreProjectSettings(payload);
        auditAssert(state.timing.speed === 1.55 && Number(timingSpeedInput.value) === 1.55, 'JSON restore failed');
        auditAssert(state.timing.language === 'it' && timingLanguageSelect.value === 'it', 'JSON language restore failed');
        restoreProjectSettings(snapshot);
        auditAssert(state.timing.language === 'it', 'snapshot language restore failed');
        const legacy = { ...payload };
        delete legacy.timing;
        restoreProjectSettings(legacy);
        auditAssert(state.timing.speed === 1 && Number(timingSpeedInput.value) === 1, 'legacy did not reset default speed');
        auditAssert(state.timing.language === 'auto' && timingLanguageSelect.value === 'auto', 'legacy language default missing');
        return { version: payload.version, savedSpeed: saved.timing.speed, savedLanguage: saved.timing.language, restoredDefault: state.timing };
    }));
    await test('language changes reweight words, preserve anchors and support undo/redo', () => evaluate(() => {
        auditSetLyrics('[00:00.00]<00:00.50>come sale <00:03.00>cuore love<00:05.00>\n[00:10.00] Torno');
        state.undoStack = [];
        state.redoStack = [];
        const starts = {};
        for (const language of ['it', 'en']) {
            timingLanguageSelect.value = language;
            timingLanguageSelect.dispatchEvent(new Event('change', { bubbles: true }));
            const line = state.timeline[0];
            auditAssert(line.timedWords[0].start === 0.5 && line.timedWords[2].start === 3 && line.vocalEnd === 5, 'language moved explicit anchors');
            starts[language] = line.timedWords[1].start;
            line.timedWords.forEach(word => auditAssert(line.chars.find(char => char.wordIndex === word.wordIndex).timestamp === word.start, 'character and word onset differ'));
        }
        auditAssert(starts.it > starts.en, 'language selection did not change pronunciation estimate');
        undoProjectChange();
        auditAssert(state.timing.language === 'it' && timingLanguageSelect.value === 'it', 'language undo failed');
        redoProjectChange();
        auditAssert(state.timing.language === 'en' && timingLanguageSelect.value === 'en', 'language redo failed');
        for (const uiLanguage of ['en', 'ru', 'zh']) {
            BratI18n.applyLanguage(uiLanguage);
            auditAssert(timingLanguageSelect.value === 'en' && state.timing.language === 'en', 'interface language changed lyrics language');
            auditAssert(document.querySelector('label[for="timingLanguageSelect"]').textContent === BratI18n.t('timingLanguage'), 'lyrics language label not translated');
        }
        BratI18n.applyLanguage('en');
        return { starts, restoredLanguage: state.timing.language };
    }));
    await test('Italian and English preview/export frames match around word boundaries', () => evaluate(() => {
        const hashes = {};
        for (const language of ['auto', 'it', 'en']) {
            auditSetLyrics('[00:00.00] come one amore\n[00:10.00] Torno', 'word');
            timingLanguageSelect.value = language;
            timingLanguageSelect.dispatchEvent(new Event('change', { bubbles: true }));
            const boundary = state.timeline[0].timedWords[1].start;
            for (const mode of ['word', 'typewriter', 'music']) {
                state.style.lyricsMode = mode === 'music' ? 'music' : 'brat';
                state.animationMode = mode === 'music' ? 'line' : mode;
                animationModeSelect.value = state.animationMode;
                state.style.colorSwap = { enabled: true, unit: 'word', interval: 1 };
                for (const time of [boundary - 0.001, boundary + 0.001]) {
                    const preview = auditFrame(time, true);
                    const exported = auditFrame(time);
                    auditAssert(preview === exported, JSON.stringify({ language, mode, time, preview, exported }));
                }
                hashes[`${language}-${mode}`] = boundary;
            }
        }
        return hashes;
    }));
    await test('preview and export scene match for the same pause frame', () => evaluate(() => {
        auditSetLyrics('[00:00.00] Ciao amico\n[00:10.00] Torno');
        const result = {};
        for (const mode of ['brat', 'music']) {
            state.style.lyricsMode = mode;
            state.style.colorSwap = { enabled: true, unit: 'word', interval: 1 };
            const preview = auditFrame(5, true);
            const exported = auditFrame(5);
            auditAssert(preview === exported, JSON.stringify({ mode, preview, exported }));
            result[mode] = preview;
        }
        return result;
    }));
    await test('restoring JSON or snapshots immediately refreshes the timing report', () => evaluate(() => {
        auditSetLyrics('[00:00.00] Ciao\n[00:10.00] Torno');
        const base = JSON.parse(JSON.stringify(buildProjectPayload()));
        const slow = { ...base, lyrics: '[00:00.00] Una frase lunga, con parole.\n[00:10.00] Torno', timing: { speed: 0.5 } };
        restoreProjectSettings(slow);
        const slowReport = document.getElementById('timingAnalysis').textContent;
        const fast = { ...base, lyrics: '[00:00.00] Ciao\n[00:10.00] Torno', timing: { speed: 2 } };
        restoreProjectSettings(fast);
        const fastReport = document.getElementById('timingAnalysis').textContent;
        const words = state.timeline.reduce((sum, line) => sum + line.analysis.wordCount, 0);
        const sung = state.timeline.reduce((sum, line) => sum + line.analysis.vocalDuration, 0).toFixed(2);
        const pause = state.timeline.reduce((sum, line) => sum + line.analysis.pauseDuration, 0).toFixed(2);
        auditAssert(slowReport !== fastReport, `restored report is stale: ${fastReport}`);
        auditAssert(fastReport.includes(`${words} words`) && fastReport.includes(`${sung}s`) && fastReport.includes(`${pause}s`), JSON.stringify({ fastReport, words, sung, pause }));
        auditAssert(state.timing.speed === 2, 'speed did not restore');
        return { slowReport, fastReport };
    }));
    await test('cinematic text freezes after terminal end near the next onset', () => evaluate(() => {
        auditSetLyrics('[00:00.00]<00:00.00>Ciao<00:09.80>\n[00:10.00] Torno');
        state.style.lyricsMode = 'beautiful';
        state.style.colorSwap.enabled = false;
        state.style.wordAnimation.mode = 'shake';
        const textFrame = time => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 500;
            const context = canvas.getContext('2d');
            drawSceneContent(context, 500, 500, time, { textOnly: true, guides: false });
            const bytes = context.getImageData(0, 0, 500, 500).data;
            let hash = 2166136261;
            let paintedPixels = 0;
            for (let index = 0; index < bytes.length; index += 1) {
                hash = Math.imul(hash ^ bytes[index], 16777619);
                if (index % 4 === 3 && bytes[index] > 0) paintedPixels += 1;
            }
            return { hash: hash >>> 0, paintedPixels };
        };
        const first = textFrame(9.8001);
        const second = textFrame(9.95);
        auditAssert(state.timeline[0].vocalEnd === 9.8, 'terminal marker was not retained');
        auditAssert(first.paintedPixels > 0 && first.hash === second.hash, JSON.stringify({ first, second }));
        return { vocalEnd: state.timeline[0].vocalEnd, first, second };
    }));
    for (const [label, width, height, mobile] of [['desktop', 1440, 900, false], ['mobile', 390, 844, true]]) {
        await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
        await evaluate(() => {
            auditSetLyrics('[00:00.00] Ciao, amico.\n[00:10.00] Ciaoooooooo');
            document.querySelector('[data-open-tab="timing"]')?.click();
            document.getElementById('advancedSyncDetails').open = true;
            window.dispatchEvent(new Event('resize'));
            renderPreviewAt(5);
        });
        await new Promise(resolve => setTimeout(resolve, 200));
        await test(`${label} layout has no horizontal overflow`, () => evaluate(() => {
            const width = window.innerWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            auditAssert(scrollWidth <= width + 1, JSON.stringify({ width, scrollWidth }));
            const language = document.getElementById('timingLanguageSelect');
            auditAssert(language && language.getBoundingClientRect().width > 0, 'lyrics language selector missing');
            return { width, scrollWidth, speedControlPresent: Boolean(document.getElementById('timingSpeedInput')), languageControlPresent: Boolean(language) };
        }));
        const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        await writeFile(path.join(artifacts, `${label}.png`), Buffer.from(screenshot.data, 'base64'));
        await evaluate(() => document.getElementById('timingSpeedInput').scrollIntoView({ block: 'center', behavior: 'instant' }));
        await new Promise(resolve => setTimeout(resolve, 100));
        await test(`${label} timing speed control is visible`, () => evaluate(() => {
            const input = document.getElementById('timingSpeedInput');
            const bounds = input.getBoundingClientRect();
            auditAssert(bounds.width > 0 && bounds.top >= 0 && bounds.bottom <= window.innerHeight, JSON.stringify(bounds.toJSON()));
            return { bounds: bounds.toJSON(), value: input.value };
        }));
        const controls = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        await writeFile(path.join(artifacts, `${label}-timing-control.png`), Buffer.from(controls.data, 'base64'));
    }
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
