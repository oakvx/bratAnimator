(function (root, factory) {
    const core = factory();
    if (typeof module !== "undefined" && module.exports) {
        module.exports = core;
    }
    root.BratCore = core;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    const PROJECT_VERSION = 5;
    const LINE_TIMESTAMP_RE = /\[(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)\]/g;
    const INLINE_WORD_TIMESTAMP_RE = /<(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)>/g;
    const META_TAG_RE = /^\[(ar|ti|al|by|offset):([^\]]*)\]$/i;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function finiteNumber(value, fallback, min, max) {
        const number = Number(value ?? fallback);
        return Number.isFinite(number) ? clamp(number, min, max) : fallback;
    }

    function normalizeEntrance(entrance = {}) {
        return {
            mode: ["none", "stretch-x", "stretch-y", "elastic"].includes(entrance?.mode) ? entrance.mode : "none",
            duration: finiteNumber(entrance?.duration, 320, 100, 800),
            intensity: finiteNumber(entrance?.intensity, 0.15, 0, 0.3),
            angle: finiteNumber(entrance?.angle, 8, 0, 15),
            randomAngles: entrance?.randomAngles === true,
            seed: Number.isFinite(Number(entrance?.seed)) ? Number(entrance.seed) >>> 0 : 0
        };
    }

    function normalizeBeatEffects(effects = {}) {
        return {
            enabled: effects?.enabled === true,
            source: effects?.source === "manual" ? "manual" : "audio",
            bpm: finiteNumber(effects?.bpm, 120, 40, 240),
            offset: finiteNumber(effects?.offset, 0, -86400, 86400),
            pulse: finiteNumber(effects?.pulse, 0.03, 0, 0.1),
            textPulse: effects?.textPulse !== false,
            backgroundZoom: effects?.backgroundZoom === true,
            colorCycle: effects?.colorCycle === true
        };
    }

    function normalizeExportRange(range = {}) {
        return {
            enabled: range?.enabled === true,
            start: finiteNumber(range?.start, 0, 0, Number.MAX_SAFE_INTEGER),
            end: range?.end == null || range.end === "" ? null : finiteNumber(range.end, null, 0, Number.MAX_SAFE_INTEGER)
        };
    }

    let rowIdCounter = 0;

    function createRowId() {
        // IDs are created only when the document changes, never during rendering.
        if (typeof globalThis.crypto?.randomUUID === "function") return `row-${globalThis.crypto.randomUUID()}`;
        rowIdCounter += 1;
        return `row-${Date.now().toString(36)}-${rowIdCounter.toString(36)}`;
    }

    function cloneValue(value) {
        if (Array.isArray(value)) return value.map(cloneValue);
        if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
        return value;
    }

    function rowStyle(style) {
        const result = style && typeof style === "object" && !Array.isArray(style) ? cloneValue(style) : {};
        if (Object.hasOwn(result, "entrance")) result.entrance = normalizeEntrance(result.entrance);
        return result;
    }

    function reconcileLyricRows(nextRows = [], previousRows = []) {
        const previous = Array.isArray(previousRows) ? previousRows.filter(row => row && typeof row === "object" && !Array.isArray(row)) : [];
        const usedPrevious = new Set();
        const usedIds = new Set();
        const incoming = Array.isArray(nextRows) ? nextRows : [];
        const timeOf = row => finiteNumber(row?.time ?? row?.timestamp, 0, 0, Number.MAX_SAFE_INTEGER);
        const textOf = row => String(row?.text ?? "");
        const idOf = row => typeof row?.id === "string" ? row.id.trim() : "";
        const sameTime = (left, right) => Math.abs(timeOf(left) - timeOf(right)) < 0.000001;
        const records = incoming.map(value => ({ row: value && typeof value === "object" && !Array.isArray(value) ? value : { text: value }, id: "", matchIndex: -1 }));
        // Resolve all strong matches before weaker ones: an edited repeated lyric
        // must not consume an identity reserved by a later exact timestamp/text match.
        for (const record of records) {
            const id = idOf(record.row);
            if (!id || usedIds.has(id)) continue;
            record.id = id;
            usedIds.add(id);
            record.matchIndex = previous.findIndex((candidate, index) => !usedPrevious.has(index) && idOf(candidate) === id);
            if (record.matchIndex >= 0) usedPrevious.add(record.matchIndex);
        }
        const matchers = [
            (candidate, row) => sameTime(candidate, row) && textOf(candidate) === textOf(row),
            (candidate, row) => textOf(candidate) === textOf(row),
            (candidate, row) => sameTime(candidate, row)
        ];
        for (const matches of matchers) {
            for (const record of records) {
                if (record.id || record.matchIndex >= 0) continue;
                const index = previous.findIndex((candidate, index) => !usedPrevious.has(index) && (!idOf(candidate) || !usedIds.has(idOf(candidate))) && matches(candidate, record.row));
                if (index < 0) continue;
                record.matchIndex = index;
                record.id = idOf(previous[index]);
                usedPrevious.add(index);
                if (record.id) usedIds.add(record.id);
            }
        }
        return records.map(({ row, id, matchIndex }) => {
            if (!id) {
                do { id = createRowId(); } while (usedIds.has(id));
                usedIds.add(id);
            }
            const matched = matchIndex >= 0 ? previous[matchIndex] : {};
            return {
                ...cloneValue(matched),
                ...cloneValue(row),
                id,
                time: timeOf(row),
                text: textOf(row),
                translation: String(row.translation ?? matched.translation ?? ""),
                style: rowStyle(row.style ?? matched.style)
            };
        });
    }

    function associateTranslations(primaryRows = [], translatedText = "") {
        const rows = reconcileLyricRows(primaryRows);
        const text = normalizeLRCText(translatedText);
        const hasTimestamps = text.split("\n").some(line => /\[\d{1,2}:\d{2}(?:[.,]\d{1,3})?\]/.test(line));
        const unmatched = [];
        if (!hasTimestamps) {
            const translated = text.split("\n").map(line => line.trim()).filter(Boolean);
            if (translated.length === rows.length) rows.forEach((row, index) => { row.translation = translated[index]; });
            else unmatched.push(...translated.map(line => ({ text: line })));
            return { rows, unmatched };
        }
        const used = new Set();
        for (const translated of parseLRC(text)) {
            let nearest = -1;
            let distance = 0.020000001;
            rows.forEach((row, index) => {
                const candidateDistance = Math.abs(row.time - translated.timestamp);
                if (!used.has(index) && candidateDistance < distance) {
                    distance = candidateDistance;
                    nearest = index;
                }
            });
            if (nearest < 0) unmatched.push({ time: translated.timestamp, text: translated.text });
            else {
                rows[nearest].translation = translated.text;
                used.add(nearest);
            }
        }
        return { rows, unmatched };
    }

    function normalizeBackgroundFill(fill = {}) {
        const type = ["solid", "linear", "radial"].includes(fill?.type) ? fill.type : "solid";
        const color2 = /^#[0-9a-f]{6}$/i.test(String(fill?.color2 || "")) ? fill.color2 : "#315f4b";
        return {
            type,
            color2,
            angle: clamp(Number(fill?.angle ?? 135), 0, 360)
        };
    }

    function normalizeColorSwap(swap = {}) {
        const unit = ["line", "word", "letter"].includes(swap?.unit) ? swap.unit : "line";
        return {
            enabled: swap?.enabled === true,
            unit,
            interval: clamp(Math.round(Number(swap?.interval ?? 1) || 1), 1, 12)
        };
    }

    function normalizeTimingSettings(timing = {}) {
        const speed = Number(timing?.speed ?? 1);
        return {
            speed: Number.isFinite(speed) ? clamp(speed, 0.5, 2) : 1
        };
    }

    function shouldSwapPalette(swap, stepIndex) {
        const normalized = normalizeColorSwap(swap);
        if (!normalized.enabled) return false;
        const safeStep = Math.max(0, Math.floor(Number(stepIndex) || 0));
        return Math.floor(safeStep / normalized.interval) % 2 === 1;
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
        if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60 || seconds < 0) return null;
        return minutes * 60 + seconds;
    }

    function secondsToTag(seconds) {
        const safe = Math.round(Math.max(0, Number(seconds) || 0) * 100) / 100;
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
        let wordEndTimestamp;
        for (let i = 0; i < matches.length; i += 1) {
            const match = matches[i];
            const next = matches[i + 1];
            const rawTime = parseTimeTag(match[1], match[2]);
            const rawSegment = String(lineBody).slice(match.index + match[0].length, next ? next.index : undefined);
            const token = rawSegment.replace(INLINE_WORD_TIMESTAMP_RE, "").replace(/\s+/g, " ").trim();
            if (rawTime == null) continue;
            if (!token) {
                if (!next) wordEndTimestamp = Math.max(0, rawTime + offsetSeconds);
                continue;
            }
            wordTimings.push({
                timestamp: Math.max(0, rawTime + offsetSeconds),
                text: token
            });
        }

        return { cleanText: cleanText || wordTimings.map(item => item.text).join(" "), wordTimings, wordEndTimestamp };
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

    function parseLRC(lrcText, startFromZero = false, sourceRows = null) {
        const text = normalizeLRCText(lrcText);
        const parsed = [];
        const boundaries = [];
        let offsetMs = 0;
        for (const line of text.split("\n")) {
            const match = line.trim().match(/^\[offset:([^\]]*)\]$/i);
            if (match && Number.isFinite(Number(match[1]))) offsetMs = Number(match[1]);
        }

        for (const rawLine of text.split("\n")) {
            const line = rawLine.trim();
            if (!line) continue;
            const metaMatch = line.match(META_TAG_RE);
            if (metaMatch) {
                continue;
            }

            const timestamps = [...line.matchAll(LINE_TIMESTAMP_RE)];
            if (!timestamps.length) continue;

            const bodyWithInlineTags = line.replace(LINE_TIMESTAMP_RE, "").trim();
            const enhanced = extractEnhancedLrcLine(bodyWithInlineTags, offsetMs / 1000);
            const vocal = parseVocalRoleAndText(enhanced.cleanText);
            const firstTimestamp = parseTimeTag(timestamps[0][1], timestamps[0][2]);

            for (const match of timestamps) {
                const rawTimestamp = parseTimeTag(match[1], match[2]);
                if (rawTimestamp == null) continue;
                const timestamp = Math.max(0, rawTimestamp + offsetMs / 1000);
                if (!vocal.text) { boundaries.push(timestamp); continue; }
                const repeatOffset = rawTimestamp - (firstTimestamp ?? rawTimestamp);
                parsed.push({
                    timestamp,
                    text: vocal.text,
                    role: vocal.role,
                    wordTimings: enhanced.wordTimings.map(word => ({ ...word, timestamp: Math.max(0, word.timestamp + repeatOffset) })),
                    wordEndTimestamp: Number.isFinite(enhanced.wordEndTimestamp) ? enhanced.wordEndTimestamp + repeatOffset : undefined
                });
            }
        }

        parsed.sort((a, b) => a.timestamp - b.timestamp);
        if (!parsed.length) return [];
        const base = startFromZero ? parsed[0].timestamp : 0;
        const identities = Array.isArray(sourceRows) ? reconcileLyricRows(parsed.map(line => ({ time: line.timestamp, text: line.text })), sourceRows) : null;
        return parsed.map((line, lineIndex) => ({
            ...line,
            ...(identities ? { sourceRowId: identities[lineIndex].id } : {}),
            lineIndex,
            sourceTimestamp: line.timestamp,
            timestamp: Math.max(0, line.timestamp - base),
            boundaryTimestamp: boundaries.filter(time => time > line.timestamp).reduce((earliest, time) => Math.min(earliest, time - base), Infinity),
            wordEndTimestamp: Number.isFinite(line.wordEndTimestamp) ? Math.max(0, line.wordEndTimestamp - base) : undefined,
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
            const inlineText = line.replace(LINE_TIMESTAMP_RE, "").trim();
            const extracted = extractEnhancedLrcLine(inlineText);
            if (!timestamps.length && extracted.cleanText) {
                rows.push({ time: 0, text: extracted.cleanText });
                continue;
            }
            for (const match of timestamps) {
                const time = parseTimeTag(match[1], match[2]);
                if (time != null) {
                    const row = { time, text: extracted.cleanText };
                    if (extracted.wordTimings.length || Number.isFinite(extracted.wordEndTimestamp)) {
                        row.inlineText = inlineText;
                        row.originalText = extracted.cleanText;
                        row.inlineBase = parseTimeTag(timestamps[0][1], timestamps[0][2]) ?? time;
                    }
                    rows.push(row);
                }
            }
        }
        return rows.sort((a, b) => a.time - b.time);
    }

    function rowsToLrc(rows) {
        return rows
            .filter(row => Number.isFinite(Number(row.time)))
            .sort((a, b) => (Number(a.time) || 0) - (Number(b.time) || 0))
            .map(row => {
                let body = String(row.text || "").trim();
                if (row.inlineText && body === row.originalText && Number.isFinite(row.inlineBase)) {
                    const delta = row.time - row.inlineBase;
                    body = row.inlineText.replace(INLINE_WORD_TIMESTAMP_RE, (tag, minutes, seconds) => {
                        const time = parseTimeTag(minutes, seconds);
                        if (time == null || delta === 0) return tag;
                        const shifted = Math.round(Math.max(0, time + delta) * 1000) / 1000;
                        const shiftedMinutes = Math.floor(shifted / 60);
                        const shiftedSeconds = (shifted - shiftedMinutes * 60).toFixed(3).padStart(6, "0");
                        return `<${String(shiftedMinutes).padStart(2, "0")}:${shiftedSeconds}>`;
                    });
                }
                return `${secondsToTag(row.time)}${body ? ` ${body}` : ""}`;
            })
            .join("\n");
    }

    function shiftRows(rows, delta, indexes = null) {
        const selected = Array.isArray(indexes) ? new Set(indexes) : null;
        return rows.map((row, index) => selected && !selected.has(index)
            ? { ...row }
            : { ...row, time: Math.max(0, (Number(row.time) || 0) + delta) });
    }

    function splitRow(rows, index, charIndex) {
        const next = reconcileLyricRows(rows);
        const row = next[index];
        if (!row) return next;
        const text = String(row.text || "");
        const splitAt = clamp(Number(charIndex) || Math.ceil(text.length / 2), 1, Math.max(1, text.length - 1));
        const first = text.slice(0, splitAt).trim();
        const second = text.slice(splitAt).trim();
        if (!first || !second) return next;
        next.splice(index, 1, { ...row, text: first }, { ...cloneValue(row), id: createRowId(), time: row.time + 0.25, text: second, translation: "" });
        return next;
    }

    function mergeRows(rows, index) {
        const next = reconcileLyricRows(rows);
        if (!next[index] || !next[index + 1]) return next;
        next[index] = {
            ...next[index],
            text: `${next[index].text} ${next[index + 1].text}`.replace(/\s+/g, " ").trim(),
            translation: `${next[index].translation} ${next[index + 1].translation}`.replace(/\s+/g, " ").trim()
        };
        next.splice(index + 1, 1);
        return next;
    }

    function moveRow(rows, index, direction) {
        const next = reconcileLyricRows(rows);
        const target = index + direction;
        if (index < 0 || target < 0 || index >= next.length || target >= next.length) return next;
        const temp = next[index];
        next[index] = next[target];
        next[target] = temp;
        return next;
    }

    function duplicateRow(rows, index) {
        const next = reconcileLyricRows(rows);
        if (!next[index]) return next;
        next.splice(index + 1, 0, { ...cloneValue(next[index]), id: createRowId() });
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
            target: ["background", "text", "both"].includes(bg.target) ? bg.target : "background",
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
            backgroundFill: normalizeBackgroundFill(source.style?.backgroundFill),
            colorSwap: normalizeColorSwap(source.style?.colorSwap),
            entrance: normalizeEntrance(source.style?.entrance),
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
            lyricRows: reconcileLyricRows(Array.isArray(source.lyricRows) ? source.lyricRows : lrcToRows(source.lyrics)),
            seed: Number.isFinite(Number(source.seed)) ? Number(source.seed) >>> 0 : 1337,
            fonts: Array.isArray(source.fonts) ? source.fonts.filter(font => font && typeof font === "object" && !Array.isArray(font)).map(font => ({
                id: String(font.id || ""),
                name: String(font.name || ""),
                family: String(font.family || ""),
                assetId: String(font.assetId || "")
            })) : [],
            beatEffects: normalizeBeatEffects(source.beatEffects),
            exportRange: normalizeExportRange(source.exportRange),
            audio: defaultAudioSettings(source),
            metadata: defaultMetadata(source),
            background: defaultBackground(source),
            timing: normalizeTimingSettings(source.timing),
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
        normalizeEntrance,
        normalizeBeatEffects,
        normalizeExportRange,
        createRowId,
        reconcileLyricRows,
        associateTranslations,
        normalizeBackgroundFill,
        normalizeColorSwap,
        normalizeTimingSettings,
        shouldSwapPalette,
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
        duplicateRow,
        defaultAudioSettings,
        defaultMetadata,
        defaultBackground,
        migrateProjectPayload,
        buildPresetPayload
    };
});
