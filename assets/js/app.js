const LINE_TIMESTAMP_RE = /\[(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)\]/g;
        const INLINE_WORD_TIMESTAMP_RE = /<(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)>/g;
        const META_TAG_RE = /^\[(ar|ti|al|by|offset):([^\]]*)\]$/i;

        const INVIDIOUS_BASES = [
            "https://yewtu.be",
            "https://invidious.nerdvpn.de"
        ];

        const APPLE_LIKE_FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro Rounded", "Helvetica Neue", "Segoe UI", system-ui, sans-serif';
        const BratCore = window.BratCore || {};
        const BratMedia = window.BratMedia || {};
        const BratExport = window.BratExport || {};
        const PROJECT_VERSION = BratCore.PROJECT_VERSION || 3;

        const previewCanvas = document.getElementById("previewCanvas");
        const previewCtx = previewCanvas.getContext("2d", {
            alpha: false
        });
        const panel = document.getElementById("panel");

        const togglePanelBtn = document.getElementById("togglePanelBtn");
        const loadDemoBtn = document.getElementById("loadDemoBtn");
        const startBtn = document.getElementById("startBtn");
        const playPauseBtn = document.getElementById("playPauseBtn");
        const restartBtn = document.getElementById("restartBtn");
        const resetBtn = document.getElementById("resetBtn");
        const bgBtn = document.getElementById("bgBtn");
        const darkBtn = document.getElementById("darkBtn");

        const searchQueryInput = document.getElementById("searchQueryInput");
        const searchSongBtn = document.getElementById("searchSongBtn");
        const clearResultsBtn = document.getElementById("clearResultsBtn");
        const searchStatus = document.getElementById("searchStatus");
        const lrclibResults = document.getElementById("lrclibResults");
        const youtubeResults = document.getElementById("youtubeResults");
        const youtubeStatus = document.getElementById("youtubeStatus");

        const playerWrap = document.getElementById("playerWrap");
        const playerBox = document.getElementById("playerBox");
        const closePlayerBtn = document.getElementById("closePlayerBtn");

        const lyricsInput = document.getElementById("lyricsInput");
        const audioFileInput = document.getElementById("audioFileInput");
        const audioUrlInput = document.getElementById("audioUrlInput");
        const loadAudioUrlBtn = document.getElementById("loadAudioUrlBtn");
        const audioStatus = document.getElementById("audioStatus");
        const useAudioTimingCheckbox = document.getElementById("useAudioTimingCheckbox");
        const startFromZeroCheckbox = document.getElementById("startFromZeroCheckbox");

        const exportVideoBtn = document.getElementById("exportVideoBtn");
        const exportPngBtn = document.getElementById("exportPngBtn");
        const exportSizeSelect = document.getElementById("exportSizeSelect");
        const exportFpsSelect = document.getElementById("exportFpsSelect");
        const includeAudioInExportCheckbox = document.getElementById("includeAudioInExportCheckbox");
        const exportAudioVolumeInput = document.getElementById("exportAudioVolumeInput");
        const exportAudioFadeInInput = document.getElementById("exportAudioFadeInInput");
        const exportAudioFadeOutInput = document.getElementById("exportAudioFadeOutInput");
        const exportAudioNote = document.getElementById("exportAudioNote");
        const exportStatus = document.getElementById("exportStatus");
        const exportEstimate = document.getElementById("exportEstimate");

        const meta = document.getElementById("meta");
        const clearSavedBtn = document.getElementById("clearSavedBtn");
        const lrcDropZone = document.getElementById("lrcDropZone");
        const audioDropZone = document.getElementById("audioDropZone");
        const exportProgress = document.getElementById("exportProgress");
        const compatFastMp4 = document.getElementById("compatFastMp4");
        const compatMediaRecorder = document.getElementById("compatMediaRecorder");
        const compatRecommendation = document.getElementById("compatRecommendation");
        const langButtons = document.querySelectorAll(".lang-btn");
        const stageWrap = document.querySelector(".stage-wrap");
        const formatPresetSelect = document.getElementById("formatPresetSelect");
        const themePresetSelect = document.getElementById("themePresetSelect");
        const animationModeSelect = document.getElementById("animationModeSelect");
        const lyricsDisplayModeSelect = document.getElementById("lyricsDisplayModeSelect");
        const musicAlignSelect = document.getElementById("musicAlignSelect");
        const wordHighlightCheckbox = document.getElementById("wordHighlightCheckbox");
        const musicActiveScaleInput = document.getElementById("musicActiveScaleInput");
        const musicDimOpacityInput = document.getElementById("musicDimOpacityInput");
        const musicScrollPositionInput = document.getElementById("musicScrollPositionInput");
        const wordAnimationModeSelect = document.getElementById("wordAnimationModeSelect");
        const wordAnimationIntensityInput = document.getElementById("wordAnimationIntensityInput");
        const wordAnimationColorInput = document.getElementById("wordAnimationColorInput");
        const beautifulDynamicBgCheckbox = document.getElementById("beautifulDynamicBgCheckbox");
        const beautifulSideVocalsCheckbox = document.getElementById("beautifulSideVocalsCheckbox");
        const beautifulMotionInput = document.getElementById("beautifulMotionInput");
        const beautifulDepthInput = document.getElementById("beautifulDepthInput");
        const beautifulGlowInput = document.getElementById("beautifulGlowInput");
        const beautifulEdgeFadeInput = document.getElementById("beautifulEdgeFadeInput");
        const bgColorInput = document.getElementById("bgColorInput");
        const textColorInput = document.getElementById("textColorInput");
        const fontFamilySelect = document.getElementById("fontFamilySelect");
        const fontScaleInput = document.getElementById("fontScaleInput");
        const blurInput = document.getElementById("blurInput");
        const verticalPositionInput = document.getElementById("verticalPositionInput");
        const stretchInput = document.getElementById("stretchInput");
        const letterSpacingInput = document.getElementById("letterSpacingInput");
        const letterChunkSizeInput = document.getElementById("letterChunkSizeInput");
        const lineSpacingInput = document.getElementById("lineSpacingInput");
        const randomStyleBtn = document.getElementById("randomStyleBtn");
        const safeZonesCheckbox = document.getElementById("safeZonesCheckbox");
        const fullscreenBtn = document.getElementById("fullscreenBtn");
        const backgroundFileInput = document.getElementById("backgroundFileInput");
        const backgroundUrlInput = document.getElementById("backgroundUrlInput");
        const loadBackgroundUrlBtn = document.getElementById("loadBackgroundUrlBtn");
        const clearBackgroundBtn = document.getElementById("clearBackgroundBtn");
        const useArtworkBgBtn = document.getElementById("useArtworkBgBtn");
        const bgMediaOpacityInput = document.getElementById("bgMediaOpacityInput");
        const bgMediaBlurInput = document.getElementById("bgMediaBlurInput");
        const bgMediaBrightnessInput = document.getElementById("bgMediaBrightnessInput");
        const bgMediaSaturationInput = document.getElementById("bgMediaSaturationInput");
        const bgMediaScaleInput = document.getElementById("bgMediaScaleInput");
        const bgMediaPositionXInput = document.getElementById("bgMediaPositionXInput");
        const bgMediaPositionYInput = document.getElementById("bgMediaPositionYInput");
        const backgroundStatus = document.getElementById("backgroundStatus");
        const presetNameInput = document.getElementById("presetNameInput");
        const savePresetBtn = document.getElementById("savePresetBtn");
        const userPresetSelect = document.getElementById("userPresetSelect");
        const loadPresetBtn = document.getElementById("loadPresetBtn");
        const deletePresetBtn = document.getElementById("deletePresetBtn");
        const exportPresetBtn = document.getElementById("exportPresetBtn");
        const importPresetInput = document.getElementById("importPresetInput");
        const presetStatus = document.getElementById("presetStatus");
        const lrcRows = document.getElementById("lrcRows");
        const lrcSearchInput = document.getElementById("lrcSearchInput");
        const refreshEditorBtn = document.getElementById("refreshEditorBtn");
        const applyEditorBtn = document.getElementById("applyEditorBtn");
        const addLrcRowBtn = document.getElementById("addLrcRowBtn");
        const syncCurrentRowBtn = document.getElementById("syncCurrentRowBtn");
        const splitLrcRowBtn = document.getElementById("splitLrcRowBtn");
        const mergeLrcRowBtn = document.getElementById("mergeLrcRowBtn");
        const moveLrcUpBtn = document.getElementById("moveLrcUpBtn");
        const moveLrcDownBtn = document.getElementById("moveLrcDownBtn");
        const duplicateLrcRowBtn = document.getElementById("duplicateLrcRowBtn");
        const playSelectedRowBtn = document.getElementById("playSelectedRowBtn");
        const timingOffsetInput = document.getElementById("timingOffsetInput");
        const shiftSelectedBackBtn = document.getElementById("shiftSelectedBackBtn");
        const shiftSelectedForwardBtn = document.getElementById("shiftSelectedForwardBtn");
        const shiftAllByInputBtn = document.getElementById("shiftAllByInputBtn");
        const undoBtn = document.getElementById("undoBtn");
        const redoBtn = document.getElementById("redoBtn");
        const plainLyricsInput = document.getElementById("plainLyricsInput");
        const startTapSyncBtn = document.getElementById("startTapSyncBtn");
        const tapNextLineBtn = document.getElementById("tapNextLineBtn");
        const finishTapSyncBtn = document.getElementById("finishTapSyncBtn");
        const tapSyncStatus = document.getElementById("tapSyncStatus");
        const syncMediaMount = document.getElementById("syncMediaMount");
        const waveformCanvas = document.getElementById("waveformCanvas");
        const timelineCanvas = document.getElementById("timelineCanvas");
        const cleanLrcBtn = document.getElementById("cleanLrcBtn");
        const normalizeLrcBtn = document.getElementById("normalizeLrcBtn");
        const shiftBackBtn = document.getElementById("shiftBackBtn");
        const shiftForwardBtn = document.getElementById("shiftForwardBtn");
        const exportFramesBtn = document.getElementById("exportFramesBtn");
        const exportPreviewClipBtn = document.getElementById("exportPreviewClipBtn");
        const exportProjectBtn = document.getElementById("exportProjectBtn");
        const importProjectInput = document.getElementById("importProjectInput");
        const copyLrcBtn = document.getElementById("copyLrcBtn");
        const starterLrcBtn = document.getElementById("starterLrcBtn");
        const snapshotNameInput = document.getElementById("snapshotNameInput");
        const saveSnapshotBtn = document.getElementById("saveSnapshotBtn");
        const duplicateProjectBtn = document.getElementById("duplicateProjectBtn");
        const shareProjectLinkBtn = document.getElementById("shareProjectLinkBtn");
        const copyProjectJsonBtn = document.getElementById("copyProjectJsonBtn");
        const projectFeatureStatus = document.getElementById("projectFeatureStatus");
        const snapshotList = document.getElementById("snapshotList");
        const previewZoomInput = document.getElementById("previewZoomInput");
        const commandPalette = document.getElementById("commandPalette");
        const commandPaletteInput = document.getElementById("commandPaletteInput");
        const commandPaletteList = document.getElementById("commandPaletteList");
        const recoveryBanner = document.getElementById("recoveryBanner");
        const recoveryKeepBtn = document.getElementById("recoveryKeepBtn");
        const recoveryDiscardBtn = document.getElementById("recoveryDiscardBtn");

        const SNAPSHOT_STORAGE_KEY = "bratAnimator.snapshots.v1";
        const USER_PRESET_STORAGE_KEY = "bratAnimator.presets.v1";
        const MEDIA_DB_NAME = "bratAnimator.media.v1";
        const MEDIA_STORE_NAME = "media";
        const UNDO_LIMIT = 60;

        const state = {
            timeline: [],
            isPlaying: false,
            animationFrame: null,
            playStartMs: null,
            pausedElapsedSec: 0,
            selectedSong: null,
            selectedVideoId: null,
            selectedVideoBase: null,
            audioBuffer: null,
            audioAnalysis: null,
            audioFileName: "",
            audioObjectUrl: "",
            audioRemoteUrl: "",
            theme: "green",
            language: "en",
            formatPreset: "square",
            animationMode: "typewriter",
            includeAudioInExport: true,
            selectedLrcRowIndex: 0,
            selectedLrcRowIndexes: new Set(),
            lrcClipboardRows: [],
            undoStack: [],
            redoStack: [],
            dragEdit: null,
            previewZoom: 1,
            audio: {
                includeInExport: true,
                volume: 1,
                fadeIn: 0,
                fadeOut: 0,
                source: "local",
                url: "",
                mediaKind: "audio"
            },
            metadata: {
                trackName: "",
                artistName: "",
                albumName: "",
                duration: 0,
                artworkUrl: "",
                thumbnailUrl: "",
                source: ""
            },
            background: {
                kind: "none",
                assetId: "",
                url: "",
                name: "",
                opacity: 1,
                blur: 0,
                brightness: 1,
                saturation: 1,
                scale: 1,
                positionX: 0.5,
                positionY: 0.5
            },
            backgroundElement: null,
            backgroundObjectUrl: "",
            backgroundExportSafe: true,
            dirty: {
                timeline: true,
                render: true,
                waveform: true
            },
            tapSync: {
                active: false,
                startedAt: 0,
                lines: [],
                stamps: [],
                index: 0
            },
            style: {
                bgColor: "#8ACE00",
                textColor: "#000000",
                fontFamily: "Arial Narrow, Arial, Helvetica Neue Condensed, sans-serif",
                fontScale: 1,
                blur: 1.05,
                verticalPosition: 0,
                stretch: 0.94,
                letterSpacing: 0,
                letterChunkSize: 2,
                lineSpacing: 0.92,
                lyricsMode: "brat",
                musicAlign: "left",
                musicWordHighlight: true,
                musicActiveScale: 1.16,
                musicDimOpacity: 0.34,
                musicScrollPosition: 0.50,
                wordAnimation: {
                    mode: "progress",
                    intensity: 0.7,
                    color: "#ffffff"
                },
                beautifulDynamicBg: true,
                beautifulSideVocals: true,
                beautifulMotion: 0.72,
                beautifulDepth: 0.86,
                beautifulGlow: 0.84,
                beautifulEdgeFade: 0.82,
                safeZones: false
            },
            exportInProgress: false
        };

        const demoLyrics = `[00:21.62] y dime que me amas aunque no lo digas con palabras
[00:24.48] yo sé que en esa pausa también hay algo
[00:27.28] aunque no haya puntuación la frase respira igual
[00:29.56] y por eso no quiero que tutta la línea salga junta`;

        const DEFAULT_TYPING_SECONDS_PER_WEIGHT = 0.065;
        const SHORT_LINE_THRESHOLD = 42;
        const SHORT_LINE_SPEED_MULTIPLIER = 1.28;
        const MIN_LINE_CONTENT_WINDOW = 0.42;
        const MAX_LINE_TRAILING_HOLD = 0.55;

        let sharedAudioContext = null;
        let syncAudio = null;

        function clamp(value, min, max) {
            return Math.min(max, Math.max(min, value));
        }

        function migrateProjectPayload(payload) {
            if (BratCore.migrateProjectPayload) {
                return BratCore.migrateProjectPayload(payload);
            }
            const audioName = payload?.audio?.name || "";
            const audioUrl = payload?.audio?.url || "";
            return {
                ...(payload || {}),
                version: PROJECT_VERSION,
                audio: {
                    includeInExport: payload?.audio?.includeInExport ?? payload?.includeAudioInExport ?? true,
                    volume: clamp(Number(payload?.audio?.volume ?? 1), 0, 2),
                    fadeIn: clamp(Number(payload?.audio?.fadeIn ?? 0), 0, 30),
                    fadeOut: clamp(Number(payload?.audio?.fadeOut ?? 0), 0, 30),
                    source: payload?.audio?.source || "local",
                    url: audioUrl,
                    assetId: payload?.audio?.assetId || "",
                    name: audioName,
                    mediaKind: payload?.audio?.mediaKind || inferAudioMediaKind(audioName, audioUrl)
                },
                metadata: payload?.metadata || {},
                background: payload?.background || { kind: "none" },
                style: {
                    ...(payload?.style || {}),
                    wordAnimation: payload?.style?.wordAnimation || { mode: "progress", intensity: 0.7, color: "#ffffff" }
                }
            };
        }

        function getAudioSettingsFromControls() {
            state.audio = {
                includeInExport: includeAudioInExportCheckbox?.checked !== false,
                volume: clamp((Number(exportAudioVolumeInput?.value) || 100) / 100, 0, 2),
                fadeIn: clamp((Number(exportAudioFadeInInput?.value) || 0) / 100, 0, 10),
                fadeOut: clamp((Number(exportAudioFadeOutInput?.value) || 0) / 100, 0, 10),
                source: state.audio?.source || "local",
                url: state.audio?.url || state.audioRemoteUrl || "",
                assetId: state.audio?.assetId || "",
                name: state.audio?.name || state.audioFileName || "",
                mediaKind: state.audio?.mediaKind || inferAudioMediaKind(state.audio?.name || state.audioFileName || "", state.audio?.url || state.audioRemoteUrl || "")
            };
            state.includeAudioInExport = state.audio.includeInExport;
            return state.audio;
        }

        function writeAudioControls(audio = state.audio) {
            const next = migrateProjectPayload({ audio }).audio;
            state.audio = next;
            state.includeAudioInExport = next.includeInExport;
            if (includeAudioInExportCheckbox) includeAudioInExportCheckbox.checked = next.includeInExport !== false;
            if (exportAudioVolumeInput) exportAudioVolumeInput.value = Math.round((next.volume ?? 1) * 100);
            if (exportAudioFadeInInput) exportAudioFadeInInput.value = Math.round((next.fadeIn ?? 0) * 100);
            if (exportAudioFadeOutInput) exportAudioFadeOutInput.value = Math.round((next.fadeOut ?? 0) * 100);
        }

        function getBackgroundSettingsFromControls() {
            state.background = {
                ...state.background,
                opacity: clamp((Number(bgMediaOpacityInput?.value) || 100) / 100, 0, 1),
                blur: clamp(Number(bgMediaBlurInput?.value) || 0, 0, 40),
                brightness: clamp((Number(bgMediaBrightnessInput?.value) || 100) / 100, 0, 2),
                saturation: clamp((Number(bgMediaSaturationInput?.value) || 100) / 100, 0, 2),
                scale: clamp((Number(bgMediaScaleInput?.value) || 100) / 100, 0.25, 3),
                positionX: clamp((Number(bgMediaPositionXInput?.value) || 50) / 100, 0, 1),
                positionY: clamp((Number(bgMediaPositionYInput?.value) || 50) / 100, 0, 1)
            };
            return state.background;
        }

        function writeBackgroundControls(background = state.background) {
            const next = migrateProjectPayload({ background }).background;
            state.background = { ...state.background, ...next };
            if (bgMediaOpacityInput) bgMediaOpacityInput.value = Math.round((next.opacity ?? 1) * 100);
            if (bgMediaBlurInput) bgMediaBlurInput.value = Math.round(next.blur ?? 0);
            if (bgMediaBrightnessInput) bgMediaBrightnessInput.value = Math.round((next.brightness ?? 1) * 100);
            if (bgMediaSaturationInput) bgMediaSaturationInput.value = Math.round((next.saturation ?? 1) * 100);
            if (bgMediaScaleInput) bgMediaScaleInput.value = Math.round((next.scale ?? 1) * 100);
            if (bgMediaPositionXInput) bgMediaPositionXInput.value = Math.round((next.positionX ?? 0.5) * 100);
            if (bgMediaPositionYInput) bgMediaPositionYInput.value = Math.round((next.positionY ?? 0.5) * 100);
            updateBackgroundStatus();
        }

        function updateUndoRedoState() {
            if (undoBtn) undoBtn.disabled = !state.undoStack.length;
            if (redoBtn) redoBtn.disabled = !state.redoStack.length;
        }

        function commitProjectChange(label, mutator) {
            const before = buildProjectPayload();
            mutator();
            const after = buildProjectPayload();
            if (JSON.stringify(before) !== JSON.stringify(after)) {
                state.undoStack.push({ label, payload: before });
                if (state.undoStack.length > UNDO_LIMIT) state.undoStack.shift();
                state.redoStack = [];
            }
            updateUndoRedoState();
        }

        function undoProjectChange() {
            if (!state.undoStack.length) return;
            const current = buildProjectPayload();
            const entry = state.undoStack.pop();
            state.redoStack.push({ label: entry.label, payload: current });
            restoreProjectSettings(entry.payload, { skipHistory: true });
            setProjectFeatureStatus(`undid ${entry.label}`);
            updateUndoRedoState();
        }

        function redoProjectChange() {
            if (!state.redoStack.length) return;
            const current = buildProjectPayload();
            const entry = state.redoStack.pop();
            state.undoStack.push({ label: entry.label, payload: current });
            restoreProjectSettings(entry.payload, { skipHistory: true });
            setProjectFeatureStatus(`redid ${entry.label}`);
            updateUndoRedoState();
        }

        function openMediaDb() {
            if (!("indexedDB" in window)) return Promise.resolve(null);
            return new Promise((resolve) => {
                const request = indexedDB.open(MEDIA_DB_NAME, 1);
                request.onupgradeneeded = () => {
                    request.result.createObjectStore(MEDIA_STORE_NAME, { keyPath: "id" });
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            });
        }

        async function storeMediaBlob(blob, name, kind) {
            const db = await openMediaDb();
            const id = `${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
            if (!db) return id;
            await new Promise((resolve) => {
                const tx = db.transaction(MEDIA_STORE_NAME, "readwrite");
                tx.objectStore(MEDIA_STORE_NAME).put({ id, blob, name, kind, savedAt: new Date().toISOString() });
                tx.oncomplete = resolve;
                tx.onerror = resolve;
            });
            db.close?.();
            return id;
        }

        async function loadMediaBlob(assetId) {
            const db = await openMediaDb();
            if (!db || !assetId) return null;
            return new Promise((resolve) => {
                const tx = db.transaction(MEDIA_STORE_NAME, "readonly");
                const request = tx.objectStore(MEDIA_STORE_NAME).get(assetId);
                request.onsuccess = () => {
                    db.close?.();
                    resolve(request.result || null);
                };
                request.onerror = () => {
                    db.close?.();
                    resolve(null);
                };
            });
        }

        function percentile(values, q) {
            if (!values.length) return 0;
            const sorted = [...values].sort((a, b) => a - b);
            const index = (sorted.length - 1) * q;
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            if (lower === upper) return sorted[lower];
            const weight = index - lower;
            return sorted[lower] * (1 - weight) + sorted[upper] * weight;
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
            if (!match) {
                return { role: "lead", text: raw };
            }

            const roleText = String(match[1] || match[2] || "lead").toLowerCase();
            let role = "lead";
            if (["bg", "background", "backing"].includes(roleText)) role = "background";
            if (["side", "adlib"].includes(roleText)) role = "side";
            if (["romanized", "rom", "translation", "trans"].includes(roleText)) role = "secondary";

            return { role, text: raw.slice(match[0].length).trim() };
        }

        function hexToRgb(hex) {
            const clean = String(hex || "").replace("#", "").trim();
            if (![3, 6].includes(clean.length)) return { r: 0, g: 0, b: 0 };
            const full = clean.length === 3 ? clean.split("").map(ch => ch + ch).join("") : clean;
            const value = parseInt(full, 16);
            if (!Number.isFinite(value)) return { r: 0, g: 0, b: 0 };
            return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
        }

        function rgbaFromHex(hex, alpha = 1) {
            const rgb = hexToRgb(hex);
            return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        }

        function mixHex(a, b, amount = 0.5) {
            const x = hexToRgb(a);
            const y = hexToRgb(b);
            const t = clamp(amount, 0, 1);
            const r = Math.round(x.r + (y.r - x.r) * t);
            const g = Math.round(x.g + (y.g - x.g) * t);
            const bb = Math.round(x.b + (y.b - x.b) * t);
            return `#${[r, g, bb].map(value => value.toString(16).padStart(2, "0")).join("")}`;
        }

        function easeOutCubic(t) {
            const x = clamp(t, 0, 1);
            return 1 - Math.pow(1 - x, 3);
        }

        function easeInOutCubic(t) {
            const x = clamp(t, 0, 1);
            return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
        }

        function splitWordsWithIndices(text) {
            const words = [];
            const regex = /\S+/g;
            let match;

            while ((match = regex.exec(text)) !== null) {
                words.push({
                    word: match[0],
                    start: match.index,
                    end: match.index + match[0].length - 1
                });
            }

            return words;
        }

        function estimatePhraseBreaks(text) {
            const words = splitWordsWithIndices(text);
            const breakCharIndices = new Set();

            if (!words.length) return breakCharIndices;

            for (const item of words) {
                if (/[,:;.!?…]$/.test(item.word)) {
                    breakCharIndices.add(item.end);
                }
            }

            const explicitBreakCount = breakCharIndices.size;
            const wordCount = words.length;

            if (explicitBreakCount >= Math.max(1, Math.floor(wordCount / 5))) {
                return breakCharIndices;
            }

            let targetChunkSize = 3;
            if (wordCount >= 7) targetChunkSize = 4;
            if (wordCount >= 11) targetChunkSize = 5;
            if (wordCount >= 16) targetChunkSize = 6;

            let cursor = 0;
            while (cursor < words.length) {
                let next = cursor + targetChunkSize;
                if (next >= words.length) break;

                const remaining = words.length - next;
                if (remaining === 1) next -= 1;

                const breakWord = words[next - 1];
                if (breakWord) {
                    breakCharIndices.add(breakWord.end);
                }

                cursor = next;
            }

            return breakCharIndices;
        }

        function buildPhraseChunks(text) {
            const words = splitWordsWithIndices(text);
            if (!words.length) return [];

            const breaks = estimatePhraseBreaks(text);
            const chunks = [];
            let chunkStart = words[0].start;

            for (let i = 0; i < words.length; i += 1) {
                const currentWord = words[i];
                const isLastWord = i === words.length - 1;
                const shouldBreak = breaks.has(currentWord.end) || isLastWord;

                if (!shouldBreak) continue;

                const chunkEnd = currentWord.end;
                const chunkText = text.slice(chunkStart, chunkEnd + 1).trim();

                if (chunkText) {
                    chunks.push({
                        startChar: chunkStart,
                        endChar: chunkEnd,
                        text: chunkText
                    });
                }

                let nextStart = chunkEnd + 1;
                while (nextStart < text.length && /\s/.test(text[nextStart])) {
                    nextStart += 1;
                }
                chunkStart = nextStart;
            }

            if (!chunks.length) {
                chunks.push({
                    startChar: 0,
                    endChar: text.length - 1,
                    text: text.trim()
                });
            }

            return chunks.filter(chunk => chunk.text.length > 0);
        }

        function getCharWeight(char, nextChar) {
            if (char === " ") return 0.16;
            if (char === ",") return 1.7;
            if (char === ";") return 2.0;
            if (char === ":") return 2.1;
            if (char === ".") return nextChar === "." ? 1.2 : 2.35;
            if (char === "!") return 2.35;
            if (char === "?") return 2.45;
            if (char === "…") return 3.1;
            if (char === "-" || char === "—") return 1.35;
            if (char === "\u2019" || char === "'") return 0.35;
            if (/[0-9]/.test(char)) return 1.05;
            return 1;
        }

        function getBlockPauseFactor(text) {
            if (/[.!?…]$/.test(text)) return 0.34;
            if (/[,:;]$/.test(text)) return 0.26;
            return 0.18;
        }

        async function getAudioContext() {
            if (!sharedAudioContext) {
                sharedAudioContext = new(window.AudioContext || window.webkitAudioContext)();
            }
            return sharedAudioContext;
        }

        async function decodeUploadedAudio(file) {
            const audioContext = await getAudioContext();
            const arrayBuffer = await file.arrayBuffer();
            return audioContext.decodeAudioData(arrayBuffer);
        }

        function bindSyncMediaEvents(element) {
            element.addEventListener("timeupdate", () => {
                if (!state.isPlaying) {
                    state.pausedElapsedSec = element.currentTime || state.pausedElapsedSec;
                    renderPreviewAt(state.pausedElapsedSec);
                    drawWaveform();
                    renderTimeline();
                }
            });
        }

        function clearSyncMediaSource() {
            syncAudio?.pause?.();
            syncAudio = null;
            if (syncMediaMount) {
                syncMediaMount.replaceChildren();
                syncMediaMount.classList.add("hidden");
            }
        }

        function setSyncMediaSource(src, mediaKind) {
            if (!syncMediaMount) return;
            clearSyncMediaSource();
            const element = mediaKind === "video" ? document.createElement("video") : document.createElement("audio");
            element.controls = true;
            element.preload = "metadata";
            element.playsInline = true;
            element.className = mediaKind === "video" ? "sync-media-player is-video" : "sync-media-player";
            element.src = src;
            bindSyncMediaEvents(element);
            syncAudio = element;
            syncMediaMount.appendChild(element);
            syncMediaMount.classList.remove("hidden");
        }

        function analyzeAudioEnergy(audioBuffer, frameMs = 18) {
            const channelCount = audioBuffer.numberOfChannels;
            const sampleRate = audioBuffer.sampleRate;
            const frameSize = Math.max(1, Math.floor(sampleRate * frameMs / 1000));
            const frameDuration = frameSize / sampleRate;
            const channels = Array.from({
                length: channelCount
            }, (_, i) => audioBuffer.getChannelData(i));

            const rawFrames = [];

            for (let start = 0; start < audioBuffer.length; start += frameSize) {
                const end = Math.min(start + frameSize, audioBuffer.length);
                let sum = 0;

                for (let i = start; i < end; i += 1) {
                    let mono = 0;
                    for (let c = 0; c < channelCount; c += 1) {
                        mono += channels[c][i] || 0;
                    }
                    mono /= channelCount;
                    sum += mono * mono;
                }

                rawFrames.push({
                    time: start / sampleRate,
                    rms: Math.sqrt(sum / Math.max(1, end - start))
                });
            }

            const frames = rawFrames.map((frame, i) => {
                let sum = 0;
                let count = 0;

                for (let j = Math.max(0, i - 2); j <= Math.min(rawFrames.length - 1, i + 2); j += 1) {
                    sum += rawFrames[j].rms;
                    count += 1;
                }

                return {
                    time: frame.time,
                    rms: sum / count
                };
            });

            const rmsValues = frames.map(frame => frame.rms);
            const lowRms = percentile(rmsValues, 0.12);
            const medianRms = percentile(rmsValues, 0.50);
            const highRms = percentile(rmsValues, 0.88);
            const silenceThreshold = lowRms + (medianRms - lowRms) * 0.28;

            return {
                duration: audioBuffer.duration,
                frameDuration,
                frames,
                lowRms,
                medianRms,
                highRms,
                silenceThreshold
            };
        }

        function getFramesInWindow(audioAnalysis, startSec, endSec) {
            if (!audioAnalysis || !audioAnalysis.frames.length) return [];

            const safeStart = clamp(startSec, 0, audioAnalysis.duration);
            const safeEnd = clamp(endSec, safeStart, audioAnalysis.duration);

            const startIndex = clamp(
                Math.floor(safeStart / audioAnalysis.frameDuration),
                0,
                audioAnalysis.frames.length - 1
            );

            const endIndex = clamp(
                Math.ceil(safeEnd / audioAnalysis.frameDuration),
                startIndex,
                audioAnalysis.frames.length - 1
            );

            return audioAnalysis.frames.slice(startIndex, endIndex + 1);
        }

        function estimateTrailingSilence(audioAnalysis, startSec, endSec) {
            const frames = getFramesInWindow(audioAnalysis, startSec, endSec);
            if (frames.length < 3) return 0;

            const threshold = audioAnalysis.silenceThreshold * 1.12;
            let trailingCount = 0;

            for (let i = frames.length - 1; i >= 0; i -= 1) {
                if (frames[i].rms <= threshold) {
                    trailingCount += 1;
                } else if (trailingCount > 0) {
                    break;
                }
            }

            return clamp(
                trailingCount * audioAnalysis.frameDuration,
                0,
                Math.max(0, endSec - startSec)
            );
        }

        function findAudioAwareBoundaries(audioAnalysis, startSec, endSec, targetRatios) {
            if (!audioAnalysis || !targetRatios.length) return [];

            const frames = getFramesInWindow(audioAnalysis, startSec, endSec);
            if (frames.length < 4) return [];

            const localDuration = endSec - startSec;
            if (localDuration <= 0.12) return [];

            const rmsRange = Math.max(audioAnalysis.highRms - audioAnalysis.lowRms, 1e-6);
            const boundaries = [];
            let previousBoundary = startSec;

            for (let i = 0; i < targetRatios.length; i += 1) {
                const ratio = targetRatios[i];
                const targetTime = startSec + localDuration * ratio;
                const searchRadius = clamp(localDuration * 0.14, 0.08, 0.30);

                const minAllowed = previousBoundary + 0.06;
                const maxAllowed = endSec - 0.06 * (targetRatios.length - i);

                const windowStart = Math.max(minAllowed, targetTime - searchRadius);
                const windowEnd = Math.min(maxAllowed, targetTime + searchRadius);

                const candidates = frames.filter(frame =>
                    frame.time >= windowStart && frame.time <= windowEnd
                );

                let boundary = clamp(targetTime, minAllowed, maxAllowed);

                if (candidates.length) {
                    let bestCandidate = candidates[0];
                    let bestScore = Infinity;

                    for (const candidate of candidates) {
                        const energyNorm = (candidate.rms - audioAnalysis.lowRms) / rmsRange;
                        const distanceNorm = Math.abs(candidate.time - targetTime) / Math.max(searchRadius, 1e-6);
                        const score = energyNorm * 0.85 + distanceNorm * 0.35;

                        if (score < bestScore) {
                            bestScore = score;
                            bestCandidate = candidate;
                        }
                    }

                    boundary = clamp(bestCandidate.time, minAllowed, maxAllowed);
                }

                previousBoundary = boundary;
                boundaries.push(boundary);
            }

            return boundaries;
        }

        function scheduleCharsInsideBlock(blockText, blockStart, typingDuration, lineIndex, blockIndex) {
            const chars = Array.from(blockText);
            const weights = chars.map((char, index) => {
                const nextChar = chars[index + 1] || "";
                let weight = getCharWeight(char, nextChar);

                if (/[A-ZÀ-Ý]/.test(char)) weight += 0.04;
                if (/[mwMW]/.test(char)) weight += 0.08;
                if (/[iltI]/.test(char)) weight -= 0.03;

                return Math.max(0.08, weight);
            });

            const totalWeight = weights.reduce((sum, value) => sum + value, 0) || 1;
            let cursor = blockStart;

            return chars.map((char, charIndex) => {
                const duration = (weights[charIndex] / totalWeight) * typingDuration;
                const timestamp = cursor;
                cursor += duration;

                return {
                    char,
                    lineIndex,
                    blockIndex,
                    charIndex,
                    timestamp,
                    duration
                };
            });
        }

        function getActiveAudioAnalysis() {
            return useAudioTimingCheckbox.checked ? state.audioAnalysis : null;
        }

        function scheduleBlocksForLine(
            text,
            lineStart,
            nextLineStart,
            lineIndex,
            sourceLineStart = null,
            sourceNextLineStart = null,
            audioAnalysis = null
        ) {
            const chunks = buildPhraseChunks(text);

            const fallbackDuration = Math.max(2.1, text.length * 0.082);
            const reservedGap = 0.05;

            const lineEnd =
                typeof nextLineStart === "number" ?
                Math.max(lineStart + 0.42, nextLineStart - reservedGap) :
                lineStart + fallbackDuration;

            const availableDuration = Math.max(0.42, lineEnd - lineStart);

            const trimmedLength = text.trim().length;
            const speedMultiplier =
                trimmedLength <= SHORT_LINE_THRESHOLD ? SHORT_LINE_SPEED_MULTIPLIER : 1;

            const weightedChunks = chunks.map((chunk) => {
                const chars = Array.from(chunk.text);
                const charWeights = chars.map((char, index) =>
                    getCharWeight(char, chars[index + 1] || "")
                );
                const typingWeight =
                    charWeights.reduce((sum, value) => sum + value, 0) || 1;
                const pauseFactor = getBlockPauseFactor(chunk.text);
                const totalWeight = typingWeight * (1 + pauseFactor);

                return {
                    ...chunk,
                    typingWeight,
                    pauseFactor,
                    totalWeight
                };
            });

            const totalLineWeight =
                weightedChunks.reduce((sum, chunk) => sum + chunk.totalWeight, 0) || 1;

            const naturalContentDuration =
                (totalLineWeight * DEFAULT_TYPING_SECONDS_PER_WEIGHT) / speedMultiplier;

            let contentWindow = Math.max(
                MIN_LINE_CONTENT_WINDOW,
                Math.min(naturalContentDuration, availableDuration)
            );

            let trailingHold = Math.max(
                0,
                Math.min(availableDuration - contentWindow, MAX_LINE_TRAILING_HOLD)
            );

            let boundaryOffsets = null;

            if (
                audioAnalysis &&
                Number.isFinite(sourceLineStart) &&
                weightedChunks.length > 1
            ) {
                const absoluteIntervalEnd =
                    Number.isFinite(sourceNextLineStart) ?
                    sourceNextLineStart :
                    sourceLineStart + availableDuration;

                const audioTrailingHold = estimateTrailingSilence(
                    audioAnalysis,
                    sourceLineStart,
                    absoluteIntervalEnd
                );

                const maxAllowedTrailingHold = Math.max(
                    0,
                    Math.min(MAX_LINE_TRAILING_HOLD, availableDuration - MIN_LINE_CONTENT_WINDOW)
                );

                trailingHold = clamp(
                    Math.max(trailingHold, audioTrailingHold * 0.85),
                    0,
                    maxAllowedTrailingHold
                );

                contentWindow = Math.max(
                    MIN_LINE_CONTENT_WINDOW,
                    Math.min(naturalContentDuration, availableDuration - trailingHold)
                );

                const targetRatios = [];
                let runningRatio = 0;

                for (let i = 0; i < weightedChunks.length - 1; i += 1) {
                    runningRatio += weightedChunks[i].totalWeight / totalLineWeight;
                    targetRatios.push(runningRatio);
                }

                const audioBoundaries = findAudioAwareBoundaries(
                    audioAnalysis,
                    sourceLineStart,
                    sourceLineStart + contentWindow,
                    targetRatios
                );

                if (audioBoundaries.length === weightedChunks.length - 1) {
                    boundaryOffsets = [
                        0,
                        ...audioBoundaries.map(boundary =>
                            clamp(boundary - sourceLineStart, 0, contentWindow)
                        ),
                        contentWindow
                    ];
                }
            }

            let cursor = lineStart;

            return weightedChunks.map((chunk, blockIndex) => {
                let blockStartTime = cursor;
                let blockDuration =
                    contentWindow * (chunk.totalWeight / totalLineWeight);

                if (boundaryOffsets) {
                    blockStartTime = lineStart + boundaryOffsets[blockIndex];
                    blockDuration = Math.max(
                        0.08,
                        boundaryOffsets[blockIndex + 1] - boundaryOffsets[blockIndex]
                    );
                }

                const typingDuration =
                    blockDuration * (chunk.typingWeight / chunk.totalWeight);

                let holdDuration = blockDuration - typingDuration;

                if (blockIndex === weightedChunks.length - 1) {
                    holdDuration += trailingHold;
                }

                const chars = scheduleCharsInsideBlock(
                    chunk.text,
                    blockStartTime,
                    typingDuration,
                    lineIndex,
                    blockIndex
                );

                const displayStart = blockStartTime;
                const fullVisibleAt = chars[chars.length - 1]?.timestamp ?? blockStartTime;
                const displayEnd = blockStartTime + typingDuration + holdDuration;

                const block = {
                    lineIndex,
                    blockIndex,
                    text: chunk.text,
                    startChar: chunk.startChar,
                    endChar: chunk.endChar,
                    chars,
                    displayStart,
                    fullVisibleAt,
                    displayEnd
                };

                cursor = displayEnd;
                return block;
            });
        }

        function parseLRC(lrcText, startFromZero, audioAnalysis = null) {
            const text = normalizeLRCText(lrcText);
            const rawLines = text.split("\n");
            const parsed = [];
            let offsetMs = 0;

            for (const rawLine of rawLines) {
                const line = rawLine.trim();
                if (!line) continue;

                const metaMatch = line.match(META_TAG_RE);
                if (metaMatch) {
                    if (metaMatch[1].toLowerCase() === "offset") {
                        const parsedOffset = Number(metaMatch[2].trim());
                        if (Number.isFinite(parsedOffset)) {
                            offsetMs = parsedOffset;
                        }
                    }
                    continue;
                }

                const timestamps = [...line.matchAll(LINE_TIMESTAMP_RE)];
                if (!timestamps.length) continue;

                const bodyWithInlineTags = line.replace(LINE_TIMESTAMP_RE, "").trim();
                const enhanced = extractEnhancedLrcLine(bodyWithInlineTags, offsetMs / 1000);
                const vocal = parseVocalRoleAndText(enhanced.cleanText);
                const textWithoutTags = vocal.text;
                if (!textWithoutTags) continue;

                for (const match of timestamps) {
                    const rawTimestamp = parseTimeTag(match[1], match[2]);
                    if (rawTimestamp == null) continue;

                    parsed.push({
                        timestamp: Math.max(0, rawTimestamp + offsetMs / 1000),
                        text: textWithoutTags,
                        role: vocal.role,
                        wordTimings: enhanced.wordTimings
                    });
                }
            }

            parsed.sort((a, b) => a.timestamp - b.timestamp);
            if (!parsed.length) return [];

            const base = startFromZero ? 0 : parsed[0].timestamp;

            const normalized = parsed.map((line, index) => ({
                ...line,
                sourceTimestamp: line.timestamp,
                lineIndex: index,
                timestamp: Math.max(0, line.timestamp - base),
                wordTimings: Array.isArray(line.wordTimings)
                    ? line.wordTimings.map(word => ({ ...word, timestamp: Math.max(0, word.timestamp - base) }))
                    : []
            }));

            return normalized.map((line, index) => {
                const nextLineStart = normalized[index + 1]?.timestamp;
                const nextSourceLineStart = normalized[index + 1]?.sourceTimestamp;

                const blocks = scheduleBlocksForLine(
                    line.text,
                    line.timestamp,
                    nextLineStart,
                    index,
                    line.sourceTimestamp,
                    nextSourceLineStart,
                    audioAnalysis
                );

                return {
                    ...line,
                    blocks,
                    displayStart: blocks[0]?.displayStart ?? line.timestamp,
                    displayEnd: blocks[blocks.length - 1]?.displayEnd ?? line.timestamp
                };
            });
        }

        function getElapsedSeconds() {
            if (state.playStartMs == null) return state.pausedElapsedSec;
            return state.pausedElapsedSec + (Date.now() - state.playStartMs) / 1000;
        }

        function cancelAnimation() {
            if (state.animationFrame != null) {
                cancelAnimationFrame(state.animationFrame);
                state.animationFrame = null;
            }
        }

        function revealTextByNonSpaceLimit(text, nonSpaceLimit) {
            if (nonSpaceLimit <= 0) return "";

            const chars = Array.from(String(text || ""));
            let visibleNonSpace = 0;
            let revealIndex = -1;

            for (let i = 0; i < chars.length; i += 1) {
                const isVisibleChar = /\S/.test(chars[i]);

                if (isVisibleChar) {
                    if (visibleNonSpace >= nonSpaceLimit) break;
                    visibleNonSpace += 1;
                }

                revealIndex = i;
            }

            while (revealIndex + 1 < chars.length && !/\S/.test(chars[revealIndex + 1])) {
                revealIndex += 1;
            }

            return chars.slice(0, revealIndex + 1).join("");
        }

        function getTimelineDuration() {
            const lastLine = state.timeline[state.timeline.length - 1];
            return lastLine ? lastLine.displayEnd : 0;
        }

        function getVisibleTextAt(timeSec) {
            if (!state.timeline.length) {
                return { text: "brat", active: false, alpha: 1, progress: 0 };
            }

            let activeLineIndex = -1;

            for (let i = 0; i < state.timeline.length; i += 1) {
                const line = state.timeline[i];
                if (timeSec >= line.displayStart && timeSec <= line.displayEnd) {
                    activeLineIndex = i;
                    break;
                }
                if (timeSec >= line.displayStart) activeLineIndex = i;
            }

            if (activeLineIndex === -1) return { text: "brat", active: false, alpha: 1, progress: 0 };

            const line = state.timeline[activeLineIndex];
            const lineDuration = Math.max(0.001, line.displayEnd - line.displayStart);
            const lineProgress = clamp((timeSec - line.displayStart) / lineDuration, 0, 1);
            let activeBlockIndex = -1;

            for (let i = 0; i < line.blocks.length; i += 1) {
                const block = line.blocks[i];
                if (timeSec >= block.displayStart && timeSec <= block.displayEnd) {
                    activeBlockIndex = i;
                    break;
                }
                if (timeSec >= block.displayStart) activeBlockIndex = i;
            }

            if (activeBlockIndex === -1) return { text: "", active: true, alpha: 1, progress: lineProgress, line };

            const mode = state.animationMode || "typewriter";
            const block = line.blocks[activeBlockIndex];
            const blockDuration = Math.max(0.001, block.displayEnd - block.displayStart);
            const blockProgress = clamp((timeSec - block.displayStart) / blockDuration, 0, 1);

            if (mode === "line" || mode === "fade" || mode === "pulse") {
                return {
                    text: line.text,
                    active: true,
                    line,
                    block,
                    progress: lineProgress,
                    alpha: mode === "fade" ? clamp(lineProgress * 5, 0, 1) : 1
                };
            }

            if (mode === "phrase" || mode === "jitter") {
                const revealUntil = block.endChar;
                return {
                    text: Array.from(line.text).slice(0, revealUntil + 1).join(""),
                    active: true,
                    line,
                    block,
                    progress: blockProgress,
                    alpha: 1
                };
            }

            if (mode === "word") {
                const textUntilBlock = Array.from(line.text).slice(0, block.startChar).join("");
                const words = block.text.split(/(\s+)/);
                const wordIndexes = words.map((token, index) => /\S/.test(token) ? index : -1).filter(index => index >= 0);
                const visibleWordCount = Math.max(1, Math.ceil(wordIndexes.length * blockProgress));
                const lastTokenIndex = wordIndexes[Math.min(visibleWordCount - 1, wordIndexes.length - 1)] ?? words.length - 1;
                const visibleBlock = words.slice(0, lastTokenIndex + 1).join("");
                return { text: textUntilBlock + visibleBlock, active: true, line, block, progress: blockProgress, alpha: 1 };
            }

            if (mode === "letter-chunks") {
                const textUntilBlock = Array.from(line.text).slice(0, block.startChar).join("");
                const nonSpaceChars = block.chars.filter(item => /\S/.test(item.char));
                const chunkSize = clamp(Math.round(state.style.letterChunkSize || 2), 1, 12);
                let visibleNonSpace = 0;

                while (visibleNonSpace < nonSpaceChars.length && timeSec >= nonSpaceChars[visibleNonSpace].timestamp) {
                    visibleNonSpace += 1;
                }

                if (timeSec >= block.fullVisibleAt) {
                    visibleNonSpace = nonSpaceChars.length;
                }

                const chunkedVisibleNonSpace = Math.min(
                    nonSpaceChars.length,
                    Math.ceil(visibleNonSpace / chunkSize) * chunkSize
                );
                const visibleBlock = revealTextByNonSpaceLimit(block.text, chunkedVisibleNonSpace);

                return { text: textUntilBlock + visibleBlock, active: true, line, block, progress: blockProgress, alpha: 1 };
            }

            let visibleChars = 0;
            while (visibleChars < block.chars.length && timeSec >= block.chars[visibleChars].timestamp) {
                visibleChars += 1;
            }
            if (timeSec >= block.fullVisibleAt) visibleChars = block.chars.length;

            const revealUntil = block.startChar + visibleChars - 1;
            const visibleText = revealUntil >= 0 ? Array.from(line.text).slice(0, revealUntil + 1).join("") : "";
            return { text: visibleText, active: true, line, block, progress: blockProgress, alpha: 1 };
        }

        function measureWrappedLines(ctx, text, maxWidth) {
            const words = String(text || "").trim().split(/\s+/).filter(Boolean);
            if (!words.length) return [""];

            const lines = [];
            let current = words[0];

            for (let i = 1; i < words.length; i += 1) {
                const candidate = current + " " + words[i];
                if (ctx.measureText(candidate).width <= maxWidth) {
                    current = candidate;
                } else {
                    lines.push(current);
                    current = words[i];
                }
            }

            if (current) lines.push(current);

            if (lines.length <= 4) return lines;

            const compact = [];
            let bucket = "";

            for (const line of lines) {
                const candidate = bucket ? bucket + " " + line : line;
                if (!bucket || ctx.measureText(candidate).width <= maxWidth * 1.05) {
                    bucket = candidate;
                } else {
                    compact.push(bucket);
                    bucket = line;
                }
            }

            if (bucket) compact.push(bucket);
            return compact;
        }

        function fitTextLayout(ctx, text, width, height) {
            const maxWidth = width * 0.76;
            const maxHeight = height * 0.48;
            let finalSize = 56;
            let finalLines = [text || "brat"];
            const family = state.style.fontFamily || "Arial Narrow, Arial, Helvetica Neue Condensed, sans-serif";
            const scale = state.style.fontScale || 1;
            const lineSpacing = state.style.lineSpacing || 0.92;

            for (let size = Math.floor(width * 0.118 * scale); size >= Math.max(22, Math.floor(width * 0.032)); size -= 2) {
                ctx.save();
                ctx.font = `400 ${size}px ${family}`;
                const lines = measureWrappedLines(ctx, text || "brat", maxWidth);
                const lineHeight = size * lineSpacing;
                const widest = Math.max(...lines.map(line => ctx.measureText(line).width), 0);
                const totalHeight = lines.length * lineHeight;
                ctx.restore();

                if (widest <= maxWidth && totalHeight <= maxHeight) {
                    finalSize = size;
                    finalLines = lines;
                    break;
                }
            }

            return { fontSize: finalSize, lines: finalLines, lineHeight: finalSize * lineSpacing, maxWidth };
        }

        function getThemeColors() {
            return {
                page: state.theme === "dark" ? "#111111" : "#e9e9e9",
                stage: state.style.bgColor || "#8ACE00",
                text: state.style.textColor || "#000000"
            };
        }

        function updateBackgroundStatus(message = "") {
            if (!backgroundStatus) return;
            if (message) {
                backgroundStatus.textContent = message;
                return;
            }
            const bg = state.background || {};
            if (!bg.kind || bg.kind === "none") {
                backgroundStatus.textContent = "no background media";
                return;
            }
            backgroundStatus.textContent = `${bg.kind} background ${bg.name || bg.url || bg.assetId ? "ready" : "selected"}`;
        }

        function inferBackgroundKind(source = "", fileType = "") {
            if (BratMedia.inferBackgroundKind) return BratMedia.inferBackgroundKind(source, fileType);
            const value = `${fileType} ${source}`.toLowerCase();
            return /video|\.mp4|\.webm|\.mov|\.m4v/.test(value) ? "video" : "image";
        }

        function inferAudioMediaKind(source = "", fileType = "") {
            if (BratMedia.inferAudioMediaKind) return BratMedia.inferAudioMediaKind(source, fileType);
            const value = `${fileType} ${source}`.toLowerCase();
            return /video|\.mp4|\.webm|\.mov|\.m4v/.test(value) ? "video" : "audio";
        }

        function mediaNameFromUrl(url) {
            if (BratMedia.mediaNameFromUrl) return BratMedia.mediaNameFromUrl(url, window.location.href);
            try {
                const parsed = new URL(url, window.location.href);
                const fileName = parsed.pathname.split("/").filter(Boolean).pop();
                return decodeURIComponent(fileName || parsed.hostname || "URL media");
            } catch (_) {
                return "URL media";
            }
        }

        function mediaDecodeFailureMessage(kind) {
            if (kind === "video") {
                return "could not extract audio from this video; use a browser-supported video with an audio track, or upload the audio file";
            }
            return "unsupported audio or decoding failed";
        }

        function mediaReadyLabel(kind) {
            return kind === "video" ? "audio extracted from video" : "timing analysis ready";
        }

        function extractYouTubeVideoId(value = "") {
            if (BratMedia.extractYouTubeVideoId) return BratMedia.extractYouTubeVideoId(value, window.location.href);
            const raw = String(value || "").trim();
            const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i);
            return match?.[1] || "";
        }

        function releaseBackgroundObjectUrl() {
            if (state.backgroundObjectUrl) {
                URL.revokeObjectURL(state.backgroundObjectUrl);
                state.backgroundObjectUrl = "";
            }
        }

        function makeBackgroundElement(kind, src, fromUrl = false) {
            return new Promise((resolve, reject) => {
                const element = kind === "video" ? document.createElement("video") : new Image();
                if (fromUrl) element.crossOrigin = "anonymous";

                if (kind === "video") {
                    element.muted = true;
                    element.loop = true;
                    element.playsInline = true;
                    element.preload = "auto";
                    element.addEventListener("loadeddata", () => resolve(element), { once: true });
                    element.addEventListener("error", reject, { once: true });
                    element.src = src;
                    element.play?.().catch(() => {});
                    return;
                }

                element.onload = () => resolve(element);
                element.onerror = reject;
                element.src = src;
            });
        }

        function canExportBackgroundElement(kind, element) {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = 2;
                canvas.height = 2;
                const ctx = canvas.getContext("2d");
                if (!ctx) return false;
                ctx.drawImage(element, 0, 0, 2, 2);
                ctx.getImageData(0, 0, 1, 1);
                return true;
            } catch (_) {
                return false;
            }
        }

        async function setBackgroundMedia({ kind, src, name = "", assetId = "", fromUrl = false }) {
            updateBackgroundStatus(`loading ${kind} background...`);
            try {
                const element = await makeBackgroundElement(kind, src, fromUrl);
                const exportSafe = !fromUrl || canExportBackgroundElement(kind, element);
                state.backgroundElement = element;
                state.backgroundExportSafe = exportSafe;
                state.background = { ...state.background, kind, url: fromUrl ? src : "", name, assetId };
                writeBackgroundControls(state.background);
                renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
                updateBackgroundStatus(exportSafe ? `${kind} background ready` : `${kind} background is preview-only; upload it locally to export`);
                saveProjectSettings();
            } catch (error) {
                state.backgroundElement = null;
                state.backgroundExportSafe = false;
                updateBackgroundStatus("background failed to load or is not CORS-enabled");
            }
        }

        async function loadBackgroundFile(file) {
            if (!file) return;
            const kind = inferBackgroundKind(file.name, file.type);
            const assetId = await storeMediaBlob(file, file.name, kind);
            releaseBackgroundObjectUrl();
            state.backgroundObjectUrl = URL.createObjectURL(file);
            await setBackgroundMedia({ kind, src: state.backgroundObjectUrl, name: file.name, assetId, fromUrl: false });
        }

        async function loadBackgroundUrl(urlValue) {
            const url = String(urlValue || "").trim();
            if (!url) return;

            const youtubeVideoId = extractYouTubeVideoId(url);
            if (youtubeVideoId) {
                updateBackgroundStatus("YouTube links are preview-only. Use search video for reference, or upload/paste a direct image/video URL for background.");
                loadInvidiousPlayer(youtubeVideoId);
                return;
            }

            let label = url;
            try {
                label = new URL(url, window.location.href).hostname;
            } catch (_) {}
            await setBackgroundMedia({ kind: inferBackgroundKind(url), src: url, name: label, fromUrl: true });
        }

        async function restoreBackgroundMedia(background) {
            writeBackgroundControls(background);
            if (!background || background.kind === "none") return;
            if (background.assetId) {
                const record = await loadMediaBlob(background.assetId);
                if (record?.blob) {
                    releaseBackgroundObjectUrl();
                    state.backgroundObjectUrl = URL.createObjectURL(record.blob);
                    await setBackgroundMedia({ kind: record.kind || background.kind, src: state.backgroundObjectUrl, name: record.name || background.name, assetId: background.assetId, fromUrl: false });
                    return;
                }
            }
            if (background.url) {
                await setBackgroundMedia({ kind: background.kind, src: background.url, name: background.name || background.url, fromUrl: true });
            }
        }

        function clearBackgroundMedia() {
            releaseBackgroundObjectUrl();
            state.backgroundElement = null;
            state.backgroundExportSafe = true;
            state.background = migrateProjectPayload({}).background;
            writeBackgroundControls(state.background);
            renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
            saveProjectSettings();
        }

        function useArtworkAsBackground() {
            const url = state.metadata?.artworkUrl || state.metadata?.thumbnailUrl || "";
            if (!url) {
                updateBackgroundStatus("no artwork or thumbnail available");
                return;
            }
            loadBackgroundUrl(url);
        }

        function drawBackgroundMedia(ctx, width, height, timeSec) {
            const element = state.backgroundElement;
            const bg = state.background || {};
            if (!element || !bg.kind || bg.kind === "none" || (bg.opacity ?? 1) <= 0) return false;

            const mediaWidth = bg.kind === "video" ? element.videoWidth : element.naturalWidth;
            const mediaHeight = bg.kind === "video" ? element.videoHeight : element.naturalHeight;
            if (!mediaWidth || !mediaHeight) return false;

            if (bg.kind === "video" && Number.isFinite(element.duration) && element.duration > 0 && !element.seeking) {
                const target = timeSec % element.duration;
                if (Math.abs((element.currentTime || 0) - target) > 0.35) {
                    try { element.currentTime = target; } catch (_) {}
                }
            }

            const coverScale = Math.max(width / mediaWidth, height / mediaHeight) * (bg.scale || 1);
            const drawWidth = mediaWidth * coverScale;
            const drawHeight = mediaHeight * coverScale;
            const x = (width - drawWidth) * (bg.positionX ?? 0.5);
            const y = (height - drawHeight) * (bg.positionY ?? 0.5);

            ctx.save();
            ctx.globalAlpha = clamp(bg.opacity ?? 1, 0, 1);
            ctx.filter = `blur(${bg.blur || 0}px) brightness(${bg.brightness || 1}) saturate(${bg.saturation || 1})`;
            ctx.drawImage(element, x, y, drawWidth, drawHeight);
            ctx.restore();
            return true;
        }

        function getActiveMusicLineIndex(timeSec) {
            if (!state.timeline.length) return -1;
            let activeIndex = -1;
            for (let i = 0; i < state.timeline.length; i += 1) {
                const line = state.timeline[i];
                const nextStart = state.timeline[i + 1]?.displayStart ?? line.displayEnd;
                if (timeSec >= line.displayStart && timeSec < nextStart) return i;
                if (timeSec >= line.displayStart) activeIndex = i;
            }
            return Math.max(0, activeIndex);
        }

        function getMusicHighlightRatio(line, lineIndex, timeSec) {
            if (!line) return 0;
            const nextLine = state.timeline[lineIndex + 1];
            const lineEnd = nextLine?.displayStart ?? line.displayEnd;
            const duration = Math.max(0.001, lineEnd - line.displayStart);

            const words = Array.isArray(line.wordTimings) ? line.wordTimings.filter(word => Number.isFinite(word.timestamp)) : [];
            if (words.length > 1) {
                if (timeSec < words[0].timestamp) return 0;
                for (let i = 0; i < words.length; i += 1) {
                    const current = words[i];
                    const next = words[i + 1];
                    if (!next || timeSec < next.timestamp) {
                        const segmentEnd = next?.timestamp ?? lineEnd;
                        const local = clamp((timeSec - current.timestamp) / Math.max(0.001, segmentEnd - current.timestamp), 0, 1);
                        return clamp((i + local) / words.length, 0, 1);
                    }
                }
                return 1;
            }

            return clamp((timeSec - line.displayStart) / duration, 0, 1);
        }

        function getTimedWordTokens(line, lineIndex, timeSec) {
            const rawTokens = String(line?.text || "").match(/\s+|\S+/g) || [];
            const wordTokens = rawTokens.filter(token => /\S/.test(token));
            const nextLine = state.timeline[lineIndex + 1];
            const lineEnd = nextLine?.displayStart ?? line?.displayEnd ?? ((line?.displayStart || 0) + 2);
            const lineStart = line?.displayStart ?? 0;
            const duration = Math.max(0.001, lineEnd - lineStart);
            const enhanced = Array.isArray(line?.wordTimings)
                ? line.wordTimings.filter(word => Number.isFinite(word.timestamp))
                : [];

            const wordTiming = [];
            if (enhanced.length) {
                for (let i = 0; i < wordTokens.length; i += 1) {
                    const current = enhanced[Math.min(i, enhanced.length - 1)];
                    const next = enhanced[Math.min(i + 1, enhanced.length - 1)];
                    const start = Math.max(lineStart, current?.timestamp ?? lineStart);
                    const end = i + 1 < enhanced.length
                        ? Math.max(start + 0.035, next.timestamp)
                        : lineEnd;
                    wordTiming.push({ start, end: Math.max(start + 0.035, end) });
                }
            } else {
                const weights = wordTokens.map(token => Math.max(0.45, token.replace(/[.,!?;:]+$/g, "").length));
                const total = weights.reduce((sum, value) => sum + value, 0) || 1;
                let cursor = lineStart;
                for (let i = 0; i < wordTokens.length; i += 1) {
                    const isLast = i === wordTokens.length - 1;
                    const segment = isLast ? (lineEnd - cursor) : duration * (weights[i] / total);
                    const start = cursor;
                    const end = isLast ? lineEnd : Math.min(lineEnd, cursor + Math.max(0.08, segment));
                    wordTiming.push({ start, end: Math.max(start + 0.035, end) });
                    cursor = end;
                }
            }

            let wordIndex = 0;
            return rawTokens.map(token => {
                const isSpace = !/\S/.test(token);
                if (isSpace) return { text: token, isSpace: true, start: lineStart, end: lineEnd, wordIndex: -1 };
                const timing = wordTiming[wordIndex] || { start: lineStart, end: lineEnd };
                const output = { text: token, isSpace: false, start: timing.start, end: timing.end, wordIndex };
                wordIndex += 1;
                return output;
            });
        }

        function layoutTimedTokens(ctx, tokens, maxWidth) {
            const rows = [];
            let current = [];
            let width = 0;

            const pushRow = () => {
                while (current.length && current[0].isSpace) {
                    width -= current[0].width || 0;
                    current.shift();
                }
                while (current.length && current[current.length - 1].isSpace) {
                    width -= current[current.length - 1].width || 0;
                    current.pop();
                }
                if (!current.length) return;
                let x = 0;
                const rowTokens = current.map(token => {
                    const item = { ...token, x };
                    x += token.width || 0;
                    return item;
                });
                rows.push({ tokens: rowTokens, width: Math.max(1, x) });
                current = [];
                width = 0;
            };

            for (const token of tokens) {
                const tokenWidth = ctx.measureText(token.text).width;
                const tokenWithWidth = { ...token, width: tokenWidth };
                const hasWord = current.some(item => !item.isSpace);
                if (!token.isSpace && hasWord && width + tokenWidth > maxWidth) {
                    pushRow();
                }
                if (!current.length && token.isSpace) continue;
                current.push(tokenWithWidth);
                width += tokenWidth;
            }
            pushRow();
            return rows;
        }

        function wrapPlainMusicText(ctx, text, maxWidth) {
            const source = String(text || "").trim();
            if (!source) return [{ text: "", width: 0 }];
            const tokens = source.match(/\s+|\S+/g) || [source];
            const timed = tokens.map(token => ({ text: token, isSpace: !/\S/.test(token), start: 0, end: 1 }));
            return layoutTimedTokens(ctx, timed, maxWidth).map(row => ({
                text: row.tokens.map(token => token.text).join(""),
                width: row.width
            }));
        }

        function fitWrappedMusicLineFont(ctx, text, maxWidth, preferredSize, minSize, maxRows = 2) {
            let size = preferredSize;
            const family = state.style.fontFamily || APPLE_LIKE_FONT_STACK;
            while (size > minSize) {
                ctx.font = `800 ${size}px ${family}`;
                const rows = wrapPlainMusicText(ctx, text || "lyrics", maxWidth);
                const widest = Math.max(...rows.map(row => row.width), 0);
                if (widest <= maxWidth && rows.length <= maxRows) return size;
                size -= 1.5;
            }
            return minSize;
        }

        function drawWrappedPlainMusicLine(ctx, text, x, y, align, maxWidth, fontSize, lineHeight, color, opacity) {
            const rows = wrapPlainMusicText(ctx, text, maxWidth);
            const totalHeight = rows.length * lineHeight;
            const startY = y - totalHeight / 2 + lineHeight / 2;
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.textBaseline = "middle";
            rows.forEach((row, rowIndex) => {
                ctx.fillText(row.text, x, startY + rowIndex * lineHeight);
            });
            ctx.restore();
        }

        function drawBeautifulActiveLine(ctx, line, lineIndex, timeSec, x, y, align, maxWidth, fontSize, theme, glow, depth, baseOpacity) {
            const tokens = getTimedWordTokens(line, lineIndex, timeSec);
            const rows = layoutTimedTokens(ctx, tokens, maxWidth);
            const lineHeight = fontSize * 1.08;
            const totalHeight = rows.length * lineHeight;
            const startY = y - totalHeight / 2 + lineHeight / 2;
            const textColor = theme.text || "#f5f5f7";
            const futureColor = rgbaFromHex(textColor, Math.max(0.22, baseOpacity * 0.92));
            const sungColor = rgbaFromHex(textColor, 0.78);
            const wordAnimation = state.style.wordAnimation || { mode: "progress", intensity: 0.7, color: "#ffffff" };
            const wordMode = wordAnimation.mode || "progress";
            const wordIntensity = clamp(wordAnimation.intensity ?? 0.7, 0, 1);
            const currentColor = wordMode === "color" ? (wordAnimation.color || "#ffffff") : "#ffffff";
            const haloColor = mixHex(textColor, "#ffffff", 0.52);

            ctx.save();
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.shadowOffsetY = 8 * depth;

            rows.forEach((row, rowIndex) => {
                const rowY = startY + rowIndex * lineHeight;
                const startX = align === "center" ? x - row.width / 2 : (align === "right" ? x - row.width : x);

                row.tokens.forEach(token => {
                    if (token.isSpace) return;
                    const tokenX = startX + token.x;
                    const isCurrent = timeSec >= token.start && timeSec < token.end;
                    const isSung = timeSec >= token.end;
                    const tokenDuration = Math.max(0.001, token.end - token.start);
                    const local = clamp((timeSec - token.start) / tokenDuration, 0, 1);

                    // Draw the whole active line first: already sung words are bright,
                    // future words stay visible but softer. This keeps the line stable
                    // instead of typewriter-cutting the text.
                    ctx.globalAlpha = isSung ? 0.86 : Math.max(0.28, baseOpacity * 1.02);
                    ctx.shadowColor = isSung ? `rgba(255,255,255,${0.10 * glow})` : "rgba(0,0,0,0)";
                    ctx.shadowBlur = isSung ? 10 * glow : 0;
                    ctx.fillStyle = isSung ? sungColor : futureColor;
                    ctx.fillText(token.text, tokenX, rowY);

                    if (isCurrent) {
                        const reveal = Math.max(2, token.width * local);
                        const padX = Math.max(18, fontSize * 0.30);
                        const centerX = tokenX + reveal;
                        const glowWidth = token.width + padX * 2;
                        const pulse = 0.78 + 0.22 * Math.sin(local * Math.PI);
                        const shakeX = wordMode === "shake" ? Math.sin(timeSec * 80) * fontSize * 0.025 * wordIntensity : 0;
                        const shakeY = wordMode === "shake" ? Math.cos(timeSec * 68) * fontSize * 0.018 * wordIntensity : 0;
                        const scale = wordMode === "scale"
                            ? 1 + Math.sin(local * Math.PI) * 0.10 * wordIntensity
                            : wordMode === "pop"
                                ? 1 + Math.max(0, 1 - local * 2.2) * 0.18 * wordIntensity
                                : 1;
                        const currentAlpha = wordMode === "fade" ? Math.max(0.2, local) : 1;
                        const effectiveGlow = glow * (wordMode === "glow" ? 1 + wordIntensity * 1.35 : 1);

                        // Soft Apple-like luminous band centered on the currently sung word.
                        const glowGradient = ctx.createRadialGradient(
                            centerX,
                            rowY,
                            0,
                            centerX,
                            rowY,
                            glowWidth * 0.72
                        );
                        glowGradient.addColorStop(0, `rgba(255,255,255,${0.30 * effectiveGlow * pulse})`);
                        glowGradient.addColorStop(0.42, `rgba(255,255,255,${0.12 * effectiveGlow * pulse})`);
                        glowGradient.addColorStop(1, "rgba(255,255,255,0)");
                        ctx.save();
                        ctx.globalCompositeOperation = "screen";
                        ctx.fillStyle = glowGradient;
                        ctx.fillRect(tokenX - padX, rowY - lineHeight * 0.72, glowWidth, lineHeight * 1.44);
                        ctx.restore();

                        // Progressive fill inside the word: the current word lights up
                        // from left to right as it is sung.
                        ctx.save();
                        if (wordMode === "progress" || wordMode === "color") {
                            ctx.beginPath();
                            ctx.rect(tokenX - 2, rowY - lineHeight * 0.56, reveal + 4, lineHeight * 1.12);
                            ctx.clip();
                        }
                        ctx.translate(tokenX + token.width / 2 + shakeX, rowY + shakeY);
                        ctx.scale(scale, scale);
                        ctx.globalAlpha = currentAlpha;
                        ctx.shadowColor = `rgba(255,255,255,${0.62 * effectiveGlow})`;
                        ctx.shadowBlur = 38 * effectiveGlow;
                        ctx.fillStyle = currentColor;
                        ctx.fillText(token.text, -token.width / 2, 0);
                        ctx.restore();

                        // A small specular sparkle at the reveal edge, visible only on
                        // the active word. It replaces any hard rectangle highlight.
                        const sparkle = ctx.createRadialGradient(centerX, rowY, 0, centerX, rowY, fontSize * 0.42);
                        sparkle.addColorStop(0, `rgba(255,255,255,${0.22 * effectiveGlow * pulse})`);
                        sparkle.addColorStop(1, "rgba(255,255,255,0)");
                        ctx.save();
                        ctx.globalCompositeOperation = "screen";
                        ctx.fillStyle = sparkle;
                        ctx.fillRect(centerX - fontSize * 0.55, rowY - fontSize * 0.55, fontSize * 1.1, fontSize * 1.1);
                        ctx.restore();
                    }
                });
            });
            ctx.restore();
        }

        function fitMusicLineFont(ctx, text, maxWidth, preferredSize, minSize) {
            let size = preferredSize;
            const family = state.style.fontFamily || "Arial, Helvetica, sans-serif";
            while (size > minSize) {
                ctx.font = `800 ${size}px ${family}`;
                if (ctx.measureText(text || "brat").width <= maxWidth) return size;
                size -= 2;
            }
            return minSize;
        }

        function drawMusicBackground(ctx, width, height, theme, timeSec) {
            const beautiful = state.style.lyricsMode === "beautiful";
            const motion = beautiful ? clamp(state.style.beautifulMotion ?? 0.65, 0, 1) : 0.25;
            const depth = beautiful ? clamp(state.style.beautifulDepth ?? 0.72, 0, 1) : 0.38;
            const dynamic = beautiful ? state.style.beautifulDynamicBg !== false : true;
            const base = theme.stage || "#07090d";
            const text = theme.text || "#f5f5f7";

            if (!beautiful) {
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, base);
                gradient.addColorStop(1, state.theme === "dark" ? "#050505" : "rgba(255,255,255,0.35)");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                return;
            }

            // Liquid-glass style background: dark base, moving blurred blobs,
            // soft center light, vignette and a faint noise veil.
            const deepA = mixHex(base, "#000000", dynamic ? 0.70 : 0.40);
            const deepB = mixHex(base, "#12151c", dynamic ? 0.52 : 0.28);
            const soft = mixHex(base, "#ffffff", dynamic ? 0.18 + depth * 0.10 : 0.10);
            const accent = mixHex(text, base, 0.34);

            const bg = ctx.createLinearGradient(0, 0, width, height);
            bg.addColorStop(0, deepA);
            bg.addColorStop(0.46, mixHex(base, "#0b0d12", 0.58));
            bg.addColorStop(1, deepB);
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, width, height);

            const t = timeSec * (0.16 + motion * 0.10);
            const blobs = [
                { x: 0.18 + 0.030 * Math.sin(t * 1.7), y: 0.12 + 0.025 * Math.cos(t * 1.1), r: 0.55, a: 0.18, color: soft },
                { x: 0.86 + 0.032 * Math.cos(t * 1.2), y: 0.25 + 0.036 * Math.sin(t * 1.5), r: 0.52, a: 0.20, color: accent },
                { x: 0.28 + 0.040 * Math.sin(t * 0.8), y: 0.80 + 0.026 * Math.cos(t * 1.3), r: 0.62, a: 0.13, color: text },
                { x: 0.62 + 0.018 * Math.cos(t * 1.9), y: 0.56 + 0.018 * Math.sin(t * 1.1), r: 0.48, a: 0.10, color: "#ffffff" }
            ];

            ctx.save();
            ctx.globalCompositeOperation = "screen";
            for (const blob of blobs) {
                const x = width * blob.x;
                const y = height * blob.y;
                const r = Math.max(width, height) * blob.r;
                const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
                glow.addColorStop(0, rgbaFromHex(blob.color, blob.a * (0.55 + depth * 0.55)));
                glow.addColorStop(0.38, rgbaFromHex(blob.color, blob.a * 0.35));
                glow.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, width, height);
            }
            ctx.restore();

            ctx.save();
            const centerLight = ctx.createRadialGradient(
                width * 0.52,
                height * 0.50,
                0,
                width * 0.52,
                height * 0.50,
                Math.max(width, height) * 0.54
            );
            centerLight.addColorStop(0, `rgba(255,255,255,${0.045 + 0.055 * depth})`);
            centerLight.addColorStop(0.55, "rgba(255,255,255,0.018)");
            centerLight.addColorStop(1, "rgba(255,255,255,0)");
            ctx.globalCompositeOperation = "screen";
            ctx.fillStyle = centerLight;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();

            ctx.save();
            const vignette = ctx.createRadialGradient(
                width / 2,
                height / 2,
                Math.min(width, height) * 0.24,
                width / 2,
                height / 2,
                Math.max(width, height) * 0.72
            );
            vignette.addColorStop(0, "rgba(0,0,0,0)");
            vignette.addColorStop(0.62, `rgba(0,0,0,${0.10 * depth})`);
            vignette.addColorStop(1, `rgba(0,0,0,${0.72 * depth})`);
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();

            // Deterministic micro-noise so the background feels less flat in exports.
            ctx.save();
            ctx.globalAlpha = 0.030 * depth;
            ctx.fillStyle = "#ffffff";
            const step = Math.max(16, Math.floor(Math.min(width, height) / 54));
            const phase = Math.floor(timeSec * 8) % 97;
            for (let yy = 0; yy < height; yy += step) {
                for (let xx = 0; xx < width; xx += step) {
                    const n = ((xx * 17 + yy * 31 + phase * 13) % 101) / 101;
                    if (n > 0.84) ctx.fillRect(xx + (n * step * 0.4), yy + ((1 - n) * step * 0.4), 1, 1);
                }
            }
            ctx.restore();
        }

        function applyEdgeFade(ctx, width, height) {
            const amount = clamp(state.style.beautifulEdgeFade ?? 0.70, 0, 1);
            if (amount <= 0) return;
            const fadeHeight = height * (0.13 + amount * 0.16);
            ctx.save();
            const top = ctx.createLinearGradient(0, 0, 0, fadeHeight);
            top.addColorStop(0, `rgba(0,0,0,${0.34 * amount})`);
            top.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = top;
            ctx.fillRect(0, 0, width, fadeHeight);
            const bottom = ctx.createLinearGradient(0, height - fadeHeight, 0, height);
            bottom.addColorStop(0, "rgba(0,0,0,0)");
            bottom.addColorStop(1, `rgba(0,0,0,${0.40 * amount})`);
            ctx.fillStyle = bottom;
            ctx.fillRect(0, height - fadeHeight, width, fadeHeight);
            ctx.restore();
        }

        function drawMusicSyncedScene(ctx, width, height, timeSec, options = {}) {
            const theme = getThemeColors();
            const beautiful = state.style.lyricsMode === "beautiful";
            ctx.save();
            ctx.clearRect(0, 0, width, height);
            drawMusicBackground(ctx, width, height, theme, timeSec);
            drawBackgroundMedia(ctx, width, height, timeSec);

            if (!state.timeline.length) {
                ctx.fillStyle = theme.text;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.font = `800 ${Math.max(42, width * 0.095)}px ${state.style.fontFamily || "Arial, Helvetica, sans-serif"}`;
                ctx.fillText(beautiful ? "Beautiful Lyrics" : "lyrics", width / 2, height / 2);
                ctx.restore();
                if (options.guides) drawSafeZones(ctx, width, height);
                return;
            }

            const activeIndex = getActiveMusicLineIndex(timeSec);
            const nextLine = state.timeline[activeIndex + 1];
            const previousLine = state.timeline[activeIndex - 1];
            const transitionWindow = beautiful ? 0.82 : 0.44;
            const rawTransition = nextLine ? clamp((timeSec - (nextLine.displayStart - transitionWindow)) / transitionWindow, 0, 1) : 0;
            const transition = beautiful ? easeInOutCubic(rawTransition) : rawTransition;
            const settleWindow = previousLine ? clamp((timeSec - state.timeline[activeIndex].displayStart) / 0.58, 0, 1) : 1;
            const settle = beautiful ? easeOutCubic(settleWindow) : 1;

            const align = state.style.musicAlign || "left";
            const textX = align === "center" ? width / 2 : width * (beautiful ? 0.088 : 0.105);
            const maxWidth = width * (align === "center" ? (beautiful ? 0.86 : 0.84) : (beautiful ? 0.82 : 0.78));
            const anchorY = height * (state.style.musicScrollPosition || 0.50);
            const beautifulBase = Math.max(26, Math.min(width * 0.068, height * 0.076));
            const baseSize = Math.max(28, beautiful ? beautifulBase : Math.min(width * 0.074, height * 0.082)) * (state.style.fontScale || 1);
            const lineGap = baseSize * (beautiful ? 1.62 : 1.58);
            const dimOpacity = clamp(state.style.musicDimOpacity ?? 0.34, 0.08, 0.80);
            const activeScale = clamp(state.style.musicActiveScale ?? 1.16, 1, 1.45);
            const depth = beautiful ? clamp(state.style.beautifulDepth ?? 0.72, 0, 1) : 0;
            const glow = beautiful ? clamp(state.style.beautifulGlow ?? 0.58, 0, 1) : 0;
            const first = Math.max(0, activeIndex - (beautiful ? 5 : 4));
            const last = Math.min(state.timeline.length - 1, activeIndex + (beautiful ? 6 : 5));

            ctx.textAlign = align;
            ctx.textBaseline = "middle";
            try { ctx.letterSpacing = `${Math.max(0, state.style.letterSpacing || 0)}px`; } catch (error) {}
            ctx.filter = `blur(${Math.max(0, (state.style.blur || 0) * (beautiful ? 0.08 : 0.42))}px)`;

            for (let i = first; i <= last; i += 1) {
                const line = state.timeline[i];
                const distance = i - activeIndex;
                const role = line.role || "lead";
                const isSide = role === "side";
                const isBackground = role === "background";
                const isSecondary = role === "secondary";
                if (beautiful && (isSide || isBackground) && state.style.beautifulSideVocals === false) continue;

                let y = anchorY + (distance - transition) * lineGap;
                if (beautiful) y += Math.sin((timeSec * 0.32) + i * 0.72) * 0.8 * depth;
                if (y < -lineGap * 1.5 || y > height + lineGap * 1.5) continue;

                const isActive = i === activeIndex;
                const text = line.text || "";
                let roleScale = 1;
                if (isSide) roleScale = 0.72;
                if (isBackground) roleScale = 0.78;
                if (isSecondary) roleScale = 0.66;
                const distanceScale = Math.max(0.78, 1 - Math.abs(distance) * (beautiful ? 0.045 : 0.07));
                const localScale = (isActive ? activeScale * (beautiful ? (0.96 + 0.04 * settle) : 1) : distanceScale) * roleScale;
                const fontWeight = isActive && !isSecondary ? 760 : (isSide || isBackground || isSecondary ? 560 : 690);
                const preferredFontSize = baseSize * localScale;
                const fontSize = beautiful
                    ? fitWrappedMusicLineFont(ctx, text, maxWidth, preferredFontSize, Math.max(18, baseSize * 0.45), isActive ? 2 : 1)
                    : fitMusicLineFont(ctx, text, maxWidth / Math.max(0.1, localScale), preferredFontSize, Math.max(18, baseSize * 0.48));
                ctx.font = `${fontWeight} ${fontSize}px ${beautiful ? APPLE_LIKE_FONT_STACK : (state.style.fontFamily || "Arial, Helvetica, sans-serif")}`;
                const measured = ctx.measureText(text).width;

                let lineX = textX;
                let effectiveAlign = align;
                if (beautiful && isSide && align !== "center") {
                    lineX = width * 0.92;
                    effectiveAlign = "right";
                    ctx.textAlign = "right";
                } else {
                    ctx.textAlign = align;
                }
                const leftEdge = effectiveAlign === "center" ? lineX - measured / 2 : (effectiveAlign === "right" ? lineX - measured : lineX);
                const lineHeight = fontSize * 1.25;

                ctx.save();
                if (beautiful) {
                    ctx.shadowColor = rgbaFromHex(theme.text, glow * (isActive ? 0.40 : 0.16));
                    ctx.shadowBlur = (isActive ? 28 : 10) * glow;
                    ctx.shadowOffsetY = 10 * depth;
                }

                if (isActive) {
                    const baseOpacity = isBackground || isSide || isSecondary ? Math.max(0.32, dimOpacity) : Math.max(0.24, dimOpacity * 0.72);
                    if (beautiful && state.style.musicWordHighlight) {
                        ctx.filter = "none";
                        drawBeautifulActiveLine(ctx, line, i, timeSec, lineX, y, effectiveAlign, maxWidth, fontSize, theme, glow, depth, baseOpacity);
                    } else {
                        const highlightRatio = state.style.musicWordHighlight ? getMusicHighlightRatio(line, i, timeSec) : 1;
                        ctx.globalAlpha = baseOpacity;
                        ctx.fillStyle = beautiful ? rgbaFromHex(theme.text, 0.80) : theme.text;
                        ctx.fillText(text, lineX, y);

                        ctx.beginPath();
                        const reveal = Math.max(2, measured * highlightRatio + 16);
                        ctx.rect(leftEdge - 5, y - lineHeight / 2, reveal, lineHeight);
                        ctx.clip();
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = beautiful ? mixHex(theme.text, "#ffffff", 0.18) : theme.text;
                        ctx.fillText(text, lineX, y);
                    }
                } else {
                    let distanceOpacity = dimOpacity * Math.max(0.10, 1 - Math.abs(distance) * (beautiful ? 0.22 : 0.18));
                    if (isSide || isBackground) distanceOpacity *= beautiful ? 0.70 : 0.82;
                    if (isSecondary) distanceOpacity *= 0.62;
                    ctx.globalAlpha = distanceOpacity;
                    ctx.fillStyle = theme.text;
                    if (beautiful) {
                        ctx.filter = `blur(${Math.min(3.6, Math.max(0.18, Math.abs(distance) * 0.42 * depth))}px)`;
                        drawWrappedPlainMusicLine(ctx, text, lineX, y, effectiveAlign, maxWidth, fontSize, lineHeight, theme.text, distanceOpacity);
                        ctx.filter = `blur(${Math.max(0, (state.style.blur || 0) * 0.22)}px)`;
                    } else {
                        ctx.fillText(text, lineX, y);
                    }
                }
                ctx.restore();
                ctx.textAlign = align;
            }

            ctx.filter = "none";
            ctx.globalAlpha = 1;
            ctx.restore();
            if (beautiful) applyEdgeFade(ctx, width, height);
            if (options.guides) drawSafeZones(ctx, width, height);
        }

        function drawScene(ctx, width, height, timeSec, options = {}) {
            if (state.style.lyricsMode === "music" || state.style.lyricsMode === "beautiful") {
                drawMusicSyncedScene(ctx, width, height, timeSec, options);
                return;
            }
            const theme = getThemeColors();
            const visible = getVisibleTextAt(timeSec);
            const displayText = visible.text || (visible.active ? "" : "brat");

            ctx.save();
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = theme.stage;
            ctx.fillRect(0, 0, width, height);
            drawBackgroundMedia(ctx, width, height, timeSec);

            const layout = fitTextLayout(ctx, displayText, width, height);
            const centerX = width / 2;
            const centerY = height / 2 + height * (state.style.verticalPosition || 0);
            const totalHeight = layout.lines.length * layout.lineHeight;
            const startY = centerY - totalHeight / 2 + layout.lineHeight * 0.82;

            ctx.translate(centerX, 0);
            ctx.scale(state.style.stretch || 0.94, 1);

            ctx.textAlign = "center";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = theme.text;
            ctx.globalAlpha = visible.alpha ?? 1;
            ctx.filter = `blur(${state.style.blur || 0}px)`;
            try { ctx.letterSpacing = `${state.style.letterSpacing || 0}px`; } catch (error) {}

            let jitterX = 0;
            let jitterY = 0;
            let pulseScale = 1;
            if (state.animationMode === "jitter" && visible.active) {
                jitterX = Math.sin(timeSec * 48) * width * 0.003;
                jitterY = Math.cos(timeSec * 39) * height * 0.002;
            }
            if (state.animationMode === "pulse" && visible.active) {
                pulseScale = 1 + Math.sin((visible.progress || 0) * Math.PI) * 0.035;
                ctx.scale(pulseScale, pulseScale);
            }

            layout.lines.forEach((line, index) => {
                ctx.font = `400 ${layout.fontSize}px ${state.style.fontFamily || "Arial Narrow, Arial, Helvetica Neue Condensed, sans-serif"}`;
                ctx.fillText(line, jitterX, startY + jitterY + index * layout.lineHeight);
            });

            ctx.filter = "none";
            ctx.globalAlpha = 1;
            ctx.restore();

            if (options.guides) drawSafeZones(ctx, width, height);
        }

        function renderPreviewAt(timeSec = 0) {
            drawScene(previewCtx, previewCanvas.width, previewCanvas.height, timeSec, { guides: true });
            drawWaveform();
            renderTimeline();
        }

        function syncPlaybackButtonLabel() {
            const key = state.isPlaying ? "pause" : "play";
            playPauseBtn.textContent = translateUi(key, key);
            playPauseBtn.setAttribute("aria-pressed", String(state.isPlaying));
        }

        function animationTick() {
            const now = getElapsedSeconds();
            renderPreviewAt(now);

            const endTime = getTimelineDuration() + 0.08;

            if (now > endTime) {
                state.isPlaying = false;
                state.playStartMs = null;
                syncPlaybackButtonLabel();
                cancelAnimation();
                renderPreviewAt(0);
                return;
            }

            state.animationFrame = requestAnimationFrame(animationTick);
        }

        function startFromBeginning() {
            if (!state.timeline.length) return;

            cancelAnimation();
            state.pausedElapsedSec = 0;
            state.playStartMs = Date.now();
            state.isPlaying = true;
            syncPlaybackButtonLabel();
            state.animationFrame = requestAnimationFrame(animationTick);
        }

        function updateAudioStatus(message, isError = false) {
            audioStatus.textContent = message;
            audioStatus.classList.toggle("muted", !isError);
        }

        function syncPanelState() {
            const isOpen = !panel.classList.contains("hidden");
            document.body.classList.toggle("panel-open", isOpen);
            document.body.classList.toggle("panel-closed", !isOpen);
            togglePanelBtn.setAttribute("aria-expanded", String(isOpen));
        }

        function syncThemeButtons() {
            bgBtn.classList.toggle("active", state.theme === "green");
            darkBtn.classList.toggle("active", state.theme === "dark");
            bgBtn.setAttribute("aria-pressed", String(state.theme === "green"));
            darkBtn.setAttribute("aria-pressed", String(state.theme === "dark"));
        }

        function rebuildTimelineFromCurrentInputs() {
            if (!lyricsInput.value.trim()) {
                state.timeline = [];
                renderPreviewAt(0);
                return;
            }

            const parsed = parseLRC(
                lyricsInput.value,
                startFromZeroCheckbox.checked,
                getActiveAudioAnalysis()
            );

            state.timeline = parsed;
            renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
        }

        function updateMeta() {
            const parsedPreview = parseLRC(
                lyricsInput.value,
                startFromZeroCheckbox.checked,
                getActiveAudioAnalysis()
            );

            const lineCount = parsedPreview.length;
            const blockCount = parsedPreview.reduce((sum, line) => sum + (line.blocks?.length || 0), 0);
            const totalTime = lineCount ? parsedPreview[parsedPreview.length - 1].displayEnd : 0;

            const audioLabel =
                state.audioAnalysis ?
                (useAudioTimingCheckbox.checked ? " • audio assist on" : " • audio assist off") :
                "";

            meta.textContent = `${lineCount} lines • ${blockCount} blocks • ${totalTime.toFixed(2)}s timeline${audioLabel}`;
        }

        function stopPlayback(keepCurrentTime = true) {
            if (keepCurrentTime) {
                state.pausedElapsedSec = getElapsedSeconds();
            } else {
                state.pausedElapsedSec = 0;
            }
            state.playStartMs = null;
            state.isPlaying = false;
            syncPlaybackButtonLabel();
            cancelAnimation();
        }

        function resetAll() {
            stopPlayback(false);
            state.timeline = [];
            state.selectedVideoId = null;
            state.selectedVideoBase = null;
            playerWrap.classList.add("hidden");
            setPlayerOpenState(false);
            playerBox.innerHTML = "";
            exportStatus.textContent = "no export yet";
            renderPreviewAt(0);
        }

        function clearSearchResults() {
            lrclibResults.innerHTML = "";
            youtubeResults.innerHTML = "";
            searchStatus.textContent = "results cleared";
            youtubeStatus.textContent = "no video loaded";
            state.selectedSong = null;
            state.selectedVideoId = null;
            state.selectedVideoBase = null;
        }

        function formatDuration(seconds) {
            if (!seconds || Number.isNaN(Number(seconds))) return "duration n/a";
            const total = Math.round(Number(seconds));
            const mm = Math.floor(total / 60);
            const ss = String(total % 60).padStart(2, "0");
            return `${mm}:${ss}`;
        }

        function formatVideoSeconds(seconds) {
            const total = Number(seconds);
            if (!Number.isFinite(total)) return "duration n/a";

            const hh = Math.floor(total / 3600);
            const mm = Math.floor((total % 3600) / 60);
            const ss = Math.floor(total % 60);

            if (hh > 0) {
                return `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
            }

            return `${mm}:${String(ss).padStart(2, "0")}`;
        }

        function escapeHtml(text) {
            return String(text)
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;");
        }

        function setMetadataFromLrclibItem(item = {}) {
            state.selectedSong = item;
            state.metadata = {
                trackName: item.trackName || state.metadata?.trackName || "",
                artistName: item.artistName || state.metadata?.artistName || "",
                albumName: item.albumName || state.metadata?.albumName || "",
                duration: Number(item.duration || state.metadata?.duration || 0) || 0,
                artworkUrl: item.artworkUrl || item.coverArt || item.albumArt || state.metadata?.artworkUrl || "",
                thumbnailUrl: state.metadata?.thumbnailUrl || "",
                source: "lrclib"
            };
        }

        async function searchLRCLIB(query) {
            const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`LRCLIB HTTP error ${res.status}`);
            }

            return res.json();
        }

        function renderLRCLIBResults(items) {
            if (!items.length) {
                lrclibResults.innerHTML = `
          <div class="result-card">
            <div class="result-sub">no LRCLIB results</div>
          </div>
        `;
                return;
            }

            lrclibResults.innerHTML = items.map((item, index) => {
                const synced = item.syncedLyrics ? "synced" : "plain text only";
                const artist = escapeHtml(item.artistName || "unknown artist");
                const track = escapeHtml(item.trackName || "unknown title");
                const album = escapeHtml(item.albumName || "album n/a");
                const duration = formatDuration(item.duration);

                return `
          <div class="result-card">
            <div class="result-title">${track}</div>
            <div class="result-sub">${artist}</div>
            <div class="badge-row">
              <span class="badge">${synced}</span>
              <span class="badge">${duration}</span>
              <span class="badge">${album}</span>
            </div>
            <div class="row">
              <button data-lrc-index="${index}" class="use-lrc-btn primary">use these lyrics</button>
              <button data-yt-index="${index}" class="find-yt-btn">search video</button>
            </div>
          </div>
        `;
            }).join("");

            document.querySelectorAll(".use-lrc-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const index = Number(btn.dataset.lrcIndex);
                    const item = items[index];
                    setMetadataFromLrclibItem(item);

                    const bestLyrics = item.syncedLyrics || item.plainLyrics || "";
                    lyricsInput.value = bestLyrics;
                    rebuildTimelineFromCurrentInputs();
                    updateMeta();
                    renderLrcRows();
                    updateBackgroundStatus();
                    saveProjectSettings();
                    searchStatus.textContent = `loaded: ${(item.artistName || "")} - ${(item.trackName || "")}`.trim();
                });
            });

            document.querySelectorAll(".find-yt-btn").forEach((btn) => {
                btn.addEventListener("click", async () => {
                    const index = Number(btn.dataset.ytIndex);
                    const item = items[index];
                    setMetadataFromLrclibItem(item);
                    saveProjectSettings();
                    await runYouTubeSearchForItem(item);
                });
            });
        }

        async function fetchFromInvidious(path) {
            let lastError = null;

            for (const base of INVIDIOUS_BASES) {
                try {
                    const res = await fetch(`${base}${path}`, {
                        method: "GET",
                        mode: "cors",
                        headers: {
                            "Accept": "application/json"
                        }
                    });

                    if (!res.ok) {
                        lastError = new Error(`istanza ${base} -> HTTP ${res.status}`);
                        continue;
                    }

                    const data = await res.json();
                    return {
                        base,
                        data
                    };
                } catch (error) {
                    lastError = error;
                }
            }

            throw lastError || new Error("no Invidious instance available");
        }

        async function searchUnofficialYouTubeVideos(query) {
            const params = new URLSearchParams({
                q: query,
                type: "video",
                sort: "relevance",
                region: "IT"
            });

            const {
                base,
                data
            } = await fetchFromInvidious(`/api/v1/search?${params.toString()}`);
            const items = Array.isArray(data) ?
                data.filter((item) => item && item.type === "video").slice(0, 8) : [];

            return {
                base,
                items
            };
        }

        function getBestThumb(video) {
            if (!Array.isArray(video.videoThumbnails)) return "";
            const preferred =
                video.videoThumbnails.find((x) => x.quality === "maxres") ||
                video.videoThumbnails.find((x) => x.quality === "high") ||
                video.videoThumbnails.find((x) => x.quality === "medium") ||
                video.videoThumbnails[0];

            return preferred?.url || "";
        }

        function renderYouTubeResults(items, instanceBase) {
            if (!items.length) {
                youtubeResults.innerHTML = `
          <div class="result-card">
            <div class="result-sub">no video found via Invidious</div>
          </div>
        `;
                return;
            }

            youtubeResults.innerHTML = items.map((item) => {
                const videoId = item.videoId || "";
                const title = escapeHtml(item.title || "video");
                const channel = escapeHtml(item.author || "canale");
                const thumb = getBestThumb(item);
                const duration = formatVideoSeconds(item.lengthSeconds);

                return `
          <div class="yt-item" data-video-id="${videoId}">
            <img src="${thumb}" alt="">
            <div>
              <div class="yt-title">${title}</div>
              <div class="yt-channel">${channel}</div>
              <div class="badge-row" style="margin-top:8px;">
                <span class="badge">${duration}</span>
                <span class="badge">via ${instanceBase}</span>
              </div>
            </div>
          </div>
        `;
            }).join("");

            document.querySelectorAll(".yt-item").forEach((el) => {
                el.addEventListener("click", () => {
                    const videoId = el.dataset.videoId;
                    const item = items.find(video => video.videoId === videoId);
                    state.metadata = { ...state.metadata, thumbnailUrl: item ? getBestThumb(item) : state.metadata?.thumbnailUrl || "" };
                    saveProjectSettings();
                    loadInvidiousPlayer(videoId);
                });
            });
        }

        function buildYouTubeWatchUrl(videoId) {
            return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
        }

        function buildYouTubeEmbedUrl(videoId) {
            const params = new URLSearchParams({
                rel: "0",
                modestbranding: "1",
                playsinline: "1"
            });
            if (/^https?:$/.test(window.location.protocol) && window.location.origin && window.location.origin !== "null") {
                params.set("origin", window.location.origin);
            }
            return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
        }

        function renderYouTubeFallbackCard(videoId, reason = "") {
            const watchUrl = buildYouTubeWatchUrl(videoId);
            const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
            playerBox.innerHTML = `
        <div class="yt-preview-card">
          <img src="${thumb}" alt="">
          <div class="yt-preview-card-body">
            <strong>YouTube preview</strong>
            <p>${reason || "This browser cannot open the embedded player here."}</p>
            <p class="mini-copy">To use audio, upload an audio/video file or paste a direct media URL you have permission to use.</p>
            <div class="yt-media-actions">
              <button class="yt-add-media-btn" type="button">add audio/video file</button>
              <a class="yt-open-link" href="${watchUrl}" target="_blank" rel="noopener noreferrer">watch on YouTube</a>
            </div>
          </div>
        </div>
      `;
        }

        function loadInvidiousPlayer(videoId) {
            state.selectedVideoId = videoId;

            playerWrap.classList.remove("hidden");
            setPlayerOpenState(true);

            if (!/^https?:$/.test(window.location.protocol)) {
                renderYouTubeFallbackCard(videoId, "Embedded YouTube preview needs http/https. Open the project through a local server, or watch this reference on YouTube.");
                youtubeStatus.textContent = `selected video: ${videoId} - open through http/https for embedded preview`;
                return;
            }

            playerBox.innerHTML = `
        <iframe
          src="${buildYouTubeEmbedUrl(videoId)}"
          title="YouTube preview"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
        <div class="yt-iframe-fallback">
          <span>if the embed is blocked</span>
          <button class="yt-add-media-btn" type="button">add audio/video</button>
          <a href="${buildYouTubeWatchUrl(videoId)}" target="_blank" rel="noopener noreferrer">watch on YouTube</a>
        </div>
      `;

            youtubeStatus.textContent = `selected video: ${videoId} - YouTube preview only; add matching audio by upload or direct permitted URL`;
        }

        function loadYouTubeLinkFromSearch(query) {
            const videoId = extractYouTubeVideoId(query);
            if (!videoId) return false;

            state.selectedSong = null;
            state.selectedVideoBase = "";
            state.metadata = {
                ...state.metadata,
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                source: state.metadata?.source || "youtube"
            };
            lrclibResults.innerHTML = `
          <div class="result-card">
            <div class="result-title">YouTube preview loaded</div>
            <div class="result-sub">${escapeHtml(videoId)}</div>
            <p class="mini-copy">This is preview/reference only. Add matching audio in Timing with an uploaded audio/video file or permitted direct media URL.</p>
          </div>
        `;
            youtubeResults.innerHTML = "";
            searchStatus.textContent = "YouTube link loaded as video preview";
            loadInvidiousPlayer(videoId);
            saveProjectSettings();
            return true;
        }

        async function runYouTubeSearchForItem(item) {
            const query = [item.artistName, item.trackName].filter(Boolean).join(" ").trim();

            if (!query) {
                youtubeStatus.textContent = "invalid video query";
                return;
            }

            youtubeStatus.textContent = `Invidious video search: ${query}`;
            youtubeResults.innerHTML = "";

            try {
                const {
                    base,
                    items
                } = await searchUnofficialYouTubeVideos(query);
                state.selectedVideoBase = base;
                youtubeStatus.textContent = `${items.length} videos found via ${base}`;
                renderYouTubeResults(items, base.replace(/^https?:\/\//, ""));
            } catch (error) {
                const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                youtubeStatus.textContent = "video search unavailable; open YouTube search and paste a video URL if needed";
                youtubeResults.innerHTML = `
          <div class="result-card">
            <div class="result-sub">
              video search unavailable on all configured instances
            </div>
            <p class="mini-copy">Invidious instances can block automated API access. You can still use YouTube as preview/reference.</p>
            <p><a class="text-link" href="${youtubeSearchUrl}" target="_blank" rel="noopener noreferrer">open YouTube search</a></p>
          </div>
        `;
            }
        }

        async function runSongSearch() {
            const query = searchQueryInput.value.trim();

            if (!query) {
                alert("Write a search query first.");
                return;
            }

            if (loadYouTubeLinkFromSearch(query)) return;

            searchStatus.textContent = `LRCLIB search: ${query}`;
            lrclibResults.innerHTML = "";
            youtubeResults.innerHTML = "";
            youtubeStatus.textContent = "no video loaded";

            try {
                const items = await searchLRCLIB(query);
                searchStatus.textContent = `${items.length} LRCLIB results`;
                renderLRCLIBResults(items);
            } catch (error) {
                searchStatus.textContent = error.message || "LRCLIB search error";
            }
        }

        function setTheme(theme) {
            state.theme = theme;
            if (theme === "green") {
                state.style.bgColor = "#8ACE00";
                state.style.textColor = "#000000";
                if (bgColorInput) bgColorInput.value = state.style.bgColor;
                if (textColorInput) textColorInput.value = state.style.textColor;
                if (themePresetSelect) themePresetSelect.value = "classic";
            } else if (theme === "dark") {
                state.style.bgColor = "#111111";
                state.style.textColor = "#8ACE00";
                if (bgColorInput) bgColorInput.value = state.style.bgColor;
                if (textColorInput) textColorInput.value = state.style.textColor;
                if (themePresetSelect) themePresetSelect.value = "dark-green";
            }
            const colors = getThemeColors();
            document.documentElement.style.setProperty("--bg-page", colors.page);
            document.documentElement.style.setProperty("--bg-stage", colors.stage);
            document.documentElement.style.setProperty("--text", colors.text);
            syncThemeButtons();
            renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
        }

        function buildExportFileBase() {
            const source = state.selectedSong ? [state.selectedSong.artistName, state.selectedSong.trackName].filter(Boolean).join(" - ") :
                "brat-video-lyrics";

            return source
                .toLowerCase()
                .replace(/[^a-z0-9àèéìòóù _-]+/gi, "")
                .trim()
                .replace(/\s+/g, "-") || "brat-video-lyrics";
        }

        function downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        function pickVideoMimeType(includeAudio = false) {
            if (typeof MediaRecorder === "undefined") return null;

            const candidates = includeAudio ? [
                "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
                "video/mp4",
                "video/webm;codecs=vp9,opus",
                "video/webm;codecs=vp8,opus",
                "video/webm;codecs=vp9",
                "video/webm;codecs=vp8",
                "video/webm"
            ] : [
                "video/mp4;codecs=avc1.42E01E",
                "video/mp4",
                "video/webm;codecs=vp9",
                "video/webm;codecs=vp8",
                "video/webm"
            ];

            for (const type of candidates) {
                if (MediaRecorder.isTypeSupported(type)) {
                    return type;
                }
            }

            return "";
        }

        function hasLoadedExportAudio() {
            return Boolean(state.audioBuffer && Number.isFinite(state.audioBuffer.duration));
        }

        function shouldIncludeAudioInExport() {
            return Boolean(includeAudioInExportCheckbox?.checked && hasLoadedExportAudio());
        }

        function syncExportAudioOption() {
            const hasAudio = hasLoadedExportAudio();
            state.includeAudioInExport = includeAudioInExportCheckbox ? includeAudioInExportCheckbox.checked : true;

            if (includeAudioInExportCheckbox) {
                includeAudioInExportCheckbox.disabled = !hasAudio;
                includeAudioInExportCheckbox.closest(".export-audio-option")?.classList.toggle("is-disabled", !hasAudio);
            }

            if (!exportAudioNote) return;

            if (hasAudio) {
                const readyText = translateUi(
                    "exportAudioReady",
                    "will be merged into export. Extracted audio stays local; YouTube is preview only."
                );
                exportAudioNote.textContent = `${state.audioFileName || "loaded media"} ${readyText}`;
                return;
            }

            exportAudioNote.textContent = translateUi(
                "exportAudioNoFile",
                "Load one audio/video file in Timing; export can merge the extracted audio automatically."
            );
        }

        async function createAudioExportSource() {
            if (!shouldIncludeAudioInExport()) return null;

            const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextCtor) {
                throw new Error("audio export requires Web Audio support");
            }

            const audioContext = new AudioContextCtor();
            const destination = audioContext.createMediaStreamDestination();
            const source = audioContext.createBufferSource();
            const gain = audioContext.createGain();
            const audio = getAudioSettingsFromControls();
            const duration = Math.max(0.001, state.audioBuffer?.duration || 0);
            const volume = clamp(audio.volume ?? 1, 0, 2);
            const fadeIn = clamp(audio.fadeIn ?? 0, 0, duration);
            const fadeOut = clamp(audio.fadeOut ?? 0, 0, duration);
            source.buffer = state.audioBuffer;
            source.connect(gain);
            gain.connect(destination);

            let started = false;

            return {
                stream: destination.stream,
                async start() {
                    if (audioContext.state === "suspended") {
                        await audioContext.resume();
                    }
                    const now = audioContext.currentTime;
                    gain.gain.cancelScheduledValues(now);
                    gain.gain.setValueAtTime(fadeIn > 0 ? 0 : volume, now);
                    if (fadeIn > 0) {
                        gain.gain.linearRampToValueAtTime(volume, now + fadeIn);
                    }
                    if (fadeOut > 0) {
                        const fadeStart = now + Math.max(0, duration - fadeOut);
                        gain.gain.setValueAtTime(volume, fadeStart);
                        gain.gain.linearRampToValueAtTime(0, now + duration);
                    }
                    source.start(0);
                    started = true;
                },
                stop() {
                    try {
                        if (started) source.stop();
                    } catch (_) {}

                    destination.stream.getTracks().forEach(track => track.stop());

                    try {
                        audioContext.close?.();
                    } catch (_) {}
                }
            };
        }

        function canAttemptFastExport() {
            if (BratExport.canAttemptFastExport) return BratExport.canAttemptFastExport(window);
            return typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined";
        }

        async function loadMp4MuxerModule() {
            if (BratExport.loadMp4MuxerModule) return BratExport.loadMp4MuxerModule();
            return import("../../vendor/mp4-muxer.mjs");
        }

        async function hasMp4MuxerModule() {
            if (BratExport.hasMp4MuxerModule) return BratExport.hasMp4MuxerModule();
            try {
                await loadMp4MuxerModule();
                return true;
            } catch (error) {
                return false;
            }
        }

        async function canUseFastMp4Export(width, fps, height = width) {
            if (BratExport.canUseFastMp4Export) return BratExport.canUseFastMp4Export(width, fps, height, window);
            if (!canAttemptFastExport() || typeof VideoEncoder.isConfigSupported !== "function") {
                return false;
            }

            const safeWidth = Math.max(16, Math.round(width / 2) * 2);
            const safeHeight = Math.max(16, Math.round(height / 2) * 2);

            try {
                const support = await VideoEncoder.isConfigSupported({
                    codec: "avc1.42001f",
                    width: safeWidth,
                    height: safeHeight,
                    bitrate: Math.max(4_000_000, Math.round(safeWidth * safeHeight * Math.max(24, fps) * 0.09)),
                    bitrateMode: "variable",
                    framerate: fps,
                    avc: {
                        format: "annexb"
                    }
                });

                return Boolean(support && support.supported);
            } catch (error) {
                return false;
            }
        }

        function wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function formatClock(totalSeconds) {
            const safe = Math.max(0, Math.round(Number(totalSeconds) || 0));
            const hours = Math.floor(safe / 3600);
            const minutes = Math.floor((safe % 3600) / 60);
            const seconds = safe % 60;

            if (hours > 0) {
                return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            }

            return `${minutes}:${String(seconds).padStart(2, "0")}`;
        }

        function estimateExportSeconds(durationSec, size, fps, fastMode = false) {
            if (fastMode) {
                const sizeFactor = size >= 1440 ? 1.38 : size >= 1080 ? 1 : 0.78;
                const fpsFactor = fps >= 60 ? 1.65 : fps >= 30 ? 1 : 0.82;
                return Math.max(4, durationSec * 0.075 * sizeFactor * fpsFactor + 3.5);
            }

            const sizePenalty = size >= 1440 ? 0.16 : size >= 1080 ? 0.07 : 0.02;
            const fpsPenalty = fps >= 60 ? 0.16 : fps >= 30 ? 0.05 : 0.01;
            return Math.max(durationSec + 1, durationSec * (1 + sizePenalty + fpsPenalty) + 1.2);
        }

        
        function translateUi(key, fallback = key) {
            return window.BratI18n?.t(key) || fallback;
        }


        function secondsToTag(seconds) {
            const safe = Math.max(0, Number(seconds) || 0);
            const minutes = Math.floor(safe / 60);
            const secs = safe - minutes * 60;
            return `[${String(minutes).padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}]`;
        }

        function tagToSeconds(tag) {
            const match = String(tag || "").match(/^(?:\[)?(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)(?:\])?$/);
            if (!match) return 0;
            return parseTimeTag(match[1], match[2]) || 0;
        }

        function normalizeTimeInput(value) {
            return secondsToTag(tagToSeconds(value));
        }

        function getLrcLineObjects() {
            if (BratCore.lrcToRows) return BratCore.lrcToRows(lyricsInput.value);
            const lines = normalizeLRCText(lyricsInput.value).split("\n");
            const rows = [];
            for (const raw of lines) {
                const line = raw.trim();
                if (!line || META_TAG_RE.test(line)) continue;
                const timestamps = [...line.matchAll(LINE_TIMESTAMP_RE)];
                const extracted = extractEnhancedLrcLine(line.replace(LINE_TIMESTAMP_RE, "").trim());
                const text = extracted.cleanText;
                if (!timestamps.length && text) {
                    rows.push({ time: 0, text });
                    continue;
                }
                for (const match of timestamps) {
                    const time = parseTimeTag(match[1], match[2]);
                    if (time != null) rows.push({ time, text });
                }
            }
            return rows.sort((a, b) => a.time - b.time);
        }

        function renderLrcRows() {
            if (!lrcRows) return;
            const rows = getLrcLineObjects();
            lrcRows.innerHTML = "";
            rows.forEach((row, index) => {
                const wrapper = document.createElement("div");
                wrapper.className = "lrc-row" + (index === state.selectedLrcRowIndex ? " selected" : "");
                wrapper.dataset.index = String(index);
                wrapper.innerHTML = `
                    <input class="lrc-time" value="${secondsToTag(row.time).replace(/[\[\]]/g, "")}" aria-label="timestamp">
                    <input class="lrc-text" value="${escapeHtml(row.text).replaceAll('\"', '&quot;')}" aria-label="lyric text">
                    <button class="remove-row" type="button" title="remove">×</button>
                `;
                wrapper.addEventListener("click", () => {
                    state.selectedLrcRowIndex = index;
                    renderLrcRows();
                });
                wrapper.querySelector(".remove-row")?.addEventListener("click", (event) => {
                    event.stopPropagation();
                    const current = readRowsFromEditor();
                    current.splice(index, 1);
                    writeRowsToEditor(current);
                    state.selectedLrcRowIndex = clamp(index, 0, Math.max(0, current.length - 1));
                });
                lrcRows.appendChild(wrapper);
            });
            if (!rows.length) {
                const empty = document.createElement("div");
                empty.className = "meta muted";
                empty.textContent = "No editable LRC rows yet.";
                lrcRows.appendChild(empty);
            }
        }

        function readRowsFromEditor() {
            if (!lrcRows) return [];
            return [...lrcRows.querySelectorAll(".lrc-row")].map(row => ({
                time: tagToSeconds(row.querySelector(".lrc-time")?.value || "0:00.00"),
                text: row.querySelector(".lrc-text")?.value || ""
            })).filter(row => row.text.trim()).sort((a, b) => a.time - b.time);
        }

        function writeRowsToEditor(rows) {
            if (!lrcRows) return;
            lyricsInput.value = rows.map(row => `${secondsToTag(row.time)} ${row.text.trim()}`).join("\n");
            renderLrcRows();
            rebuildTimelineFromCurrentInputs();
            updateMeta();
            updateExportEstimate();
            renderTimeline();
            saveProjectSettings();
        }

        function applyEditorRowsToTextarea() {
            writeRowsToEditor(readRowsFromEditor());
        }

        function shiftLrc(secondsDelta) {
            const rows = getLrcLineObjects().map(row => ({
                time: Math.max(0, row.time + secondsDelta),
                text: row.text
            }));
            writeRowsToEditor(rows);
        }

        function cleanLrc() {
            const rows = getLrcLineObjects().filter(row => row.text.trim());
            writeRowsToEditor(rows);
        }

        function normalizeLrc() {
            const rows = getLrcLineObjects();
            writeRowsToEditor(rows);
        }

        function getSelectedRowIndexes() {
            const selected = [...(state.selectedLrcRowIndexes || new Set())]
                .map(index => Number(index))
                .filter(index => Number.isInteger(index) && index >= 0);
            if (selected.length) return [...new Set(selected)].sort((a, b) => a - b);
            if (Number.isInteger(state.selectedLrcRowIndex) && state.selectedLrcRowIndex >= 0) return [state.selectedLrcRowIndex];
            return [];
        }

        function setSelectedRowIndexes(indexes) {
            state.selectedLrcRowIndexes = new Set(indexes.filter(index => Number.isInteger(index) && index >= 0));
            state.selectedLrcRowIndex = getSelectedRowIndexes()[0] ?? 0;
        }

        function refreshFromRows(rows, { preserveSelection = true } = {}) {
            if (!lrcRows) return;
            lrcRows.__rows = rows.map(row => ({
                time: Number(row.time) || 0,
                text: String(row.text || "")
            }));

            if (!preserveSelection) setSelectedRowIndexes([]);
            const selected = new Set(getSelectedRowIndexes());
            const query = (lrcSearchInput?.value || "").trim().toLowerCase();
            lrcRows.innerHTML = "";

            rows.forEach((row, index) => {
                const searchable = `${secondsToTag(row.time)} ${row.text}`.toLowerCase();
                if (query && !searchable.includes(query)) return;

                const wrapper = document.createElement("div");
                const isSelected = selected.has(index);
                wrapper.className = "lrc-row" + (index === state.selectedLrcRowIndex ? " selected" : "") + (isSelected ? " multi-selected" : "");
                wrapper.dataset.index = String(index);
                wrapper.innerHTML = `
                    <input class="row-select" type="checkbox" ${isSelected ? "checked" : ""} aria-label="select lyric row">
                    <input class="lrc-time" value="${secondsToTag(row.time).replace(/[\[\]]/g, "")}" aria-label="timestamp">
                    <input class="lrc-text" value="${escapeHtml(row.text).replaceAll('"', '&quot;')}" aria-label="lyric text">
                    <button class="seek-row" type="button" title="seek to row">play</button>
                    <button class="remove-row" type="button" title="remove">&times;</button>
                `;

                wrapper.addEventListener("click", (event) => {
                    if (event.target.closest("input, button")) return;
                    setSelectedRowIndexes([index]);
                    refreshFromRows(readRowsFromEditor());
                });

                wrapper.querySelector(".row-select")?.addEventListener("change", (event) => {
                    if (event.target.checked) state.selectedLrcRowIndexes.add(index);
                    else state.selectedLrcRowIndexes.delete(index);
                    state.selectedLrcRowIndex = getSelectedRowIndexes()[0] ?? index;
                    refreshFromRows(readRowsFromEditor());
                });

                wrapper.querySelector(".seek-row")?.addEventListener("click", (event) => {
                    event.stopPropagation();
                    setSelectedRowIndexes([index]);
                    seekTo(row.time);
                    refreshFromRows(readRowsFromEditor());
                });

                wrapper.querySelectorAll(".lrc-time, .lrc-text").forEach(input => {
                    input.addEventListener("change", () => {
                        const before = buildProjectPayload();
                        writeRowsToEditor(readRowsFromEditor(), { selection: getSelectedRowIndexes(), beforePayload: before, label: "edit lyric" });
                    });
                });

                wrapper.querySelector(".remove-row")?.addEventListener("click", (event) => {
                    event.stopPropagation();
                    const rowsNow = readRowsFromEditor();
                    commitRowsChange("delete lyric", rowsNow.filter((_, rowIndex) => rowIndex !== index), [clamp(index, 0, Math.max(0, rowsNow.length - 2))]);
                });

                lrcRows.appendChild(wrapper);
            });

            if (!rows.length || !lrcRows.children.length) {
                const empty = document.createElement("div");
                empty.className = "meta muted";
                empty.textContent = rows.length ? "No lyric rows match the filter." : "No editable LRC rows yet.";
                lrcRows.appendChild(empty);
            }
        }

        function renderLrcRows() {
            refreshFromRows(getLrcLineObjects());
        }

        function readRowsFromEditor() {
            if (!lrcRows) return [];
            const rows = (lrcRows.__rows || getLrcLineObjects()).map(row => ({ ...row }));
            lrcRows.querySelectorAll(".lrc-row").forEach(rowEl => {
                const index = Number(rowEl.dataset.index);
                if (!Number.isInteger(index) || !rows[index]) return;
                rows[index] = {
                    time: tagToSeconds(rowEl.querySelector(".lrc-time")?.value || "0:00.00"),
                    text: rowEl.querySelector(".lrc-text")?.value || ""
                };
            });
            return rows.filter(row => row.text.trim());
        }

        function writeRowsToEditor(rows, options = {}) {
            if (!lrcRows) return;
            const normalizedRows = rows
                .filter(row => String(row.text || "").trim())
                .map(row => ({ time: Math.max(0, Number(row.time) || 0), text: String(row.text || "").trim() }));
            lyricsInput.value = normalizedRows.map(row => `${secondsToTag(row.time)} ${row.text}`).join("\n");
            if (Array.isArray(options.selection)) setSelectedRowIndexes(options.selection);
            renderLrcRows();
            rebuildTimelineFromCurrentInputs();
            updateMeta();
            updateExportEstimate();
            renderTimeline();
            drawWaveform();
            saveProjectSettings();

            if (options.beforePayload) {
                const after = buildProjectPayload();
                if (JSON.stringify(options.beforePayload) !== JSON.stringify(after)) {
                    state.undoStack.push({ label: options.label || "edit lyrics", payload: options.beforePayload });
                    if (state.undoStack.length > UNDO_LIMIT) state.undoStack.shift();
                    state.redoStack = [];
                    updateUndoRedoState();
                }
            }
        }

        function commitRowsChange(label, rows, selection = getSelectedRowIndexes()) {
            commitProjectChange(label, () => writeRowsToEditor(rows, { selection }));
        }

        function applyEditorRowsToTextarea() {
            commitRowsChange("apply lyric edits", readRowsFromEditor());
        }

        function shiftLrc(secondsDelta) {
            const shifter = BratCore.shiftRows || ((items, delta) => items.map(row => ({ ...row, time: Math.max(0, row.time + delta) })));
            commitRowsChange("shift all lyrics", shifter(getLrcLineObjects(), secondsDelta));
        }

        function shiftSelectedRows(secondsDelta) {
            const indexes = getSelectedRowIndexes();
            if (!indexes.length) return shiftLrc(secondsDelta);
            const shifter = BratCore.shiftRows || ((items, delta, selectedIndexes) => {
                const selected = new Set(selectedIndexes);
                return items.map((row, index) => selected.has(index) ? { ...row, time: Math.max(0, row.time + delta) } : { ...row });
            });
            commitRowsChange("shift selected lyrics", shifter(readRowsFromEditor(), secondsDelta, indexes), indexes);
        }

        function splitSelectedRow() {
            const [index] = getSelectedRowIndexes();
            const rows = readRowsFromEditor();
            if (!rows[index]) return;
            const activeText = document.activeElement?.classList?.contains("lrc-text") ? document.activeElement : lrcRows?.querySelector(`.lrc-row[data-index="${index}"] .lrc-text`);
            const caret = activeText && Number.isInteger(activeText.selectionStart) ? activeText.selectionStart : Math.ceil(rows[index].text.length / 2);
            const nextRows = BratCore.splitRow ? BratCore.splitRow(rows, index, caret) : rows;
            commitRowsChange("split lyric", nextRows, [index + 1]);
        }

        function mergeSelectedRow() {
            const [index] = getSelectedRowIndexes();
            const rows = readRowsFromEditor();
            if (!rows[index] || !rows[index + 1]) return;
            const nextRows = BratCore.mergeRows ? BratCore.mergeRows(rows, index) : rows;
            commitRowsChange("merge lyrics", nextRows, [index]);
        }

        function moveSelectedRow(direction) {
            const [index] = getSelectedRowIndexes();
            const rows = readRowsFromEditor();
            const target = index + direction;
            if (!rows[index] || !rows[target]) return;
            const nextRows = rows.map(row => ({ ...row }));
            const movingTime = nextRows[index].time;
            nextRows[index].time = nextRows[target].time;
            nextRows[target].time = movingTime;
            commitRowsChange(direction < 0 ? "move lyric up" : "move lyric down", nextRows, [target]);
        }

        function duplicateSelectedRow() {
            const indexes = getSelectedRowIndexes();
            const rows = readRowsFromEditor();
            if (!indexes.length || !rows[indexes[0]]) return;
            const nextRows = rows.map(row => ({ ...row }));
            indexes.slice().reverse().forEach(index => {
                if (!rows[index]) return;
                nextRows.splice(index + 1, 0, { ...rows[index], time: rows[index].time + 0.25 });
            });
            commitRowsChange("duplicate lyrics", nextRows, indexes.map(index => index + 1));
        }

        function playSelectedRow() {
            const [index] = getSelectedRowIndexes();
            const rows = readRowsFromEditor();
            if (!rows[index]) return;
            seekTo(rows[index].time);
            if (!state.isPlaying) playPauseBtn?.click();
        }

        function cleanLrc() {
            commitRowsChange("clean lyrics", getLrcLineObjects().filter(row => row.text.trim()));
        }

        function normalizeLrc() {
            commitRowsChange("normalize lyrics", getLrcLineObjects());
        }

        function getExportDimensions() {
            const preset = formatPresetSelect?.value || state.formatPreset || "square";
            const base = Number(exportSizeSelect?.value) || 1080;
            if (preset === "vertical" || preset === "story") return { width: base, height: Math.round(base * 16 / 9), format: "vertical" };
            if (preset === "landscape") return { width: Math.round(base * 16 / 9), height: base, format: "landscape" };
            if (preset === "cover") return { width: 3000, height: 3000, format: "square" };
            return { width: base, height: base, format: "square" };
        }

        function applyFormatPreset() {
            const dims = getExportDimensions();
            state.formatPreset = formatPresetSelect?.value || "square";
            previewCanvas.width = dims.width;
            previewCanvas.height = dims.height;
            stageWrap?.setAttribute("data-format", dims.format);
            previewCanvas.setAttribute("aria-label", `${dims.width} by ${dims.height} lyric video preview`);
            renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
            updateExportEstimate();
            updateCompatibilityPanel();
            saveProjectSettings();
        }

        function readStyleControls() {
            state.animationMode = animationModeSelect?.value || state.animationMode || "typewriter";
            state.style = {
                bgColor: bgColorInput?.value || state.style.bgColor,
                textColor: textColorInput?.value || state.style.textColor,
                fontFamily: fontFamilySelect?.value || state.style.fontFamily,
                fontScale: (Number(fontScaleInput?.value) || 100) / 100,
                blur: (Number(blurInput?.value) || 0) / 100,
                verticalPosition: (Number(verticalPositionInput?.value) || 0) / 100,
                stretch: (Number(stretchInput?.value) || 100) / 100,
                letterSpacing: Number(letterSpacingInput?.value) || 0,
                letterChunkSize: clamp(Math.round(Number(letterChunkSizeInput?.value) || state.style.letterChunkSize || 2), 1, 12),
                lineSpacing: (Number(lineSpacingInput?.value) || 92) / 100,
                lyricsMode: lyricsDisplayModeSelect?.value || state.style.lyricsMode || "brat",
                musicAlign: musicAlignSelect?.value || state.style.musicAlign || "left",
                musicWordHighlight: Boolean(wordHighlightCheckbox?.checked),
                musicActiveScale: (Number(musicActiveScaleInput?.value) || 116) / 100,
                musicDimOpacity: (Number(musicDimOpacityInput?.value) || 34) / 100,
                musicScrollPosition: (Number(musicScrollPositionInput?.value) || 50) / 100,
                wordAnimation: {
                    mode: wordAnimationModeSelect?.value || state.style.wordAnimation?.mode || "progress",
                    intensity: clamp((Number(wordAnimationIntensityInput?.value) || 70) / 100, 0, 1),
                    color: wordAnimationColorInput?.value || state.style.wordAnimation?.color || "#ffffff"
                },
                beautifulDynamicBg: Boolean(beautifulDynamicBgCheckbox?.checked),
                beautifulSideVocals: Boolean(beautifulSideVocalsCheckbox?.checked),
                beautifulMotion: (Number(beautifulMotionInput?.value) || 65) / 100,
                beautifulDepth: (Number(beautifulDepthInput?.value) || 72) / 100,
                beautifulGlow: (Number(beautifulGlowInput?.value) || 58) / 100,
                beautifulEdgeFade: (Number(beautifulEdgeFadeInput?.value) || 70) / 100,
                safeZones: Boolean(safeZonesCheckbox?.checked)
            };
        }

        function writeStyleControls(style = state.style, mode = state.animationMode) {
            if (animationModeSelect) animationModeSelect.value = mode || "typewriter";
            if (lyricsDisplayModeSelect) lyricsDisplayModeSelect.value = style.lyricsMode || "brat";
            if (musicAlignSelect) musicAlignSelect.value = style.musicAlign || "left";
            if (wordHighlightCheckbox) wordHighlightCheckbox.checked = style.musicWordHighlight !== false;
            if (musicActiveScaleInput) musicActiveScaleInput.value = Math.round((style.musicActiveScale || 1.16) * 100);
            if (musicDimOpacityInput) musicDimOpacityInput.value = Math.round((style.musicDimOpacity ?? 0.34) * 100);
            if (musicScrollPositionInput) musicScrollPositionInput.value = Math.round((style.musicScrollPosition || 0.50) * 100);
            if (wordAnimationModeSelect) wordAnimationModeSelect.value = style.wordAnimation?.mode || "progress";
            if (wordAnimationIntensityInput) wordAnimationIntensityInput.value = Math.round((style.wordAnimation?.intensity ?? 0.7) * 100);
            if (wordAnimationColorInput) wordAnimationColorInput.value = style.wordAnimation?.color || "#ffffff";
            if (beautifulDynamicBgCheckbox) beautifulDynamicBgCheckbox.checked = style.beautifulDynamicBg !== false;
            if (beautifulSideVocalsCheckbox) beautifulSideVocalsCheckbox.checked = style.beautifulSideVocals !== false;
            if (beautifulMotionInput) beautifulMotionInput.value = Math.round((style.beautifulMotion ?? 0.65) * 100);
            if (beautifulDepthInput) beautifulDepthInput.value = Math.round((style.beautifulDepth ?? 0.72) * 100);
            if (beautifulGlowInput) beautifulGlowInput.value = Math.round((style.beautifulGlow ?? 0.58) * 100);
            if (beautifulEdgeFadeInput) beautifulEdgeFadeInput.value = Math.round((style.beautifulEdgeFade ?? 0.70) * 100);
            if (bgColorInput) bgColorInput.value = style.bgColor || "#8ACE00";
            if (textColorInput) textColorInput.value = style.textColor || "#000000";
            if (fontFamilySelect) fontFamilySelect.value = style.fontFamily || fontFamilySelect.value;
            if (fontScaleInput) fontScaleInput.value = Math.round((style.fontScale || 1) * 100);
            if (blurInput) blurInput.value = Math.round((style.blur ?? 1.05) * 100);
            if (verticalPositionInput) verticalPositionInput.value = Math.round((style.verticalPosition || 0) * 100);
            if (stretchInput) stretchInput.value = Math.round((style.stretch || 0.94) * 100);
            if (letterSpacingInput) letterSpacingInput.value = Math.round(style.letterSpacing || 0);
            if (letterChunkSizeInput) letterChunkSizeInput.value = clamp(Math.round(style.letterChunkSize || 2), 1, 12);
            if (lineSpacingInput) lineSpacingInput.value = Math.round((style.lineSpacing || 0.92) * 100);
            if (safeZonesCheckbox) safeZonesCheckbox.checked = Boolean(style.safeZones);
            readStyleControls();
        }

        function applyStylePreset(preset) {
            const presets = {
                classic: { bgColor: "#8ACE00", textColor: "#000000", fontScale: 1, blur: 1.05, verticalPosition: 0, stretch: 0.94, letterSpacing: 0, lineSpacing: 0.92, wordAnimation: { mode: "progress", intensity: 0.7, color: "#ffffff" } },
                "dark-green": { bgColor: "#111111", textColor: "#8ACE00", fontScale: 1, blur: 0.6, verticalPosition: 0, stretch: 0.96, letterSpacing: 0, lineSpacing: 0.94, wordAnimation: { mode: "glow", intensity: 0.76, color: "#8ACE00" } },
                "white-label": { bgColor: "#f6f6f2", textColor: "#111111", fontScale: 0.96, blur: 0.15, verticalPosition: 0, stretch: 1, letterSpacing: 0, lineSpacing: 0.96, wordAnimation: { mode: "fade", intensity: 0.55, color: "#111111" } },
                pink: { bgColor: "#ff8fcb", textColor: "#111111", fontScale: 1.04, blur: 0.55, verticalPosition: 0, stretch: 0.96, letterSpacing: 0, lineSpacing: 0.92, wordAnimation: { mode: "pop", intensity: 0.68, color: "#ffffff" } },
                blue: { bgColor: "#6db7ff", textColor: "#06111f", fontScale: 1.02, blur: 0.45, verticalPosition: 0, stretch: 0.98, letterSpacing: 0, lineSpacing: 0.92, wordAnimation: { mode: "scale", intensity: 0.62, color: "#ffffff" } },
                "beautiful-lyrics": { bgColor: "#07090d", textColor: "#f5f5f7", fontFamily: APPLE_LIKE_FONT_STACK, fontScale: 1.00, blur: 0.00, verticalPosition: 0, stretch: 1, letterSpacing: -2, lineSpacing: 1.00, lyricsMode: "beautiful", musicAlign: "center", musicActiveScale: 1.22, musicDimOpacity: 0.20, musicScrollPosition: 0.52, musicWordHighlight: true, wordAnimation: { mode: "progress", intensity: 0.86, color: "#ffffff" }, beautifulDynamicBg: true, beautifulSideVocals: true, beautifulMotion: 0.86, beautifulDepth: 0.96, beautifulGlow: 0.88, beautifulEdgeFade: 0.92 },
                "beautiful-live": { bgColor: "#07090d", textColor: "#f5f5f7", fontFamily: APPLE_LIKE_FONT_STACK, fontScale: 1.00, blur: 0.00, verticalPosition: 0, stretch: 1, letterSpacing: -2, lineSpacing: 1.00, lyricsMode: "beautiful", musicAlign: "center", musicActiveScale: 1.22, musicDimOpacity: 0.20, musicScrollPosition: 0.52, musicWordHighlight: true, wordAnimation: { mode: "glow", intensity: 0.90, color: "#ffffff" }, beautifulDynamicBg: true, beautifulSideVocals: true, beautifulMotion: 0.86, beautifulDepth: 0.96, beautifulGlow: 0.88, beautifulEdgeFade: 0.92 }
            };
            const next = presets[preset];
            if (!next) return;
            writeStyleControls({ ...state.style, ...next }, state.animationMode);
            setTheme("custom");
            renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
            saveProjectSettings();
        }

        function randomizeStyle() {
            const colors = ["#8ACE00", "#ff8fcb", "#6db7ff", "#f3f3ed", "#111111", "#f4ff00"];
            const bg = colors[Math.floor(Math.random() * colors.length)];
            const darkBg = bg === "#111111";
            writeStyleControls({
                ...state.style,
                bgColor: bg,
                textColor: darkBg ? "#8ACE00" : "#111111",
                fontScale: 0.88 + Math.random() * 0.34,
                blur: Math.random() * 1.6,
                verticalPosition: -0.1 + Math.random() * 0.2,
                stretch: 0.86 + Math.random() * 0.22,
                letterSpacing: Math.round(-2 + Math.random() * 8),
                letterChunkSize: 1 + Math.floor(Math.random() * 5),
                lineSpacing: 0.84 + Math.random() * 0.24,
                wordAnimation: {
                    mode: ["progress", "fade", "scale", "pop", "glow", "shake", "color"][Math.floor(Math.random() * 7)],
                    intensity: 0.45 + Math.random() * 0.48,
                    color: darkBg ? "#ffffff" : "#111111"
                }
            }, ["typewriter", "word", "letter-chunks", "phrase", "fade", "jitter", "pulse"][Math.floor(Math.random()*7)]);
            if (themePresetSelect) themePresetSelect.value = "custom";
            renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
            saveProjectSettings();
        }

        function drawSafeZones(ctx, width, height) {
            if (!state.style.safeZones) return;
            ctx.save();
            ctx.strokeStyle = "rgba(0,0,0,.36)";
            ctx.setLineDash([14, 10]);
            ctx.lineWidth = Math.max(2, width * 0.002);
            const marginX = width * 0.08;
            const marginY = height * 0.10;
            ctx.strokeRect(marginX, marginY, width - marginX * 2, height - marginY * 2);
            if (height > width * 1.2) {
                ctx.strokeStyle = "rgba(0,0,0,.24)";
                ctx.strokeRect(width * 0.08, height * 0.18, width * 0.62, height * 0.64);
            }
            ctx.restore();
        }

        function drawWaveform() {
            if (!waveformCanvas) return;
            const ctx = waveformCanvas.getContext("2d");
            const width = waveformCanvas.width;
            const height = waveformCanvas.height;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(255,255,255,.75)";
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "rgba(0,0,0,.12)";
            ctx.fillRect(0, height / 2 - 1, width, 2);
            if (!state.audioAnalysis?.frames?.length) {
                ctx.fillStyle = "rgba(0,0,0,.52)";
                ctx.font = "13px Arial, sans-serif";
                ctx.fillText("waveform appears after audio upload", 14, 25);
                return;
            }
            const frames = state.audioAnalysis.frames;
            const max = Math.max(...frames.map(f => f.rms), 0.001);
            ctx.fillStyle = "rgba(0,0,0,.68)";
            for (let x = 0; x < width; x += 1) {
                const index = Math.floor((x / width) * frames.length);
                const rms = frames[index]?.rms || 0;
                const amp = (rms / max) * (height * 0.46);
                ctx.fillRect(x, height / 2 - amp, 1, Math.max(1, amp * 2));
            }
            const duration = state.audioAnalysis.duration || getTimelineDuration() || 1;
            const playhead = clamp((state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec) / duration, 0, 1) * width;
            ctx.fillStyle = "rgba(0,0,0,.95)";
            ctx.fillRect(playhead, 0, 2, height);
        }

        function renderTimeline() {
            if (!timelineCanvas) return;
            const ctx = timelineCanvas.getContext("2d");
            const width = timelineCanvas.width;
            const height = timelineCanvas.height;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(255,255,255,.75)";
            ctx.fillRect(0, 0, width, height);
            const duration = Math.max(getTimelineDuration(), 1);
            ctx.font = "11px Arial, sans-serif";
            state.timeline.forEach((line, i) => {
                const x = (line.displayStart / duration) * width;
                const w = Math.max(3, ((line.displayEnd - line.displayStart) / duration) * width);
                ctx.fillStyle = i % 2 ? "rgba(0,0,0,.48)" : "rgba(0,0,0,.72)";
                ctx.fillRect(x, 18, w, 28);
            });
            const playhead = clamp((state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec) / duration, 0, 1) * width;
            ctx.fillStyle = "rgba(0,0,0,.96)";
            ctx.fillRect(playhead, 0, 2, height);
            ctx.fillStyle = "rgba(0,0,0,.62)";
            ctx.fillText(`${state.timeline.length} lines · ${formatClock(duration)}`, 10, 13);
        }

        function drawLyricMarkers(ctx, width, height, duration) {
            const rows = getLrcLineObjects();
            const selected = new Set(getSelectedRowIndexes());
            rows.forEach((row, index) => {
                const x = clamp(row.time / duration, 0, 1) * width;
                ctx.save();
                ctx.strokeStyle = selected.has(index) ? "#8ACE00" : "rgba(18,19,15,.48)";
                ctx.lineWidth = selected.has(index) ? 3 : 1;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
                ctx.restore();
            });
        }

        function drawWaveform() {
            if (!waveformCanvas) return;
            const ctx = waveformCanvas.getContext("2d");
            const width = waveformCanvas.width;
            const height = waveformCanvas.height;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(255,255,255,.75)";
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "rgba(0,0,0,.12)";
            ctx.fillRect(0, height / 2 - 1, width, 2);

            if (state.audioAnalysis?.frames?.length) {
                const frames = state.audioAnalysis.frames;
                const max = Math.max(...frames.map(f => f.rms), 0.001);
                ctx.fillStyle = "rgba(0,0,0,.68)";
                for (let x = 0; x < width; x += 1) {
                    const index = Math.floor((x / width) * frames.length);
                    const rms = frames[index]?.rms || 0;
                    const amp = (rms / max) * (height * 0.46);
                    ctx.fillRect(x, height / 2 - amp, 1, Math.max(1, amp * 2));
                }
            } else {
                ctx.fillStyle = "rgba(0,0,0,.52)";
                ctx.font = "13px Arial, sans-serif";
                ctx.fillText("waveform appears after audio upload", 14, 25);
            }

            const duration = state.audioAnalysis?.duration || getTimelineDuration() || 1;
            drawLyricMarkers(ctx, width, height, duration);
            const playhead = clamp((state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec) / duration, 0, 1) * width;
            ctx.fillStyle = "rgba(0,0,0,.95)";
            ctx.fillRect(playhead, 0, 2, height);
        }

        function renderTimeline() {
            if (!timelineCanvas) return;
            const ctx = timelineCanvas.getContext("2d");
            const width = timelineCanvas.width;
            const height = timelineCanvas.height;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(255,255,255,.75)";
            ctx.fillRect(0, 0, width, height);
            const duration = Math.max(getTimelineDuration(), 1);
            ctx.font = "11px Arial, sans-serif";
            state.timeline.forEach((line, i) => {
                const x = (line.displayStart / duration) * width;
                const w = Math.max(3, ((line.displayEnd - line.displayStart) / duration) * width);
                ctx.fillStyle = i % 2 ? "rgba(0,0,0,.42)" : "rgba(0,0,0,.64)";
                ctx.fillRect(x, 18, w, 28);
            });
            drawLyricMarkers(ctx, width, height, duration);
            const playhead = clamp((state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec) / duration, 0, 1) * width;
            ctx.fillStyle = "rgba(0,0,0,.96)";
            ctx.fillRect(playhead, 0, 2, height);
            ctx.fillStyle = "rgba(0,0,0,.62)";
            ctx.fillText(`${state.timeline.length} lines - ${formatClock(duration)}`, 10, 13);
        }

        function canvasTimeFromPointer(event, canvas, duration) {
            const rect = canvas.getBoundingClientRect();
            return clamp(((event.clientX - rect.left) / rect.width) * duration, 0, duration);
        }

        function findNearestTimingRow(event, canvas, duration) {
            const rows = getLrcLineObjects();
            if (!rows.length) return -1;
            const rect = canvas.getBoundingClientRect();
            const pointerX = event.clientX - rect.left;
            let nearest = -1;
            let nearestDistance = 14;
            rows.forEach((row, index) => {
                const x = clamp(row.time / duration, 0, 1) * rect.width;
                const distance = Math.abs(pointerX - x);
                if (distance < nearestDistance) {
                    nearest = index;
                    nearestDistance = distance;
                }
            });
            return nearest;
        }

        function beginTimingPointer(event, canvas, duration) {
            const nearest = findNearestTimingRow(event, canvas, duration);
            if (nearest < 0) {
                seekTo(canvasTimeFromPointer(event, canvas, duration));
                return;
            }
            event.preventDefault();
            canvas.setPointerCapture?.(event.pointerId);
            setSelectedRowIndexes([nearest]);
            state.dragEdit = {
                pointerId: event.pointerId,
                index: nearest,
                beforePayload: buildProjectPayload(),
                rows: readRowsFromEditor()
            };
            updateTimingPointer(event, canvas, duration);
        }

        function updateTimingPointer(event, canvas, duration) {
            if (!state.dragEdit || state.dragEdit.pointerId !== event.pointerId) return;
            const rows = state.dragEdit.rows.map(row => ({ ...row }));
            if (!rows[state.dragEdit.index]) return;
            rows[state.dragEdit.index].time = canvasTimeFromPointer(event, canvas, duration);
            state.dragEdit.rows = rows;
            writeRowsToEditor(rows, { selection: [state.dragEdit.index] });
        }

        function finishTimingPointer(event, canvas) {
            if (!state.dragEdit || state.dragEdit.pointerId !== event.pointerId) return;
            canvas.releasePointerCapture?.(event.pointerId);
            const before = state.dragEdit.beforePayload;
            state.dragEdit = null;
            const after = buildProjectPayload();
            if (JSON.stringify(before) !== JSON.stringify(after)) {
                state.undoStack.push({ label: "drag lyric timing", payload: before });
                if (state.undoStack.length > UNDO_LIMIT) state.undoStack.shift();
                state.redoStack = [];
                updateUndoRedoState();
            }
        }

        function seekTo(seconds) {
            stopPlayback(true);
            state.pausedElapsedSec = clamp(seconds, 0, Math.max(getTimelineDuration(), state.audioAnalysis?.duration || 0));
            if (syncAudio && !Number.isNaN(syncAudio.duration)) syncAudio.currentTime = clamp(seconds, 0, syncAudio.duration || seconds);
            renderPreviewAt(state.pausedElapsedSec);
            drawWaveform();
            renderTimeline();
        }

        function startTapSync() {
            const lines = plainLyricsInput.value.split("\n").map(line => line.trim()).filter(Boolean);
            if (!lines.length) {
                alert("Paste plain lyrics first.");
                return;
            }
            state.tapSync = { active: true, startedAt: performance.now(), lines, stamps: [], index: 0 };
            if (syncAudio?.src) {
                syncAudio.currentTime = 0;
                syncAudio.play().catch(() => {});
            }
            tapSyncStatus.textContent = `tap sync started · line 1/${lines.length}`;
        }

        function tapNextLine() {
            if (!state.tapSync.active) startTapSync();
            if (!state.tapSync.active) return;
            const time = syncAudio?.src ? syncAudio.currentTime : (performance.now() - state.tapSync.startedAt) / 1000;
            if (state.tapSync.index >= state.tapSync.lines.length) return;
            state.tapSync.stamps.push(time);
            state.tapSync.index += 1;
            tapSyncStatus.textContent = state.tapSync.index >= state.tapSync.lines.length
                ? "all lines tapped · finish to LRC"
                : `next: line ${state.tapSync.index + 1}/${state.tapSync.lines.length}`;
        }

        function finishTapSync() {
            if (!state.tapSync.lines.length) return;
            while (state.tapSync.stamps.length < state.tapSync.lines.length) {
                const last = state.tapSync.stamps.at(-1) ?? 0;
                state.tapSync.stamps.push(last + 2);
            }
            lyricsInput.value = state.tapSync.lines.map((line, index) => `${secondsToTag(state.tapSync.stamps[index])} ${line}`).join("\n");
            state.tapSync.active = false;
            tapSyncStatus.textContent = "LRC generated from tap sync";
            rebuildTimelineFromCurrentInputs();
            updateMeta();
            renderLrcRows();
            renderTimeline();
            saveProjectSettings();
        }

        function exportProjectJson() {
            const payload = buildProjectPayload();
            downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${buildExportFileBase()}-project.json`);
        }

        async function importProjectJson(file) {
            if (!file) return;
            try {
                const payload = JSON.parse(await file.text());
                restoreProjectSettings(payload);
                renderLrcRows();
                applyFormatPreset();
                exportStatus.textContent = "project JSON imported";
                setProjectFeatureStatus("project JSON imported");
            } catch (error) {
                alert("Invalid project JSON.");
            }
        }

        async function copyText(text) {
            const value = String(text || "");
            if (!value) return false;

            if (navigator.clipboard?.writeText && window.isSecureContext) {
                await navigator.clipboard.writeText(value);
                return true;
            }

            const textarea = document.createElement("textarea");
            textarea.value = value;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            const copied = document.execCommand("copy");
            textarea.remove();
            return copied;
        }

        function setProjectFeatureStatus(message, isError = false) {
            if (!projectFeatureStatus) return;
            projectFeatureStatus.textContent = message;
            projectFeatureStatus.classList.toggle("muted", !isError);
        }

        function encodeProjectPayload(payload) {
            const json = JSON.stringify(payload);
            const bytes = new TextEncoder().encode(json);
            let binary = "";
            bytes.forEach((byte) => {
                binary += String.fromCharCode(byte);
            });
            return btoa(binary)
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/g, "");
        }

        function decodeProjectPayload(encoded) {
            const padded = String(encoded || "").replace(/-/g, "+").replace(/_/g, "/");
            const base64 = padded + "=".repeat((4 - padded.length % 4) % 4);
            const binary = atob(base64);
            const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
            return JSON.parse(new TextDecoder().decode(bytes));
        }

        function getHashProjectPayload() {
            const match = window.location.hash.match(/^#project=([^&]+)/);
            if (!match) return null;
            try {
                return decodeProjectPayload(match[1]);
            } catch (error) {
                console.warn("shared project link could not be read", error);
                return null;
            }
        }

        function buildProjectLabel(payload = buildProjectPayload()) {
            const source = [
                state.selectedSong?.artistName,
                state.selectedSong?.trackName
            ].filter(Boolean).join(" - ");
            if (source) return source;

            const query = String(payload.query || "").trim();
            if (query) return query.slice(0, 52);

            const firstLyric = String(payload.lyrics || "")
                .split("\n")
                .map(line => line.replace(LINE_TIMESTAMP_RE, "").trim())
                .find(Boolean);

            return (firstLyric || "untitled lyric project").slice(0, 52);
        }

        function loadSnapshots() {
            try {
                const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.warn("snapshots restore failed", error);
                return [];
            }
        }

        function writeSnapshots(items) {
            try {
                localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(items.slice(0, 8)));
            } catch (error) {
                console.warn("snapshots save failed", error);
                setProjectFeatureStatus("snapshot storage is full", true);
            }
        }

        function formatSnapshotTime(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "saved";
            return date.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        }

        function renderSnapshots() {
            if (!snapshotList) return;
            const snapshots = loadSnapshots();
            snapshotList.innerHTML = "";

            if (!snapshots.length) {
                const empty = document.createElement("div");
                empty.className = "snapshot-empty";
                empty.textContent = "No snapshots yet.";
                snapshotList.appendChild(empty);
                return;
            }

            snapshots.forEach((snapshot) => {
                const item = document.createElement("div");
                item.className = "snapshot-item";

                const details = document.createElement("div");
                details.className = "snapshot-details";

                const title = document.createElement("strong");
                title.textContent = snapshot.title || "untitled snapshot";

                const metaText = document.createElement("span");
                const payload = snapshot.payload || {};
                const lineCount = parseLRC(
                    payload.lyrics || "",
                    Boolean(payload.startFromZero),
                    null
                ).length;
                metaText.textContent = `${formatSnapshotTime(snapshot.savedAt)} · ${lineCount} lines`;

                details.append(title, metaText);

                const actions = document.createElement("div");
                actions.className = "snapshot-actions";

                const loadButton = document.createElement("button");
                loadButton.type = "button";
                loadButton.textContent = "load";
                loadButton.addEventListener("click", () => {
                    restoreProjectSettings(snapshot.payload);
                    saveProjectSettings();
                    renderSnapshots();
                    setProjectFeatureStatus(`loaded ${snapshot.title || "snapshot"}`);
                });

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.textContent = "delete";
                deleteButton.addEventListener("click", () => {
                    writeSnapshots(loadSnapshots().filter(item => item.id !== snapshot.id));
                    renderSnapshots();
                    setProjectFeatureStatus("snapshot deleted");
                });

                actions.append(loadButton, deleteButton);
                item.append(details, actions);
                snapshotList.appendChild(item);
            });
        }

        function saveSnapshot() {
            const payload = buildProjectPayload();
            const title = (snapshotNameInput?.value || buildProjectLabel(payload)).trim() || "untitled lyric project";
            const snapshots = loadSnapshots();
            snapshots.unshift({
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                title,
                savedAt: new Date().toISOString(),
                payload
            });
            writeSnapshots(snapshots);
            if (snapshotNameInput) snapshotNameInput.value = "";
            renderSnapshots();
            setProjectFeatureStatus(`saved snapshot: ${title}`);
        }

        async function copyProjectJson() {
            const payload = buildProjectPayload();
            const copied = await copyText(JSON.stringify(payload, null, 2));
            setProjectFeatureStatus(copied ? "project JSON copied" : "copy failed", !copied);
        }

        async function copyProjectLink() {
            const payload = buildProjectPayload();
            const encoded = encodeProjectPayload(payload);
            const url = new URL(window.location.href);
            url.hash = `project=${encoded}`;
            const shareUrl = url.toString();

            if (shareUrl.length > 7800) {
                await copyProjectJson();
                setProjectFeatureStatus("project is too large for a tidy link; JSON copied instead", true);
                return;
            }

            const copied = await copyText(shareUrl);
            setProjectFeatureStatus(copied ? "share link copied" : "copy failed", !copied);
        }

        function loadUserPresets() {
            try {
                const parsed = JSON.parse(localStorage.getItem(USER_PRESET_STORAGE_KEY) || "[]");
                return Array.isArray(parsed) ? parsed : [];
            } catch (_) {
                return [];
            }
        }

        function writeUserPresets(presets) {
            localStorage.setItem(USER_PRESET_STORAGE_KEY, JSON.stringify(presets));
            renderUserPresets();
        }

        function renderUserPresets() {
            if (!userPresetSelect) return;
            const presets = loadUserPresets();
            userPresetSelect.innerHTML = presets.length
                ? presets.map((preset, index) => `<option value="${index}">${escapeHtml(preset.name || `preset ${index + 1}`)}</option>`).join("")
                : `<option value="">no user presets</option>`;
            if (presetStatus) presetStatus.textContent = presets.length ? `${presets.length} saved presets` : "no saved presets yet";
        }

        function saveUserPreset() {
            const name = (presetNameInput?.value || "").trim() || `preset ${new Date().toLocaleDateString()}`;
            const payload = BratCore.buildPresetPayload
                ? BratCore.buildPresetPayload(buildProjectPayload(), name)
                : { type: "bratAnimatorPreset", version: PROJECT_VERSION, name, style: state.style, background: state.background };
            const presets = loadUserPresets().filter(preset => preset.name !== name);
            presets.unshift({ ...payload, savedAt: new Date().toISOString() });
            writeUserPresets(presets);
            if (presetNameInput) presetNameInput.value = name;
            if (presetStatus) presetStatus.textContent = `saved preset: ${name}`;
        }

        function applyUserPreset() {
            const presets = loadUserPresets();
            const index = Number(userPresetSelect?.value);
            const preset = presets[index];
            if (!preset) return;
            commitProjectChange("apply preset", () => {
                if (preset.exportSize && exportSizeSelect) exportSizeSelect.value = preset.exportSize;
                if (preset.exportFps && exportFpsSelect) exportFpsSelect.value = preset.exportFps;
                if (preset.formatPreset && formatPresetSelect) formatPresetSelect.value = preset.formatPreset;
                if (preset.animationMode) state.animationMode = preset.animationMode;
                if (preset.style) writeStyleControls({ ...state.style, ...preset.style }, state.animationMode);
                if (preset.background) {
                    state.background = { ...state.background, ...migrateProjectPayload({ background: preset.background }).background };
                    writeBackgroundControls(state.background);
                    restoreBackgroundMedia(state.background);
                }
                applyFormatPreset();
                renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
                saveProjectSettings();
            });
            if (presetStatus) presetStatus.textContent = `loaded preset: ${preset.name || "preset"}`;
        }

        function deleteUserPreset() {
            const index = Number(userPresetSelect?.value);
            const presets = loadUserPresets();
            if (!presets[index]) return;
            const [removed] = presets.splice(index, 1);
            writeUserPresets(presets);
            if (presetStatus) presetStatus.textContent = `deleted preset: ${removed.name || "preset"}`;
        }

        function exportUserPresets() {
            const presets = loadUserPresets();
            downloadBlob(new Blob([JSON.stringify({ type: "bratAnimatorPresetLibrary", version: PROJECT_VERSION, presets }, null, 2)], { type: "application/json" }), "brat-animator-presets.json");
            if (presetStatus) presetStatus.textContent = "preset library exported";
        }

        async function importUserPresetFile(file) {
            if (!file) return;
            try {
                const payload = JSON.parse(await file.text());
                const incoming = Array.isArray(payload) ? payload : Array.isArray(payload.presets) ? payload.presets : [payload];
                const valid = incoming.filter(preset => preset && typeof preset === "object");
                if (!valid.length) throw new Error("no presets");
                const existing = loadUserPresets();
                const merged = [...valid, ...existing].slice(0, 80);
                writeUserPresets(merged);
                if (presetStatus) presetStatus.textContent = `imported ${valid.length} preset${valid.length === 1 ? "" : "s"}`;
            } catch (error) {
                if (presetStatus) presetStatus.textContent = "preset import failed";
            } finally {
                if (importPresetInput) importPresetInput.value = "";
            }
        }

        function duplicateProjectSnapshot() {
            const base = (snapshotNameInput?.value || buildExportFileBase()).trim() || "brat-animator";
            if (snapshotNameInput) snapshotNameInput.value = `${base} copy`;
            saveSnapshot();
            setProjectFeatureStatus("duplicated current project as a snapshot");
        }

        function applyPreviewZoom() {
            state.previewZoom = clamp((Number(previewZoomInput?.value) || 100) / 100, 0.5, 1.4);
            if (stageWrap) stageWrap.style.setProperty("--preview-zoom", String(state.previewZoom));
            renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
        }

        function showTab(tabName) {
            document.querySelector(`[data-open-tab="${tabName}"]`)?.click();
        }

        const commandDefinitions = [
            { name: "preview from start", run: () => startBtn?.click() },
            { name: "export video", run: () => { showTab("export"); exportVideoBtn?.click(); } },
            { name: "save snapshot", run: () => saveSnapshotBtn?.click() },
            { name: "undo", run: undoProjectChange },
            { name: "redo", run: redoProjectChange },
            { name: "fullscreen preview", run: () => fullscreenBtn?.click() },
            { name: "play selected lyric", run: playSelectedRow },
            { name: "split selected lyric", run: splitSelectedRow },
            { name: "duplicate selected lyric", run: duplicateSelectedRow },
            { name: "clear background", run: () => commitProjectChange("clear background", clearBackgroundMedia) },
            { name: "open lyrics", run: () => showTab("lyrics") },
            { name: "open timing", run: () => showTab("timing") },
            { name: "open design", run: () => showTab("design") },
            { name: "open canvas", run: () => showTab("canvas") },
            { name: "open project", run: () => showTab("project") }
        ];

        function renderCommandPalette() {
            if (!commandPaletteList) return;
            const query = (commandPaletteInput?.value || "").trim().toLowerCase();
            const commands = commandDefinitions.filter(command => command.name.includes(query)).slice(0, 8);
            commandPaletteList.innerHTML = commands.map((command, index) => `
                <button type="button" data-command-index="${index}" ${index === 0 ? 'class="active"' : ""}>${escapeHtml(command.name)}</button>
            `).join("");
            commandPaletteList.querySelectorAll("button").forEach((button, localIndex) => {
                button.addEventListener("click", () => {
                    commands[localIndex]?.run();
                    closeCommandPalette();
                });
            });
        }

        function openCommandPalette() {
            if (!commandPalette) return;
            commandPalette.classList.remove("hidden");
            if (commandPaletteInput) commandPaletteInput.value = "";
            renderCommandPalette();
            window.setTimeout(() => commandPaletteInput?.focus({ preventScroll: true }), 20);
        }

        function closeCommandPalette() {
            commandPalette?.classList.add("hidden");
        }

        function copySelectedRowsToClipboard() {
            const rows = readRowsFromEditor();
            const selected = getSelectedRowIndexes();
            state.lrcClipboardRows = selected.map(index => rows[index]).filter(Boolean).map(row => ({ ...row }));
            if (state.lrcClipboardRows.length) copyText(state.lrcClipboardRows.map(row => `${secondsToTag(row.time)} ${row.text}`).join("\n"));
        }

        async function pasteRowsFromClipboard() {
            const rows = readRowsFromEditor();
            let incoming = state.lrcClipboardRows.map(row => ({ ...row }));
            try {
                const text = await navigator.clipboard?.readText?.();
                const parsed = text ? getLrcLineObjectsFromText(text) : [];
                if (parsed.length) incoming = parsed;
            } catch (_) {}
            if (!incoming.length) return;
            const insertAfter = Math.max(...getSelectedRowIndexes(), state.selectedLrcRowIndex, -1);
            const nextRows = rows.map(row => ({ ...row }));
            incoming.forEach((row, offset) => nextRows.splice(insertAfter + 1 + offset, 0, { ...row, time: row.time + 0.25 * (offset + 1) }));
            commitRowsChange("paste lyrics", nextRows, incoming.map((_, offset) => insertAfter + 1 + offset));
        }

        function getLrcLineObjectsFromText(text) {
            if (BratCore.lrcToRows) return BratCore.lrcToRows(text);
            const previous = lyricsInput.value;
            lyricsInput.value = text;
            const rows = getLrcLineObjects();
            lyricsInput.value = previous;
            return rows;
        }

        async function copyLrcText() {
            if (!lyricsInput.value.trim()) {
                meta.textContent = "nothing to copy yet";
                lyricsInput.focus();
                return;
            }
            const copied = await copyText(lyricsInput.value);
            meta.textContent = copied ? "LRC copied" : "copy failed";
        }

        function generateStarterLrc() {
            const starters = [
                ["late light on the kitchen tile", "you said the quiet part twice", "i kept the echo in my pocket", "now every room knows your name"],
                ["green screen glow on my face", "timer running out of frame", "words arrive a little crooked", "but the feeling lands the same"],
                ["train glass shaking in the rain", "your message sitting unread", "i count the seconds between stations", "and make a chorus in my head"],
                ["soft static under the door", "bass line taped to the wall", "i let the first line breathe longer", "then let the whole thing fall"]
            ];
            const picked = starters[Math.floor(Math.random() * starters.length)];
            const start = 1.2 + Math.random() * 1.4;
            lyricsInput.value = picked
                .map((line, index) => `${secondsToTag(start + index * (2.15 + index * 0.18))} ${line}`)
                .join("\n");
            rebuildTimelineFromCurrentInputs();
            updateMeta();
            renderLrcRows();
            renderTimeline();
            updateExportEstimate();
            saveProjectSettings();
            meta.textContent = "starter LRC generated";
        }

        function buildProjectPayload() {
            readStyleControls();
            getAudioSettingsFromControls();
            getBackgroundSettingsFromControls();
            return {
                version: PROJECT_VERSION,
                lyrics: lyricsInput.value,
                plainLyrics: plainLyricsInput?.value || "",
                query: searchQueryInput.value,
                useAudioTiming: useAudioTimingCheckbox.checked,
                startFromZero: startFromZeroCheckbox.checked,
                exportSize: exportSizeSelect.value,
                exportFps: exportFpsSelect.value,
                includeAudioInExport: includeAudioInExportCheckbox?.checked !== false,
                audio: state.audio,
                metadata: state.metadata,
                background: state.background,
                formatPreset: formatPresetSelect?.value || state.formatPreset,
                theme: state.theme,
                animationMode: state.animationMode,
                style: state.style,
                language: state.language || window.BratI18n?.getSavedLanguage?.() || "en"
            };
        }

        function exportPreviewFrames() {
            const dims = getExportDimensions();
            const duration = Math.max(getTimelineDuration(), 1);
            [0.15, 0.5, 0.85].forEach((ratio, index) => {
                const frameCanvas = document.createElement("canvas");
                frameCanvas.width = dims.width;
                frameCanvas.height = dims.height;
                const frameCtx = frameCanvas.getContext("2d", { alpha: false });
                drawScene(frameCtx, dims.width, dims.height, duration * ratio, { guides: false });
                frameCanvas.toBlob((blob) => {
                    if (blob) downloadBlob(blob, `${buildExportFileBase()}-frame-${index + 1}.png`);
                }, "image/png");
            });
            exportStatus.textContent = "3 preview frames exported";
        }

        async function exportPreviewClip() {
            if (typeof MediaRecorder === "undefined") {
                alert("WebM preview export requires MediaRecorder support.");
                return;
            }
            const dims = getExportDimensions();
            const fps = Math.min(Number(exportFpsSelect.value) || 30, 30);
            const duration = Math.min(5, Math.max(getTimelineDuration(), 1));
            const clipCanvas = document.createElement("canvas");
            clipCanvas.width = dims.width;
            clipCanvas.height = dims.height;
            const clipCtx = clipCanvas.getContext("2d", { alpha: false });
            const stream = clipCanvas.captureStream(fps);
            const chunks = [];
            const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm" });
            recorder.ondataavailable = event => event.data?.size && chunks.push(event.data);
            const done = new Promise(resolve => recorder.onstop = resolve);
            recorder.start();
            for (let frame = 0; frame <= duration * fps; frame += 1) {
                drawScene(clipCtx, dims.width, dims.height, frame / fps, { guides: false });
                await wait(1000 / fps);
            }
            recorder.stop();
            await done;
            stream.getTracks().forEach(track => track.stop());
            downloadBlob(new Blob(chunks, { type: "video/webm" }), `${buildExportFileBase()}-preview.webm`);
            exportStatus.textContent = "5s WebM preview exported";
        }

        function setExportProgress(percent, visible = true) {
            if (!exportProgress) return;
            exportProgress.hidden = !visible;
            exportProgress.value = clamp(Number(percent) || 0, 0, 100);
        }

        async function updateCompatibilityPanel() {
            if (!compatFastMp4 || !compatMediaRecorder || !compatRecommendation) return;

            const dims = getExportDimensions();
            const fps = Number(exportFpsSelect.value) || 30;
            const canRecord = typeof MediaRecorder !== "undefined";
            const includeAudio = shouldIncludeAudioInExport();
            let fastMp4 = false;

            if (!includeAudio) {
                try {
                    fastMp4 = await canUseFastMp4Export(dims.width, fps, dims.height) && await hasMp4MuxerModule();
                } catch (error) {
                    fastMp4 = false;
                }
            }

            compatFastMp4.textContent = includeAudio ? "disabled with audio" : (fastMp4 ? "supported" : "not supported");
            compatMediaRecorder.textContent = canRecord ? "supported" : "not supported";
            compatRecommendation.textContent = includeAudio
                ? `${dims.width}×${dims.height} · ${fps} fps · audio uses real-time export`
                : Math.max(dims.width, dims.height) >= 1920 || fps >= 60
                    ? `${dims.width}×${dims.height} works, but 1080 base · 30 fps is safer`
                    : `${dims.width}×${dims.height} · ${fps} fps`;
        }

        function saveProjectSettings() {
            try {
                const payload = buildProjectPayload();
                const raw = JSON.stringify(payload);
                localStorage.setItem("bratAnimator.project.v3", raw);
            } catch (error) {
                console.warn("autosave failed", error);
            }
        }

        function loadProjectSettings() {
            try {
                const raw = localStorage.getItem("bratAnimator.project.v3") || localStorage.getItem("bratAnimator.project.v2");
                return raw ? JSON.parse(raw) : null;
            } catch (error) {
                console.warn("restore failed", error);
                return null;
            }
        }

        function showRecoveryBanner() {
            recoveryBanner?.classList.remove("hidden");
        }

        function hideRecoveryBanner() {
            recoveryBanner?.classList.add("hidden");
        }

        function restoreProjectSettings(payload, options = {}) {
            if (!payload || typeof payload !== "object") return false;
            payload = migrateProjectPayload(payload);

            if (typeof payload.lyrics === "string") lyricsInput.value = payload.lyrics;
            if (plainLyricsInput && typeof payload.plainLyrics === "string") plainLyricsInput.value = payload.plainLyrics;
            if (typeof payload.query === "string") searchQueryInput.value = payload.query;
            if (typeof payload.useAudioTiming === "boolean") useAudioTimingCheckbox.checked = payload.useAudioTiming;
            if (typeof payload.startFromZero === "boolean") startFromZeroCheckbox.checked = payload.startFromZero;
            if (payload.exportSize) exportSizeSelect.value = payload.exportSize;
            if (payload.exportFps) exportFpsSelect.value = payload.exportFps;
            state.audio = payload.audio;
            writeAudioControls(payload.audio);
            if (audioUrlInput) audioUrlInput.value = payload.audio?.url || "";
            if (payload.audio?.source === "local" && payload.audio.assetId) {
                restoreAudioMedia(payload.audio).catch(() => updateAudioStatus("saved media reference could not be restored", true));
            }
            state.metadata = payload.metadata || state.metadata;
            state.background = payload.background || state.background;
            restoreBackgroundMedia(state.background);
            if (formatPresetSelect && payload.formatPreset) formatPresetSelect.value = payload.formatPreset;
            if (payload.animationMode) state.animationMode = payload.animationMode;
            if (payload.style && typeof payload.style === "object") state.style = { ...state.style, ...payload.style };
            writeStyleControls(state.style, state.animationMode);
            setTheme(payload.theme || "green");
            state.language = window.BratI18n?.applyLanguage?.(payload.language || window.BratI18n?.getSavedLanguage?.() || "en") || "en";
            rebuildTimelineFromCurrentInputs();
            renderLrcRows();
            applyFormatPreset();
            if (payload.audio?.source === "url" && payload.audio.url) {
                updateAudioStatus("URL media reference restored; click load media URL to decode it again.");
            }
            if (!options.skipHistory) updateUndoRedoState();
            return true;
        }

        function clearSavedProject() {
            localStorage.removeItem("bratAnimator.project.v2");
            localStorage.removeItem("bratAnimator.project.v3");
            lyricsInput.value = "";
            searchQueryInput.value = "";
            startFromZeroCheckbox.checked = false;
            useAudioTimingCheckbox.checked = true;
            exportSizeSelect.value = "1080";
            exportFpsSelect.value = "30";
            if (includeAudioInExportCheckbox) includeAudioInExportCheckbox.checked = true;
            if (formatPresetSelect) formatPresetSelect.value = "square";
            if (plainLyricsInput) plainLyricsInput.value = "";
            writeAudioControls({ includeInExport: true, volume: 1, fadeIn: 0, fadeOut: 0, source: "local", url: "", assetId: "", name: "", mediaKind: "audio" });
            if (audioUrlInput) audioUrlInput.value = "";
            writeStyleControls({
                bgColor: "#8ACE00",
                textColor: "#000000",
                fontFamily: "Arial Narrow, Arial, Helvetica Neue Condensed, sans-serif",
                fontScale: 1,
                blur: 1.05,
                verticalPosition: 0,
                stretch: 0.94,
                letterSpacing: 0,
                letterChunkSize: 2,
                lineSpacing: 0.92,
                wordAnimation: { mode: "progress", intensity: 0.7, color: "#ffffff" },
                safeZones: false
            }, "typewriter");
            state.audioBuffer = null;
            state.audioAnalysis = null;
            state.audioFileName = "";
            state.audioRemoteUrl = "";
            if (state.audioObjectUrl) URL.revokeObjectURL(state.audioObjectUrl);
            state.audioObjectUrl = "";
            clearSyncMediaSource();
            clearBackgroundMedia();
            syncExportAudioOption();
            setTheme("green");
            resetAll();
            updateAudioStatus(translateUi("noAudio", "no audio loaded"));
            updateMeta();
            updateExportEstimate();
            updateCompatibilityPanel();
            renderLrcRows();
            renderTimeline();
        }

        async function loadLrcFile(file) {
            if (!file) return;
            const text = await file.text();
            lyricsInput.value = text;
            rebuildTimelineFromCurrentInputs();
            updateMeta();
            updateExportEstimate();
            renderLrcRows();
            renderTimeline();
            saveProjectSettings();
        }

        async function processAudioFile(file) {
            if (!file) {
                state.audioBuffer = null;
                state.audioAnalysis = null;
                state.audioFileName = "";
                if (state.audioObjectUrl) URL.revokeObjectURL(state.audioObjectUrl);
                state.audioObjectUrl = "";
                state.audioRemoteUrl = "";
                state.audio = { ...state.audio, source: "local", url: "", assetId: "", name: "", mediaKind: "audio" };
                clearSyncMediaSource();
                updateAudioStatus(translateUi("noAudio", "no audio loaded"));
                syncExportAudioOption();
                rebuildTimelineFromCurrentInputs();
                updateMeta();
                updateExportEstimate();
                drawWaveform();
                renderTimeline();
                saveProjectSettings();
                return;
            }

            const mediaKind = inferAudioMediaKind(file.name, file.type);
            updateAudioStatus(mediaKind === "video" ? `extracting audio from ${file.name}...` : `decoding ${file.name}...`);

            try {
                const audioBuffer = await decodeUploadedAudio(file);
                const audioAnalysis = analyzeAudioEnergy(audioBuffer);
                const assetId = await storeMediaBlob(file, file.name, mediaKind);

                state.audioBuffer = audioBuffer;
                state.audioAnalysis = audioAnalysis;
                state.audioFileName = file.name;
                state.audioRemoteUrl = "";
                state.audio = { ...state.audio, source: "local", url: "", assetId, name: file.name, mediaKind };
                if (state.audioObjectUrl) URL.revokeObjectURL(state.audioObjectUrl);
                state.audioObjectUrl = URL.createObjectURL(file);
                setSyncMediaSource(state.audioObjectUrl, mediaKind);
                drawWaveform();

                updateAudioStatus(
                    `${file.name} - ${audioBuffer.duration.toFixed(2)}s - ${mediaReadyLabel(mediaKind)}`
                );

                syncExportAudioOption();
                rebuildTimelineFromCurrentInputs();
                updateMeta();
                updateExportEstimate();
                saveProjectSettings();
            } catch (error) {
                state.audioBuffer = null;
                state.audioAnalysis = null;
                state.audioFileName = "";
                updateAudioStatus(mediaDecodeFailureMessage(mediaKind), true);
                syncExportAudioOption();
                rebuildTimelineFromCurrentInputs();
                updateMeta();
                updateExportEstimate();
                drawWaveform();
            }
        }

        async function processAudioUrl(urlValue) {
            const url = String(urlValue || "").trim();
            if (!url) return;

            const youtubeVideoId = extractYouTubeVideoId(url);
            if (youtubeVideoId) {
                loadInvidiousPlayer(youtubeVideoId);
                updateAudioStatus("YouTube cannot be downloaded here. Use it as preview, then upload an audio/video file or paste a direct CORS-enabled media URL you can use.", true);
                document.querySelector('[data-open-tab="timing"]')?.click();
                return;
            }

            const guessedKind = inferAudioMediaKind(url);
            updateAudioStatus(`loading URL ${guessedKind}...`);

            try {
                const response = await fetch(url, { mode: "cors" });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const blob = await response.blob();
                const mediaKind = inferAudioMediaKind(url, blob.type || response.headers.get("content-type") || "");
                updateAudioStatus(mediaKind === "video" ? "extracting audio from URL media..." : "decoding URL audio...");

                const audioBuffer = await decodeUploadedAudio(blob);
                const audioAnalysis = analyzeAudioEnergy(audioBuffer);
                const name = mediaNameFromUrl(url);

                state.audioBuffer = audioBuffer;
                state.audioAnalysis = audioAnalysis;
                state.audioFileName = name;
                state.audioRemoteUrl = url;
                state.audio = { ...state.audio, source: "url", url, assetId: "", name, mediaKind };
                if (state.audioObjectUrl) URL.revokeObjectURL(state.audioObjectUrl);
                state.audioObjectUrl = URL.createObjectURL(blob);
                setSyncMediaSource(state.audioObjectUrl, mediaKind);
                drawWaveform();

                updateAudioStatus(
                    `${name} - ${audioBuffer.duration.toFixed(2)}s - ${mediaReadyLabel(mediaKind)}`
                );

                syncExportAudioOption();
                rebuildTimelineFromCurrentInputs();
                updateMeta();
                updateExportEstimate();
                saveProjectSettings();
            } catch (error) {
                console.warn("media URL failed", error);
                updateAudioStatus("media URL could not be loaded or decoded; check CORS, permissions, and browser support", true);
            }
        }

        async function restoreAudioMedia(audio = state.audio) {
            if (!audio || audio.source !== "local" || !audio.assetId) return false;
            const record = await loadMediaBlob(audio.assetId);
            if (!record?.blob) return false;
            const file = new File([record.blob], record.name || audio.name || "restored media", { type: record.blob.type || (record.kind === "video" ? "video/mp4" : "audio/mpeg") });
            await processAudioFile(file);
            updateAudioStatus(`${file.name} restored from this browser`);
            return true;
        }

        function setupDropZone(dropZone, acceptFn) {
            if (!dropZone) return;

            dropZone.addEventListener("click", () => acceptFn(null, true));

            dropZone.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    acceptFn(null, true);
                }
            });

            ["dragenter", "dragover"].forEach((eventName) => {
                dropZone.addEventListener(eventName, (event) => {
                    event.preventDefault();
                    dropZone.classList.add("drag-over");
                });
            });

            ["dragleave", "drop"].forEach((eventName) => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.remove("drag-over");
                });
            });

            dropZone.addEventListener("drop", (event) => {
                event.preventDefault();
                const file = event.dataTransfer?.files?.[0];
                acceptFn(file, false);
            });
        }

        function setupLanguageControls() {
            state.language = window.BratI18n?.applyLanguage?.(window.BratI18n?.getSavedLanguage?.() || "en") || "en";
            syncExportAudioOption();
            syncPlaybackButtonLabel();

            langButtons.forEach((button) => {
                button.addEventListener("click", () => {
                    state.language = window.BratI18n?.applyLanguage?.(button.dataset.lang) || button.dataset.lang || "en";
                    syncExportAudioOption();
                    syncPlaybackButtonLabel();
                    saveProjectSettings();
                });
            });
        }

        function registerServiceWorker() {
            if (!/^https?:$/.test(window.location.protocol)) return;
            if (!("serviceWorker" in navigator)) return;
            window.addEventListener("load", () => {
                navigator.serviceWorker.register("./sw.js").catch((error) => {
                    console.warn("service worker registration failed", error);
                });
            });
        }

