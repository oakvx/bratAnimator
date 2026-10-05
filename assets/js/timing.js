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

    function pauseWeight(text) {
        const clean = String(text).replace(/["'’”»）)\]]+$/u, "");
        if (/[.!?…。！？]$/u.test(clean)) return 0.65;
        if (/[,:;，、；：]$/u.test(clean)) return 0.3;
        if (/[—–]$/u.test(clean)) return 0.2;
        return 0;
    }

    function wordWeight(text) {
        const letters = String(text).normalize("NFD").replace(/\p{Mark}/gu, "");
        const syllables = (letters.match(/[aeiouyаеёиоуыэюя]+/giu) || []).length;
        const length = graphemes(text).filter(item => /[\p{Letter}\p{Number}]/u.test(item.char)).length;
        const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text);
        return Math.max(0.75, cjk ? length : syllables + Math.sqrt(length) * 0.25) + pauseWeight(text);
    }

    function tokenize(text) {
        const source = String(text || "");
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
        return raw.map(token => ({
            ...token,
            startChar: Array.from(source.slice(0, token.index)).length,
            endChar: Array.from(source.slice(0, token.index + token.text.length)).length - 1,
            wordIndex: token.isSpace ? -1 : wordIndex++,
            weight: token.isSpace ? 0 : wordWeight(token.text)
        }));
    }

    function phraseChunks(text, words) {
        const source = Array.from(text);
        const chunks = [];
        let first = 0;
        let weight = 0;
        for (let index = 0; index < words.length; index++) {
            weight += words[index].weight;
            const last = index === words.length - 1;
            const punctuation = pauseWeight(words[index].text) > 0;
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
        return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))];
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

    function scheduleWords(line, tokens, end, audio, warnings) {
        const words = tokens.filter(token => !token.isSpace);
        const anchors = new Map([[0, line.timestamp], [words.length, end]]);
        let searchCursor = 0;
        let previous = line.timestamp;
        for (const marker of line.wordTimings || []) {
            const markerText = String(marker.text || "").replace(/^(?:\[(?:bg|side|rom|lead|main|background|backing|adlib|romanized|translation|trans)\]|\((?:bg|side|rom|lead|main|background|backing|adlib|romanized|translation|trans)\))\s*/i, "");
            const position = line.text.indexOf(markerText, searchCursor);
            if (position < 0 || !markerText) { warnings.push("Unmatched word timestamp"); continue; }
            const point = Array.from(line.text.slice(0, position)).length;
            const wordIndex = words.findIndex(word => word.endChar >= point);
            if (wordIndex < 0) continue;
            const start = clamp(marker.timestamp, previous, end);
            if (start !== marker.timestamp) warnings.push("Word timestamp outside its line or out of order");
            anchors.set(wordIndex, start);
            previous = start;
            searchCursor = position + markerText.length;
        }
        const ordered = [...anchors].sort((a, b) => a[0] - b[0]);
        const starts = new Array(words.length + 1);
        for (let index = 0; index < ordered.length - 1; index++) {
            const [first, start] = ordered[index];
            const [last, finish] = ordered[index + 1];
            const totalWeight = words.slice(first, last).reduce((sum, word) => sum + word.weight, 0) || 1;
            let progress = 0;
            for (let wordIndex = first; wordIndex < last; wordIndex++) {
                const target = start + (finish - start) * progress / totalWeight;
                const sourceOffset = (line.sourceTimestamp ?? line.timestamp) - line.timestamp;
                starts[wordIndex] = wordIndex === first ? start : nudgeBoundary(
                    audio, target + sourceOffset,
                    (starts[wordIndex - 1] ?? start) + sourceOffset,
                    finish + sourceOffset
                ) - sourceOffset;
                progress += words[wordIndex].weight;
            }
            starts[last] = finish;
        }
        return words.map((word, index) => ({ ...word, start: starts[index], end: Math.max(starts[index], starts[index + 1]) }));
    }

    function buildTimeline(parsed, audio = null) {
        const nextStarts = new Array(parsed.length);
        let nextStart = Infinity;
        for (let index = parsed.length - 1; index >= 0; index--) {
            if (parsed[index + 1]?.timestamp > parsed[index].timestamp) nextStart = parsed[index + 1].timestamp;
            nextStarts[index] = nextStart;
        }
        return parsed.map((line, lineIndex) => {
            const tokens = tokenize(line.text);
            const words = tokens.filter(token => !token.isSpace);
            const warnings = [];
            const nextTimestamp = Math.min(nextStarts[lineIndex], line.boundaryTimestamp ?? Infinity);
            const totalWeight = words.reduce((sum, word) => sum + word.weight, 0);
            const fallback = clamp(totalWeight * 0.28 + 0.5, 0.7, 12);
            const offset = (line.sourceTimestamp ?? line.timestamp) - line.timestamp;
            const audioEnd = audio?.duration - offset;
            let end = Number.isFinite(nextTimestamp) ? nextTimestamp : (Number.isFinite(audioEnd) && audioEnd > line.timestamp ? Math.min(audioEnd, line.timestamp + fallback) : line.timestamp + fallback);
            const explicitEnd = line.wordEndTimestamp;
            if (Number.isFinite(explicitEnd) && explicitEnd > line.timestamp) end = Math.min(nextTimestamp, explicitEnd);
            // Explicit word onsets can extend an otherwise estimated final line.
            const lastMarker = line.wordTimings?.at(-1)?.timestamp;
            if (!Number.isFinite(nextTimestamp) && !Number.isFinite(explicitEnd) && Number.isFinite(lastMarker)) end = Math.max(end, lastMarker + 0.35);
            end = Math.max(line.timestamp + 0.001, end);
            if (end - line.timestamp < words.length * 0.045) warnings.push("Dense line: very little time per word");
            const timedWords = scheduleWords(line, tokens, end, audio, warnings);
            const chars = [];
            for (const word of timedWords) {
                const letters = graphemes(word.text);
                const weights = letters.map(letter => pauseWeight(letter.char) > 0 ? 1.8 : 1);
                const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
                let progress = 0;
                // Leave a small hold at each word end; punctuation delays the next word.
                const revealDuration = (word.end - word.start) * 0.88;
                letters.forEach((letter, index) => {
                    const timestamp = word.start + revealDuration * progress / total;
                    chars.push({ ...letter, startChar: word.startChar + letter.startChar, endChar: word.startChar + letter.endChar, timestamp, duration: revealDuration * weights[index] / total, lineIndex, wordIndex: word.wordIndex });
                    progress += weights[index];
                });
            }
            const chunks = phraseChunks(line.text, words);
            const blocks = chunks.map((chunk, blockIndex) => {
                const blockChars = chars.filter(char => char.startChar >= chunk.startChar && char.endChar <= chunk.endChar).map(char => ({ ...char, blockIndex }));
                return {
                    ...chunk, lineIndex, blockIndex, chars: blockChars,
                    displayStart: timedWords[chunk.firstWord]?.start ?? line.timestamp,
                    displayEnd: timedWords[chunk.lastWord]?.end ?? end,
                    fullVisibleAt: blockChars.at(-1)?.timestamp ?? line.timestamp
                };
            });
            const timedTokens = tokens.map(token => token.isSpace
                ? { ...token, start: line.timestamp, end }
                : timedWords[token.wordIndex]);
            return {
                ...line, blocks, chars, timedWords, timedTokens,
                displayStart: line.timestamp, displayEnd: end,
                analysis: {
                    wordCount: words.length,
                    letterCount: chars.length,
                    phraseCount: chunks.length,
                    wordsPerSecond: words.length / (end - line.timestamp),
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
