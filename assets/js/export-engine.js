/* Brat Animator phase 13 — time-indexed, multi-source export engine.
 * No UI, project database or lyric dependencies. The host supplies drawFrame(t).
 * Works with the existing mp4-muxer; WebCodecs/AAC are probed before use.
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    root.BratExportEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (scope) {
    "use strict";
    const Plan = scope.BratExportPlan || (typeof require === "function" ? require("./export-plan.js") : null);
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const aborted = signal => { if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError"); };
    const hasAudio = clips => clips.some(clip => clip && clip.buffer && !clip.muted && clip.volume !== 0);

    async function probe({ plan, audioClips = [], loadMuxer, environment = scope }) {
        const audio = hasAudio(audioClips);
        const fallback = typeof environment.MediaRecorder === "function";
        if (typeof environment.VideoEncoder !== "function" || typeof environment.VideoFrame !== "function" || typeof loadMuxer !== "function") {
            return { fast: false, fallback, reason: "WebCodecs video or MP4 muxer unavailable" };
        }
        try {
            const video = await environment.VideoEncoder.isConfigSupported({
                codec: "avc1.42001f", width: plan.width, height: plan.height,
                bitrate: plan.bitrate, framerate: plan.fps, bitrateMode: "variable", avc: { format: "annexb" }
            });
            if (!video?.supported) return { fast: false, fallback, reason: "H.264 encoder unavailable" };
            if (audio) {
                if (typeof environment.AudioEncoder !== "function" || typeof environment.AudioData !== "function" ||
                    typeof environment.OfflineAudioContext !== "function") {
                    return { fast: false, fallback, reason: "AAC encoder or offline audio mixer unavailable" };
                }
                const supported = await environment.AudioEncoder.isConfigSupported({
                    codec: "mp4a.40.2", sampleRate: 48000, numberOfChannels: 2, bitrate: 192000
                });
                if (!supported?.supported) return { fast: false, fallback, reason: "AAC encoding unsupported" };
            }
            await loadMuxer();
            return { fast: true, fallback, reason: null };
        } catch (error) {
            return { fast: false, fallback, reason: error?.message || "Codec probe failed" };
        }
    }

    function gainAt(clip, t) {
        const fadeInFactor = clip.fadeIn > 0 ? (t - clip.clipStart) / clip.fadeIn : 1;
        const fadeOutFactor = clip.fadeOut > 0 ? (clip.clipEnd - t) / clip.fadeOut : 1;
        return clip.volume * Math.max(0, Math.min(1, fadeInFactor, fadeOutFactor));
    }

    // A shared scheduling model guarantees the same clip trim, crop and fade semantics
    // for the offline AAC encoder and the live MediaRecorder fallback.
    function scheduleAudio(context, destination, clips, plan, anchor = 0) {
        const sources = [];
        for (const clip of clips) {
            const window = Plan.clipWindow(clip, plan);
            if (!window || window.volume === 0) continue;
            const source = context.createBufferSource();
            source.buffer = clip.buffer;
            const gain = context.createGain();
            source.connect(gain);
            gain.connect(destination);
            const points = [window.overlapStart, window.overlapEnd];
            for (const boundary of [window.clipStart + window.fadeIn, window.clipEnd - window.fadeOut]) {
                if (boundary > window.overlapStart && boundary < window.overlapEnd) points.push(boundary);
            }
            points.sort((a, b) => a - b);
            const at = t => anchor + t - plan.start;
            gain.gain.setValueAtTime(gainAt(window, points[0]), at(points[0]));
            for (const point of points.slice(1)) {
                gain.gain.linearRampToValueAtTime(gainAt(window, point), at(point));
            }
            source.start(at(window.overlapStart), window.sourceOffset, window.duration);
            sources.push(source);
        }
        return sources;
    }

    async function mixOffline({ plan, audioClips, environment = scope, sampleRate = 48000 }) {
        const frames = Math.ceil(plan.duration * sampleRate);
        if (frames > sampleRate * 60 * 60) throw new RangeError("Offline audio export is limited to 60 minutes.");
        const context = new environment.OfflineAudioContext(2, Math.max(1, frames), sampleRate);
        scheduleAudio(context, context.destination, audioClips, plan);
        return context.startRendering();
    }

    function videoConfig(plan) {
        return { codec: "avc1.42001f", width: plan.width, height: plan.height, bitrate: plan.bitrate,
            bitrateMode: "variable", framerate: plan.fps, avc: { format: "annexb" } };
    }

    async function encodeAudio(muxer, audioBuffer, environment, signal) {
        let failure = null;
        const encoder = new environment.AudioEncoder({
            output(chunk, metadata) { try { muxer.addAudioChunk(chunk, metadata); } catch (error) { failure = error; } },
            error(error) { failure = error; }
        });
        try {
            encoder.configure({ codec: "mp4a.40.2", sampleRate: audioBuffer.sampleRate,
                numberOfChannels: 2, bitrate: 192000 });
            const channel0 = audioBuffer.getChannelData(0);
            const channel1 = audioBuffer.getChannelData(1);
            const chunkSize = 1024;
            for (let offset = 0; offset < audioBuffer.length; offset += chunkSize) {
                aborted(signal);
                if (failure) throw failure;
                const count = Math.min(chunkSize, audioBuffer.length - offset);
                const pcm = new Float32Array(count * 2);
                pcm.set(channel0.subarray(offset, offset + count), 0);
                pcm.set(channel1.subarray(offset, offset + count), count);
                const frame = new environment.AudioData({
                    format: "f32-planar", sampleRate: audioBuffer.sampleRate, numberOfFrames: count,
                    numberOfChannels: 2, timestamp: Math.round(offset / audioBuffer.sampleRate * 1_000_000), data: pcm
                });
                try { encoder.encode(frame); } finally { frame.close(); }
                if (encoder.encodeQueueSize > 16) await encoder.flush();
            }
            await encoder.flush();
            if (failure) throw failure;
        } finally {
            if (encoder.state !== "closed") encoder.close();
        }
    }

    async function renderFast({ plan, canvas, context, renderFrame, prepareFrame, audioClips,
        loadMuxer, onProgress = () => {}, signal, environment = scope }) {
        const { Muxer, ArrayBufferTarget } = await loadMuxer();
        const withAudio = hasAudio(audioClips);
        const target = new ArrayBufferTarget();
        const muxerOptions = {
            target, fastStart: "in-memory", firstTimestampBehavior: "offset",
            video: { codec: "avc", width: plan.width, height: plan.height }
        };
        if (withAudio) muxerOptions.audio = { codec: "aac", sampleRate: 48000, numberOfChannels: 2 };
        const muxer = new Muxer(muxerOptions);
        if (withAudio) {
            aborted(signal);
            onProgress({ mode: "fast", stage: "mixing-audio", percent: 0 });
            const mixed = await mixOffline({ plan, audioClips, environment });
            await encodeAudio(muxer, mixed, environment, signal);
            onProgress({ mode: "fast", stage: "encoding-video", percent: 0 });
        }
        let failure = null;
        const encoder = new environment.VideoEncoder({
            output(chunk, metadata) { try { muxer.addVideoChunk(chunk, metadata); } catch (error) { failure = error; } },
            error(error) { failure = error; }
        });
        try {
            encoder.configure(videoConfig(plan));
            for (let index = 0; index < plan.totalFrames; index++) {
                aborted(signal);
                if (failure) throw failure;
                const frameInfo = Plan.frameAt(plan, index);
                await prepareFrame?.(frameInfo.sourceTime);
                await renderFrame(context, canvas.width, canvas.height, frameInfo.sourceTime);
                const frame = new environment.VideoFrame(canvas, {
                    timestamp: frameInfo.timestamp, duration: frameInfo.duration
                });
                try {
                    encoder.encode(frame, { keyFrame: index === 0 || index % Math.max(plan.fps * 2, 1) === 0 });
                } finally { frame.close(); }
                if (encoder.encodeQueueSize > 12) await encoder.flush();
                if (index % Math.max(1, Math.floor(plan.fps / 2)) === 0 || index === plan.totalFrames - 1) {
                    onProgress({ mode: "fast", stage: "encoding-video", percent: (index + 1) / plan.totalFrames * 100 });
                    await wait(0);
                }
            }
            await encoder.flush();
            if (failure) throw failure;
        } finally {
            if (encoder.state !== "closed") encoder.close();
        }
        muxer.finalize();
        return { blob: new Blob([target.buffer], { type: "video/mp4" }), extension: "mp4", mode: "fast" };
    }

    function chooseMime(environment, withAudio) {
        if (!environment.MediaRecorder?.isTypeSupported) return "";
        const types = withAudio
            ? ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
            : ["video/mp4;codecs=avc1.42E01E", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
        return types.find(type => environment.MediaRecorder.isTypeSupported(type)) || "";
    }

    async function renderRealtime({ plan, canvas, context, renderFrame, prepareFrame, audioClips,
        onProgress = () => {}, signal, environment = scope }) {
        if (typeof environment.MediaRecorder !== "function" || typeof canvas.captureStream !== "function") {
            throw new Error("MediaRecorder fallback is unavailable in this browser.");
        }
        const withAudio = hasAudio(audioClips);
        await prepareFrame?.(plan.start);
        await renderFrame(context, canvas.width, canvas.height, plan.start);
        const stream = canvas.captureStream(plan.fps);
        let audioContext = null;
        let sources = [];
        let recorder = null;
        const chunks = [];
        try {
            if (withAudio) {
                const AudioContext = environment.AudioContext || environment.webkitAudioContext;
                if (!AudioContext) throw new Error("Web Audio is required for exporting audio.");
                audioContext = new AudioContext();
                if (audioContext.state === "suspended") await audioContext.resume();
                const destination = audioContext.createMediaStreamDestination();
                for (const track of destination.stream.getAudioTracks()) stream.addTrack(track);
                // Source nodes are scheduled only after MediaRecorder begins.
                sources = [{ destination }];
            }
            const mimeType = chooseMime(environment, withAudio);
            const options = { videoBitsPerSecond: 8_000_000 };
            if (mimeType) options.mimeType = mimeType;
            if (withAudio) options.audioBitsPerSecond = 192_000;
            try { recorder = new environment.MediaRecorder(stream, options); }
            catch (_) { recorder = new environment.MediaRecorder(stream); }
            recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
            const ended = new Promise((resolve, reject) => {
                recorder.onstop = resolve;
                recorder.onerror = event => reject(event.error || new Error("MediaRecorder export failed."));
            });
            recorder.start(1000);
            if (audioContext) {
                const destination = sources[0].destination;
                sources = scheduleAudio(audioContext, destination, audioClips, plan, audioContext.currentTime + 0.03);
            }
            const began = performance.now();
            for (let index = 0; index < plan.totalFrames; index++) {
                aborted(signal);
                const frameInfo = Plan.frameAt(plan, index);
                await prepareFrame?.(frameInfo.sourceTime);
                await renderFrame(context, canvas.width, canvas.height, frameInfo.sourceTime);
                if (index % Math.max(1, Math.floor(plan.fps / 2)) === 0 || index === plan.totalFrames - 1) {
                    onProgress({ mode: "realtime", stage: "recording", percent: (index + 1) / plan.totalFrames * 100 });
                }
                await wait(Math.max(0, began + Math.min(plan.duration, (index + 1) / plan.fps) * 1000 - performance.now()));
            }
            await wait(120);
            recorder.stop();
            await ended;
            const type = recorder.mimeType || mimeType || "video/webm";
            const extension = type.toLowerCase().includes("mp4") ? "mp4" : "webm";
            return { blob: new Blob(chunks, { type }), extension, mode: "realtime" };
        } finally {
            if (recorder && recorder.state !== "inactive") {
                try { recorder.stop(); } catch (_) {}
            }
            for (const source of sources) { try { source.stop?.(); } catch (_) {} }
            stream.getTracks().forEach(track => track.stop());
            if (audioContext) await audioContext.close().catch(() => {});
        }
    }

    async function exportTimeline(options) {
        const { plan, audioClips = [], onProgress = () => {}, onWarning = () => {}, environment = scope } = options;
        if (!Plan || !plan || !options.canvas || !options.context || typeof options.renderFrame !== "function") {
            throw new TypeError("An export plan, canvas and renderFrame callback are required.");
        }
        if (options.canvas.width !== plan.width || options.canvas.height !== plan.height) {
            throw new RangeError("Export canvas dimensions do not match the plan.");
        }
        const capability = await probe({ plan, audioClips, loadMuxer: options.loadMuxer, environment });
        if (capability.fast) {
            try { return await renderFast(options); }
            catch (error) {
                if (error?.name === "AbortError" || !capability.fallback) throw error;
                onWarning("Fast MP4 export failed; falling back to real-time recording: " + error.message);
            }
        } else {
            onWarning(capability.reason);
        }
        if (!capability.fallback) throw new Error(capability.reason || "No compatible video export path.");
        return renderRealtime(options);
    }

    return Object.freeze({ probe, gainAt, scheduleAudio, mixOffline, chooseMime,
        renderFast, renderRealtime, exportTimeline });
});
