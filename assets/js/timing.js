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

    function wordMetrics(text) {
        const letters = String(text).normalize("NFD").replace(/\p{Mark}/gu, "").toLowerCase();
        let longestRun = 0;
        const ordinary = letters.replace(/([aeiouyаеёиоуыэюя])\1{2,}/gu, run => {
            longestRun = Math.max(longestRun, Array.from(run).length);
            return Array.from(run)[0];
        });
        const syllables = (ordinary.match(/[aeiouyаеёиоуыэюя]+/giu) || []).length;
        const length = graphemes(ordinary).filter(item => /[\p{Letter}\p{Number}]/u.test(item.char)).length;
        const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text);
        return {
            spokenWeight: Math.max(0.75, cjk ? length : syllables + Math.sqrt(length) * 0.25),
            pause: punctuationPause(text),
            sustain: longestRun >= 3 ? Math.min(2.5, 0.35 * Math.sqrt(longestRun - 2)) : 0
        };
    }

    function wordWeight(text) {
        const metrics = wordMetrics(text);
        return metrics.spokenWeight + metrics.pause;
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
        return raw.map(token => {
            const metrics = token.isSpace ? { spokenWeight: 0, pause: 0, sustain: 0 } : wordMetrics(token.text);
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
        const nativeSegments = [];
        const seenWords = new Set();
        let searchCursor = 0;
        let previous = line.timestamp;
        for (const marker of line.wordTimings || []) {
            const markerText = String(marker.text || "").replace(/^(?:\[(?:bg|side|rom|lead|main|background|backing|adlib|romanized|translation|trans)\]|\((?:bg|side|rom|lead|main|background|backing|adlib|romanized|translation|trans)\))\s*/i, "").replace(/\s+/gu, " ").trim();
            const position = line.text.indexOf(markerText, searchCursor);
            if (position < 0 || !markerText) { warnings.push("Unmatched word timestamp"); continue; }
            const point = Array.from(line.text.slice(0, position)).length;
            const wordIndex = words.findIndex(word => word.endChar >= point);
            if (wordIndex < 0) continue;
            if (!Number.isFinite(marker.timestamp)) { warnings.push("Invalid word timestamp"); continue; }
            const isNative = Number.isFinite(marker.endTimestamp);
            const start = clamp(marker.timestamp, isNative ? line.timestamp : previous, limit);
            if (start !== marker.timestamp) warnings.push("Word timestamp outside its line or out of order");
            // Several native syllables can belong to one displayed word. Its
            // onset is the first syllable, never the final one.
            if (!isNative || !seenWords.has(wordIndex)) anchors.set(wordIndex, start);
            seenWords.add(wordIndex);
            if (isNative && marker.endTimestamp >= marker.timestamp) nativeSegments.push({
                startChar: point, endChar: point + Array.from(markerText).length - 1,
                start: marker.timestamp, end: marker.endTimestamp
            });
            previous = start;
            searchCursor = position + markerText.length;
        }
        if (Number.isFinite(explicitEnd) && explicitEnd < previous) {
            warnings.push("Terminal timestamp before its last word");
            explicitEnd = previous;
        }
        // TTML often leaves wrapping parentheses/punctuation outside the timed
        // span. Attach only those characters to the same source interval.
        const sourceChars = Array.from(line.text);
        for (const word of words) {
            const segments = nativeSegments.filter(segment => segment.startChar >= word.startChar && segment.endChar <= word.endChar);
            if (!segments.length) continue;
            const first = segments[0], last = segments.at(-1);
            if (/^\p{Punctuation}+$/u.test(sourceChars.slice(word.startChar, first.startChar).join(""))) first.startChar = word.startChar;
            if (/^\p{Punctuation}+$/u.test(sourceChars.slice(last.endChar + 1, word.endChar + 1).join(""))) last.endChar = word.endChar;
        }
        // A known word end also bounds any following word whose timing is
        // missing. Estimates must begin after that interval, not inside it.
        words.forEach((word, index) => {
            const segments = nativeSegments.filter(segment => segment.startChar >= word.startChar && segment.endChar <= word.endChar);
            let cursor = word.startChar;
            for (const segment of segments) {
                if (segment.startChar !== cursor) break;
                cursor = segment.endChar + 1;
            }
            if (segments.length && cursor === word.endChar + 1 && !anchors.has(index + 1)) anchors.set(index + 1, Math.max(...segments.map(segment => segment.end)));
        });
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
                const revealEnd = cursor + word.spokenWeight * secondsPerUnit * compression;
                const end = revealEnd + word.sustain / speed * compression;
                const pauseDuration = word.pause / speed * compression;
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
        scheduled.forEach((word, index) => {
            const segments = nativeSegments.filter(segment => segment.startChar >= word.startChar && segment.endChar <= word.endChar);
            let cursor = word.startChar;
            for (const segment of segments) {
                if (segment.startChar !== cursor) break;
                cursor = segment.endChar + 1;
            }
            if (!segments.length || cursor !== word.endChar + 1) return;
            // Bypass rhythm, punctuation, speed and audio guidance completely
            // when the source supplies the complete word interval.
            const end = Math.max(...segments.map(segment => segment.end));
            scheduled[index] = {
                ...word, start: segments[0].start, end,
                revealEnd: end, explicitStart: true, explicitEnd: true,
                sustainDuration: 0, pauseDuration: 0, nativeSegments: segments
            };
        });
        return scheduled;
    }

    function buildTimeline(parsed, audio = null, options = {}) {
        const rawSpeed = Number(options?.speed ?? 1);
        const speed = Number.isFinite(rawSpeed) ? clamp(rawSpeed, 0.5, 2) : 1;
        const tokenized = parsed.map(line => tokenize(line.text));
        const nextStarts = new Array(parsed.length);
        let nextStart = Infinity;
        for (let index = parsed.length - 1; index >= 0; index--) {
            if (parsed[index + 1]?.timestamp > parsed[index].timestamp) nextStart = parsed[index + 1].timestamp;
            nextStarts[index] = nextStart;
        }
        const rhythmSamples = [];
        parsed.forEach((line, index) => {
            const words = tokenized[index].filter(token => !token.isSpace);
            const next = Math.min(nextStarts[index], line.boundaryTimestamp ?? Infinity);
            const gap = next - line.timestamp;
            if (words.length < 4 || words.some(word => word.sustain > 0) || !Number.isFinite(gap) || gap <= 0 || gap > 12) return;
            const units = words.reduce((sum, word) => sum + word.spokenWeight, 0);
            const pauses = words.reduce((sum, word) => sum + word.pause, 0);
            if (gap > pauses && units > 0) rhythmSamples.push((gap - pauses) / units);
        });
        const rhythm = rhythmSamples.length >= 3 ? clamp(percentile(rhythmSamples, 0.25), 0.18, 0.40) : 0.28;
        const secondsPerUnit = rhythm / speed;
        return parsed.map((line, lineIndex) => {
            const tokens = tokenized[lineIndex];
            const words = tokens.filter(token => !token.isSpace);
            const warnings = [];
            const sourceEnd = line.lineEndTimestamp ?? Math.max(-Infinity, ...(line.wordTimings || []).map(marker => marker.endTimestamp ?? -Infinity));
            // Explicit source intervals may overlap another singer/line.
            const nextTimestamp = Number.isFinite(sourceEnd) ? sourceEnd : Math.min(nextStarts[lineIndex], line.boundaryTimestamp ?? Infinity);
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
            const vocalEnd = Math.max(line.timestamp, ...timedWords.map(word => word.end));
            const slotEnd = Number.isFinite(nextTimestamp) ? nextTimestamp
                : Number.isFinite(mediaEnd) ? mediaEnd : vocalEnd + 0.8;
            const chars = [];
            for (const word of timedWords) {
                const letters = graphemes(word.text);
                const revealDuration = word.revealEnd - word.start;
                letters.forEach((letter, index) => {
                    const startChar = word.startChar + letter.startChar;
                    const segment = word.nativeSegments?.find(segment => startChar >= segment.startChar && startChar <= segment.endChar);
                    const duration = segment ? (segment.end - segment.start) / Math.max(1, segment.endChar - segment.startChar + 1) : revealDuration / Math.max(1, letters.length);
                    const timestamp = segment ? segment.start + duration * (startChar - segment.startChar) : word.start + revealDuration * index / Math.max(1, letters.length);
                    chars.push({ ...letter, startChar, endChar: word.startChar + letter.endChar, timestamp, duration, lineIndex, wordIndex: word.wordIndex });
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
