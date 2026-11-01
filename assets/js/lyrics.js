(function (root, factory) {
    const api = factory(root, typeof module !== "undefined" && module.exports ? require("../../vendor/js-yaml.min.js") : root.jsyaml);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratLyrics = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (root, yaml) {
    const MAX_SIZE = 2 * 1024 * 1024;
    const ACCEPT = ".lrc,.ttml,.xml,.lyricsfile,.yaml,.yml,.json,.srt,.vtt,.txt,text/plain,application/ttml+xml,application/yaml,text/vtt";
    const clean = value => String(value ?? "").replace(/\s+/gu, " ").trim();
    const mapping = value => value && typeof value === "object" && !Array.isArray(value);

    function detectFormat(text, filename = "") {
        const source = String(text).replace(/^\uFEFF/, "").trim();
        const extension = filename.toLowerCase().split(".").at(-1);
        if (["ttml", "xml"].includes(extension) || /^(?:<\?xml[^>]*>\s*)?<(?:\w+:)?tt[\s>]/i.test(source)) return "ttml";
        if (["yaml", "yml", "lyricsfile"].includes(extension) || /^(?:---\s*)?(?:#.*\n\s*)*(?:version|metadata|lines|plain):/m.test(source)) return "yaml";
        if (extension === "json" || source.startsWith("{")) return "json";
        if (extension === "vtt" || /^WEBVTT(?:\s|$)/.test(source)) return "vtt";
        if (extension === "srt" || /^\s*(?:\d+\s*\n)?\d{1,}:\d{2}(?::\d{2})?[.,]\d+\s*-->/m.test(source)) return "srt";
        if (extension === "lrc" || /\[\d+:\d{2}(?:[.,]\d+)?\]/.test(source)) return "lrc";
        return "plain";
    }

    function timeTag(seconds, inline = false) {
        const ms = Math.round(Math.max(0, seconds) * 1000);
        const time = `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${(ms % 60000 / 1000).toFixed(3).padStart(6, "0")}`;
        return inline ? `<${time}>` : `[${time}]`;
    }

    // LRC remains the editable representation. Native end times live on the
    // project rows as well, since Enhanced LRC cannot represent every word end.
    function finish(rows, metadata = {}, format = "lrc", plain = "") {
        if (rows.length > 20000) throw new Error("Too many lyric lines (maximum 20000).");
        rows = rows.filter(row => clean(row.text)).sort((a, b) => a.time - b.time);
        if (!rows.length && !plain.trim()) throw new Error("No usable lyrics in this file.");
        const lyrics = rows.length ? rows.map(row => {
            const words = row.timing?.words || [];
            const prefix = row.text.match(/^\[bg\]\s*/)?.[0] || "";
            const canInline = words.length && clean(words.map(word => word.text).join("")) === clean(row.text.slice(prefix.length));
            const body = canInline ? prefix + words.map(word => `${timeTag(word.start, true)}${word.text}`).join("") : row.text;
            const end = row.timing?.end;
            return `${timeTag(row.time)} ${body}${Number.isFinite(end) ? timeTag(end, true) : ""}`;
        }).join("\n") : plain;
        return { lyrics, rows, metadata, format, nativeWordCount: rows.reduce((sum, row) => sum + (row.timing?.words.filter(word => Number.isFinite(word.end)).length || 0), 0) };
    }

    function milliseconds(value, name, optional = false) {
        if (optional && value == null) return undefined;
        if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer in milliseconds.`);
        return value / 1000;
    }

    function parseLyricsfile(document, format) {
        if (!mapping(document) || document.version !== "1.0") throw new Error("Expected Lyricsfile version '1.0'.");
        if (!mapping(document.metadata)) throw new Error("Lyricsfile metadata must be a mapping.");
        if (document.lines != null && !Array.isArray(document.lines)) throw new Error("Lyricsfile lines must be a sequence.");
        if (document.plain != null && typeof document.plain !== "string") throw new Error("Lyricsfile plain must be text.");
        if ((document.lines?.length || 0) > 20000) throw new Error("Too many lyric lines (maximum 20000).");
        const meta = document.metadata;
        const offset = meta.offset_ms == null ? 0 : Number.isSafeInteger(meta.offset_ms) ? meta.offset_ms / 1000 : NaN;
        if (!Number.isFinite(offset)) throw new Error("Invalid Lyricsfile offset_ms.");
        const shift = value => value == null ? undefined : Math.max(0, value + offset);
        const rows = (document.lines || []).map((line, index) => {
            if (!mapping(line) || typeof line.text !== "string") throw new Error(`Invalid Lyricsfile line ${index + 1}.`);
            const time = milliseconds(line.start_ms, "start_ms");
            const end = milliseconds(line.end_ms, "end_ms", true);
            if (end != null && end < time) throw new Error("Line end_ms precedes start_ms.");
            if (line.words != null && !Array.isArray(line.words)) throw new Error("Lyricsfile words must be a sequence.");
            const words = (line.words || []).map(word => {
                if (!mapping(word) || typeof word.text !== "string") throw new Error("Invalid Lyricsfile word.");
                const start = milliseconds(word.start_ms, "word start_ms");
                const finish = milliseconds(word.end_ms, "word end_ms", true);
                if (finish != null && finish < start) throw new Error("Word end_ms precedes start_ms.");
                return { text: word.text.replace(/\s+/gu, " "), start: shift(start), end: shift(finish) };
            });
            if (words.length && clean(words.map(word => word.text).join("")) !== clean(line.text)) throw new Error("Lyricsfile words do not match the line text.");
            const text = clean(line.text);
            return { time: shift(time), text, timing: { text, time: shift(time), end: shift(end), words } };
        });
        return finish(rows, {
            trackName: typeof meta.title === "string" ? meta.title : "",
            artistName: typeof meta.artist === "string" ? meta.artist : "",
            albumName: typeof meta.album === "string" ? meta.album : "",
            duration: milliseconds(meta.duration_ms, "duration_ms", true) || 0
        }, format, document.plain || "");
    }

    function parseClock(value, rates = {}) {
        const input = String(value ?? "").trim().replace(",", ".");
        const offset = input.match(/^(\d+(?:\.\d+)?)(h|m|s|ms|f|t)?$/);
        if (offset) return Number(offset[1]) * ({ h: 3600, m: 60, s: 1, ms: 0.001, f: 1 / (rates.frame || 30), t: 1 / (rates.tick || 1) }[offset[2] || "s"]);
        const frames = input.match(/^(\d+):(\d{2}):(\d{2}):(\d+)(?:\.(\d+))?$/);
        if (frames) {
            if (Number(frames[2]) >= 60 || Number(frames[3]) >= 60) return null;
            return Number(frames[1]) * 3600 + Number(frames[2]) * 60 + Number(frames[3]) + (Number(frames[4]) + Number(frames[5] || 0) / (rates.subFrame || 1)) / (rates.frame || 30);
        }
        const clock = input.match(/^(?:(\d+):)?(\d+):(\d{2}(?:\.\d+)?)$/);
        if (!clock || Number(clock[3]) >= 60 || (clock[1] && Number(clock[2]) >= 60)) return null;
        return Number(clock[1] || 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
    }

    function parseTTML(text) {
        if (!root.DOMParser) throw new Error("TTML import requires a browser DOMParser.");
        if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error("TTML document types and entities are not supported.");
        const document = new root.DOMParser().parseFromString(text, "application/xml");
        if (document.getElementsByTagName("parsererror").length || document.documentElement.localName !== "tt") throw new Error("Invalid TTML document.");
        const attr = (node, name) => [...node.attributes].find(attribute => attribute.localName === name)?.value;
        const elements = (node, name) => [...node.getElementsByTagNameNS("*", name)];
        const tt = document.documentElement;
        const frameMultiplier = (attr(tt, "frameRateMultiplier") || "1 1").split(/\s+/).map(Number);
        const rates = { frame: (Number(attr(tt, "frameRate")) || 30) * frameMultiplier[0] / frameMultiplier[1], tick: Number(attr(tt, "tickRate")) || 1, subFrame: Number(attr(tt, "subFrameRate")) || 1 };
        if (attr(tt, "tickRate") == null && attr(tt, "frameRate") != null) rates.tick = rates.frame * rates.subFrame;
        if (!Object.values(rates).every(value => Number.isFinite(value) && value > 0)) throw new Error("Invalid TTML timing rates.");
        // Apple Music and lrc.red lyric TTML use track-absolute timestamps even
        // inside timed song-part divs. Standard subtitle TTML uses parent time.
        const absolute = /(?:(?:itunes|music)\.apple\.com\/lyric|lrc\.red\/lyric)/i.test(text);
        const cache = new Map();
        function interval(node) {
            if (!node || node.nodeType !== 1) return { start: 0, end: undefined };
            if (cache.has(node)) return cache.get(node);
            if (attr(node, "timeContainer") === "seq") throw new Error("Sequential TTML time containers are not supported.");
            const parent = interval(node.parentElement);
            const read = name => {
                const value = attr(node, name);
                const parsed = value == null ? undefined : parseClock(value, rates);
                if (value != null && (parsed == null || !Number.isFinite(parsed))) throw new Error(`Invalid TTML ${name}: ${value}`);
                return parsed;
            };
            const base = absolute ? 0 : parent.start;
            const start = read("begin") == null ? parent.start : base + read("begin");
            const end = read("end") != null ? base + read("end") : read("dur") != null ? start + read("dur") : parent.end;
            if (end != null && end < start) throw new Error("TTML end precedes begin.");
            const result = { start, end };
            cache.set(node, result);
            return result;
        }
        const rows = [];
        for (const paragraph of elements(tt, "p")) {
            const backgrounds = elements(paragraph, "span").filter(node => /(?:^|:)x-bg$/.test(attr(node, "role") || ""));
            const translations = elements(paragraph, "span").filter(node => /(?:translation|x-translation)/i.test(attr(node, "role") || ""));
            function makeRow(container, role = "") {
                const words = [];
                function visit(node) {
                    if (node.nodeType === 3) return node.nodeValue;
                    if (node.nodeType !== 1 || (node !== container && (backgrounds.includes(node) || translations.includes(node)))) return "";
                    if (node.localName === "br") return " ";
                    const timedDescendants = elements(node, "span").some(child => attr(child, "begin") != null);
                    const body = [...node.childNodes].map(visit).join("");
                    if (node.localName === "span" && attr(node, "begin") != null && !timedDescendants && clean(body)) {
                        const timing = interval(node);
                        words.push({ text: body.replace(/\s+/gu, " "), start: timing.start, end: timing.end });
                    }
                    return body;
                }
                const body = visit(container);
                const text = clean(body);
                if (!text) return;
                // Keep whitespace between timed spans (it can be a text node).
                let cursor = 0;
                words.forEach((word, index) => {
                    const normalized = clean(word.text);
                    const at = text.indexOf(normalized, cursor);
                    if (at < 0) return;
                    const next = at + normalized.length;
                    word.text = `${index === 0 ? text.slice(0, at) : ""}${normalized}${text.slice(next).match(/^\s*/)[0]}`;
                    cursor = next + text.slice(next).match(/^\s*/)[0].length;
                });
                const timing = interval(container);
                const rowText = `${role}${text}`;
                rows.push({ time: timing.start, text: rowText, timing: { text: rowText, time: timing.start, end: timing.end, words } });
            }
            makeRow(paragraph);
            backgrounds.filter(node => !backgrounds.some(other => other !== node && other.contains(node))).forEach(node => makeRow(node, "[bg] "));
        }
        const metadata = { duration: interval(elements(tt, "body")[0]).end || 0 };
        for (const name of ["title", "artist", "album"]) {
            const node = elements(tt, name)[0];
            if (node) metadata[{ title: "trackName", artist: "artistName", album: "albumName" }[name]] = clean(node.textContent);
        }
        return finish(rows, metadata, "ttml");
    }

    function subtitleText(text) {
        return clean(text.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, "").replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, entity => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&nbsp;": " " })[entity]));
    }

    function parseSubtitles(text, format) {
        const rows = [];
        for (const block of text.trim().split(/\n\s*\n/)) {
            if (/^(?:WEBVTT|NOTE|STYLE|REGION)(?:\s|$)/.test(block)) continue;
            const lines = block.split("\n");
            const index = lines.findIndex(line => line.includes("-->"));
            if (index < 0) continue;
            const match = lines[index].match(/^\s*(\S+)\s+-->\s+(\S+)/);
            const start = match && parseClock(match[1]);
            const end = match && parseClock(match[2]);
            if (start == null || end == null || end < start) throw new Error("Invalid subtitle timestamps.");
            const raw = lines.slice(index + 1).join(" ");
            const body = subtitleText(raw);
            const words = [];
            let cursor = 0, from = start;
            for (const marker of raw.matchAll(/<((?:\d+:)?\d{2}:\d{2}\.\d+)>/g)) {
                const to = parseClock(marker[1]);
                if (to == null || to < from || to > end) throw new Error("Invalid WebVTT word timestamp.");
                const segment = subtitleText(raw.slice(cursor, marker.index));
                if (segment) words.push({ text: segment + " ", start: from, end: to });
                cursor = marker.index + marker[0].length;
                from = to;
            }
            if (words.length) {
                const segment = subtitleText(raw.slice(cursor));
                if (segment) words.push({ text: segment, start: from, end });
            }
            rows.push({ time: start, text: body, timing: { text: body, time: start, end, words } });
        }
        return finish(rows, {}, format);
    }

    function parse(text, filename = "") {
        if (typeof text !== "string" || text.length > MAX_SIZE || new TextEncoder().encode(text).byteLength > MAX_SIZE) throw new Error("Lyrics file is too large (maximum 2 MB).");
        const source = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
        const format = detectFormat(source, filename);
        if (format === "ttml") return parseTTML(source);
        if (format === "yaml") {
            let depth = 0, nodes = 0;
            const document = yaml.load(source, { schema: yaml.CORE_SCHEMA, listener(event) {
                if (event === "open") { depth++; nodes++; }
                else depth--;
                if (depth > 64 || nodes > 500000) throw new Error("Lyricsfile YAML is too complex.");
            } });
            return parseLyricsfile(document, format);
        }
        if (format === "json") return parseLyricsfile(JSON.parse(source), format);
        if (format === "srt" || format === "vtt") return parseSubtitles(source, format);
        if (!source.trim()) throw new Error("No usable lyrics in this file.");
        return { lyrics: source, rows: null, metadata: {}, format, nativeWordCount: 0 };
    }

    return { parse, detectFormat, parseClock, ACCEPT, MAX_SIZE };
});
