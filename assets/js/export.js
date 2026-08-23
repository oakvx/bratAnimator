(function (root, factory) {
    const exportHelpers = factory();
    if (typeof module !== "undefined" && module.exports) {
        module.exports = exportHelpers;
    }
    root.BratExport = exportHelpers;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    let mp4MuxerModulePromise = null;

    function canAttemptFastExport(scope = globalThis) {
        return typeof scope.VideoEncoder !== "undefined" && typeof scope.VideoFrame !== "undefined";
    }

    async function loadMp4MuxerModule() {
        if (!mp4MuxerModulePromise) {
            mp4MuxerModulePromise = import("../../vendor/mp4-muxer.mjs");
        }
        return mp4MuxerModulePromise;
    }

    async function hasMp4MuxerModule() {
        try {
            await loadMp4MuxerModule();
            return true;
        } catch (_) {
            return false;
        }
    }

    async function canUseFastMp4Export(width, fps, height = width, scope = globalThis) {
        if (!canAttemptFastExport(scope) || typeof scope.VideoEncoder.isConfigSupported !== "function") {
            return false;
        }

        const safeWidth = Math.max(16, Math.round(Number(width) / 2) * 2);
        const safeHeight = Math.max(16, Math.round(Number(height) / 2) * 2);
        const safeFps = Number(fps) || 30;

        try {
            const support = await scope.VideoEncoder.isConfigSupported({
                codec: "avc1.42001f",
                width: safeWidth,
                height: safeHeight,
                bitrate: Math.max(4_000_000, Math.round(safeWidth * safeHeight * Math.max(24, safeFps) * 0.09)),
                bitrateMode: "variable",
                framerate: safeFps,
                avc: {
                    format: "annexb"
                }
            });

            return Boolean(support && support.supported);
        } catch (_) {
            return false;
        }
    }

    return {
        canAttemptFastExport,
        canUseFastMp4Export,
        hasMp4MuxerModule,
        loadMp4MuxerModule
    };
});
