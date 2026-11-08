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
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.studio-classic-window')).display !== 'none'"),true);
    assert.equal(await evaluate("Boolean(document.querySelector('#studioDashboard.win7 .window .title-bar .title-bar-text'))"),true);
    assert.equal(await evaluate("document.body.innerText.includes('BRAT WORKSPACE / 2000')"),false);
    // True 7.css shell: caption controls are functional, not decoration.
    assert.equal(await evaluate("document.querySelector('#studioMainWindow .title-bar-controls button[aria-label=Minimize]') !== null"),true);
    assert.equal(await evaluate("document.querySelector('#studioNav .studio-original-logo').getAttribute('src')"),"favicon.svg");
    await evaluate("document.getElementById('studioWindowMinimize').click()");
    assert.equal(await evaluate("window.BratWin7ShellInstance.state().minimized"),true);
    assert.equal(await evaluate("document.getElementById('studioDesktop').hidden"),false);
    await evaluate("document.getElementById('studioTaskbarApp').click()");
    assert.equal(await evaluate("document.body.classList.contains('studio-window-minimized')"),false);
    await evaluate("document.getElementById('studioWindowMaximize').click()");
    assert.equal(await evaluate("document.body.classList.contains('studio-window-maximized')"),true);
    assert.equal(await evaluate("document.getElementById('studioWindowMaximize').getAttribute('aria-label')"),"Restore");
    await evaluate("document.getElementById('studioWindowMaximize').click()");
    assert.equal(await evaluate("document.body.classList.contains('studio-window-maximized')"),false);
    await evaluate("document.getElementById('studioWindowClose').click()");
    assert.equal(await evaluate("document.body.classList.contains('studio-window-closed')"),true);
    assert.equal(await evaluate("document.getElementById('studioDesktop').hidden"),false);
    await evaluate("document.getElementById('studioDesktopLauncher').click()");
    assert.equal(await evaluate("document.body.classList.contains('studio-window-closed')"),false);
    // Login and sign-up dialog must open from the account entry, even when
    // Supabase is unconfigured. No false authenticated session is shown.
    await evaluate("document.getElementById('studioNavAccount').click()");
    await until("!document.getElementById('studioAuthDialog').hidden");
    // Regression for the real screenshot: 7.css normally hides native
    // .window[role=dialog] unless it matches :target. These dialogs are
    // controlled by JavaScript, so role=dialog belongs to their wrappers.
    assert.equal(await evaluate("document.getElementById('studioAuthDialog').getAttribute('role')"),"dialog");
    assert.equal(await evaluate("document.querySelector('#studioAuthDialog .window').hasAttribute('role')"),false);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('#studioAuthDialog .window')).visibility"),"visible");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('#studioAuthDialog .window')).opacity"),"1");
    assert.equal(await evaluate("getComputedStyle(document.getElementById('studioAuthDialog')).backdropFilter"),"none");
    assert.equal(await evaluate("getComputedStyle(document.getElementById('studioMainWindow')).backdropFilter"),"none");
    assert.equal(await evaluate("(() => { const d=document.querySelector('#studioAuthDialog .window');const r=d.getBoundingClientRect();return r.width >= 280 && r.height >= 180 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight+1; })()"),true);
    assert.equal(await evaluate("(() => { const r=document.querySelector('#studioAuthDialog .window').getBoundingClientRect(); const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); return Boolean(top?.closest('#studioAuthDialog')); })()"),true);
    assert.equal(await evaluate("document.styleSheets.length > 2 && [...document.styleSheets].some(s => s.href?.endsWith('/vendor/7css/7.scoped.css'))"),true);
    assert.equal(await evaluate("document.getElementById('studioAuthClose').getAttribute('aria-label')"),"Close");
    await evaluate("document.querySelector('[data-auth-mode=register]').click()");
    assert.equal(await evaluate("document.getElementById('studioAuthSubmit').textContent"),"Crea account");
    assert.equal(await evaluate("document.querySelector('[data-auth-mode=register]').getAttribute('aria-selected')"),"true");
    assert.equal(await evaluate("document.querySelector('[data-auth-mode=login]').getAttribute('aria-selected')"),"false");
    await evaluate("document.getElementById('studioAuthClose').click()");
    assert.equal(await evaluate("document.getElementById('studioAuthDialog').hidden"),true);
    await evaluate("window.BratStudio.show('settings')");
    await until("!document.getElementById('studioSettingsView').hidden");
    // For guests the TikTok action remains an entry to the real sign-in UI;
    // only a logged-in user with unconfigured OAuth gets a disabled button.
    assert.equal(await evaluate("document.getElementById('studioTikTokConnect').disabled"),false);
    assert.equal(await evaluate("/accedi/i.test(document.getElementById('studioTikTokStatus').textContent)"),true);
    await evaluate("document.getElementById('studioTikTokConnect').click()");
    assert.equal(await evaluate("document.getElementById('studioAuthDialog').hidden"),false);
    await evaluate("document.getElementById('studioAuthGuest').click()");
    await evaluate("window.BratStudio.show('home')");
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
    // The setup note may remain populated after closing the dialog; the
    // dialog itself must remain closed until the user explicitly opens it.
    assert.equal(await evaluate("document.getElementById('studioAuthDialog').hidden"),true);
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

    // Phase 4: real audio import into IndexedDB, playlists, explicit editor use.
    await evaluate("window.BratStudio.show('sounds')");
    await until("!document.getElementById('studioSoundsView').hidden && window.BratSoundHubUI");
    assert.equal(await evaluate("window.BratEditorWorkspace.snapshot().audio.assetId || ''"),"");
    await evaluate(`(() => {
      const sampleRate=8000, frames=4000, bytes=44+frames*2;
      const buffer=new ArrayBuffer(bytes), view=new DataView(buffer);
      function write(offset,value){for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));}
      write(0,'RIFF');view.setUint32(4,bytes-8,true);
      write(8,'WAVE');write(12,'fmt ');view.setUint32(16,16,true);
      view.setUint16(20,1,true);view.setUint16(22,1,true);
      view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);
      view.setUint16(32,2,true);view.setUint16(34,16,true);
      write(36,'data');view.setUint32(40,frames*2,true);
      for(let i=0;i<frames;i++)view.setInt16(44+i*2,Math.sin(i/17)*5000,true);
      const file=new File([buffer],'nostalgia.wav',{type:'audio/wav'});
      const dt=new DataTransfer();dt.items.add(file);
      const input=document.getElementById('studioSoundFileInput');
      input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
      return true;
    })()`);
    await until("document.getElementById('studioSoundList').querySelectorAll('.studio-sound-row').length === 1", 11000);
    assert.equal(await evaluate("window.BratEditorWorkspace.snapshot().audio.assetId || ''"),"");
    await evaluate("document.getElementById('studioSoundNewCollection').click()");
    assert.equal(await evaluate("document.getElementById('studioSoundCollectionDialog').hidden"),false);
    await evaluate("document.getElementById('studioSoundCollectionName').value='Retro';document.getElementById('studioSoundCollectionForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));");
    await until("document.querySelectorAll('#studioSoundCollections .studio-sound-collection-entry').length === 1");
    await evaluate("document.querySelector('#studioSoundList .studio-accent-button').click()");
    await until("window.BratEditorWorkspace.snapshot().audio.assetId?.startsWith('sound-')", 16000);
    await until("document.body.classList.contains('studio-editor-open')");
    assert.equal(await evaluate("window.BratEditorWorkspace.snapshot().audio.name"),"nostalgia.wav");
    assert.equal(await evaluate("window.BratSoundHub.createLibrary().listTracks('guest').then(t=>t.length)"),1);
    // Editor media was attached by explicit action, without duplicating its ID.
    assert.equal(await evaluate("window.BratEditorWorkspace.store.getActive('guest').then(p=>!!p?.payload?.audio?.assetId)"),true);
    assert.equal(await evaluate("document.body.classList.contains('studio-editor-open')"),true);
    await evaluate("document.querySelector('[data-studio-view=\"projects\"]').click()");
    await until("document.body.classList.contains('studio-dashboard-open')");
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
    console.log("Windows 7 UI browser smoke: visible login, native tabs, Sound Hub and editor — PASS");
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
