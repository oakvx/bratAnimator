/* Unicode-aware lyric case conversion. Timing markers and track metadata are immutable. */
(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratLyricsCase = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    "use strict";
    const metadata = /^\s*\[(?:ar|ti|al|by|offset):[^\]]*\]\s*$/iu;
    const tags = /(\[\d+:\d{2}(?:[.,]\d{1,3})?\]|<\d+:\d{2}(?:[.,]\d{1,3})?>)/gu;
    const isTag = /^(?:\[\d+:\d{2}(?:[.,]\d{1,3})?\]|<\d+:\d{2}(?:[.,]\d{1,3})?>)$/u;

    function lowercaseLyrics(source) {
        return String(source ?? "").split(/(\r\n|\r|\n)/u).map(line => {
            if (metadata.test(line)) return line;
            return line.split(tags).map(part => isTag.test(part) ? part : part.toLowerCase()).join("");
        }).join("");
    }

    function lowercaseLyricRows(rows) {
        if (!Array.isArray(rows)) return [];
        return rows.map(row => {
            if (!row || typeof row !== "object") return row;
            const result = { ...row };
            for (const key of ["text", "inlineText", "originalText", "translation"]) {
                if (typeof result[key] === "string") result[key] = lowercaseLyrics(result[key]);
            }
            if (row.timing && typeof row.timing === "object") {
                result.timing = {
                    ...row.timing,
                    ...(typeof row.timing.text === "string" ? { text: lowercaseLyrics(row.timing.text) } : {}),
                    ...(Array.isArray(row.timing.words) ? {
                        words: row.timing.words.map(word => ({
                            ...word,
                            ...(typeof word.text === "string" ? { text: word.text.toLowerCase() } : {})
                        }))
                    } : {})
                };
            }
            return result;
        });
    }

    return { lowercaseLyrics, lowercaseLyricRows };
});
