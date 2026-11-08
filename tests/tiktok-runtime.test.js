const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const link = require("../assets/js/tiktok-link.js");
const read = file => fs.readFileSync(path.join(__dirname,"..",file),"utf8");

test("TikTok remains disabled until developer authorization and backend deployment", async () => {
    assert.equal(link.configured(), false);
    await assert.rejects(link.request("delete-all"), /Azione TikTok non supportata/);
    await assert.rejects(link.request("start"), /Accedi prima/);
    assert.match(read("assets/js/tiktok-config.js"), /enabled:\s*false/);
});

test("TikTok request sends verified Brat JWT only to configured Edge Function", async () => {
    const originals = {};
    for (const key of ["BratSupabaseConfig","BratTikTokConfig","BratAuth","fetch"]) originals[key] = globalThis[key];
    const requests=[];
    Object.assign(globalThis, {
        BratSupabaseConfig: { url:"https://example.supabase.co",publishableKey:"sb_publishable_mock_00000000" },
        BratTikTokConfig: {enabled:true},
        BratAuth: {user:()=>({id:"member-one"}),getAccessToken:async()=>"browser-jwt"},
        fetch: async (url,options) => {
            requests.push({url,options});
            return { ok:true, json:async()=>({connected:false}) };
        }
    });
    try {
        assert.equal(link.configured(),true);
        assert.deepEqual(await link.request("status"),{connected:false});
        assert.equal(requests.length,1);
        assert.equal(requests[0].url,"https://example.supabase.co/functions/v1/tiktok-link");
        assert.equal(requests[0].options.method,"POST");
        assert.equal(requests[0].options.credentials,"omit");
        assert.equal(requests[0].options.headers.Authorization,"Bearer browser-jwt");
        assert.equal(requests[0].options.redirect,"error");
        assert.equal(JSON.parse(requests[0].options.body).action,"status");
    } finally { for (const [key,value] of Object.entries(originals)) { if(value===undefined)delete globalThis[key]; else globalThis[key]=value; } }
});

test("TikTok Edge Function bounds inputs and never reports remote revocation without verification", () => {
    const server=read("supabase/functions/tiktok-link/index.ts");
    const browser=read("assets/js/tiktok-link.js");
    assert.match(server,/callback\.origin===base\.origin/);
    assert.match(server,/callback\.pathname==="\/functions\/v1\/tiktok-link"/);
    assert.match(server,/length>1024/);
    assert.match(server,/revokedAtProvider=false/);
    assert.match(server,/return reply\(req,\{connected:false,revokedAtProvider\}\)/);
    assert.match(browser,/result\.revokedAtProvider === true/);
    assert.doesNotMatch(browser,/TIKTOK_CLIENT_SECRET|SUPABASE_SERVICE_ROLE_KEY/);
});
