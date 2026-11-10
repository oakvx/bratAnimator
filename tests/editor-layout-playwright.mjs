// Playwright UI audit for the actual Chrome/Chromium DOM, not CSS snapshots.
// Run from repository root: npm install --no-save --no-package-lock playwright-core
//   CHROME_PATH=/usr/bin/chromium node tests/editor-layout-playwright.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(process.env.LAYOUT_ARTIFACTS || 'artifacts/editor-layout');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
    '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (request, response) => {
    const target = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (target !== root && !target.startsWith(root + path.sep)) return void response.writeHead(403).end();
    try {
        const file = target === root ? path.join(root, 'index.html') : target;
        response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
let browser;
try {
    browser = await chromium.launch({
        headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/chromium',
        args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-background-networking']
    });
    const tabs = ['lyrics', 'timing', 'tracks', 'design', 'canvas', 'export', 'project'];
    const summary = [];
    for (const viewport of [
        { width: 1440, height: 900, name: 'desktop' },
        { width: 390, height: 844, name: 'mobile' }
    ]) {
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
        await context.addInitScript(() => {
            sessionStorage.setItem('bratAnimator.permissionNotice.dismissed.v1', 'true');
            localStorage.setItem('bratAnimator.tutorial.seen.v1', 'true');
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('http://127.0.0.1:' + server.address().port, { waitUntil: 'load' });
        await page.waitForFunction(() => Boolean(window.BratStudio?.show && window.BratMultitrackHost));
        await page.evaluate(() => window.BratStudio.show('editor'));
        await page.waitForSelector('#panel', { state: 'visible' });
        const architecture = await page.evaluate(() => ({
            groupsReady: document.body.dataset.inspectorLayout === 'organized',
            order: [...document.querySelectorAll('.editor-tabs [data-open-tab]')].map(node => node.dataset.openTab),
            moved: {
                clearProject: document.getElementById('clearSavedBtn').closest('.editor-section')?.dataset.editorTab,
                portableExport: document.getElementById('exportProjectBtn').closest('.editor-section')?.dataset.editorTab,
                safeZones: document.getElementById('safeZonesCheckbox').closest('.editor-section')?.dataset.editorTab
            },
            strayClipHeadings: [...document.querySelectorAll('#section-tracks > .section-title')].length,
            strayExportNotes: document.querySelectorAll('#section-export > .pill-note').length,
            duplicateIds: [...document.querySelectorAll('[id]')].map(n => n.id)
                .filter((id, index, ids) => ids.indexOf(id) !== index)
        }));
        assert.equal(architecture.groupsReady, true);
        assert.deepEqual(architecture.order, tabs, 'Navigation must match the editor workflow');
        assert.deepEqual(architecture.moved, {
            clearProject: 'project', portableExport: 'project', safeZones: 'canvas'
        });
        assert.equal(architecture.strayClipHeadings, 1);
        assert.equal(architecture.strayExportNotes, 0);
        assert.deepEqual(architecture.duplicateIds, []);
        console.log('EDITOR IA ' + viewport.name + ': ' + JSON.stringify(architecture));
        for (const name of tabs) {
            const tab = page.locator('[data-open-tab="' + name + '"]');
            await tab.click({ force: true });
            await page.waitForTimeout(80);
            const metrics = await page.evaluate(section => {
                const panel = document.getElementById('panel');
                const active = document.querySelector('.editor-section.active');
                const nodes = [...active.querySelectorAll('input, select, textarea, button')].filter(n => {
                    const r = n.getBoundingClientRect(), style = getComputedStyle(n);
                    return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
                });
                const overflow = nodes.filter(n => {
                    const box = n.getBoundingClientRect(), sectionBox = active.getBoundingClientRect();
                    return box.left < sectionBox.left - 2 || box.right > sectionBox.right + 2;
                }).map(n => n.id || n.outerHTML.slice(0, 80));
                const headings = [...active.querySelectorAll('.inspector-group-heading, .section-title')]
                    .filter(n => n.getBoundingClientRect().height > 0).map(n => n.textContent.trim());
                return { section, active: active.dataset.editorTab,
                    docWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
                    panelWidth: Math.round(panel.getBoundingClientRect().width),
                    sectionWidth: Math.round(active.getBoundingClientRect().width),
                    sectionHeight: active.scrollHeight,
                    sectionClientHeight: active.clientHeight,
                    overflow,
                    headings
                };
            }, name);
            assert.equal(metrics.active, name, 'Incorrect active tab');
            console.log('LAYOUT ' + viewport.name + ' ' + name + ': ' + JSON.stringify(metrics));
            summary.push({ viewport: viewport.name, ...metrics });
            await page.screenshot({ path: path.join(output, viewport.name + '-' + name + '.png'), fullPage: true });
            assert.ok(metrics.docWidth <= viewport.width + 3,
                viewport.name + ' document overflows by ' + (metrics.docWidth - viewport.width) + 'px');
            assert.deepEqual(metrics.overflow, [], viewport.name + '/' + name + ' form controls exceed inspector width');
        }
        // Select a text overlay, then an audio clip, and verify that the
        // properties inspector exposes only relevant controls.
        await page.evaluate(() => {
            window.BratMultitrackHost.apply('add-clip', {
                trackId: 'main-overlay', clip: { kind: 'text', name: 'Text for layout test',
                    start: 0, duration: 2, source: { kind: 'text', text: 'Title' } }
            });
        });
        await page.locator('[data-open-tab="tracks"]').click({ force: true });
        assert.equal(await page.locator('[data-layout-group="track-visual"]').isVisible(), true);
        assert.equal(await page.locator('[data-layout-group="track-audio"]').isVisible(), false);
        await page.screenshot({ path: path.join(output, viewport.name + '-visual-properties.png'), fullPage: true });
        await page.evaluate(() => {
            window.BratMultitrackHost.apply('add-clip', {
                trackId: 'main-audio', clip: { kind: 'audio', name: 'Audio for layout test',
                    start: 0, duration: 2, source: { kind: 'audio' } }
            });
        });
        assert.equal(await page.locator('[data-layout-group="track-visual"]').isVisible(), false);
        assert.equal(await page.locator('[data-layout-group="track-audio"]').isVisible(), true);
        await page.screenshot({ path: path.join(output, viewport.name + '-audio-properties.png'), fullPage: true });
        // The advanced editor must remain usable after controls were moved.
        await page.locator('#editorModeSelect').selectOption('advanced');
        await page.locator('[data-open-tab="design"]').click({ force: true });
        assert.equal(await page.locator('#entranceSettings').isVisible(), true);
        assert.equal(await page.locator('#textSettings').isVisible(), true);
        await page.screenshot({ path: path.join(output, viewport.name + '-advanced-design.png'), fullPage: true });
        // Real drag, undo/redo, zoom and trim on the same live canvas editor.
        await page.evaluate(() => {
            const host = window.BratMultitrackHost;
            host.replace(window.BratTracks.empty());
            host.apply('add-clip', { trackId: 'main-video', clip: {
                kind: 'image', name: 'Timeline test image', start: 1, duration: 3
            } });
            window.__timelineImageId = host.snapshot().selectedClipId;
            host.apply('add-clip', { trackId: 'main-overlay', clip: {
                kind: 'text', name: 'Timeline marker', start: 8, duration: 2,
                source: { kind: 'text', text: 'Hello' }
            } });
        });
        await page.locator('#studioTlViewport').scrollIntoViewIfNeeded();
        await page.locator('#studioTlSnap').uncheck();
        await page.waitForFunction(() =>
            document.querySelectorAll('#studioTlLanes .studio-tl-clip').length >= 2);
        const imageId = await page.evaluate(() => window.__timelineImageId);
        const image = page.locator('.studio-tl-clip[data-clip-id="' + imageId + '"]');
        const firstBounds = await image.boundingBox();
        assert.ok(firstBounds && firstBounds.width > 50, 'Timeline clip is too small to drag');
        const centerX = firstBounds.x + firstBounds.width / 2;
        const centerY = firstBounds.y + firstBounds.height / 2;
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + 96, centerY, { steps: 8 });
        await page.mouse.up();
        const at = () => page.evaluate(id => window.BratMultitrackHost.snapshot().tracks
            .flatMap(track => track.clips).find(clip => clip.id === id)?.start, imageId);
        assert.ok(Math.abs((await at()) - 3) < .08, 'Drag did not move clip from 1s to 3s');
        await page.locator('#studioTlUndo').click();
        assert.equal(await at(), 1, 'Undo failed to restore timeline clip');
        await page.locator('#studioTlRedo').click();
        assert.ok(Math.abs((await at()) - 3) < .08, 'Redo failed to replay drag');
        const zoomBefore = Number(await page.locator('#studioTlZoom').inputValue());
        await page.locator('#studioTlZoomIn').click();
        assert.ok(Number(await page.locator('#studioTlZoom').inputValue()) > zoomBefore);
        await page.locator('#studioTlFit').click();
        assert.ok(Number(await page.locator('#studioTlZoom').inputValue()) >= 12);
        await page.screenshot({
            path: path.join(output, viewport.name + '-professional-timeline.png'),
            fullPage: true
        });
        // Save a copy of the original timeline graph and verify bounded changes.
        const timelineState = await page.evaluate(() => ({
            graph: window.BratMultitrackHost.snapshot(),
            history: window.BratMultitrackHost.history(),
            width: document.documentElement.scrollWidth
        }));
        assert.ok(timelineState.history.undo > 0, 'Clip edits are missing from undo history');
        assert.ok(timelineState.width <= viewport.width + 3, 'Timeline caused body horizontal overflow');

        // Virtualization must render only clips near the current viewport,
        // even if a project contains hundreds of clips.
        await page.evaluate(() => {
            const Tracks = window.BratTracks;
            let graph = Tracks.empty();
            const lane = graph.tracks.find(track => track.id === 'main-overlay');
            for (let i = 0; i < 180; i++) {
                lane.clips.push({
                    id: 'stress-' + i, kind: 'text', name: 'Text ' + i,
                    start: 2 * i, duration: 1.5,
                    source: { kind: 'text', text: 'Sample' }
                });
            }
            window.BratMultitrackHost.replace(graph);
            document.getElementById('studioTlViewport').scrollLeft = 0;
            window.BratTimelineUI.render();
        });
        const visibleClipNodes = await page.locator('#studioTlLanes .studio-tl-clip').count();
        assert.ok(visibleClipNodes < 45,
            'Timeline virtualization rendered ' + visibleClipNodes + ' nodes from a 180-clip project');
        console.log('TIMELINE STRESS ' + viewport.name + ': 180 clips; ' +
            visibleClipNodes + ' visible DOM nodes');
        console.log('TIMELINE ' + viewport.name + ': ' + JSON.stringify({
            initialDrag: 3, undoRedo: true, zoomBefore,
            zoomAfter: Number(await page.locator('#studioTlZoom').inputValue()),
            undoDepth: timelineState.history.undo, tracks: timelineState.graph.tracks.length
        }));
        assert.deepEqual(errors, [], viewport.name + ' runtime page errors');
        await context.close();
    }
    // Localized SEO landing pages must be indexable, readable and consistent
    // with the actual free-to-use editor and publishing conditions.
    const seoContext = await browser.newContext({ viewport: { width: 1080, height: 800 } });
    const seoPage = await seoContext.newPage();
    for (const item of [
        { locale: 'en', title: 'Free Brat Video Editor Online', term: 'multitrack timeline' },
        { locale: 'it', title: 'Editor Video Brat Gratis Online', term: 'editor video gratuito' }
    ]) {
        await seoPage.goto('http://127.0.0.1:' + server.address().port + '/' + item.locale + '/',
            { waitUntil: 'load' });
        assert.ok((await seoPage.title()).includes(item.title), 'SEO title missing in ' + item.locale);
        assert.equal(await seoPage.locator('h1').isVisible(), true);
        assert.ok((await seoPage.locator('meta[name="description"]').getAttribute('content'))
            .includes(item.term), 'SEO description not in localized language');
        assert.ok((await seoPage.locator('link[rel="canonical"]').getAttribute('href'))
            .endsWith('/' + item.locale + '/'));
        const overflow = await seoPage.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 3, item.locale + ' SEO landing page exceeds viewport by ' + overflow);
        await seoPage.screenshot({ path: path.join(output, 'seo-' + item.locale + '.png'), fullPage: true });
    }
    await seoContext.close();
    console.log('LAYOUT AUDIT PASS: ' + (summary.length + 10) +
        ' screenshots, 180-clip virtualization, localized SEO, no horizontal clipping and functional tabs.');
} finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}
