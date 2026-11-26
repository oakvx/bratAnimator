// editor su telefono: menu compatto, tab in basso, pannello a mezza altezza, nessuno scroll orizzontale.
//   CHROME_PATH=/usr/bin/chromium node tests/editor-mobile-playwright.mjs
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
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const target = path.resolve(root, '.' + pathname);
    if (target !== root && !target.startsWith(root + path.sep)) return void response.writeHead(403).end();
    try {
        const file = target === root || pathname.endsWith('/') ? path.join(target, 'index.html') : target;
        response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
let failures = 0;
try {
    for (const [width, height] of [[390, 844], [320, 640]]) {
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true });
        await context.addInitScript(() => {
            try {
                sessionStorage.setItem('bratAnimator.permissionNotice.dismissed.v1', 'true');
                localStorage.setItem('bratAnimator.tutorial.seen.v1', 'true');
            } catch {}
        });
        const page = await context.newPage();
        page.setDefaultTimeout(5000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('http://127.0.0.1:' + server.address().port, { waitUntil: 'load' });
        await page.waitForFunction(() => Boolean(window.BratStudio?.show && window.BratEditorNav));
        await page.evaluate(() => { window.BratStudio.show('editor'); window.BratGuidedTour?.close(); });
        await page.waitForTimeout(400);
        const label = width + 'x' + height;
        const check = async (name, fn) => {
            try { await fn(); console.log('PASS ' + label + ' ' + name); }
            catch (error) { failures += 1; console.error('FAIL ' + label + ' ' + name + ': ' + (error.stack || error)); }
        };

        await check('no horizontal overflow', async () => {
            const m = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
            assert.ok(m.scroll <= m.inner, JSON.stringify(m));
        });
        await check('compact menu replaces the horizontal menubar', async () => {
            assert.equal(await page.locator('#editorMenuToggle').isVisible(), true);
            assert.equal(await page.locator('#editorMenuBar').isVisible(), false);
            await page.locator('#editorMenuToggle').tap();
            assert.equal(await page.locator('#editorMenuBar').isVisible(), true);
            const view = page.locator('#editorMenuBar > [aria-haspopup="true"]').nth(2);
            await view.tap();
            assert.equal(await view.getAttribute('aria-expanded'), 'true');
            assert.equal(await page.locator('#textSettingsBtn').isVisible(), true);
            await page.locator('#editorMenuToggle').tap();
            assert.equal(await page.locator('#editorMenuBar').isVisible(), false);
        });
        await check('toolbar buttons are touch sized and never clipped', async () => {
            const boxes = await page.$$eval('#editorToolbar button', nodes => nodes.map(n => {
                const r = n.getBoundingClientRect(); return { h: r.height, sw: n.scrollWidth, cw: n.clientWidth, text: n.textContent };
            }));
            for (const box of boxes) {
                assert.ok(box.h >= 40, 'toolbar button too short: ' + JSON.stringify(box));
                assert.ok(box.sw <= box.cw + 1, 'toolbar text clipped: ' + JSON.stringify(box));
            }
        });
        await check('preview is visible before opening any panel', async () => {
            assert.equal(await page.locator('#section-lyrics').isVisible(), false, 'sheet must start closed');
            const r = await page.locator('#previewCanvas').boundingBox();
            assert.ok(r && r.width > 120 && r.y >= 0 && r.y + r.height <= height, JSON.stringify(r));
        });
        await check('a bottom tab opens the panel sheet and tapping it again closes it', async () => {
            const tab = page.locator('.editor-tab[data-open-tab="style"]');
            const tabBox = await tab.boundingBox();
            assert.ok(tabBox.y > height / 2, 'tabs must sit at the bottom: ' + JSON.stringify(tabBox));
            assert.ok(tabBox.height >= 40, 'tab too short: ' + JSON.stringify(tabBox));
            await tab.tap();
            assert.equal(await page.locator('#panel').isVisible(), true);
            assert.equal(await page.locator('#section-design').isVisible(), true);
            const panel = await page.locator('#panel').boundingBox();
            assert.ok(panel.height <= height * 0.62, 'sheet taller than 62% of the screen: ' + JSON.stringify(panel));
            const canvas = await page.locator('#previewCanvas').boundingBox();
            assert.ok(canvas.y < panel.y, 'preview must stay above the sheet');
            await page.screenshot({ path: path.join(output, 'mobile-' + label + '-sheet.png') });
            await tab.tap();
            assert.equal(await page.locator('#section-design').isVisible(), false, 'sheet did not close');
        });
        await check('the sheet close button closes it', async () => {
            await page.locator('.editor-tab[data-open-tab="text"]').tap();
            assert.equal(await page.locator('#editorSheetClose').isVisible(), true);
            await page.locator('#editorSheetClose').tap();
            assert.equal(await page.locator('#section-lyrics').isVisible(), false, 'sheet did not close');
        });
        await check('menu commands open the sheet on the right tab', async () => {
            await page.locator('#editorMenuToggle').tap();
            await page.locator('#editorMenuBar > [aria-haspopup="true"]').nth(2).tap();
            await page.locator('#textSettingsBtn').tap();
            assert.equal(await page.locator('#editorMenuBar').isVisible(), false, 'menu should close after a command');
            assert.equal(await page.locator('#textSettings').isVisible(), true);
            assert.equal(await page.locator('.editor-tab[aria-selected="true"]').getAttribute('data-open-tab'), 'style');
        });
        await check('rotating to desktop width resets the phone-only state', async () => {
            await page.locator('#editorMenuToggle').tap();
            await page.setViewportSize({ width: 1280, height: 800 });
            await page.waitForTimeout(150);
            const state = await page.evaluate(() => ({
                menu: document.body.classList.contains('editor-menu-open'),
                sheet: document.body.classList.contains('editor-sheet-open'),
                bar: getComputedStyle(document.getElementById('editorMenuBar')).display
            }));
            assert.equal(state.menu, false);
            assert.equal(state.sheet, false);
            assert.notEqual(state.bar, 'none');
            assert.equal(await page.locator('#panel').isVisible(), true, 'desktop shows the side panel');
            await page.setViewportSize({ width, height });
        });
        await check('no uncaught errors', async () => assert.deepEqual(errors, []));
        await page.screenshot({ path: path.join(output, 'mobile-' + label + '-editor.png') });
        await context.close();
    }
} finally {
    await browser.close();
    server.close();
}
if (failures) { console.error(failures + ' mobile check(s) failed'); process.exit(1); }
