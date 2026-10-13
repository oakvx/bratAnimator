(function (root, factory) {
    const timing = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = timing;
    root.BratTiming = timing;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const graphemeSegmenter = typeof Intl?.Segmenter === "function"
        ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
    const wordSegmenter = typeof Intl?.Segmenter === "function"
        ? new Intl.Segmenter(undefined, { granularity: "word" }) : null;

    function graphemes(text) {
        const source = String(text || "");
        const segments = graphemeSegmenter
            ? [...graphemeSegmenter.segment(source)].map(item => item.segment)
            : Array.from(source);
        let cursor = 0;
        return segments.map(char => {
            const startChar = cursor;
            cursor += Array.from(char).length;
            return { char, startChar, endChar: cursor - 1 };
        });
    }

    function punctuationPause(text) {
        const clean = String(text).replace(/["'’”»）)\]]+$/u, "");
        if (/(?:\.{3,}|…)$/u.test(clean)) return 0.45;
        if (/[.!?。！？]$/u.test(clean)) return 0.25;
        if (/[,，、]$/u.test(clean)) return 0.12;
        if (/[:;；：—–]$/u.test(clean)) return 0.18;
        return 0;
    }

    const italianWords = new Set(("io tu lui lei noi voi loro me te mi ti ci vi si lo la gli le ne un uno una il i e ed o ma se che chi non per con " +
        "a in no da su tra fra al ai allo col sul del della delle degli nel nella nelle negli alla alle anche ancora " +
        "amore amico ciao bello bella cuore quando quanto questa questo sono sei stai siamo siete essere hai abbiamo hanno " +
        "mio mia tuoi tua qui piu perche notte giorno senza sempre tutto tutti niente voglio posso come dove cosa vita mondo rimani torno nuovo pezzo").split(" "));
    const englishWords = new Set(("i you he she it we they me my your his her our their the a an and or but if that this these those is are was were be been " +
        "have has had do does did don't can't won't i'm you're we're they're i've you've i'll you'll i'd he'd she'd it's that's let's " +
        "isn't wasn't couldn't wouldn't shouldn't mustn't didn't doesn't one two three four five hello beautiful extraordinary love heart " +
        "come when what where why who how now then here there with without of to from for in on at by as so not no yes never always again " +
        "tonight night day world stop dancing wanted loved little every people only over under").split(" "));
    const italianExceptions = { io: 2, mio: 2, mia: 2, miei: 1, mie: 2, tuo: 2, tua: 2, tuoi: 1, tue: 2,
        suo: 2, sua: 2, suoi: 1, sue: 2, noi: 1, voi: 1, lui: 1, lei: 1, sei: 1, mai: 1, poi: 1,
        ciao: 1, qui: 1, cui: 1, piu: 1, puo: 1, cuore: 2, cielo: 2, gioia: 2, buio: 2,
        aiuto: 3, paura: 3, paese: 3, poeta: 3, poesia: 4, via: 2, dio: 2, zio: 2, sia: 2, due: 2 };
    const englishExceptions = { one: 1, once: 1, two: 1, are: 1, were: 1, have: 1, love: 1, loved: 1,
        come: 1, some: 1, done: 1, gone: 1, give: 1, live: 1, move: 1, eye: 1, eyes: 1, heart: 1,
        hour: 1, our: 1, fire: 1, people: 2, little: 2, every: 2, different: 3, family: 3,
        beautiful: 3, extraordinary: 5, quiet: 2, science: 2, piano: 3, poem: 2, poetry: 3,
        anyone: 3, everyone: 3, everything: 3, business: 2, rhythm: 2, queue: 1, because: 2,
        created: 3, wanted: 2, needed: 2, really: 2, being: 2, going: 2, seeing: 2,
        "isn't": 2, "wasn't": 2, "couldn't": 2, "wouldn't": 2, "shouldn't": 2,
        "doesn't": 2, "didn't": 2, "hasn't": 2, "haven't": 2, "mustn't": 2,
        "aren't": 1, "weren't": 1, naked: 2, wicked: 2, sacred: 2, rugged: 2,
        sometimes: 2, something: 2, someone: 2, somewhere: 2 };

    function lexicalKey(text) {
        return String(text).normalize("NFD").replace(/\p{Mark}/gu, "").toLowerCase()
            .replace(/’/g, "'").replace(/[^a-z'-]/g, "").replace(/^['-]+|['-]+$/g, "")
            .replace(/([aeiouy])\1{2,}/g, "$1");
    }

    function detectLanguage(text, requested = "auto") {
        if (requested === "it" || requested === "en") return requested;
        let italian = 0;
        let english = 0;
        for (const token of String(text).split(/\s+/u)) {
            const key = lexicalKey(token);
            if (italianWords.has(key) && !englishWords.has(key)) italian += 2;
            if (englishWords.has(key) && !italianWords.has(key)) english += 2;
            if (/^(?:l|d|all|dall|dell|nell|sull|un)'/.test(key)) italian += 2;
            if (/(?:n't|'(?:m|re|ve|ll|d|s))$/.test(key)) english += 2;
            if (/(?:zione|zioni|mente|ando|endo)$/.test(key) || /[àèéìòù]$/iu.test(token)) italian += 0.5;
            if (/(?:ing|ness|tion|tions|ously)$/.test(key)) english += 0.5;
        }
        // Mixed and short ambiguous phrases retain both pronunciation estimates.
        if (Math.min(italian, english) >= Math.max(italian, english) * 0.4 && Math.min(italian, english) >= 2) return "auto";
        if (italian >= 2 && italian - english >= 2) return "it";
        if (english >= 2 && english - italian >= 2) return "en";
        return "auto";
    }

    function italianSyllables(word, stressedWord = word) {
        if (Object.hasOwn(italianExceptions, word)) return italianExceptions[word];
        if (word.includes("'")) {
            const parts = word.split("'");
            const stressedParts = stressedWord.split("'");
            return parts.reduce((sum, part, index) => sum + (/[aeiou]/.test(part) ? italianSyllables(part, stressedParts[index] || part) : 0), 0) || 1;
        }
        // Written i after c/g and u after q are glides, not extra nuclei.
        const source = stressedWord.replace(/([cg])i(?=[aeou])/g, "$1").replace(/qu(?=[aeio])/g, "q");
        let count = 0;
        for (const group of source.match(/[aeiouIU]+/g) || []) {
            count += 1;
            for (let index = 1; index < group.length; index++) {
                const pair = group.slice(index - 1, index + 1);
                if (/^[aeo]{2}$/.test(pair) || pair[0] === pair[1] || /[IU]/.test(pair)) count += 1;
            }
        }
        return Math.max(1, count);
    }

    function englishSyllables(word) {
        if (Object.hasOwn(englishExceptions, word)) return englishExceptions[word];
        let source = word.replace(/'/g, "");
        if (source.length > 3) {
            if (/[^aeiouy]e$/.test(source) && !/[^aeiouy]le$/.test(source)) source = source.slice(0, -1);
            else if (/ed$/.test(source) && !/[td]ed$/.test(source)) source = source.slice(0, -2);
            else if (/es$/.test(source) && !/(?:[scgxz]|ch|sh|[aeiouy])es$/.test(source)) source = source.slice(0, -2);
        }
        return Math.max(1, (source.match(/[aeiouy]+/g) || []).length);
    }

    function estimateSyllables(text, ordinary, language) {
        // Keep the established Unicode estimator for scripts outside Latin.
        if (!/[a-z]/i.test(ordinary) || /[^\p{Script=Latin}\p{Number}\p{Punctuation}\p{Symbol}\s]/u.test(ordinary)) {
            return (ordinary.match(/[aeiouyаеёиоуыэюя]+/giu) || []).length;
        }
        const key = lexicalKey(ordinary);
        const stressedParts = String(text).normalize("NFC").toLowerCase().replace(/’/g, "'")
            .replace(/[ìíîï]/g, "I").replace(/[ùúûü]/g, "U").normalize("NFD").replace(/\p{Mark}/gu, "")
            .replace(/[^a-zIU'-]/g, "").replace(/^['-]+|['-]+$/g, "").replace(/([aeiouy])\1{2,}/g, "$1").split("-").filter(Boolean);
        return key.split("-").filter(Boolean).reduce((sum, part, index) => {
            const italian = italianSyllables(part, stressedParts[index] || part);
            const english = englishSyllables(part);
            if (language === "it") return sum + italian;
            if (language === "en") return sum + english;
            const detected = detectLanguage(part);
            return sum + (detected === "it" ? italian : detected === "en" ? english : (italian + english) / 2);
        }, 0);
    }

    function wordMetrics(text, language) {
        const letters = String(text).normalize("NFD").replace(/\p{Mark}/gu, "").toLowerCase();
        let longestRun = 0;
        const ordinary = letters.replace(/([aeiouyаеёиоуыэюя])\1{2,}/gu, run => {
            longestRun = Math.max(longestRun, Array.from(run).length);
            return Array.from(run)[0];
        });
        const syllables = estimateSyllables(text, ordinary, language);
        const length = graphemes(ordinary).filter(item => /[\p{Letter}\p{Number}]/u.test(item.char)).length;
        const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text);
        return {
            syllables: cjk ? length : syllables,
            spokenWeight: Math.max(0.75, cjk ? length : syllables + Math.sqrt(length) * 0.25),
            pause: punctuationPause(text),
            sustain: longestRun >= 3 ? Math.min(2.5, 0.35 * Math.sqrt(longestRun - 2)) : 0
        };
    }

    function wordWeight(text, language = "auto") {
        const metrics = wordMetrics(text, detectLanguage(text, language));
        return metrics.spokenWeight + metrics.pause;
    }

    function tokenize(text, language = "auto") {
        const source = String(text || "");
        const detected = detectLanguage(source, language);
        const raw = [];
        for (const match of source.matchAll(/\s+|\S+/gu)) {
            if (wordSegmenter && /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(match[0])) {
                for (const part of wordSegmenter.segment(match[0])) {
                    if (!part.isWordLike && raw.length && !raw.at(-1).isSpace) {
                        raw.at(-1).text += part.segment;
                        continue;
                    }
                    raw.push({ text: part.segment, index: match.index + part.index, isSpace: /^\s+$/u.test(part.segment) });
                }
            } else raw.push({ text: match[0], index: match.index, isSpace: /^\s+$/u.test(match[0]) });
        }
        let wordIndex = 0;
        return raw.map(token => {
            const metrics = token.isSpace ? { spokenWeight: 0, pause: 0, sustain: 0 } : wordMetrics(token.text, detected);
            return {
                ...token, ...metrics,
                startChar: Array.from(source.slice(0, token.index)).length,
                endChar: Array.from(source.slice(0, token.index + token.text.length)).length - 1,
                wordIndex: token.isSpace ? -1 : wordIndex++,
                weight: metrics.spokenWeight + metrics.pause
            };
        });
    }

    function phraseChunks(text, words) {
        const source = Array.from(text);
        const chunks = [];
        let first = 0;
        let weight = 0;
        for (let index = 0; index < words.length; index++) {
            weight += words[index].weight;
            const last = index === words.length - 1;
            const punctuation = words[index].pause > 0;
            const balancedBreak = index - first >= 3 && weight >= 8 && words.length - index > 2;
            if (!last && !punctuation && !balancedBreak) continue;
            const startChar = words[first].startChar;
            const endChar = words[index].endChar;
            chunks.push({ text: source.slice(startChar, endChar + 1).join(""), startChar, endChar, firstWord: first, lastWord: index });
            first = index + 1;
            weight = 0;
        }
        return chunks;
    }

    function percentile(values, ratio) {
        if (!values.length) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const position = (sorted.length - 1) * clamp(ratio, 0, 1);
        const lower = Math.floor(position);
        return sorted[lower] + (sorted[Math.ceil(position)] - sorted[lower]) * (position - lower);
    }

    function analyzeAudioEnergy(buffer, frameMs = 18) {
        const frameSize = Math.max(1, Math.round(buffer.sampleRate * frameMs / 1000));
        const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
        const raw = [];
        for (let start = 0; start < buffer.length; start += frameSize) {
            const end = Math.min(start + frameSize, buffer.length);
            let power = 0;
            for (const channel of channels) {
                for (let index = start; index < end; index++) power += channel[index] * channel[index];
            }
            raw.push({ time: start / buffer.sampleRate, rms: Math.sqrt(power / Math.max(1, (end - start) * channels.length)) });
        }
        const frames = raw.map((frame, index) => {
            const neighbors = raw.slice(Math.max(0, index - 1), index + 2);
            const rms = neighbors.reduce((sum, item) => sum + item.rms, 0) / neighbors.length;
            return { time: frame.time, rms, onset: Math.max(0, frame.rms - (raw[index - 1]?.rms || 0)) };
        });
        const values = frames.map(frame => frame.rms);
        const lowRms = percentile(values, 0.12);
        const medianRms = percentile(values, 0.5);
        const highRms = percentile(values, 0.9);
        return {
            duration: buffer.duration,
            frameDuration: frameSize / buffer.sampleRate,
            frames, lowRms, medianRms, highRms,
            silenceThreshold: Math.max(0.0001, lowRms + (medianRms - lowRms) * 0.22),
            usable: highRms > 0.0001 && highRms - lowRms > highRms * 0.08
        };
    }

    function framesInWindow(audio, start, end) {
        if (!audio?.frames?.length || !audio.frameDuration) return [];
        const first = Math.max(0, Math.ceil(start / audio.frameDuration));
        const last = Math.min(audio.frames.length, Math.ceil(end / audio.frameDuration));
        return audio.frames.slice(first, last);
    }

    function nudgeBoundary(audio, target, min, max) {
        if (!audio || audio.usable === false || max <= min) return clamp(target, min, max);
        const radius = Math.min(0.15, (max - min) * 0.2);
        const candidates = framesInWindow(audio, Math.max(min, target - radius), Math.min(max, target + radius));
        const range = Math.max(0.0001, audio.highRms - audio.lowRms);
        let best = target;
        let bestScore = 1;
        for (const frame of candidates) {
            const energy = clamp((frame.rms - audio.lowRms) / range, 0, 1);
            const distance = Math.abs(frame.time - target) / Math.max(radius, 0.001);
            const score = energy * 0.6 + distance * 0.7;
            if (score < bestScore) { bestScore = score; best = frame.time; }
        }
        return clamp(best, min, max);
    }

    function scheduleWords(line, tokens, limit, explicitEnd, audio, warnings, secondsPerUnit, speed) {
        const words = tokens.filter(token => !token.isSpace);
        const anchors = new Map([[0, line.timestamp]]);
        let searchCursor = 0;
        let previous = line.timestamp;
        for (const marker of line.wordTimings || []) {
            const markerText = String(marker.text || "").replace(/^(?:\[(?:bg|side|rom|lead|main|background|backing|adlib|romanized|translation|trans)\]|\((?:bg|side|rom|lead|main|background|backing|adlib|romanized|translation|trans)\))\s*/i, "");
            const position = line.text.indexOf(markerText, searchCursor);
            if (position < 0 || !markerText) { warnings.push("Unmatched word timestamp"); continue; }
            const point = Array.from(line.text.slice(0, position)).length;
            const wordIndex = words.findIndex(word => word.endChar >= point);
            if (wordIndex < 0) continue;
            if (!Number.isFinite(marker.timestamp)) { warnings.push("Invalid word timestamp"); continue; }
            const start = clamp(marker.timestamp, previous, limit);
            if (start !== marker.timestamp) warnings.push("Word timestamp outside its line or out of order");
            anchors.set(wordIndex, start);
            previous = start;
            searchCursor = position + markerText.length;
        }
        if (Number.isFinite(explicitEnd) && explicitEnd < previous) {
            warnings.push("Terminal timestamp before its last word");
            explicitEnd = previous;
        }
        anchors.set(words.length, Number.isFinite(explicitEnd) ? explicitEnd : limit);
        const ordered = [...anchors].sort((a, b) => a[0] - b[0]);
        const scheduled = new Array(words.length);
        const sourceOffset = (line.sourceTimestamp ?? line.timestamp) - line.timestamp;
        for (let index = 0; index < ordered.length - 1; index++) {
            const [first, start] = ordered[index];
            const [last, finish] = ordered[index + 1];
            const total = words.slice(first, last).reduce((sum, word) =>
                sum + word.spokenWeight * secondsPerUnit + (word.sustain + word.pause) / speed, 0);
            const compression = total > 0 ? Math.min(1, Math.max(0, finish - start) / total) : 1;
            let cursor = start;
            for (let wordIndex = first; wordIndex < last; wordIndex++) {
                const word = words[wordIndex];
                const revealEnd = Math.min(finish, cursor + word.spokenWeight * secondsPerUnit * compression);
                const end = Math.min(finish, revealEnd + word.sustain / speed * compression);
                const pauseDuration = Math.min(Math.max(0, finish - end), word.pause / speed * compression);
                // Only move estimated onsets locally. End times stay fixed, so an
                // energetic accompaniment cannot stretch a phrase into its slot.
                const nudgedStart = wordIndex === first ? cursor : nudgeBoundary(
                    audio, cursor + sourceOffset, cursor + sourceOffset,
                    Math.min(revealEnd, cursor + 0.06) + sourceOffset
                ) - sourceOffset;
                scheduled[wordIndex] = {
                    ...word, start: clamp(nudgedStart, cursor, revealEnd), revealEnd, end,
                    pauseDuration, sustainDuration: end - revealEnd,
                    explicitStart: anchors.has(wordIndex)
                };
                cursor = end + pauseDuration;
            }
        }
        // A terminal Enhanced LRC marker declares the end of the sung phrase;
        // extend only the last word's hold, never its typewriter reveal.
        if (scheduled.length && Number.isFinite(explicitEnd)) {
            const last = scheduled.at(-1);
            last.end = explicitEnd;
            last.revealEnd = Math.min(last.revealEnd, explicitEnd);
            last.sustainDuration = last.end - last.revealEnd;
            last.pauseDuration = 0;
        }
        return scheduled;
    }

    function buildTimeline(parsed, audio = null, options = {}) {
        const rawSpeed = Number(options?.speed ?? 1);
        const speed = Number.isFinite(rawSpeed) ? clamp(rawSpeed, 0.5, 2) : 1;
        const language = ["it", "en"].includes(options?.language) ? options.language : "auto";
        const tokenized = parsed.map(line => tokenize(line.text, language));
        const nextStarts = new Array(parsed.length);
        let nextStart = Infinity;
        for (let index = parsed.length - 1; index >= 0; index--) {
            if (parsed[index + 1]?.timestamp > parsed[index].timestamp) nextStart = parsed[index + 1].timestamp;
            nextStarts[index] = nextStart;
        }
        const rhythmSamples = [];
        const rolesAtTimestamp = new Map();
        parsed.forEach(line => {
            if (!rolesAtTimestamp.has(line.timestamp)) rolesAtTimestamp.set(line.timestamp, new Set());
            rolesAtTimestamp.get(line.timestamp).add(line.role || "lead");
        });
        parsed.forEach((line, index) => {
            const words = tokenized[index].filter(token => !token.isSpace);
            const next = Math.min(nextStarts[index], line.boundaryTimestamp ?? Infinity);
            const gap = next - line.timestamp;
            if (words.length < 4 || words.some(word => word.sustain > 0) || !Number.isFinite(gap) || gap <= 0 || gap > 12) return;
            // Empty LRC rows explicitly mark a pause. Do not learn a singing rate
            // from that slot, nor from another singer's next onset.
            if ((line.boundaryTimestamp ?? Infinity) <= nextStarts[index]) return;
            if (!rolesAtTimestamp.get(next)?.has(line.role || "lead")) return;
            let previous = line.timestamp;
            let searchCursor = 0;
            for (const marker of line.wordTimings || []) {
                const markerText = String(marker.text || "").replace(/^(?:\[(?:bg|side|rom|lead|main|background|backing|adlib|romanized|translation|trans)\]|\((?:bg|side|rom|lead|main|background|backing|adlib|romanized|translation|trans)\))\s*/i, "");
                const position = line.text.indexOf(markerText, searchCursor);
                if (!markerText || position < 0 || !Number.isFinite(marker.timestamp) || marker.timestamp < previous || marker.timestamp > next) return;
                previous = marker.timestamp;
                searchCursor = position + markerText.length;
            }
            if (Number.isFinite(line.wordEndTimestamp) && (line.wordEndTimestamp <= line.timestamp || line.wordEndTimestamp < previous || line.wordEndTimestamp > next)) return;
            // An explicit early sung end leaves a known trailing pause.
            const sungGap = Math.min(next, line.wordEndTimestamp ?? next) - line.timestamp;
            const units = words.reduce((sum, word) => sum + word.spokenWeight, 0);
            const pauses = words.reduce((sum, word) => sum + word.pause, 0);
            if (sungGap > pauses && units > 0) rhythmSamples.push({ index, role: line.role || "lead", rate: (sungGap - pauses) / units });
        });
        const globalRhythm = rhythmSamples.length >= 3 ? clamp(percentile(rhythmSamples.map(sample => sample.rate), 0.25), 0.18, 0.40) : 0.28;
        const samplesByRole = new Map();
        rhythmSamples.forEach(sample => {
            if (!samplesByRole.has(sample.role)) samplesByRole.set(sample.role, []);
            samplesByRole.get(sample.role).push(sample);
        });
        return parsed.map((line, lineIndex) => {
            // Samples are sorted by line index. Search only around the insertion
            // point, so long lyrics do not require sorting the whole song per row.
            const candidates = samplesByRole.get(line.role || "lead") || [];
            let low = 0;
            let high = candidates.length;
            while (low < high) {
                const middle = (low + high) >>> 1;
                if (candidates[middle].index < lineIndex) low = middle + 1;
                else high = middle;
            }
            const local = candidates.slice(Math.max(0, low - 8), low + 8)
                .sort((a, b) => Math.abs(a.index - lineIndex) - Math.abs(b.index - lineIndex) || a.index - b.index).slice(0, 8);
            const rhythm = local.length >= 3 ? clamp(percentile(local.map(sample => sample.rate), 0.25), 0.18, 0.40) : globalRhythm;
            const secondsPerUnit = rhythm / speed;
            const tokens = tokenized[lineIndex];
            const words = tokens.filter(token => !token.isSpace);
            const warnings = [];
            const nextTimestamp = Math.min(nextStarts[lineIndex], line.boundaryTimestamp ?? Infinity);
            const offset = (line.sourceTimestamp ?? line.timestamp) - line.timestamp;
            const originalDuration = Number.isFinite(options?.mediaDuration) ? options.mediaDuration : audio?.duration;
            let mediaEnd = Number.isFinite(originalDuration) ? originalDuration - offset : Infinity;
            if (mediaEnd <= line.timestamp) mediaEnd = Infinity;
            let explicitEnd = line.wordEndTimestamp;
            if (Number.isFinite(explicitEnd) && explicitEnd <= line.timestamp) {
                warnings.push("Terminal timestamp outside its line");
                explicitEnd = undefined;
            } else if (Number.isFinite(explicitEnd) && explicitEnd > nextTimestamp) {
                warnings.push("Terminal timestamp outside its line");
                explicitEnd = nextTimestamp;
            }
            const lastMarker = Math.max(line.timestamp, ...(line.wordTimings || []).map(marker =>
                Number.isFinite(marker.timestamp) ? marker.timestamp : line.timestamp));
            if (Number.isFinite(mediaEnd) && (lastMarker >= mediaEnd || (explicitEnd ?? line.timestamp) > mediaEnd)) {
                warnings.push("Media ends before the Enhanced LRC timings");
                mediaEnd = Infinity;
            }
            const limit = Number.isFinite(nextTimestamp) ? nextTimestamp : mediaEnd;
            if (limit - line.timestamp < words.length * 0.045) warnings.push("Dense line: very little time per word");
            const timedWords = scheduleWords(line, tokens, limit, explicitEnd, audio, warnings, secondsPerUnit, speed);
            const vocalEnd = timedWords.at(-1)?.end ?? line.timestamp;
            const slotEnd = Number.isFinite(nextTimestamp) ? nextTimestamp
                : Number.isFinite(mediaEnd) ? mediaEnd : vocalEnd + 0.8;
            const chars = [];
            for (const word of timedWords) {
                const letters = graphemes(word.text);
                const revealDuration = word.revealEnd - word.start;
                letters.forEach((letter, index) => {
                    const timestamp = word.start + revealDuration * index / Math.max(1, letters.length);
                    chars.push({ ...letter, startChar: word.startChar + letter.startChar, endChar: word.startChar + letter.endChar, timestamp, duration: revealDuration / Math.max(1, letters.length), lineIndex, wordIndex: word.wordIndex });
                });
            }
            const chunks = phraseChunks(line.text, words);
            const blocks = chunks.map((chunk, blockIndex) => {
                const blockChars = chars.filter(char => char.startChar >= chunk.startChar && char.endChar <= chunk.endChar).map(char => ({ ...char, blockIndex }));
                return {
                    ...chunk, lineIndex, blockIndex, chars: blockChars,
                    displayStart: timedWords[chunk.firstWord]?.start ?? line.timestamp,
                    displayEnd: timedWords[chunk.lastWord]?.end ?? vocalEnd,
                    fullVisibleAt: blockChars.at(-1)?.timestamp ?? line.timestamp
                };
            });
            const timedTokens = tokens.map(token => token.isSpace
                ? { ...token, start: line.timestamp, end: slotEnd, revealEnd: vocalEnd }
                : timedWords[token.wordIndex]);
            return {
                ...line, blocks, chars, timedWords, timedTokens,
                displayStart: line.timestamp, displayEnd: slotEnd, vocalEnd, slotEnd,
                analysis: {
                    wordCount: words.length,
                    letterCount: chars.length,
                    phraseCount: chunks.length,
                    wordsPerSecond: words.length / Math.max(0.001, vocalEnd - line.timestamp),
                    vocalDuration: Math.max(0, vocalEnd - line.timestamp),
                    pauseDuration: Math.max(0, slotEnd - vocalEnd),
                    sustainedWordCount: words.filter(word => word.sustain > 0).length,
                    secondsPerUnit,
                    language: detectLanguage(line.text, language),
                    timingSource: line.wordTimings?.length ? "enhanced" : audio?.usable ? "audio" : "estimated",
                    warnings: [...new Set(warnings)]
                }
            };
        });
    }

    function getTimedWordTokens(line) {
        return line?.timedTokens || [];
    }

    return { graphemes, tokenize, wordWeight, analyzeAudioEnergy, buildTimeline, getTimedWordTokens };
});
