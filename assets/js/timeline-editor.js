/* Phase 17 — full-width, low-CPU timeline editor (pointer, mouse, touch, keyboard).
 * Uses existing BratMultitrackHost/BratTracks; does not own media or duplicate
 * the project store. A gesture is saved exactly once on pointer release.
 */
(function () {
    "use strict";
    const Core = window.BratTimeline;
    const Tracks = window.BratTracks;
    const host = window.BratMultitrackHost;
    const $ = id => document.getElementById(id);
    const root = $("studioTimelineDock");
    if (!root || !Core || !Tracks || !host) return;
    const viewport = $("studioTlViewport");
    const world = $("studioTlWorld");
    const ruler = $("studioTlRuler");
    const lanes = $("studioTlLanes");
    const zoomSlider = $("studioTlZoom");
    const zoomValue = $("studioTlZoomValue");
    const snapCheckbox = $("studioTlSnap");
    const playhead = $("studioTlPlayhead");
    const currentTime = $("studioTlCurrent");
    const status = $("studioTlStatus");
    const undoBtn = $("studioTlUndo");
    const redoBtn = $("studioTlRedo");
    const headerWidth = 116;
    const minimumDuration = 12;
    const safe = (fn, ...args) => { try { return fn(...args); } catch (error) { tell(error.message, true); return null; } };
    const tell = (message, error = false) => {
        status.textContent = String(message || "");
        status.dataset.error = String(error);
    };
    const el = (tag, className = "", content = "") => {
        const node = document.createElement(tag);
        node.className = className;
        node.textContent = String(content);
        return node;
    };
    let scale = Core.zoom(Number(localStorage.getItem("bratAnimator.timeline.zoom") || 48));
    let snapping = localStorage.getItem("bratAnimator.timeline.snap") !== "false";
    let drag = null;
    let repaintScheduled = false;
    let currentWorldWidth = 0;
    let lastScrollBucket = -1;
    zoomSlider.value = String(scale);
    snapCheckbox.checked = snapping;

    function timeLabel(t) {
        return Core.secondsToLabel(t);
    }

    function requestRender() {
        if (drag || repaintScheduled || document.hidden) return;
        repaintScheduled = true;
        requestAnimationFrame(() => {
            repaintScheduled = false;
            if (!drag) render();
        });
    }
    function durationForGraph(graph) {
        return Math.max(minimumDuration, Tracks.endTime(graph) + 3, host.duration() + 1);
    }
    function renderRuler(duration, visibleStart, visibleEnd) {
        ruler.replaceChildren();
        const step = Core.rulerStep(scale);
        const start = Math.floor(visibleStart / step) * step;
        for (let tick = Math.max(0, start); tick < Math.min(duration + step, visibleEnd + step);
            tick = Math.round((tick + step) * 100000) / 100000) {
            const mark = el("span", "studio-tl-tick", timeLabel(tick));
            mark.style.left = (headerWidth + tick * scale) + "px";
            ruler.append(mark);
        }
    }
    function renderClip(clip, track, graph) {
        const node = el("div", "studio-tl-clip studio-tl-" + clip.kind +
            (graph.selectedClipId === clip.id ? " is-selected" : ""), "");
        node.dataset.clipId = clip.id;
        node.dataset.trackId = track.id;
        node.tabIndex = 0;
        node.setAttribute("role", "button");
        node.setAttribute("aria-label",
            clip.name + ", " + timeLabel(clip.start) + " to " + timeLabel(clip.start + clip.duration) +
            ", " + track.name + ". Drag to move, use handles to trim, arrow keys to nudge.");
        node.style.left = (clip.start * scale) + "px";
        node.style.width = Math.max(3, clip.duration * scale) + "px";
        node.title = clip.name + " • " + timeLabel(clip.start) + "–" + timeLabel(clip.start + clip.duration);
        const left = el("span", "studio-tl-handle studio-tl-handle-left");
        left.dataset.gesture = "trim-left";
        left.setAttribute("aria-hidden", "true");
        const name = el("span", "studio-tl-clip-name", clip.name);
        const right = el("span", "studio-tl-handle studio-tl-handle-right");
        right.dataset.gesture = "trim-right";
        right.setAttribute("aria-hidden", "true");
        node.append(left, name, right);
        return node;
    }
    function renderLanes(graph, visibleStart, visibleEnd) {
        lanes.replaceChildren();
        for (const track of graph.tracks) {
            const lane = el("div", "studio-tl-lane" + (track.locked ? " is-locked" : ""));
            lane.dataset.trackId = track.id;
            const label = el("button", "studio-tl-label", track.name);
            label.type = "button";
            label.setAttribute("aria-label", "Select " + track.name + " track");
            label.setAttribute("aria-pressed", String(graph.selectedTrackId === track.id));
            label.title = track.kind + (track.locked ? " • locked" : "");
            label.addEventListener("click", () => safe(host.apply, "select-track", { trackId: track.id }));
            const layer = el("div", "studio-tl-lane-clips");
            layer.style.width = (currentWorldWidth - headerWidth) + "px";
            // Culling prevents thousands of DOM nodes on long productions.
            for (const clip of track.clips) {
                if (clip.start > visibleEnd + 5 || clip.start + clip.duration < visibleStart - 5) continue;
                layer.append(renderClip(clip, track, graph));
            }
            lane.append(label, layer);
            lanes.append(lane);
        }
        if (!graph.tracks.length) {
            lanes.append(el("p", "studio-tl-empty", "Add a track in the Timeline tab to begin."));
        }
    }
    function redrawPlayhead() {
        const seconds = Math.max(0, host.currentTime());
        const x = headerWidth + seconds * scale;
        playhead.style.left = x + "px";
        const label = timeLabel(seconds);
        currentTime.textContent = label;
        playhead.setAttribute("aria-label", "Playhead " + label);
    }
    function render() {
        const graph = host.snapshot();
        const duration = durationForGraph(graph);
        const scrollLeft = viewport.scrollLeft;
        const viewWidth = Math.max(250, viewport.clientWidth);
        const visibleStart = Math.max(0, (scrollLeft - headerWidth) / scale);
        const visibleEnd = Math.max(0, (scrollLeft + viewWidth - headerWidth) / scale);
        currentWorldWidth = Math.max(viewWidth, Math.ceil(headerWidth + duration * scale + 24));
        world.style.width = currentWorldWidth + "px";
        // Redraw only markers/visible clips; retain scrollLeft and track controls.
        renderRuler(duration, visibleStart, visibleEnd);
        renderLanes(graph, visibleStart, visibleEnd);
        zoomValue.textContent = Math.round(scale) + " px/s";
        undoBtn.disabled = !host.history().undo;
        redoBtn.disabled = !host.history().redo;
        redrawPlayhead();
        lastScrollBucket = Math.floor(viewport.scrollLeft / Math.max(100, scale * 2));
    }

    function applyZoom(nextScale) {
        const midpoint = viewport.scrollLeft + viewport.clientWidth / 2;
        const centeredTime = Math.max(0, (midpoint - headerWidth) / scale);
        scale = Core.zoom(nextScale);
        zoomSlider.value = String(scale);
        try { localStorage.setItem("bratAnimator.timeline.zoom", String(scale)); } catch (_) {}
        render();
        viewport.scrollLeft = Math.max(0, headerWidth + centeredTime * scale - viewport.clientWidth / 2);
        render();
    }

    function pointerTime(event) {
        const box = viewport.getBoundingClientRect();
        return Math.max(0, (event.clientX - box.left + viewport.scrollLeft - headerWidth) / scale);
    }
    function seekOnRuler(event) {
        if (event.target.closest(".studio-tl-clip")) return;
        if (event.button !== 0) return;
        safe(host.seek, pointerTime(event));
        redrawPlayhead();
    }
    function clearGuide() {
        root.classList.remove("is-dragging");
        $("studioTlSnapGuide").hidden = true;
        for (const node of world.querySelectorAll(".is-dragging")) {
            node.classList.remove("is-dragging");
            node.style.transform = "";
        }
    }

    function updateGesture(event) {
        if (!drag) return;
        const delta = event.clientX - drag.startX;
        const track = document.elementFromPoint(event.clientX, event.clientY)?.closest(".studio-tl-lane");
        const targetTrackId = drag.mode === "move" && track ? track.dataset.trackId : drag.startTrack;
        let change;
        try {
            change = Core.gesture(drag.graph, drag.clipId, drag.mode, delta, scale, {
                toTrackId: targetTrackId, snap: snapping, playhead: drag.playhead
            });
        } catch (_) {
            change = Core.gesture(drag.graph, drag.clipId, drag.mode, delta, scale, {
                toTrackId: drag.startTrack, snap: snapping, playhead: drag.playhead
            });
        }
        drag.plan = change;
        drag.moved = drag.moved || Math.abs(delta) > 3;
        if (drag.mode === "move") {
            drag.node.style.transform = "translateX(" +
                ((change.args.start - drag.startTime) * scale) + "px)";
        } else {
            const start = change.args.start;
            const end = start + change.args.duration;
            drag.node.style.transform = "translateX(" + ((start - drag.startTime) * scale) + "px)";
            drag.node.style.width = Math.max(3, (end - start) * scale) + "px";
        }
        const guide = $("studioTlSnapGuide");
        if (change.snapped && change.marker) {
            guide.hidden = false;
            guide.style.left = (headerWidth + change.marker.at * scale) + "px";
        } else guide.hidden = true;
        tell((drag.mode === "move" ? "Move" : "Trim") + " • " +
            timeLabel(change.args.start) + " • snapping " + (change.snapped ? "active" : "off"));
    }
    function finishGesture(event, commit) {
        if (!drag || drag.pointerId !== event.pointerId) return;
        const prev = drag;
        drag = null;
        clearGuide();
        if (!commit) { render(); return; }
        if (prev.moved && prev.plan) {
            try {
                // Apply once: no intermediate project writes while dragging.
                host.apply(prev.plan.operation, prev.plan.args);
                tell("Clip updated • one undo step");
            } catch (error) {
                tell(error.message, true);
            }
        } else {
            safe(host.apply, "select-clip", { clipId: prev.clipId });
        }
        render();
    }
    viewport.addEventListener("pointerdown", event => {
        const target = event.target.closest(".studio-tl-clip");
        if (!target) return;
        if (event.button !== 0 || drag) return;
        const graph = host.snapshot(), clipId = target.dataset.clipId;
        const track = graph.tracks.find(item => item.id === target.dataset.trackId);
        const clip = track?.clips.find(item => item.id === clipId);
        if (!clip || track.locked) {
            tell("Unlock the track before editing its clips.", true);
            return;
        }
        const mode = event.target.closest(".studio-tl-handle")?.dataset.gesture || "move";
        drag = { pointerId: event.pointerId, node: target, graph,
            startX: event.clientX, startTime: clip.start, startTrack: track.id,
            mode, clipId, playhead: host.currentTime(), moved: false, plan: null };
        root.classList.add("is-dragging");
        target.classList.add("is-dragging");
        viewport.setPointerCapture(event.pointerId);
        event.preventDefault();
    });
    viewport.addEventListener("pointermove", event => {
        if (drag && drag.pointerId === event.pointerId) updateGesture(event);
    });
    viewport.addEventListener("pointerup", event => finishGesture(event, true));
    viewport.addEventListener("pointercancel", event => finishGesture(event, false));
    viewport.addEventListener("lostpointercapture", event => {
        if (drag && event.pointerId === drag.pointerId) finishGesture(event, false);
    });
    ruler.addEventListener("click", seekOnRuler);
    lanes.addEventListener("click", event => {
        if (!event.target.closest(".studio-tl-clip") && event.target.closest(".studio-tl-lane-clips")) {
            seekOnRuler(event);
        }
    });
    viewport.addEventListener("keydown", event => {
        const clipEl = event.target.closest(".studio-tl-clip");
        if (!clipEl || event.altKey) return;
        const graph = host.snapshot();
        const track = graph.tracks.find(entry => entry.clips.some(c => c.id === clipEl.dataset.clipId));
        const clip = track?.clips.find(entry => entry.id === clipEl.dataset.clipId);
        if (!clip) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            if (track.locked) return tell("Unlock this track first.", true);
            const step = event.shiftKey ? 1 : 1 / 30;
            const delta = (event.key === "ArrowRight" ? 1 : -1) * step * scale;
            const plan = Core.gesture(graph, clip.id, "move", delta, scale,
                { snap: snapping, playhead: host.currentTime() });
            safe(host.apply, plan.operation, plan.args);
            render();
            lanes.querySelector('[data-clip-id="' + CSS.escape(clip.id) + '"]')?.focus();
        } else if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            if (!track.locked) safe(host.apply, "remove-clip", { clipId: clip.id });
        }
    });

    viewport.addEventListener("dragover", event => {
        const lane = event.target.closest(".studio-tl-lane");
        if (lane && event.dataTransfer?.types?.includes("Files")) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
        }
    });
    viewport.addEventListener("drop", async event => {
        const lane = event.target.closest(".studio-tl-lane");
        if (!lane || !event.dataTransfer?.files?.length) return;
        event.preventDefault();
        const target = lane.dataset.trackId;
        const files = [...event.dataTransfer.files];
        const at = pointerTime(event);
        for (const file of files) {
            try {
                await host.importMedia(file, target);
                const id = host.snapshot().selectedClipId;
                if (id) {
                    const clip = host.snapshot().tracks.flatMap(t => t.clips).find(c => c.id === id);
                    const start = Math.min(Math.max(0, at), 86400 - (clip?.duration || 0));
                    host.apply("move-clip", { clipId: id, start });
                }
                tell("Imported: " + file.name);
            } catch (error) { tell("Import failed: " + error.message, true); }
        }
        render();
    });

    zoomSlider.addEventListener("input", () => applyZoom(Number(zoomSlider.value)));
    $("studioTlZoomIn").addEventListener("click", () => applyZoom(scale * 1.5));
    $("studioTlZoomOut").addEventListener("click", () => applyZoom(scale / 1.5));
    $("studioTlFit").addEventListener("click", () =>
        applyZoom((viewport.clientWidth - headerWidth - 34) /
            Math.max(minimumDuration, host.duration(), Tracks.endTime(host.snapshot()))));
    snapCheckbox.addEventListener("change", () => {
        snapping = snapCheckbox.checked;
        try { localStorage.setItem("bratAnimator.timeline.snap", String(snapping)); } catch (_) {}
        tell("Snapping " + (snapping ? "enabled" : "disabled"));
    });
    undoBtn.addEventListener("click", () => { safe(host.undo); render(); });
    redoBtn.addEventListener("click", () => { safe(host.redo); render(); });
    $("studioTlSplit").addEventListener("click", () => {
        const graph = host.snapshot(), clip = graph.tracks.flatMap(t => t.clips)
            .find(c => c.id === graph.selectedClipId);
        if (!clip) return tell("Select a clip to split.", true);
        safe(host.apply, "split-clip", { clipId: clip.id, at: host.currentTime() });
    });
    // Keep app shortcuts unaffected outside the timeline.
    root.addEventListener("keydown", event => {
        if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
        if (!["z", "y"].includes(event.key.toLowerCase())) return;
        event.preventDefault();
        if (event.key.toLowerCase() === "y" || event.shiftKey) safe(host.redo);
        else safe(host.undo);
        render();
    });
    viewport.addEventListener("scroll", () => {
        if (drag) return;
        const key = Math.floor(viewport.scrollLeft / Math.max(100, scale * 2));
        if (key !== lastScrollBucket) requestRender();
    }, { passive: true });
    window.addEventListener("brat:multitrack-changed", requestRender);
    window.addEventListener("resize", requestRender);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(requestRender) : null;
    observer?.observe(viewport);
    // Reading playhead clock does not mutate data or trigger React-style rerenders.
    const ticker = setInterval(() => {
        if (document.hidden || !document.body.classList.contains("studio-editor-open")) return;
        redrawPlayhead();
        undoBtn.disabled = !host.history().undo;
        redoBtn.disabled = !host.history().redo;
    }, 140);
    window.addEventListener("pagehide", () => { clearInterval(ticker); observer?.disconnect(); }, { once: true });
    window.BratTimelineUI = Object.freeze({ render, zoomTo: applyZoom, seek: seconds => host.seek(seconds) });
    render();
})();