async function updateExportEstimate() {
            updateCompatibilityPanel();
            const parsed = parseLRC(
                lyricsInput.value,
                startFromZeroCheckbox.checked,
                getActiveAudioAnalysis()
            );

            if (!parsed.length) {
                exportEstimate.textContent = "estimated export time: n/a";
                return;
            }

            const dims = getExportDimensions();
            const size = Math.max(dims.width, dims.height);
            const fps = Number(exportFpsSelect.value) || 30;
            const includeAudio = shouldIncludeAudioInExport();
            const baseDuration = Math.max(1, parsed[parsed.length - 1].displayEnd + 0.6);
            const duration = includeAudio ? Math.max(baseDuration, state.audioBuffer.duration || 0) : baseDuration;

            if (includeAudio) {
                const estimated = estimateExportSeconds(duration, size, fps, false);
                exportEstimate.textContent = `estimated export time: about ${formatClock(estimated)} - audio export records in real time (${formatClock(duration)})`;
                return;
            }

            if (await canUseFastMp4Export(dims.width, fps, dims.height) && await hasMp4MuxerModule()) {
                const estimated = estimateExportSeconds(duration, size, fps, true);
                exportEstimate.textContent = `estimated export time: about ${formatClock(estimated)} • fast export, no need to wait for the full lyric duration`;
                return;
            }

            const estimated = estimateExportSeconds(duration, size, fps, false);
            const minimum = Math.max(duration, 1);
            exportEstimate.textContent = `estimated export time: about ${formatClock(estimated)} • traditional fallback, browser can approach real duration (${formatClock(minimum)})`;
        }

        function setPlayerOpenState(isOpen) {
            document.body.classList.toggle("player-open", Boolean(isOpen));
        }

        async function exportVideo() {
            if (state.exportInProgress) return;

            const parsed = parseLRC(
                lyricsInput.value,
                startFromZeroCheckbox.checked,
                getActiveAudioAnalysis()
            );

            if (!lyricsInput.value.trim()) {
                alert("Paste LRC lyrics first.");
                return;
            }

            if (!parsed.length) {
                alert("Invalid format. Use [MM:SS.xx] text.");
                return;
            }

            const includeAudio = shouldIncludeAudioInExport();

            if (state.background?.kind !== "none" && state.backgroundExportSafe === false) {
                alert("The selected remote background is not CORS-enabled, so the browser cannot export it. Use a local upload or another permitted URL.");
                return;
            }

            if (includeAudio && typeof MediaRecorder === "undefined") {
                alert("Audio export requires MediaRecorder support in this browser.");
                return;
            }

            if (typeof MediaRecorder === "undefined" && !canAttemptFastExport()) {
                alert("This browser does not support video export.");
                return;
            }

            state.timeline = parsed;
            state.exportInProgress = true;
            setExportProgress(0, true);
            exportVideoBtn.disabled = true;
            exportPngBtn.disabled = true;

            const wasPlaying = state.isPlaying;
            const previousElapsed = getElapsedSeconds();
            stopPlayback(true);

            const dims = getExportDimensions();
            const size = Math.max(dims.width, dims.height);
            const fps = Number(exportFpsSelect.value) || 30;
            const baseDuration = Math.max(1, getTimelineDuration() + 0.6);
            const duration = includeAudio ? Math.max(baseDuration, state.audioBuffer.duration || 0) : baseDuration;
            const totalFrames = Math.ceil(duration * fps);
            const exportCanvas = document.createElement("canvas");
            exportCanvas.width = dims.width;
            exportCanvas.height = dims.height;
            const exportCtx = exportCanvas.getContext("2d", {
                alpha: false
            });

            const restoreUIState = () => {
                state.exportInProgress = false;
                exportVideoBtn.disabled = false;
                exportPngBtn.disabled = false;
                state.pausedElapsedSec = previousElapsed;
                renderPreviewAt(previousElapsed);
                window.setTimeout(() => setExportProgress(0, false), 800);

                if (wasPlaying) {
                    state.playStartMs = Date.now();
                    state.isPlaying = true;
                    syncPlaybackButtonLabel();
                    cancelAnimation();
                    state.animationFrame = requestAnimationFrame(animationTick);
                } else {
                    state.playStartMs = null;
                    state.isPlaying = false;
                    syncPlaybackButtonLabel();
                }
            };

            let activeAudioExport = null;

            try {
                if (!includeAudio && await canUseFastMp4Export(dims.width, fps, dims.height) && await hasMp4MuxerModule()) {
                    exportStatus.textContent = "preparing fast MP4 export...";
                    const {
                        Muxer,
                        ArrayBufferTarget
                    } = await loadMp4MuxerModule();
                    const bitrate = Math.max(4_500_000, Math.round(dims.width * dims.height * Math.max(24, fps) * 0.095));
                    const encoderConfig = {
                        codec: "avc1.42001f",
                        width: dims.width,
                        height: dims.height,
                        bitrate,
                        bitrateMode: "variable",
                        framerate: fps,
                        avc: {
                            format: "annexb"
                        }
                    };

                    const target = new ArrayBufferTarget();
                    const muxer = new Muxer({
                        target,
                        fastStart: "in-memory",
                        firstTimestampBehavior: "offset",
                        video: {
                            codec: "avc",
                            width: dims.width,
                            height: dims.height
                        }
                    });

                    const perfStart = performance.now();
                    let encodedFrames = 0;

                    const encoder = new VideoEncoder({
                        output: (chunk, meta) => {
                            muxer.addVideoChunk(chunk, meta);
                        },
                        error: (error) => {
                            throw error;
                        }
                    });

                    encoder.configure(encoderConfig);

                    for (let frameIndex = 0; frameIndex <= totalFrames; frameIndex += 1) {
                        const timeSec = Math.min(duration, frameIndex / fps);
                        drawScene(exportCtx, exportCanvas.width, exportCanvas.height, timeSec, { guides: false });

                        const frame = new VideoFrame(exportCanvas, {
                            timestamp: Math.round((frameIndex / fps) * 1_000_000),
                            duration: Math.round((1 / fps) * 1_000_000)
                        });

                        encoder.encode(frame, {
                            keyFrame: frameIndex === 0 || frameIndex % Math.max(fps * 2, 1) === 0
                        });
                        frame.close();
                        encodedFrames += 1;

                        if (frameIndex === 0 || frameIndex === totalFrames || frameIndex % Math.max(1, Math.floor(fps / 2)) === 0) {
                            const progress = totalFrames > 0 ? frameIndex / totalFrames : 1;
                            const elapsedRealSec = (performance.now() - perfStart) / 1000;
                            const remainingSec = progress > 0 ? Math.max(0, (elapsedRealSec / progress) - elapsedRealSec) : 0;
                            exportStatus.textContent = `fast MP4 export: ${Math.round(progress * 100)}% • estimated remaining ${formatClock(remainingSec)}`;
                            setExportProgress(progress * 100, true);
                            await wait(0);
                        }
                    }

                    await encoder.flush();
                    encoder.close();
                    muxer.finalize();

                    const buffer = target.buffer;
                    downloadBlob(new Blob([buffer], {
                        type: "video/mp4"
                    }), `${buildExportFileBase()}.mp4`);
                    exportStatus.textContent = "export complete: video-only MP4 generated with fast mode";
                    restoreUIState();
                    return;
                }

                if (typeof MediaRecorder === "undefined") {
                    throw new Error("no video encoder available in this browser");
                }

                exportStatus.textContent = "preparing fallback export...";
                const stream = exportCanvas.captureStream(fps);
                activeAudioExport = includeAudio ? await createAudioExportSource() : null;
                activeAudioExport?.stream.getAudioTracks().forEach(track => stream.addTrack(track));
                const chunks = [];
                let recorder;

                const videoMimeType = pickVideoMimeType(includeAudio);
                try {
                    recorder = videoMimeType ? new MediaRecorder(stream, {
                        mimeType: videoMimeType,
                        videoBitsPerSecond: 8_000_000,
                        audioBitsPerSecond: includeAudio ? 192_000 : undefined
                    }) : new MediaRecorder(stream);
                } catch (error) {
                    recorder = new MediaRecorder(stream);
                }

                const actualMimeType = recorder.mimeType || videoMimeType || "video/webm";
                const extension = actualMimeType.includes("mp4") ? "mp4" : "webm";

                recorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                const stopPromise = new Promise((resolve, reject) => {
                    recorder.onerror = () => reject(new Error("video recording failed"));
                    recorder.onstop = () => resolve();
                });

                recorder.start();
                await activeAudioExport?.start();
                exportStatus.textContent = `fallback export: ${extension.toUpperCase()} - ${fps} fps - ${includeAudio ? "with loaded audio" : "no audio"}`;
                const exportPerfStart = performance.now();

                for (let frameIndex = 0; frameIndex <= totalFrames; frameIndex += 1) {
                    const timeSec = Math.min(duration, frameIndex / fps);
                    drawScene(exportCtx, exportCanvas.width, exportCanvas.height, timeSec, { guides: false });

                    if (frameIndex === 0 || frameIndex === totalFrames || frameIndex % Math.max(1, Math.floor(fps / 2)) === 0) {
                        const progress = totalFrames > 0 ? frameIndex / totalFrames : 1;
                        if (progress > 0) {
                            const elapsedRealSec = (performance.now() - exportPerfStart) / 1000;
                            const remainingSec = Math.max(0, (elapsedRealSec / progress) - elapsedRealSec);
                            exportStatus.textContent = `fallback export: ${extension.toUpperCase()} • ${Math.round(progress * 100)}% • estimated remaining ${formatClock(remainingSec)}`;
                            setExportProgress(progress * 100, true);
                        }
                    }

                    await wait(1000 / fps);
                }

                await wait(120);
                recorder.stop();
                await stopPromise;
                stream.getTracks().forEach(track => track.stop());
                activeAudioExport?.stop();
                activeAudioExport = null;

                const blob = new Blob(chunks, {
                    type: actualMimeType || "video/webm"
                });
                const filename = `${buildExportFileBase()}.${extension}`;
                downloadBlob(blob, filename);

                exportStatus.textContent =
                    extension === "mp4" ?
                    `export complete: ${includeAudio ? "MP4 with loaded audio" : "video-only MP4"} generated with fallback mode` :
                    `export complete: browser generated ${includeAudio ? "WebM with loaded audio" : "video-only WebM fallback"}`;

                restoreUIState();
            } catch (error) {
                console.error(error);
                activeAudioExport?.stop();
                exportStatus.textContent = error?.message || "export failed";
                restoreUIState();
            }
        }

        function exportCurrentFramePng() {
            const dims = getExportDimensions();
            const frameCanvas = document.createElement("canvas");
            frameCanvas.width = dims.width;
            frameCanvas.height = dims.height;
            const frameCtx = frameCanvas.getContext("2d", {
                alpha: false
            });
            const timeSec = state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec;

            drawScene(frameCtx, frameCanvas.width, frameCanvas.height, timeSec, { guides: false });

            frameCanvas.toBlob((blob) => {
                if (!blob) return;
                downloadBlob(blob, `${buildExportFileBase()}.png`);
                exportStatus.textContent = "PNG frame exported";
            }, "image/png");
        }

        togglePanelBtn.addEventListener("click", () => {
            panel.classList.toggle("hidden");
            syncPanelState();
        });

        loadDemoBtn.addEventListener("click", () => {
            lyricsInput.value = demoLyrics;
            updateMeta();
            rebuildTimelineFromCurrentInputs();
            renderLrcRows();
            renderTimeline();
            updateExportEstimate();
            searchQueryInput.value = "charli xcx guess";
            searchStatus.textContent = "demo loaded";
            saveProjectSettings();
            renderPreviewAt(0);
        });

        clearResultsBtn.addEventListener("click", clearSearchResults);
        searchSongBtn.addEventListener("click", runSongSearch);

        searchQueryInput.addEventListener("input", saveProjectSettings);
        searchQueryInput.addEventListener("paste", () => {
            window.setTimeout(() => {
                const pastedValue = searchQueryInput.value.trim();
                if (extractYouTubeVideoId(pastedValue)) runSongSearch();
            }, 0);
        });

        searchQueryInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                runSongSearch();
            }
        });

        audioFileInput.addEventListener("change", async () => {
            await processAudioFile(audioFileInput.files?.[0] || null);
        });
        loadAudioUrlBtn?.addEventListener("click", () => processAudioUrl(audioUrlInput?.value || ""));
        audioUrlInput?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                processAudioUrl(audioUrlInput.value);
            }
        });
        audioUrlInput?.addEventListener("input", () => {
            const nextUrl = audioUrlInput.value.trim();
            state.audio = { ...state.audio, source: "url", url: nextUrl, mediaKind: inferAudioMediaKind(nextUrl, state.audio?.name || "") };
            saveProjectSettings();
        });

        lyricsInput.addEventListener("input", () => {
            rebuildTimelineFromCurrentInputs();
            updateMeta();
            updateExportEstimate();
            renderLrcRows();
            renderTimeline();
            saveProjectSettings();
        });

        useAudioTimingCheckbox.addEventListener("change", () => {
            rebuildTimelineFromCurrentInputs();
            updateMeta();
            updateExportEstimate();
            saveProjectSettings();
        });

        startFromZeroCheckbox.addEventListener("change", () => {
            rebuildTimelineFromCurrentInputs();
            updateMeta();
            updateExportEstimate();
            saveProjectSettings();
        });

        startBtn.addEventListener("click", () => {
            const parsed = parseLRC(
                lyricsInput.value,
                startFromZeroCheckbox.checked,
                getActiveAudioAnalysis()
            );

            if (!lyricsInput.value.trim()) {
                alert("Paste LRC lyrics first.");
                return;
            }

            if (!parsed.length) {
                alert("Invalid format. Use [MM:SS.xx] text.");
                return;
            }

            state.timeline = parsed;
            startFromBeginning();
        });

        playPauseBtn.addEventListener("click", () => {
            if (!state.timeline.length) return;

            if (state.isPlaying) {
                stopPlayback(true);
                return;
            }

            state.playStartMs = Date.now();
            state.isPlaying = true;
            syncPlaybackButtonLabel();
            cancelAnimation();
            state.animationFrame = requestAnimationFrame(animationTick);
        });

        restartBtn.addEventListener("click", () => {
            rebuildTimelineFromCurrentInputs();
            startFromBeginning();
        });

        resetBtn.addEventListener("click", resetAll);

        closePlayerBtn.addEventListener("click", () => {
            playerWrap.classList.add("hidden");
            setPlayerOpenState(false);
            playerBox.innerHTML = "";
        });

        playerBox?.addEventListener("click", (event) => {
            const addMediaButton = event.target.closest?.(".yt-add-media-btn");
            if (!addMediaButton) return;
            document.querySelector('[data-open-tab="timing"]')?.click();
            audioFileInput?.click();
        });

        bgBtn.addEventListener("click", () => setTheme("green"));
        darkBtn.addEventListener("click", () => setTheme("dark"));

        exportVideoBtn.addEventListener("click", exportVideo);
        exportPngBtn.addEventListener("click", exportCurrentFramePng);
        exportSizeSelect.addEventListener("change", () => {
            updateExportEstimate();
            updateCompatibilityPanel();
            saveProjectSettings();
        });
        exportFpsSelect.addEventListener("change", () => {
            updateExportEstimate();
            updateCompatibilityPanel();
            saveProjectSettings();
        });
        includeAudioInExportCheckbox?.addEventListener("change", () => {
            syncExportAudioOption();
            updateExportEstimate();
            updateCompatibilityPanel();
            saveProjectSettings();
        });
        [exportAudioVolumeInput, exportAudioFadeInInput, exportAudioFadeOutInput].forEach((control) => {
            control?.addEventListener("input", () => {
                getAudioSettingsFromControls();
                updateExportEstimate();
                saveProjectSettings();
            });
        });

        formatPresetSelect?.addEventListener("change", applyFormatPreset);
        themePresetSelect?.addEventListener("change", () => applyStylePreset(themePresetSelect.value));
        [animationModeSelect, lyricsDisplayModeSelect, musicAlignSelect, wordHighlightCheckbox, musicActiveScaleInput, musicDimOpacityInput, musicScrollPositionInput, wordAnimationModeSelect, wordAnimationIntensityInput, wordAnimationColorInput, beautifulDynamicBgCheckbox, beautifulSideVocalsCheckbox, beautifulMotionInput, beautifulDepthInput, beautifulGlowInput, beautifulEdgeFadeInput, bgColorInput, textColorInput, fontFamilySelect, fontScaleInput, blurInput, verticalPositionInput, stretchInput, letterSpacingInput, letterChunkSizeInput, lineSpacingInput, safeZonesCheckbox].forEach((control) => {
            control?.addEventListener("input", () => {
                if (themePresetSelect && [bgColorInput, textColorInput, fontFamilySelect, fontScaleInput, blurInput, verticalPositionInput, stretchInput, letterSpacingInput, letterChunkSizeInput, lineSpacingInput].includes(control)) {
                    themePresetSelect.value = "custom";
                }
                readStyleControls();
                renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
                saveProjectSettings();
            });
            control?.addEventListener("change", () => {
                readStyleControls();
                renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
                saveProjectSettings();
            });
        });
        randomStyleBtn?.addEventListener("click", randomizeStyle);
        backgroundFileInput?.addEventListener("change", () => loadBackgroundFile(backgroundFileInput.files?.[0]));
        loadBackgroundUrlBtn?.addEventListener("click", () => loadBackgroundUrl(backgroundUrlInput?.value || ""));
        backgroundUrlInput?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                loadBackgroundUrl(backgroundUrlInput.value);
            }
        });
        clearBackgroundBtn?.addEventListener("click", () => commitProjectChange("clear background", clearBackgroundMedia));
        useArtworkBgBtn?.addEventListener("click", useArtworkAsBackground);
        [bgMediaOpacityInput, bgMediaBlurInput, bgMediaBrightnessInput, bgMediaSaturationInput, bgMediaScaleInput, bgMediaPositionXInput, bgMediaPositionYInput].forEach((control) => {
            control?.addEventListener("input", () => {
                getBackgroundSettingsFromControls();
                updateBackgroundStatus();
                renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
                saveProjectSettings();
            });
        });
        savePresetBtn?.addEventListener("click", saveUserPreset);
        loadPresetBtn?.addEventListener("click", applyUserPreset);
        deletePresetBtn?.addEventListener("click", deleteUserPreset);
        exportPresetBtn?.addEventListener("click", exportUserPresets);
        importPresetInput?.addEventListener("change", () => importUserPresetFile(importPresetInput.files?.[0]));
        previewZoomInput?.addEventListener("input", applyPreviewZoom);
        fullscreenBtn?.addEventListener("click", () => {
            document.getElementById("stage")?.requestFullscreen?.().catch(() => {});
        });

        undoBtn?.addEventListener("click", undoProjectChange);
        redoBtn?.addEventListener("click", redoProjectChange);
        lrcSearchInput?.addEventListener("input", renderLrcRows);
        refreshEditorBtn?.addEventListener("click", renderLrcRows);
        applyEditorBtn?.addEventListener("click", applyEditorRowsToTextarea);
        addLrcRowBtn?.addEventListener("click", () => {
            const rows = getLrcLineObjects();
            rows.push({ time: rows.at(-1)?.time != null ? rows.at(-1).time + 2 : 0, text: "new lyric line" });
            state.selectedLrcRowIndex = rows.length - 1;
            commitRowsChange("add lyric", rows, [rows.length - 1]);
        });
        syncCurrentRowBtn?.addEventListener("click", () => {
            const rows = readRowsFromEditor();
            const idx = clamp(state.selectedLrcRowIndex, 0, Math.max(0, rows.length - 1));
            if (!rows[idx]) return;
            rows[idx].time = state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec;
            commitRowsChange("sync lyric", rows, [idx]);
        });
        splitLrcRowBtn?.addEventListener("click", splitSelectedRow);
        mergeLrcRowBtn?.addEventListener("click", mergeSelectedRow);
        moveLrcUpBtn?.addEventListener("click", () => moveSelectedRow(-1));
        moveLrcDownBtn?.addEventListener("click", () => moveSelectedRow(1));
        duplicateLrcRowBtn?.addEventListener("click", duplicateSelectedRow);
        playSelectedRowBtn?.addEventListener("click", playSelectedRow);
        cleanLrcBtn?.addEventListener("click", cleanLrc);
        normalizeLrcBtn?.addEventListener("click", normalizeLrc);
        shiftBackBtn?.addEventListener("click", () => shiftLrc(-0.5));
        shiftForwardBtn?.addEventListener("click", () => shiftLrc(0.5));
        shiftSelectedBackBtn?.addEventListener("click", () => shiftSelectedRows(-0.25));
        shiftSelectedForwardBtn?.addEventListener("click", () => shiftSelectedRows(0.25));
        shiftAllByInputBtn?.addEventListener("click", () => shiftLrc(Number(timingOffsetInput?.value) || 0));
        copyLrcBtn?.addEventListener("click", copyLrcText);
        starterLrcBtn?.addEventListener("click", generateStarterLrc);

        startTapSyncBtn?.addEventListener("click", startTapSync);
        tapNextLineBtn?.addEventListener("click", tapNextLine);
        finishTapSyncBtn?.addEventListener("click", finishTapSync);
        waveformCanvas?.addEventListener("click", (event) => {
            const rect = waveformCanvas.getBoundingClientRect();
            const duration = state.audioAnalysis?.duration || getTimelineDuration() || 1;
            seekTo(((event.clientX - rect.left) / rect.width) * duration);
        });
        waveformCanvas?.addEventListener("pointerdown", (event) => {
            const duration = state.audioAnalysis?.duration || getTimelineDuration() || 1;
            beginTimingPointer(event, waveformCanvas, duration);
        });
        waveformCanvas?.addEventListener("pointermove", (event) => {
            const duration = state.audioAnalysis?.duration || getTimelineDuration() || 1;
            updateTimingPointer(event, waveformCanvas, duration);
        });
        waveformCanvas?.addEventListener("pointerup", (event) => finishTimingPointer(event, waveformCanvas));
        waveformCanvas?.addEventListener("pointercancel", (event) => finishTimingPointer(event, waveformCanvas));
        timelineCanvas?.addEventListener("click", (event) => {
            const rect = timelineCanvas.getBoundingClientRect();
            const duration = getTimelineDuration() || 1;
            seekTo(((event.clientX - rect.left) / rect.width) * duration);
        });
        timelineCanvas?.addEventListener("pointerdown", (event) => {
            const duration = getTimelineDuration() || 1;
            beginTimingPointer(event, timelineCanvas, duration);
        });
        timelineCanvas?.addEventListener("pointermove", (event) => {
            const duration = getTimelineDuration() || 1;
            updateTimingPointer(event, timelineCanvas, duration);
        });
        timelineCanvas?.addEventListener("pointerup", (event) => finishTimingPointer(event, timelineCanvas));
        timelineCanvas?.addEventListener("pointercancel", (event) => finishTimingPointer(event, timelineCanvas));

        exportFramesBtn?.addEventListener("click", exportPreviewFrames);
        exportPreviewClipBtn?.addEventListener("click", exportPreviewClip);
        exportProjectBtn?.addEventListener("click", exportProjectJson);
        importProjectInput?.addEventListener("change", () => importProjectJson(importProjectInput.files?.[0]));
        saveSnapshotBtn?.addEventListener("click", saveSnapshot);
        duplicateProjectBtn?.addEventListener("click", duplicateProjectSnapshot);
        shareProjectLinkBtn?.addEventListener("click", copyProjectLink);
        copyProjectJsonBtn?.addEventListener("click", copyProjectJson);
        commandPaletteInput?.addEventListener("input", renderCommandPalette);
        commandPaletteInput?.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeCommandPalette();
                return;
            }
            if (event.key === "Enter") {
                event.preventDefault();
                const first = commandPaletteList?.querySelector("button");
                first?.click();
            }
        });
        commandPalette?.addEventListener("click", (event) => {
            if (event.target === commandPalette) closeCommandPalette();
        });

        document.addEventListener("keydown", (event) => {
            if (document.body.classList.contains("permission-notice-open")) return;
            if (commandPalette && !commandPalette.classList.contains("hidden") && event.key === "Escape") {
                event.preventDefault();
                closeCommandPalette();
                return;
            }

            const target = event.target;
            const isTyping = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
            if (isTyping && event.code !== "Space") return;
            if (event.code === "Space" && state.tapSync.active) {
                event.preventDefault();
                tapNextLine();
                return;
            }
            if (isTyping) return;
            const shortcutKey = event.key?.toLowerCase();
            if (event.ctrlKey || event.metaKey) {
                if (shortcutKey === "k") {
                    event.preventDefault();
                    openCommandPalette();
                    return;
                }
                if (shortcutKey === "s") {
                    event.preventDefault();
                    saveSnapshotBtn?.click();
                    return;
                }
                if (shortcutKey === "z") {
                    event.preventDefault();
                    undoProjectChange();
                    return;
                }
                if (shortcutKey === "y") {
                    event.preventDefault();
                    redoProjectChange();
                    return;
                }
                if (shortcutKey === "d") {
                    event.preventDefault();
                    duplicateSelectedRow();
                    return;
                }
                if (shortcutKey === "c") {
                    event.preventDefault();
                    copySelectedRowsToClipboard();
                    return;
                }
                if (shortcutKey === "v") {
                    event.preventDefault();
                    pasteRowsFromClipboard();
                    return;
                }
            }
            if (event.code === "Space") { event.preventDefault(); playPauseBtn.click(); }
            if (event.key?.toLowerCase() === "r") restartBtn.click();
            if (event.key?.toLowerCase() === "e") exportVideoBtn.click();
            if (event.key?.toLowerCase() === "f") fullscreenBtn?.click();
            if (event.key === "ArrowLeft") seekTo((state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec) - 1);
            if (event.key === "ArrowRight") seekTo((state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec) + 1);
        });

        setupLanguageControls();
        setupDropZone(lrcDropZone, (file, openPicker) => {
            if (openPicker) {
                const picker = document.createElement("input");
                picker.type = "file";
                picker.accept = ".lrc,text/plain";
                picker.addEventListener("change", () => loadLrcFile(picker.files?.[0]));
                picker.click();
                return;
            }
            loadLrcFile(file);
        });
        setupDropZone(audioDropZone, (file, openPicker) => {
            if (openPicker) {
                audioFileInput.click();
                return;
            }
            processAudioFile(file);
        });

        clearSavedBtn?.addEventListener("click", clearSavedProject);
        recoveryKeepBtn?.addEventListener("click", hideRecoveryBanner);
        recoveryDiscardBtn?.addEventListener("click", () => {
            clearSavedProject();
            hideRecoveryBanner();
        });
        bgBtn.addEventListener("click", saveProjectSettings);
        darkBtn.addEventListener("click", saveProjectSettings);

        syncPanelState();
        syncPlaybackButtonLabel();
        const sharedProject = getHashProjectPayload();
        const autosavedProject = sharedProject ? null : loadProjectSettings();
        const restored = restoreProjectSettings(sharedProject || autosavedProject);
        if (sharedProject) setProjectFeatureStatus("shared project loaded");
        if (autosavedProject && restored) showRecoveryBanner();
        updateAudioStatus(translateUi("noAudio", "no audio loaded"));
        if (!restored) {
            setTheme("green");
        }
        renderLrcRows();
        renderUserPresets();
        renderSnapshots();
        applyFormatPreset();
        applyPreviewZoom();
        syncExportAudioOption();
        updateUndoRedoState();
        updateBackgroundStatus();
        updateMeta();
        updateExportEstimate();
        updateCompatibilityPanel();
        window.addEventListener("beforeunload", () => {
            if (state.audioObjectUrl) URL.revokeObjectURL(state.audioObjectUrl);
            releaseBackgroundObjectUrl();
        });
        registerServiceWorker();
        renderPreviewAt(0);
