const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = relative => fs.readFileSync(path.join(__dirname, "..", relative), "utf8");

test("the authentic brat logo is used throughout the Windows 7 shell", () => {
    const html = read("index.html");
    assert.match(html,/class="studio-original-logo" src="favicon\.svg"/);
    assert.match(html,/class="studio-title-icon"/);
    assert.match(html,/id="studioTaskbarApp"/);
    assert.match(html,/id="studioDesktopLauncher"/);
    assert.doesNotMatch(html,/class="studio-mark">b\./);
    const svg=read("favicon.svg");
    assert.match(svg,/<text[^>]*>brat<\/text>/);
});
test("7.css is actually imported and owns native caption buttons", () => {
    const vendor=read("vendor/7css/7.scoped.css");
    const css=read("assets/css/studio-win7.css");
    assert.match(vendor,/7\.css v0\.21\.0/);
    assert.ok(vendor.length > 60000);
    assert.match(css,/\.title-bar-controls button/);
    assert.doesNotMatch(css,/@import url\("https:\/\/unpkg\.com/);
    const html=read("index.html");
    assert.match(html,/class="studio-classic-window window glass active"/);
    assert.match(html,/class="title-bar-controls"/);
    for(const name of ["Minimize","Maximize","Close"]) {
        assert.match(html,new RegExp('aria-label="'+name+'"'));
    }
    const project=html.indexOf('id="studioProjectDialog"');
    const auth=html.indexOf('id="studioAuthDialog"');
    assert.ok(project>0 && auth>project);
    assert.match(html.slice(auth,html.indexOf('id="studioLogoutDialog"')),/title-bar-controls/);
    assert.equal((html.match(/id="studioAuthClose"/g)||[]).length,1);
    assert.equal((html.match(/id="studioProjectDialogClose"/g)||[]).length,1);
});
test("the shell exposes functional open, minimize, restore and close actions", () => {
    const source=read("assets/js/win7-shell.js");
    for(const fn of ["restore","minimize","close","toggleMaximize"]) {
        assert.match(source,new RegExp("function "+fn+"\\("));
    }
    assert.match(source,/studioDesktopLauncher/);
    assert.match(source,/studioWindowMinimize/);
    assert.match(source,/studioWindowMaximize/);
    assert.match(source,/studioWindowClose/);
});
test("TikTok is optional, initially disabled and decoupled from primary auth", () => {
    const config=read("assets/js/tiktok-config.js");
    assert.match(config,/enabled: false/);
    const html=read("index.html");
    assert.match(html,/id="studioTikTokConnect"/);
    assert.match(html,/id="studioTikTokDisconnect"/);
    assert.match(html,/id="studioTikTokConfirmYes"/);
    assert.match(html,/id="studioAuthGoogle"/);
    const api=require("../assets/js/tiktok-link.js");
    assert.equal(api.configured(),false);
    assert.ok(typeof api.request==="function");
    assert.ok(typeof api.mount==="function");
});
test("TikTok secrets are restricted to the Edge Function, never GitHub Pages", () => {
    const frontend=read("assets/js/tiktok-link.js");
    const backend=read("supabase/functions/tiktok-link/index.ts");
    assert.doesNotMatch(frontend,/TIKTOK_CLIENT_SECRET|SUPABASE_SERVICE_ROLE_KEY|refresh_token|client_secret/);
    assert.match(backend,/TIKTOK_CLIENT_SECRET/);
    assert.match(backend,/SUPABASE_SERVICE_ROLE_KEY/);
    assert.match(backend,/db\.auth\.getUser\(/);
    assert.match(backend,/tiktok_claim_link_state/);
    assert.match(backend,/open\.tiktokapis\.com\/v2\/oauth\/token/);
    assert.match(backend,/open\.tiktokapis\.com\/v2\/oauth\/revoke/);
    assert.match(backend,/refres?h_token/);
    assert.match(backend,/new URLSearchParams/);
    assert.match(backend,/Access-Control-Allow-Origin/);
    assert.match(backend,/req\.headers\.get\("origin"\)!==appOrigin/);
    assert.doesNotMatch(backend,/console\.(?:log|error|debug)/);
});
test("TikTok tables prohibit public token access and use one-time OAuth state", () => {
    const sql=read("supabase/migrations/20261108201640_tiktok_link.sql");
    assert.match(sql,/ALTER TABLE public\.tiktok_connections ENABLE ROW LEVEL SECURITY/);
    assert.match(sql,/ALTER TABLE public\.tiktok_link_states ENABLE ROW LEVEL SECURITY/);
    assert.match(sql,/REVOKE ALL ON TABLE public\.tiktok_connections FROM PUBLIC, anon, authenticated/);
    assert.match(sql,/REVOKE ALL ON TABLE public\.tiktok_link_states FROM PUBLIC, anon, authenticated/);
    assert.match(sql,/GRANT (?:SELECT, INSERT, UPDATE, DELETE|ALL) ON TABLE public\.tiktok_connections TO service_role/);
    assert.match(sql,/DELETE FROM public\.tiktok_link_states[\s\S]*RETURNING user_id/);
    assert.match(sql,/expires_at > now\(\)/);
    assert.match(sql,/state_hash text PRIMARY KEY/);
});
