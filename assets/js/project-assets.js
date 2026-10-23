(function (root, factory) {
    const zip = typeof module !== "undefined" && module.exports ? require("../../vendor/fflate.min.js") : root.fflate;
    const assets = factory(root, zip);
    if (typeof module !== "undefined" && module.exports) module.exports = assets;
    root.BratAssets = assets;
})(typeof globalThis !== "undefined" ? globalThis : window, function (root, zip) {
    "use strict";

    const PACKAGE_VERSION = 5;
    const MAX_FILES = 256;
    const MAX_ASSET_BYTES = 512 * 1024 * 1024;
    const MAX_PACKAGE_BYTES = 1024 * 1024 * 1024;
    const MAX_MANIFEST_BYTES = 1024 * 1024;
    const FONT_EXTENSIONS = /\.(ttf|otf|woff2?)$/i;
    const loadedFonts = new Map();
    let fontSequence = 0;

    class PackageError extends Error {
        constructor(message, code = "INVALID_PACKAGE", missingAssets = []) {
            super(message);
            this.name = "PackageError";
            this.code = code;
            this.missingAssets = missingAssets;
        }
    }

    class FontError extends Error {
        constructor(message, missingFonts = []) {
            super(message);
            this.name = "FontError";
            this.code = "FONT_UNAVAILABLE";
            this.missingFonts = missingFonts;
        }
    }

    function checkAbort(signal) {
        if (signal?.aborted) throw new DOMException("The operation was cancelled.", "AbortError");
    }

    function progress(options, completed, total, name) {
        checkAbort(options.signal);
        options.onProgress?.({ completed, total, name });
    }

    function safeName(value, fallback = "asset") {
        return String(value || fallback).split(/[\\/]/).pop().replace(/[\u0000-\u001f]/g, "").slice(0, 255) || fallback;
    }

    function hash(value) {
        let result = 2166136261;
        for (const character of String(value)) {
            result ^= character.charCodeAt(0);
            result = Math.imul(result, 16777619);
        }
        return (result >>> 0).toString(36);
    }

    function fontMetadata(blob, metadata = {}) {
        const name = safeName(metadata.name || blob?.name, "custom-font.ttf");
        if (!FONT_EXTENSIONS.test(name)) throw new FontError("Choose a TTF, OTF, WOFF or WOFF2 font.");
        const id = String(metadata.id || `font-${Date.now().toString(36)}-${++fontSequence}`);
        const requestedFamily = String(metadata.family || "");
        const family = /^[a-zA-Z0-9 _-]{1,100}$/.test(requestedFamily) ? requestedFamily : `BratCustom_${hash(id)}`;
        return { id, name, family, assetId: String(metadata.assetId || "") };
    }

    async function registerFont(blob, metadata = {}) {
        if (!blob || typeof blob.arrayBuffer !== "function" || !blob.size) throw new FontError("The font file is empty or missing.", [metadata]);
        const normalized = fontMetadata(blob, metadata);
        if (typeof root.FontFace !== "function" || !root.document?.fonts) throw new FontError("Custom fonts are not supported in this browser.", [normalized]);
        let face;
        try {
            face = new root.FontFace(normalized.family, await blob.arrayBuffer());
            await face.load();
            root.document.fonts.add(face);
        } catch (_) {
            throw new FontError(`Cannot load font: ${normalized.name}`, [normalized]);
        }
        const previous = loadedFonts.get(normalized.id);
        if (previous?.face && previous.face !== face) root.document.fonts.delete(previous.face);
        loadedFonts.set(normalized.id, { ...normalized, face });
        return normalized;
    }

    async function prepareFonts(fonts = [], loadAsset) {
        const results = [];
        const missing = [];
        for (const font of fonts) {
            const existing = loadedFonts.get(font.id);
            if (existing?.assetId === font.assetId && (!font.family || existing.family === font.family) && existing?.face?.status === "loaded") {
                results.push({ id: existing.id, name: existing.name, family: existing.family, assetId: existing.assetId });
                continue;
            }
            try {
                const record = font.assetId && await loadAsset?.(font.assetId);
                if (!record?.blob) throw new Error("Missing font asset");
                results.push(await registerFont(record.blob, { ...font, name: font.name || record.name }));
            } catch (_) {
                missing.push(font);
            }
        }
        if (missing.length) throw new FontError(`Reload or replace missing fonts: ${missing.map(font => font.name || font.id).join(", ")}`, missing);
        await awaitFonts(fonts);
        return results;
    }

    async function awaitFonts(fonts = []) {
        const missing = fonts.filter(font => {
            const registered = loadedFonts.get(font.id);
            return !registered || registered.assetId !== font.assetId || (font.family && registered.family !== font.family) || registered.face.status !== "loaded";
        });
        if (missing.length) throw new FontError(`Reload or replace missing fonts: ${missing.map(font => font.name || font.id).join(", ")}`, missing);
        if (fonts.length && root.document?.fonts) await root.document.fonts.ready;
    }

    function removeFonts(fonts = null) {
        const ids = fonts == null ? [...loadedFonts.keys()] : fonts.map(font => typeof font === "string" ? font : font.id);
        for (const id of ids) {
            const registered = loadedFonts.get(id);
            if (registered) root.document?.fonts?.delete(registered.face);
            loadedFonts.delete(id);
        }
    }

    function isYouTube(value) {
        try {
            const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
            return host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com");
        } catch (_) { return false; }
    }

    function assetReferences(project) {
        const references = [];
        const audio = project.audio;
        if (audio && !isYouTube(audio.url) && (audio.assetId || audio.url || audio.name)) {
            references.push({ target: audio, kind: audio.mediaKind === "video" ? "video" : "audio", name: audio.name || "audio", audio: true });
        }
        const background = project.background;
        if (background && background.kind !== "none" && ["image", "video"].includes(background.kind)) {
            references.push({ target: background, kind: background.kind, name: background.name || "background" });
        }
        for (const font of project.fonts || []) references.push({ target: font, kind: "font", name: font.name || "font" });
        return references;
    }

    function requireZip() {
        if (!zip?.zipSync || !zip?.unzipSync) throw new PackageError("The local ZIP library is unavailable.", "ZIP_UNAVAILABLE");
    }

    function cloneProject(payload) {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new PackageError("The project must be an object.");
        let project;
        try { project = JSON.parse(JSON.stringify(payload)); }
        catch (_) { throw new PackageError("The project contains unsupported data."); }
        if (project.version !== PACKAGE_VERSION) throw new PackageError("Upgrade the project to version 5 before packaging it.", "UNSUPPORTED_VERSION");
        if (project.fonts != null && !Array.isArray(project.fonts)) throw new PackageError("The project's fonts must be a list.");
        const fontIds = new Set();
        for (const font of project.fonts || []) {
            if (!font || typeof font !== "object" || Array.isArray(font) || typeof font.id !== "string" || !font.id || font.id.length > 256 || fontIds.has(font.id) || (font.family != null && !/^[a-zA-Z0-9 _-]{1,100}$/.test(font.family))) throw new PackageError("The project contains invalid font metadata.");
            fontIds.add(font.id);
        }
        for (const target of [project.audio, project.background, ...(project.fonts || [])]) {
            if (target == null) continue;
            if (typeof target !== "object" || Array.isArray(target)) throw new PackageError("The project contains invalid media metadata.");
            for (const field of ["assetId", "url", "name"]) {
                if (target[field] != null && typeof target[field] !== "string") throw new PackageError("The project contains invalid asset references.");
            }
        }
        return project;
    }

    function validateFontBytes(bytes, name) {
        const signature = bytes.length >= 4 ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0) : 0;
        const extension = String(name).match(FONT_EXTENSIONS)?.[1]?.toLowerCase();
        const valid = extension === "woff" ? signature === 0x774f4646 && bytes.length >= 44
            : extension === "woff2" ? signature === 0x774f4632 && bytes.length >= 48
                : extension === "otf" ? signature === 0x4f54544f && bytes.length >= 12
                    : extension === "ttf" && [0x00010000, 0x74727565].includes(signature) && bytes.length >= 12;
        if (!valid) throw new PackageError(`The font file is invalid: ${name}`);
    }

    function extensionFor(name, type, kind) {
        const extension = String(name).match(/\.([a-zA-Z0-9]{1,8})$/)?.[1]?.toLowerCase();
        if (extension) return extension;
        return ({ "audio/mpeg": "mp3", "audio/wav": "wav", "video/mp4": "mp4", "video/webm": "webm", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "font/woff2": "woff2", "font/woff": "woff", "font/ttf": "ttf", "font/otf": "otf" })[type] || (kind === "font" ? "ttf" : "bin");
    }

    async function exportPackage(payload, loadAsset, options = {}) {
        requireZip();
        if (typeof options === "function") options = { fetch: options };
        const project = cloneProject(payload);
        const references = assetReferences(project);
        if (references.length >= MAX_FILES) throw new PackageError(`A package supports fewer than ${MAX_FILES} assets.`);
        const records = new Map();
        const missing = [];
        const files = Object.create(null);
        let totalBytes = 0;
        const fetchAsset = options.fetch || root.fetch?.bind(root);
        progress(options, 0, references.length + 1, "assets");
        for (let index = 0; index < references.length; index += 1) {
            checkAbort(options.signal);
            const reference = references[index];
            const target = reference.target;
            const key = target.assetId ? `id:${target.assetId}` : target.url ? `url:${target.url}` : `missing:${index}`;
            let record = records.get(key);
            if (!record) {
                try {
                    let source;
                    if (target.assetId) source = await loadAsset?.(target.assetId);
                    else if (reference.kind !== "font" && target.url) {
                        const remote = new URL(target.url);
                        if (!["http:", "https:"].includes(remote.protocol)) throw new Error("Only HTTP(S) assets can be packaged.");
                        if (!fetchAsset) throw new Error("Remote media cannot be downloaded in this browser.");
                        const response = await fetchAsset(target.url, { mode: "cors", credentials: "omit", signal: options.signal });
                        if (!response.ok || response.type === "opaque") throw new Error(`Remote media download failed (${response.status}).`);
                        source = { blob: await response.blob(), name: reference.name, kind: reference.kind };
                    }
                    checkAbort(options.signal);
                    if (!source?.blob || typeof source.blob.arrayBuffer !== "function" || !source.blob.size) throw new Error("Asset is missing or empty.");
                    if (source.blob.size > MAX_ASSET_BYTES) throw new Error("Asset exceeds the 512 MiB package limit.");
                    const name = safeName(source.name || reference.name);
                    if (reference.kind === "font" && !FONT_EXTENSIONS.test(name)) throw new Error("Unsupported font file.");
                    const type = String(source.blob.type || "application/octet-stream");
                    const id = String(target.assetId || `package-${records.size + 1}-${hash(target.url)}`);
                    if (!id || id.length > 256) throw new Error("Invalid asset identifier.");
                    if ([...records.values()].some(asset => asset.id === id)) throw new Error("Duplicate asset identifier.");
                    const path = `assets/${String(records.size + 1).padStart(3, "0")}.${extensionFor(name, type, reference.kind)}`;
                    const bytes = new Uint8Array(await source.blob.arrayBuffer());
                    if (reference.kind === "font") validateFontBytes(bytes, name);
                    totalBytes += bytes.length;
                    if (totalBytes > MAX_PACKAGE_BYTES) throw new Error("Package exceeds the 1 GiB limit.");
                    record = { id, path, name, kind: reference.kind, type, size: bytes.length };
                    records.set(key, record);
                    files[path] = [bytes, { level: 0 }];
                } catch (error) {
                    checkAbort(options.signal);
                    missing.push({ assetId: target.assetId || "", url: target.url || "", name: reference.name, kind: reference.kind, reason: error.message });
                }
            }
            if (record) {
                target.assetId = record.id;
                if (reference.kind !== "font") target.url = "";
                target.name = record.name;
                if (reference.audio) target.source = "local";
            }
            progress(options, index + 1, references.length + 1, reference.name);
        }
        if (missing.length) throw new PackageError(`Reload missing assets before exporting: ${missing.map(asset => asset.name).join(", ")}`, "MISSING_ASSETS", missing);
        const manifest = { type: "bratAnimatorPackage", version: PACKAGE_VERSION, project, assets: [...records.values()] };
        const manifestBytes = zip.strToU8(JSON.stringify(manifest));
        if (manifestBytes.length > MAX_MANIFEST_BYTES) throw new PackageError("The project manifest exceeds 1 MiB.");
        files["manifest.json"] = [manifestBytes, { level: 6 }];
        checkAbort(options.signal);
        const bytes = zip.zipSync(files);
        progress(options, references.length + 1, references.length + 1, "complete");
        return new Blob([bytes], { type: "application/zip" });
    }

    function safePath(path) {
        return typeof path === "string" && path.length > 0 && path.length <= 255 && !path.includes("\\") && !path.startsWith("/") && !path.includes(":") && !/[\u0000-\u001f]/.test(path) && path.split("/").every(segment => segment && segment !== "." && segment !== "..");
    }

    // Inspect sizes before inflation; unzipSync alone would allocate a malicious entry's declared size.
    function inspectZip(bytes) {
        if (bytes.length < 22 || bytes.length > MAX_PACKAGE_BYTES + MAX_MANIFEST_BYTES + 65536) throw new PackageError("The ZIP file is empty, truncated or too large.");
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        let end = bytes.length - 22;
        const minimum = Math.max(0, end - 65535);
        for (; end >= minimum; end -= 1) {
            if (view.getUint32(end, true) === 0x06054b50 && end + 22 + view.getUint16(end + 20, true) === bytes.length) break;
        }
        if (end < minimum) throw new PackageError("The ZIP directory is missing.");
        const count = view.getUint16(end + 10, true);
        const centralSize = view.getUint32(end + 12, true);
        const centralStart = view.getUint32(end + 16, true);
        if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || view.getUint16(end + 8, true) !== count || !count || count > MAX_FILES || count === 65535 || centralStart + centralSize !== end) throw new PackageError("Unsupported ZIP directory or too many entries.");
        let position = centralStart;
        let totalSize = 0;
        const entries = new Map();
        for (let index = 0; index < count; index += 1) {
            if (position + 46 > end || view.getUint32(position, true) !== 0x02014b50) throw new PackageError("Invalid ZIP entry.");
            const flags = view.getUint16(position + 8, true);
            const method = view.getUint16(position + 10, true);
            const crc = view.getUint32(position + 16, true);
            const compressedSize = view.getUint32(position + 20, true);
            const size = view.getUint32(position + 24, true);
            const nameSize = view.getUint16(position + 28, true);
            const extraSize = view.getUint16(position + 30, true);
            const commentSize = view.getUint16(position + 32, true);
            const localStart = view.getUint32(position + 42, true);
            const next = position + 46 + nameSize + extraSize + commentSize;
            if (next > end || flags & 1 || ![0, 8].includes(method) || size === 0xffffffff || compressedSize === 0xffffffff || view.getUint16(position + 34, true)) throw new PackageError("Encrypted, ZIP64 or unsupported ZIP entries are not allowed.");
            const name = zip.strFromU8(bytes.subarray(position + 46, position + 46 + nameSize));
            if (!safePath(name) || entries.has(name)) throw new PackageError("Unsafe or duplicate ZIP path.");
            if (localStart + 30 > centralStart || view.getUint32(localStart, true) !== 0x04034b50) throw new PackageError("Invalid local ZIP entry.");
            const localNameSize = view.getUint16(localStart + 26, true);
            const localExtraSize = view.getUint16(localStart + 28, true);
            const dataStart = localStart + 30 + localNameSize + localExtraSize;
            if (dataStart + compressedSize > centralStart || view.getUint16(localStart + 8, true) !== method || zip.strFromU8(bytes.subarray(localStart + 30, localStart + 30 + localNameSize)) !== name) throw new PackageError("ZIP entry headers do not match.");
            totalSize += size;
            if (size > (name === "manifest.json" ? MAX_MANIFEST_BYTES : MAX_ASSET_BYTES) || totalSize > MAX_PACKAGE_BYTES + MAX_MANIFEST_BYTES) throw new PackageError("ZIP contents exceed package size limits.");
            entries.set(name, { size, crc });
            position = next;
        }
        if (position !== end || !entries.has("manifest.json")) throw new PackageError("The package manifest is missing.");
        return entries;
    }

    const crcTable = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
        let crc = index;
        for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
        crcTable[index] = crc >>> 0;
    }
    function crc32(bytes) {
        let crc = 0xffffffff;
        for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
        return (crc ^ 0xffffffff) >>> 0;
    }

    async function importPackage(file, options = {}) {
        requireZip();
        checkAbort(options.signal);
        if (Number(file?.size || file?.byteLength || 0) > MAX_PACKAGE_BYTES + MAX_MANIFEST_BYTES + 65536) throw new PackageError("The ZIP file exceeds the 1 GiB package limit.");
        let bytes;
        try { bytes = file instanceof Uint8Array ? file : new Uint8Array(typeof file?.arrayBuffer === "function" ? await file.arrayBuffer() : file); }
        catch (_) { throw new PackageError("Cannot read the ZIP file."); }
        const directory = inspectZip(bytes);
        checkAbort(options.signal);
        let files;
        try { files = zip.unzipSync(bytes); }
        catch (_) { throw new PackageError("The ZIP file is damaged."); }
        for (const [name, descriptor] of directory) {
            if (!files[name] || files[name].length !== descriptor.size || crc32(files[name]) !== descriptor.crc) throw new PackageError(`The ZIP entry is damaged: ${name}`);
        }
        let manifest;
        try { manifest = JSON.parse(zip.strFromU8(files["manifest.json"])); }
        catch (_) { throw new PackageError("The package manifest is not valid JSON."); }
        if (manifest?.type !== "bratAnimatorPackage") throw new PackageError("This file is not a Brat Animator package.");
        if (manifest.version !== PACKAGE_VERSION || manifest.project?.version !== PACKAGE_VERSION) throw new PackageError("This package version is not supported.", "UNSUPPORTED_VERSION");
        const payload = cloneProject(manifest.project);
        if (!Array.isArray(manifest.assets) || manifest.assets.length >= MAX_FILES) throw new PackageError("The package asset list is invalid.");
        const ids = new Set();
        const paths = new Set(["manifest.json"]);
        const assets = [];
        progress(options, 0, manifest.assets.length + 1, "manifest");
        for (const descriptor of manifest.assets) {
            checkAbort(options.signal);
            if (!descriptor || typeof descriptor.id !== "string" || !descriptor.id || descriptor.id.length > 256 || ids.has(descriptor.id) || !safePath(descriptor.path) || !descriptor.path.startsWith("assets/") || paths.has(descriptor.path)) throw new PackageError("Invalid or duplicate asset identifier/path.");
            if (!directory.has(descriptor.path)) throw new PackageError(`A packaged asset is missing: ${descriptor.name || descriptor.id}`, "MISSING_ASSETS", [descriptor]);
            if (!["audio", "video", "image", "font"].includes(descriptor.kind) || typeof descriptor.name !== "string" || descriptor.name.length > 255 || typeof descriptor.type !== "string" || descriptor.type.length > 200 || descriptor.size !== files[descriptor.path].length || descriptor.size === 0) throw new PackageError("The package contains invalid asset metadata.");
            if (descriptor.kind === "font" && !FONT_EXTENSIONS.test(descriptor.name)) throw new PackageError("The package contains an unsupported font.");
            if (descriptor.kind === "font") validateFontBytes(files[descriptor.path], descriptor.name);
            ids.add(descriptor.id);
            paths.add(descriptor.path);
            const blob = new Blob([files[descriptor.path]], { type: descriptor.type });
            if (descriptor.kind === "font" && typeof root.FontFace === "function") {
                // Verify the font before the caller commits any package assets; do not install it yet.
                try { await new root.FontFace(`BratValidate_${hash(descriptor.id)}`, await blob.arrayBuffer()).load(); }
                catch (_) { throw new PackageError(`The packaged font cannot be loaded: ${descriptor.name}`); }
            }
            assets.push({ id: descriptor.id, blob, name: safeName(descriptor.name), kind: descriptor.kind });
            progress(options, assets.length, manifest.assets.length + 1, descriptor.name);
        }
        if (paths.size !== directory.size) throw new PackageError("The ZIP contains files not listed in its manifest.");
        const missing = assetReferences(payload).filter(reference => !reference.target.assetId || !ids.has(reference.target.assetId)).map(reference => ({ assetId: reference.target.assetId || "", name: reference.name, kind: reference.kind }));
        if (missing.length) throw new PackageError("The project references missing assets.", "MISSING_ASSETS", missing);
        progress(options, manifest.assets.length + 1, manifest.assets.length + 1, "complete");
        return { payload, assets };
    }

    return { PACKAGE_VERSION, PackageError, FontError, registerFont, prepareFonts, awaitFonts, removeFonts, exportPackage, importPackage };
});
