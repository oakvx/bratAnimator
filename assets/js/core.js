(function (root, factory) {
    const core = factory();
    if (typeof module !== "undefined" && module.exports) {
        module.exports = core;
    }
    root.BratCore = core;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    const PROJECT_VERSION = 3;
    const LINE_TIMESTAMP_RE = /\[(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)\]/g;
    const INLINE_WORD_TIMESTAMP_RE = /<(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)>/g;
    const META_TAG_RE = /^\[(ar|ti|al|by|offset):([^\]]*)\]$/i;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function normalizeLRCText(text) {
        return String(text || "")
            .replace(/^\uFEFF/, "")
            .replace(/\r/g, "")
            .replace(/\u00A0/g, " ");
    }

    function parseTimeTag(minutesStr, secondsStr) {
        const minutes = Number(minutesStr);
        const seconds = Number(String(secondsStr).replace(",", "."));
        if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
        return minutes * 60 + seconds;
    }

    function secondsToTag(seconds) {
        const safe = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(safe / 60);
        const secs = safe - minutes * 60;
        return `[${String(minutes).padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}]`;
    }

    function tagToSeconds(tag) {
        const match = String(tag || "").match(/^(?:\[)?(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)(?:\])?$/);
        return match ? parseTimeTag(match[1], match[2]) ?? 0 : 0;
    }

    function extractEnhancedLrcLine(lineBody, offsetSeconds = 0) {
        const matches = [...String(lineBody || "").matchAll(INLINE_WORD_TIMESTAMP_RE)];
        const cleanText = String(lineBody || "")
            .replace(INLINE_WORD_TIMESTAMP_RE, "")
            .replace(/\s+/g, " ")
            .trim();

        if (!matches.length) {
            return { cleanText, wordTimings: [] };
        }

        const wordTimings = [];
        for (let i = 0; i < matches.length; i += 1) {
            const match = matches[i];
            const next = matches[i + 1];
            const rawTime = parseTimeTag(match[1], match[2]);
            const rawSegment = String(lineBody).slice(match.index + match[0].length, next ? next.index : undefined);
            const token = rawSegment.replace(INLINE_WORD_TIMESTAMP_RE, "").replace(/\s+/g, " ").trim();
            if (rawTime == null || !token) continue;
            wordTimings.push({
                timestamp: Math.max(0, rawTime + offsetSeconds),
                text: token
            });
        }

        return { cleanText: cleanText || wordTimings.map(item => item.text).join(" "), wordTimings };
    }

    function parseVocalRoleAndText(text) {
        const raw = String(text || "").trim();
        const match = raw.match(/^(?:\[(lead|main|bg|background|backing|side|adlib|romanized|rom|translation|trans)\]|\((lead|main|bg|background|backing|side|adlib|romanized|rom|translation|trans)\))\s*/i);
        if (!match) return { role: "lead", text: raw };

        const roleText = String(match[1] || match[2] || "lead").toLowerCase();
        let role = "lead";
        if (["bg", "background", "backing"].includes(roleText)) role = "background";
        if (["side", "adlib"].includes(roleText)) role = "side";
        if (["romanized", "rom", "translation", "trans"].includes(roleText)) role = "secondary";
        return { role, text: raw.slice(match[0].length).trim() };
    }

    function parseLRC(lrcText, startFromZero = false) {
        const text = normalizeLRCText(lrcText);
        const parsed = [];
        let offsetMs = 0;

        for (const rawLine of text.split("\n")) {
            const line = rawLine.trim();
            if (!line) continue;
            const metaMatch = line.match(META_TAG_RE);
            if (metaMatch) {
                if (metaMatch[1].toLowerCase() === "offset") {
                    const parsedOffset = Number(metaMatch[2].trim());
                    if (Number.isFinite(parsedOffset)) offsetMs = parsedOffset;
                }
                continue;
            }

            const timestamps = [...line.matchAll(LINE_TIMESTAMP_RE)];
            if (!timestamps.length) continue;

            const bodyWithInlineTags = line.replace(LINE_TIMESTAMP_RE, "").trim();
            const enhanced = extractEnhancedLrcLine(bodyWithInlineTags, offsetMs / 1000);
            const vocal = parseVocalRoleAndText(enhanced.cleanText);
            if (!vocal.text) continue;

            for (const match of timestamps) {
                const rawTimestamp = parseTimeTag(match[1], match[2]);
                if (rawTimestamp == null) continue;
                parsed.push({
                    timestamp: Math.max(0, rawTimestamp + offsetMs / 1000),
                    text: vocal.text,
                    role: vocal.role,
                    wordTimings: enhanced.wordTimings
                });
            }
        }

        parsed.sort((a, b) => a.timestamp - b.timestamp);
        if (!parsed.length) return [];
        const base = startFromZero ? parsed[0].timestamp : 0;
        return parsed.map((line, lineIndex) => ({
            ...line,
            lineIndex,
            sourceTimestamp: line.timestamp,
            timestamp: Math.max(0, line.timestamp - base),
            wordTimings: line.wordTimings.map(word => ({
                ...word,
                timestamp: Math.max(0, word.timestamp - base)
            }))
        }));
    }

    function lrcToRows(lrcText) {
        const rows = [];
        for (const raw of normalizeLRCText(lrcText).split("\n")) {
            const line = raw.trim();
            if (!line || META_TAG_RE.test(line)) continue;
            const timestamps = [...line.matchAll(LINE_TIMESTAMP_RE)];
            const extracted = extractEnhancedLrcLine(line.replace(LINE_TIMESTAMP_RE, "").trim());
            if (!timestamps.length && extracted.cleanText) {
                rows.push({ time: 0, text: extracted.cleanText });
                continue;
            }
            for (const match of timestamps) {
                const time = parseTimeTag(match[1], match[2]);
                if (time != null && extracted.cleanText) rows.push({ time, text: extracted.cleanText });
            }
        }
        return rows.sort((a, b) => a.time - b.time);
    }

    function rowsToLrc(rows) {
        return rows
            .filter(row => String(row.text || "").trim())
            .sort((a, b) => (Number(a.time) || 0) - (Number(b.time) || 0))
            .map(row => `${secondsToTag(row.time)} ${String(row.text || "").trim()}`)
            .join("\n");
    }

    function shiftRows(rows, delta, indexes = null) {
        const selected = Array.isArray(indexes) ? new Set(indexes) : null;
        return rows.map((row, index) => selected && !selected.has(index)
            ? { ...row }
            : { ...row, time: Math.max(0, (Number(row.time) || 0) + delta) });
    }

    function splitRow(rows, index, charIndex) {
        const next = rows.map(row => ({ ...row }));
        const row = next[index];
        if (!row) return next;
        const text = String(row.text || "");
        const splitAt = clamp(Number(charIndex) || Math.ceil(text.length / 2), 1, Math.max(1, text.length - 1));
        const first = text.slice(0, splitAt).trim();
        const second = text.slice(splitAt).trim();
        if (!first || !second) return next;
        next.splice(index, 1, { ...row, text: first }, { time: row.time + 0.25, text: second });
        return next;
    }

    function mergeRows(rows, index) {
        const next = rows.map(row => ({ ...row }));
        if (!next[index] || !next[index + 1]) return next;
        next[index] = {
            ...next[index],
            text: `${next[index].text} ${next[index + 1].text}`.replace(/\s+/g, " ").trim()
        };
        next.splice(index + 1, 1);
        return next;
    }

    function moveRow(rows, index, direction) {
        const next = rows.map(row => ({ ...row }));
        const target = index + direction;
        if (index < 0 || target < 0 || index >= next.length || target >= next.length) return next;
        const temp = next[index];
        next[index] = next[target];
        next[target] = temp;
        return next;
    }

    function defaultAudioSettings(payload = {}) {
        const audioName = payload.audio?.name || "";
        const audioUrl = payload.audio?.url || "";
        const inferredKind = /video|\.mp4|\.webm|\.mov|\.m4v/i.test(`${audioName} ${audioUrl}`) ? "video" : "audio";
        return {
            includeInExport: payload.audio?.includeInExport ?? payload.includeAudioInExport ?? true,
            volume: clamp(Number(payload.audio?.volume ?? 1), 0, 2),
            fadeIn: clamp(Number(payload.audio?.fadeIn ?? 0), 0, 30),
            fadeOut: clamp(Number(payload.audio?.fadeOut ?? 0), 0, 30),
            source: payload.audio?.source || "local",
            url: audioUrl,
            assetId: payload.audio?.assetId || "",
            name: audioName,
            mediaKind: payload.audio?.mediaKind || inferredKind
        };
    }

    function defaultMetadata(payload = {}) {
        const selected = payload.selectedSong || {};
        return {
            trackName: payload.metadata?.trackName || selected.trackName || "",
            artistName: payload.metadata?.artistName || selected.artistName || "",
            albumName: payload.metadata?.albumName || selected.albumName || "",
            duration: Number(payload.metadata?.duration ?? selected.duration ?? 0) || 0,
            artworkUrl: payload.metadata?.artworkUrl || selected.artworkUrl || selected.coverArt || "",
            thumbnailUrl: payload.metadata?.thumbnailUrl || "",
            source: payload.metadata?.source || (selected.id ? "lrclib" : "")
        };
    }

    function defaultBackground(payload = {}) {
        const bg = payload.background || {};
        return {
            kind: bg.kind || "none",
            assetId: bg.assetId || "",
            url: bg.url || "",
            name: bg.name || "",
            opacity: clamp(Number(bg.opacity ?? 1), 0, 1),
            blur: clamp(Number(bg.blur ?? 0), 0, 40),
            brightness: clamp(Number(bg.brightness ?? 1), 0, 2),
            saturation: clamp(Number(bg.saturation ?? 1), 0, 2),
            scale: clamp(Number(bg.scale ?? 1), 0.25, 3),
            positionX: clamp(Number(bg.positionX ?? 0.5), 0, 1),
            positionY: clamp(Number(bg.positionY ?? 0.5), 0, 1)
        };
    }

    function migrateProjectPayload(payload) {
        const source = payload && typeof payload === "object" ? payload : {};
        const style = {
            ...(source.style || {}),
            wordAnimation: {
                mode: source.style?.wordAnimation?.mode || "progress",
                intensity: clamp(Number(source.style?.wordAnimation?.intensity ?? 0.7), 0, 1),
                color: source.style?.wordAnimation?.color || source.style?.textColor || "#ffffff"
            }
        };

        return {
            ...source,
            version: PROJECT_VERSION,
            lyrics: typeof source.lyrics === "string" ? source.lyrics : "",
            plainLyrics: typeof source.plainLyrics === "string" ? source.plainLyrics : "",
            query: typeof source.query === "string" ? source.query : "",
            audio: defaultAudioSettings(source),
            metadata: defaultMetadata(source),
            background: defaultBackground(source),
            style
        };
    }

    function buildPresetPayload(projectPayload, name = "custom preset") {
        const payload = migrateProjectPayload(projectPayload);
        return {
            version: PROJECT_VERSION,
            type: "bratAnimatorPreset",
            name: String(name || "custom preset").trim() || "custom preset",
            savedAt: new Date().toISOString(),
            style: payload.style,
            animationMode: payload.animationMode || "typewriter",
            background: payload.background,
            formatPreset: payload.formatPreset || "square",
            exportSize: payload.exportSize || "1080",
            exportFps: payload.exportFps || "30"
        };
    }

    return {
        PROJECT_VERSION,
        LINE_TIMESTAMP_RE,
        INLINE_WORD_TIMESTAMP_RE,
        META_TAG_RE,
        clamp,
        normalizeLRCText,
        parseTimeTag,
        secondsToTag,
        tagToSeconds,
        extractEnhancedLrcLine,
        parseVocalRoleAndText,
        parseLRC,
        lrcToRows,
        rowsToLrc,
        shiftRows,
        splitRow,
        mergeRows,
        moveRow,
        defaultAudioSettings,
        defaultMetadata,
        defaultBackground,
        migrateProjectPayload,
        buildPresetPayload
    };
});
