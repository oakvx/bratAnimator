/* Optional but real browser smoke test. Runs with Chrome/Chromium and no npm deps. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chrome = process.env.CHROME_PATH;
assert.ok(chrome, "Set CHROME_PATH to Google Chrome/Chromium for browser smoke tests");
const profile = await mkdtemp(path.join(tmpdir(), "brat-studio-smoke-"));
const mime = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".mjs":"text/javascript", ".svg":"image/svg+xml", ".json":"application/json", ".webmanifest":"application/manifest+json", ".png":"image/png" };
const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const filename = path.resolve(root, "." + pathname, pathname.endsWith("/") ? "index.html" : "");
    if (!filename.startsWith(root + path.sep) && filename !== root) { res.writeHead(403).end(); return; }
    try { res.writeHead(200, { "Content-Type":mime[path.extname(filename)] || "application/octet-stream", "Cache-Control":"no-store" }).end(await readFile(filename)); }
    catch (_) { res.writeHead(404).end(); }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const origin = "http://127.0.0.1:" + server.address().port;
const browser = spawn(chrome, [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
    "--no-first-run", "--no-default-browser-check", "--disable-background-networking",
    "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"
], { stdio:"ignore" });

let ws;
const errors = [];
try {
    let port = null;
    for (let i=0;i<120;i++) {
        try { port = (await readFile(path.join(profile,"DevToolsActivePort"),"utf8")).split("\n")[0]; break; }
        catch (_) { await new Promise(resolve=>setTimeout(resolve,100)); }
    }
    assert.ok(port, "Headless Chrome could not start");
    const target = await (await fetch("http://127.0.0.1:" + port + "/json/new?about:blank",{method:"PUT"})).json();
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{
        ws.addEventListener("open",resolve,{once:true});
        ws.addEventListener("error",reject,{once:true});
    });
    let next = 0;
    const waiting = new Map();
    ws.addEventListener("message", event => {
        const data=JSON.parse(event.data);
        if (data.id) {
            const item=waiting.get(data.id);
            if (!item) return;
            waiting.delete(data.id);
            clearTimeout(item.timer);
            data.error ? item.reject(new Error(JSON.stringify(data.error))) : item.resolve(data.result);
        } else if (data.method==="Runtime.exceptionThrown") {
            errors.push(data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text);
        }
    });
    async function send(method, params={}) {
        return new Promise((resolve,reject)=>{
            const id=++next;
            const timer=setTimeout(()=>{waiting.delete(id);reject(new Error("CDP timeout: "+method));},15000);
            waiting.set(id,{resolve,reject,timer});
            ws.send(JSON.stringify({id,method,params}));
        });
    }
    async function evaluate(expression) {
        const response = await send("Runtime.evaluate", { expression, awaitPromise:true, returnByValue:true });
        if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
        return response.result.value;
    }
    async function until(check, deadline=12000) {
        const started=Date.now();
        while (Date.now()-started<deadline) {
            if (await evaluate(check)) return;
            await new Promise(resolve=>setTimeout(resolve,120));
        }
        throw new Error("Browser condition not met: " + check);
    }
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate",{url:origin+"/"});
    await until("Boolean(window.BratStudio && window.BratEditorWorkspace && document.body.classList.contains('studio-dashboard-open'))");
    assert.equal(await evaluate("getComputedStyle(document.getElementById('studioDashboard')).display !== 'none'"),true);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.studio-hero')).backgroundImage.includes('gradient')"),true);
    assert.equal(await evaluate("window.BratDashboardAudio.isEnabled()"),true);
    await evaluate("document.getElementById('studioSoundToggle').click()");
    assert.equal(await evaluate("window.BratDashboardAudio.isEnabled()"),false);
    assert.equal(await evaluate("document.getElementById('studioSettingsSound').getAttribute('aria-pressed')"),"false");
    await evaluate("document.getElementById('studioSoundToggle').click()");
    assert.equal(await evaluate("window.BratDashboardAudio.isEnabled()"),true);
    await evaluate("document.querySelector('[data-studio-view=share]').click()");
    await until("!document.getElementById('studioShareView').hidden");
    assert.equal(await evaluate("document.getElementById('studioCodeCreate').disabled"),true);
    assert.equal(await evaluate("document.getElementById('studioCodeImport').disabled"),false);
    await evaluate("document.querySelector('[data-studio-view=home]').click()");
    assert.equal(await evaluate("document.getElementById('permissionNotice').classList.contains('hidden')"),true);
    assert.equal(await evaluate("document.getElementById('studioAuthSetup').hidden"),true);
    await evaluate("document.getElementById('studioAccountButton').click()");
    assert.equal(await evaluate("document.getElementById('studioAuthDialog').hidden"),false);
    assert.equal(await evaluate("document.getElementById('studioAuthSetup').hidden"),false);
    await evaluate("document.getElementById('studioAuthGuest').click()");
    await evaluate("document.getElementById('studioContinue').click()");
    await until("document.body.classList.contains('studio-editor-open')");
    assert.equal(await evaluate("document.getElementById('permissionNotice').classList.contains('hidden')"),false);
    await evaluate("document.getElementById('permissionNoticeAckBtn').click()");
    assert.equal(await evaluate("document.getElementById('studioDashboard').hidden"),false);
    assert.equal(await evaluate("getComputedStyle(document.getElementById('studioDashboard')).display"),"none");
    await evaluate("document.getElementById('lyricsInput').value = '[00:01.00] smoke test lyric'; document.getElementById('lyricsInput').dispatchEvent(new Event('input', { bubbles: true }));");
    await until("window.BratEditorWorkspace.store.getActive('guest').then(record => record?.payload?.lyrics?.includes('smoke test lyric'))", 9000);
    await evaluate("document.querySelector('[data-studio-view=\"projects\"]').click()");
    await until("!document.getElementById('studioProjectsView').hidden");
    await until("document.getElementById('studioProjectList').querySelectorAll('.studio-project-card').length > 0");
    // Fill 20 permanent slots, verify the 21st is a separate recoverable draft.
    await evaluate("(async()=>{for(let i=0;i<19;i++) await window.BratEditorWorkspace.store.saveProject({version:5,lyrics:'[00:01.00] archive '+i},{ownerId:'guest',projectId:'archive-browser-'+i,title:'Archive '+i});})()");
    assert.equal(await evaluate("window.BratEditorWorkspace.store.stats().then(s=>s.saved)"),20);
    await evaluate("document.getElementById('studioProjectsNew').click()");
    await until("window.BratEditorWorkspace.projectId()==='temporary'");
    await until("window.BratEditorWorkspace.store.getProject('guest','temporary').then(p=>!!p)");
    assert.equal(await evaluate("window.BratEditorWorkspace.store.getActive('guest').then(p=>p.payload.lyrics.includes('smoke test lyric'))"),true);
    await evaluate("document.getElementById('lyricsInput').value='[00:01.00] temporary test lyric'; document.getElementById('lyricsInput').dispatchEvent(new Event('input',{bubbles:true}));");
    await until("window.BratEditorWorkspace.store.getProject('guest','temporary').then(p=>p?.payload.lyrics.includes('temporary test lyric'))");
    await evaluate("window.BratEditorWorkspace.store.deleteProject('guest','archive-browser-0')");
    await evaluate("window.BratEditorWorkspace.promoteTemporary()");
    assert.equal(await evaluate("window.BratEditorWorkspace.projectId()"),"current");
    assert.equal(await evaluate("window.BratEditorWorkspace.store.getActive('guest').then(p=>p?.payload.lyrics.includes('temporary test lyric'))"),true);
    assert.equal(await evaluate("window.BratEditorWorkspace.store.stats().then(s=>s.temporary)"),0);
    // Project records and backups must remain browser-local throughout.
    assert.equal(await evaluate("window.BratEditorWorkspace.store.stats().then(s=>s.saved)"),20);

    assert.equal(await evaluate("document.body.classList.contains('studio-dashboard-open')"),true);
    await evaluate("document.querySelector('[data-studio-view=\"editor\"]').click()");
    await until("document.body.classList.contains('studio-editor-open')");
    await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await new Promise(resolve=>setTimeout(resolve,300));
    assert.equal(await evaluate("getComputedStyle(document.getElementById('studioBackToHome')).display !== 'none'"),true);
    await evaluate("document.getElementById('studioBackToHome').click()");
    await until("document.body.classList.contains('studio-dashboard-open')");
    assert.equal(await evaluate("getComputedStyle(document.getElementById('studioDashboard')).display !== 'none'"),true);
    const relevantErrors=errors.filter(error=>!error.includes("ResizeObserver loop"));
    assert.deepEqual(relevantErrors,[], "Unexpected browser JS exceptions");
    console.log("Creator Studio browser smoke: dashboard, guest auth, editor, navigation, mobile return — PASS");
} finally {
    ws?.close();
    browser.kill();
    await new Promise(resolve => {
        if (browser.exitCode !== null || browser.signalCode !== null) { resolve(); return; }
        browser.once("exit", resolve);
        setTimeout(resolve, 2500);
    });
    server.close();
    await rm(profile,{recursive:true,force:true,maxRetries:12,retryDelay:200});
}