/* --- Sidebar editor navigation upgrade --- */
(function setupEditorSidebarUpgrade() {
    const tabs = Array.from(document.querySelectorAll('.editor-tab'));
    const sections = Array.from(document.querySelectorAll('.editor-section'));
    const dockPreviewBtn = document.getElementById('dockPreviewBtn');
    const dockExportBtn = document.getElementById('dockExportBtn');
    const sidebarExportProjectBtn = document.getElementById('sidebarExportProjectBtn');
    const sidebarClearSavedBtn = document.getElementById('sidebarClearSavedBtn');
    const autosaveBadge = document.getElementById('autosaveBadge');
    const statusDuration = document.getElementById('statusDuration');
    const statusFormat = document.getElementById('statusFormat');
    const statusFps = document.getElementById('statusFps');
    const statusLines = document.getElementById('statusLines');
    const canvasFormatSummary = document.getElementById('canvasFormatSummary');
    const canvasSafeSummary = document.getElementById('canvasSafeSummary');
    const canvasFullscreenBtn = document.getElementById('canvasFullscreenBtn');
    const canvasSafeToggleBtn = document.getElementById('canvasSafeToggleBtn');
    const quickPresetButtons = Array.from(document.querySelectorAll('[data-preset-quick]'));
    const tutorialBtn = document.getElementById('tutorialBtn');
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    const tutorialProgress = document.getElementById('tutorialProgress');
    const tutorialTitle = document.getElementById('tutorialTitle');
    const tutorialBody = document.getElementById('tutorialBody');
    const tutorialTip = document.getElementById('tutorialTip');
    const tutorialSkipBtn = document.getElementById('tutorialSkipBtn');
    const tutorialBackBtn = document.getElementById('tutorialBackBtn');
    const tutorialNextBtn = document.getElementById('tutorialNextBtn');
    const tutorialActionBtn = document.getElementById('tutorialActionBtn');
    const TUTORIAL_STORAGE_KEY = 'bratAnimator.tutorial.seen.v1';
    const permissionNotice = document.getElementById('permissionNotice');
    const permissionNoticeAckBtn = document.getElementById('permissionNoticeAckBtn');
    const permissionNoticeRequestLink = document.getElementById('permissionNoticeRequestLink');
    const PERMISSION_NOTICE_SESSION_KEY = 'bratAnimator.permissionNotice.dismissed.v1';

    const tutorialSteps = [
        {
            title: 'start with the preview',
            body: 'The canvas is the video you will export. Every lyric, timing, style, and format change updates this preview.',
            target: '.stage-wrap',
            placement: 'bottom',
            tip: 'Use the controls panel for editing. Collapse it when you want a larger preview.'
        },
        {
            title: 'find lyrics',
            body: 'Search by artist and title. Results from LRCLIB can fill the project without leaving the browser.',
            tab: 'lyrics',
            target: '#searchQueryInput',
            tip: 'You can also skip search and paste your own LRC in the Timing tab.'
        },
        {
            title: 'add timed lines',
            body: 'LRC lines need timestamps like [00:01.20]. Use starter LRC for a quick working example, then edit the rows.',
            tab: 'timing',
            target: '#starterLrcBtn',
            actionLabel: 'generate starter',
            action() {
                starterLrcBtn?.click();
            }
        },
        {
            title: 'adjust the look',
            body: 'Choose a preset, animation mode, colors, and typography. Keep checking the canvas as you tune it.',
            tab: 'design',
            target: '#themePresetSelect'
        },
        {
            title: 'choose the format',
            body: 'Pick square, vertical, landscape, or cover output before exporting. Safe zones help with social layouts.',
            tab: 'canvas',
            target: '[data-preset-quick="vertical"]',
            tip: 'The Export tab still controls final size and FPS.'
        },
        {
            title: 'export or save',
            body: 'Export the video, save a project snapshot, or copy a share link so you can return to the edit later.',
            tab: 'export',
            target: '#exportVideoBtn',
            tip: 'Audio can be embedded only from a local upload or a direct CORS-enabled URL you have permission to use.'
        }
    ];

    let tutorialIndex = 0;
    let tutorialActive = false;

    function openEditorTab(tabName) {
        let activeTab = null;
        let activeSection = null;

        tabs.forEach((tab) => {
            const isActive = tab.dataset.openTab === tabName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
            if (isActive) activeTab = tab;
        });

        sections.forEach((section) => {
            const isActive = section.dataset.editorTab === tabName;
            section.classList.toggle('active', isActive);
            section.toggleAttribute('hidden', !isActive);
            section.setAttribute('aria-hidden', String(!isActive));
            if (isActive) activeSection = section;
        });

        if (window.matchMedia('(max-width: 700px)').matches) {
            activeTab?.scrollIntoView({
                block: 'nearest',
                inline: 'center',
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });
            if (activeSection) activeSection.scrollTop = 0;
        }

        try {
            localStorage.setItem('bratAnimator.activeSidebarTab', tabName);
        } catch (_) {}
    }

    function clearTutorialFocus() {
        document.querySelectorAll('.tutorial-focus').forEach((node) => {
            node.classList.remove('tutorial-focus');
            node.removeAttribute('data-tutorial-active');
        });
    }

    function getTutorialTarget(selector) {
        if (!selector) return null;
        return document.querySelector(selector);
    }

    function setTutorialSeen() {
        try {
            localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
        } catch (_) {}
    }

    function hasSeenTutorial() {
        try {
            return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
        } catch (_) {
            return true;
        }
    }

    function setPermissionNoticeDismissed() {
        try {
            sessionStorage.setItem(PERMISSION_NOTICE_SESSION_KEY, 'true');
        } catch (_) {}
    }

    function hasDismissedPermissionNotice() {
        try {
            return sessionStorage.getItem(PERMISSION_NOTICE_SESSION_KEY) === 'true';
        } catch (_) {
            return false;
        }
    }

    function shouldAutoStartTutorial() {
        return !hasSeenTutorial() && !window.location.hash.startsWith('#project=');
    }

    function scheduleTutorial(delay = 900) {
        if (shouldAutoStartTutorial()) {
            window.setTimeout(() => startTutorial(0), delay);
        }
    }

    function closePermissionNotice() {
        permissionNotice?.classList.add('hidden');
        document.body.classList.remove('permission-notice-open');
        setPermissionNoticeDismissed();
        scheduleTutorial(420);
    }

    function showPermissionNotice() {
        if (!permissionNotice || hasDismissedPermissionNotice()) return false;

        permissionNotice.classList.remove('hidden');
        document.body.classList.add('permission-notice-open');
        window.setTimeout(() => permissionNoticeAckBtn?.focus({ preventScroll: true }), 40);
        return true;
    }

    function trapPermissionNoticeFocus(event) {
        if (!permissionNotice || permissionNotice.classList.contains('hidden') || event.key !== 'Tab') return;

        const focusable = Array.from(permissionNotice.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function closeTutorial(markSeen = true) {
        tutorialActive = false;
        tutorialOverlay?.classList.add('hidden');
        document.body.classList.remove('tutorial-open');
        clearTutorialFocus();
        if (markSeen) setTutorialSeen();
        tutorialBtn?.focus();
    }

    function renderTutorialStep() {
        if (!tutorialOverlay || !tutorialTitle || !tutorialBody) return;

        const step = tutorialSteps[tutorialIndex];
        if (!step) return;

        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            syncPanelState();
        }

        if (step.tab) openEditorTab(step.tab);

        tutorialProgress.textContent = `step ${tutorialIndex + 1} of ${tutorialSteps.length}`;
        tutorialOverlay.dataset.placement = step.placement || 'top';
        tutorialTitle.textContent = step.title;
        tutorialBody.textContent = step.body;

        if (step.tip) {
            tutorialTip.hidden = false;
            tutorialTip.textContent = step.tip;
        } else {
            tutorialTip.hidden = true;
            tutorialTip.textContent = '';
        }

        tutorialBackBtn.disabled = tutorialIndex === 0;
        tutorialNextBtn.textContent = tutorialIndex === tutorialSteps.length - 1 ? 'finish' : 'next';

        if (step.actionLabel && typeof step.action === 'function') {
            tutorialActionBtn.classList.remove('hidden');
            tutorialActionBtn.textContent = step.actionLabel;
            tutorialActionBtn.onclick = () => {
                step.action();
                renderTutorialStep();
            };
        } else {
            tutorialActionBtn.classList.add('hidden');
            tutorialActionBtn.onclick = null;
        }

        clearTutorialFocus();

        window.setTimeout(() => {
            const target = getTutorialTarget(step.target);
            if (!target) return;
            target.classList.add('tutorial-focus');
            target.setAttribute('data-tutorial-active', 'true');
            target.scrollIntoView({
                block: 'nearest',
                inline: 'center',
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });
        }, 80);
    }

    function startTutorial(startIndex = 0) {
        tutorialActive = true;
        tutorialIndex = clamp(startIndex, 0, tutorialSteps.length - 1);
        tutorialOverlay?.classList.remove('hidden');
        document.body.classList.add('tutorial-open');
        renderTutorialStep();
        tutorialNextBtn?.focus();
    }

    function goToNextTutorialStep() {
        if (tutorialIndex >= tutorialSteps.length - 1) {
            closeTutorial(true);
            return;
        }

        tutorialIndex += 1;
        renderTutorialStep();
    }

    function goToPreviousTutorialStep() {
        if (tutorialIndex <= 0) return;
        tutorialIndex -= 1;
        renderTutorialStep();
    }

    function getSidebarDimensionsLabel() {
        const dims = getExportDimensions();
        return `${dims.width}×${dims.height}`;
    }

    function updateSidebarStatus() {
        const duration = getTimelineDuration();
        const lineCount = state.timeline.length || parseLRC(
            lyricsInput.value,
            startFromZeroCheckbox.checked,
            getActiveAudioAnalysis()
        ).length;
        const dimsLabel = getSidebarDimensionsLabel();

        if (statusDuration) statusDuration.textContent = `${duration.toFixed(2)}s`;
        if (statusFormat) statusFormat.textContent = dimsLabel;
        if (statusFps) statusFps.textContent = `${exportFpsSelect?.value || 30}`;
        if (statusLines) statusLines.textContent = String(lineCount);
        if (canvasFormatSummary) canvasFormatSummary.textContent = dimsLabel;
        if (canvasSafeSummary) canvasSafeSummary.textContent = safeZonesCheckbox?.checked ? 'on' : 'off';
    }

    function flashAutosaveBadge(label = 'autosaved') {
        if (!autosaveBadge) return;
        autosaveBadge.textContent = label;
        autosaveBadge.classList.add('flash');
        window.setTimeout(() => autosaveBadge.classList.remove('flash'), 420);
    }

    const originalUpdateMeta = updateMeta;
    updateMeta = function patchedUpdateMeta() {
        originalUpdateMeta();
        updateSidebarStatus();
    };

    const originalApplyFormatPreset = applyFormatPreset;
    applyFormatPreset = function patchedApplyFormatPreset() {
        originalApplyFormatPreset();
        updateSidebarStatus();
    };

    const originalReadStyleControls = readStyleControls;
    readStyleControls = function patchedReadStyleControls() {
        originalReadStyleControls();
        updateSidebarStatus();
    };

    const originalSaveProjectSettings = saveProjectSettings;
    saveProjectSettings = function patchedSaveProjectSettings() {
        originalSaveProjectSettings();
        updateSidebarStatus();
        flashAutosaveBadge('autosaved');
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => openEditorTab(tab.dataset.openTab));
    });

    tutorialBtn?.addEventListener('click', () => startTutorial(0));
    tutorialSkipBtn?.addEventListener('click', () => closeTutorial(true));
    tutorialBackBtn?.addEventListener('click', goToPreviousTutorialStep);
    tutorialNextBtn?.addEventListener('click', goToNextTutorialStep);
    permissionNoticeAckBtn?.addEventListener('click', closePermissionNotice);
    permissionNoticeRequestLink?.addEventListener('click', closePermissionNotice);

    document.addEventListener('keydown', (event) => {
        if (permissionNotice && !permissionNotice.classList.contains('hidden')) {
            if (event.key === 'Escape') {
                event.preventDefault();
                closePermissionNotice();
                return;
            }

            trapPermissionNoticeFocus(event);
            return;
        }

        if (!tutorialActive) return;
        if (event.key === 'Escape') closeTutorial(true);
        if (event.key === 'ArrowRight' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) {
            goToNextTutorialStep();
        }
        if (event.key === 'ArrowLeft' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) {
            goToPreviousTutorialStep();
        }
    });

    dockPreviewBtn?.addEventListener('click', () => {
        openEditorTab('timing');
        const parsed = parseLRC(
            lyricsInput.value,
            startFromZeroCheckbox.checked,
            getActiveAudioAnalysis()
        );

        if (!lyricsInput.value.trim()) {
            meta.textContent = 'paste or load LRC lyrics to preview';
            lyricsInput.focus();
            return;
        }

        if (!parsed.length) {
            meta.textContent = 'use [MM:SS.xx] timestamps before previewing';
            lyricsInput.focus();
            return;
        }

        state.timeline = parsed;
        startFromBeginning();
    });

    dockExportBtn?.addEventListener('click', () => {
        if (!lyricsInput.value.trim()) {
            openEditorTab('timing');
            meta.textContent = 'paste or load LRC lyrics before exporting';
            lyricsInput.focus();
            return;
        }

        openEditorTab('export');
        exportVideoBtn.click();
    });

    sidebarExportProjectBtn?.addEventListener('click', () => exportProjectBtn?.click());
    sidebarClearSavedBtn?.addEventListener('click', () => clearSavedBtn?.click());

    quickPresetButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (!formatPresetSelect) return;
            formatPresetSelect.value = button.dataset.presetQuick || 'square';
            applyFormatPreset();
            updateSidebarStatus();
        });
    });

    canvasFullscreenBtn?.addEventListener('click', () => fullscreenBtn?.click());
    canvasSafeToggleBtn?.addEventListener('click', () => {
        if (!safeZonesCheckbox) return;
        safeZonesCheckbox.checked = !safeZonesCheckbox.checked;
        readStyleControls();
        renderPreviewAt(state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec);
        saveProjectSettings();
        updateSidebarStatus();
    });

    [exportSizeSelect, exportFpsSelect, formatPresetSelect, lyricsInput, safeZonesCheckbox].forEach((control) => {
        control?.addEventListener('change', updateSidebarStatus);
        control?.addEventListener('input', updateSidebarStatus);
    });

    let restoredTab = 'lyrics';
    try {
        restoredTab = localStorage.getItem('bratAnimator.activeSidebarTab') || restoredTab;
    } catch (_) {}

    if (!tabs.some((tab) => tab.dataset.openTab === restoredTab)) restoredTab = 'lyrics';
    openEditorTab(restoredTab);
    updateSidebarStatus();

    if (!showPermissionNotice()) {
        scheduleTutorial();
    }
})();
