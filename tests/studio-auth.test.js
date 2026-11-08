const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const auth = require("../assets/js/auth-client.js");

test("auth integration stays disabled until public Supabase config is provided", async () => {
    assert.equal(auth.configured(), false);
    const result = await auth.initialize();
    assert.deepEqual(result, { configured: false, user: null });
    assert.equal(auth.ownerId(), "guest");
    await assert.rejects(auth.signInWithPassword("x@y.com", "test-password"), /non ancora configurato/);
});

test("dashboard renders concrete navigation and all three auth options", () => {
    const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
    for (const identifier of ["studioDashboard","studioProjectsView","studioSettingsView","studioAuthDialog","studioLogoutDialog","studioAuthEmail","studioAuthPassword","studioAuthCode","studioAuthGoogle","studioTransferGuest","studioNewProject","studioBackToHome"]) {
        if (identifier === "studioBackToHome") {
            const script = fs.readFileSync(path.join(__dirname, "../assets/js/studio-dashboard.js"), "utf8");
            assert.match(script, /studioBackToHome/);
        } else {
            assert.ok(html.includes('id="' + identifier + '"'), identifier + " missing from HTML");
        }
    }
    assert.match(html, /assets\/js\/auth-client\.js/);
    assert.match(html, /assets\/js\/studio-dashboard\.js/);
    assert.match(html, /assets\/css\/studio-dashboard\.css/);
});

test("auth bootstrap is never configured with service-role credentials", () => {
    const config = fs.readFileSync(path.join(__dirname, "../assets/js/supabase-config.js"), "utf8");
    assert.match(config, /publishableKey:\s*""/);
    assert.match(config, /url:\s*""/);
    const authCode = fs.readFileSync(path.join(__dirname, "../assets/js/auth-client.js"), "utf8");
    assert.ok(authCode.includes("signInWithPassword"));
    assert.ok(authCode.includes("signUp"));
    assert.ok(authCode.includes("signInWithOtp"));
    assert.ok(authCode.includes("verifyOtp"));
    assert.ok(authCode.includes("signInWithOAuth"));
});
