(function (root, factory) {
    const media = factory();
    if (typeof module !== "undefined" && module.exports) {
        module.exports = media;
    }
    root.BratMedia = media;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    function inferBackgroundKind(source = "", fileType = "") {
        const value = `${fileType} ${source}`.toLowerCase();
        if (/video|\.mp4|\.webm|\.mov|\.m4v/.test(value)) return "video";
        return "image";
    }

    function inferAudioMediaKind(source = "", fileType = "") {
        const value = `${fileType} ${source}`.toLowerCase();
        if (/video|\.mp4|\.webm|\.mov|\.m4v/.test(value)) return "video";
        return "audio";
    }

    function mediaNameFromUrl(url, baseHref = "https://example.invalid/") {
        try {
            const parsed = new URL(String(url || ""), baseHref);
            const fileName = parsed.pathname.split("/").filter(Boolean).pop();
            return decodeURIComponent(fileName || parsed.hostname || "URL media");
        } catch (_) {
            return "URL media";
        }
    }

    function extractYouTubeVideoId(value = "", baseHref = "https://example.invalid/") {
        const raw = String(value || "").trim();
        if (!raw) return "";

        try {
            const url = new URL(raw, baseHref);
            const host = url.hostname.replace(/^www\./, "").toLowerCase();
            if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
            if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
                if (url.pathname === "/watch") return url.searchParams.get("v") || "";
                if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
                    return url.pathname.split("/").filter(Boolean)[1] || "";
                }
            }
        } catch (_) {}

        const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i);
        return match?.[1] || "";
    }

    function isYouTubeUrl(value = "", baseHref = "https://example.invalid/") {
        return Boolean(extractYouTubeVideoId(value, baseHref));
    }

    return {
        inferBackgroundKind,
        inferAudioMediaKind,
        mediaNameFromUrl,
        extractYouTubeVideoId,
        isYouTubeUrl
    };
});
