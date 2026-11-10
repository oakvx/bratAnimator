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
        assert.deepEqual(errors, [], viewport.name + ' runtime page errors');
        await context.close();
    }
    console.log('LAYOUT AUDIT PASS: ' + summary.length + ' screenshots, no horizontal clipping and functional tabs.');
} finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}
