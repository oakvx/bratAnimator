/* v5 editor integration. Rendering remains shared by preview and every export. */
(function () {
    'use strict';
    const Motion = window.BratMotion;
    const Assets = window.BratAssets;
    const $ = id => document.getElementById(id);
    const strings = window.BratV5Strings = {
        editorMode: ['editor mode', 'modalità editor'], simple: ['simple', 'semplice'], advanced: ['advanced', 'avanzata'],
        scope: ['apply changes to', 'applica modifiche a'], project: ['whole project', 'intero progetto'], selected: ['selected phrase', 'frase selezionata'],
        phrase: ['phrase', 'frase'], inherit: ['use project settings', 'usa impostazioni del progetto'],
        entrance: ['text entrance', 'ingresso del testo'], none: ['none', 'nessuno'], horizontal: ['horizontal stretch', 'stretch orizzontale'], vertical: ['vertical stretch', 'stretch verticale'], elastic: ['elastic stretch', 'stretch elastico'],
        tilted: ['tilted elastic preset', 'preset inclinato elastico'], duration: ['duration (ms)', 'durata (ms)'], intensity: ['stretch intensity', 'intensità stretch'], random: ['random angle for each visual row', 'angolo casuale per ogni riga visiva'], angle: ['maximum angle', 'angolo massimo'], rerollLine: ['new angles for phrase', 'nuovi angoli della frase'], rerollAll: ['new angles for project', 'nuovi angoli del progetto'],
        customFont: ['upload fonts', 'carica font'], replaceFonts: ['replace missing fonts with system font', 'sostituisci font mancanti con quello di sistema'],
        bilingual: ['bilingual lyrics', 'testo bilingue'], translation: ['translation of selected phrase', 'traduzione della frase selezionata'], translationImport: ['paste translated lines or LRC', 'incolla righe tradotte o LRC'], importTranslation: ['associate translations', 'associa traduzioni'], translationFile: ['load translated text', 'carica testo tradotto'], translationSize: ['translation size', 'dimensione traduzione'], translationFont: ['translation font', 'font traduzione'], translationColor: ['translation color', 'colore traduzione'], assign: ['assign to selected phrase', 'assegna alla frase selezionata'],
        beats: ['music effects', 'effetti musicali'], enableBeats: ['enable music effects', 'attiva effetti musicali'], beatSource: ['beat source', 'origine battiti'], estimated: ['estimated from loaded audio', 'stimati dall’audio caricato'], manual: ['manual BPM', 'BPM manuali'], offset: ['beat offset (seconds)', 'offset battiti (secondi)'], pulse: ['pulse intensity', 'intensità pulsazione'], textPulse: ['pulse text', 'pulsa il testo'], backgroundZoom: ['zoom background', 'zoom dello sfondo'], colorCycle: ['color transitions', 'transizioni di colore'],
        interval: ['export interval', 'intervallo di esportazione'], enableRange: ['export selected interval', 'esporta intervallo selezionato'], start: ['start (seconds)', 'inizio (secondi)'], end: ['end (seconds)', 'fine (secondi)'], useStart: ['start at playhead', 'inizia dalla posizione attuale'], useEnd: ['end at playhead', 'termina alla posizione attuale'],
        bundle: ['complete portable project', 'progetto completo portabile'], exportBundle: ['export complete project', 'esporta progetto completo'], importBundle: ['open complete project', 'apri progetto completo'], cancel: ['cancel', 'annulla'], editCanvas: ['edit text in preview', 'modifica testo nell’anteprima'], editHint: ['Drag to move. Corners resize, side handles stretch. Escape cancels.', 'Trascina per spostare. Gli angoli ridimensionano, le maniglie laterali applicano lo stretch. Escape annulla.'],
        editShort: ['edit text', 'modifica'], lineSettings: ['phrase settings', 'impostazioni frase'], noPhrase: ['Load lyrics to select a phrase.', 'Carica un testo per selezionare una frase.'],
        unmatched: ['unmatched translations', 'traduzioni da abbinare'], saved: ['changes saved', 'modifiche salvate'], loaded: ['complete project opened', 'progetto completo aperto'], fontLoaded: ['font loaded', 'font caricato'], noAudioBeats: ['Load audio or choose manual BPM.', 'Carica un audio oppure scegli BPM manuali.'], invalidRange: ['Choose an interval within the project duration, with end after start.', 'Scegli un intervallo nella durata del progetto, con fine successiva all’inizio.']
    };
    function lang() { return window.BratI18n?.getSavedLanguage() || 'en'; }
    function t(key) { return strings[key]?.[lang() === 'it' ? 1 : 0] || key; }
    function label(key, tag = 'span') { return `<${tag} data-v5-key="${key}">${strings[key]?.[0] || key}</${tag}>`; }
    function field(id, key, control) { return `<div class="v5-field"><label for="${id}" data-v5-key="${key}">${strings[key][0]}</label>${control}</div>`; }
    function range(id, key, min, max, value, step = 1) { return field(id, key, `<div class="v5-range"><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><output for="${id}"></output></div>`); }
    function check(id, key, checked = false) { return `<label class="inline-check"><input id="${id}" type="checkbox" ${checked ? 'checked' : ''}>${label(key)}</label>`; }
    function button(id, key) { return `<button id="${id}" type="button" data-v5-key="${key}">${strings[key][0]}</button>`; }
    function block(id, key, content, extra = '') { return `<fieldset id="${id}" class="v5-block ${extra}"><legend data-v5-key="${key}">${strings[key][0]}</legend>${content}</fieldset>`; }

    document.querySelector('.panel-header').insertAdjacentHTML('afterend', `<div class="v5-preferences">${field('editorModeSelect', 'editorMode', `<select id="editorModeSelect"><option value="simple" data-v5-key="simple">simple</option><option value="advanced" data-v5-key="advanced">advanced</option></select>`)}<div id="v5Status" class="mini-copy" role="status"></div></div>`);
    $('textSettings').insertAdjacentHTML('afterbegin', `<div class="v5-scope advanced-only">${field('styleScopeSelect', 'scope', `<select id="styleScopeSelect"><option value="project" data-v5-key="project">whole project</option><option value="line" data-v5-key="selected">selected phrase</option></select>`)}${field('phraseSelect', 'phrase', '<select id="phraseSelect"></select>')}${button('inheritStyleBtn', 'inherit')}</div>`);
    $('textSettings').insertAdjacentHTML('beforeend', `<div class="advanced-only v5-font-upload">${field('customFontInput', 'customFont', '<input id="customFontInput" type="file" accept=".ttf,.otf,.woff,.woff2" multiple>')}<div id="fontStatus" class="mini-copy" role="status"></div>${button('replaceMissingFontsBtn', 'replaceFonts')}</div>`);
    $('textSettings').insertAdjacentHTML('afterend', block('entranceSettings', 'entrance', `<div class="tool-strip">${button('tiltedElasticBtn', 'tilted')}</div><div class="advanced-only">${field('entranceModeSelect', 'entrance', `<select id="entranceModeSelect"><option value="none" data-v5-key="none">none</option><option value="stretch-x" data-v5-key="horizontal">horizontal stretch</option><option value="stretch-y" data-v5-key="vertical">vertical stretch</option><option value="elastic" data-v5-key="elastic">elastic stretch</option></select>`)}${range('entranceDurationInput', 'duration', 100, 800, 320, 10)}${range('entranceIntensityInput', 'intensity', 0, 30, 15)}${check('randomAnglesCheckbox', 'random')}${range('randomAngleInput', 'angle', 0, 15, 8)}<div class="tool-strip">${button('rerollPhraseBtn', 'rerollLine')}${button('rerollProjectBtn', 'rerollAll')}</div></div>`));
    $('section-timing').insertAdjacentHTML('beforeend', block('translationSettings', 'bilingual', `${field('translationInput', 'translation', '<textarea id="translationInput" rows="2" class="compact-textarea" spellcheck="true"></textarea>')}${field('translationImportInput', 'translationImport', '<textarea id="translationImportInput" class="compact-textarea"></textarea>')}<div class="tool-strip">${button('associateTranslationsBtn', 'importTranslation')}<label class="file-button">${label('translationFile')}<input id="translationFileInput" type="file" accept=".txt,.lrc" hidden></label></div><div id="unmatchedTranslations" class="v5-unmatched"></div>${range('translationScaleInput', 'translationSize', 30, 100, 60)}${field('translationFontSelect', 'translationFont', '<select id="translationFontSelect"></select>')}${field('translationColorInput', 'translationColor', '<input id="translationColorInput" type="color" value="#555555">')}`, 'advanced-only'));
    $('section-timing').insertAdjacentHTML('beforeend', block('beatSettings', 'beats', `${check('beatEnabledCheckbox', 'enableBeats')}${field('beatSourceSelect', 'beatSource', '<select id="beatSourceSelect"><option value="audio" data-v5-key="estimated">estimated from loaded audio</option><option value="manual" data-v5-key="manual">manual BPM</option></select>')}<div class="row">${field('beatBpmInput', 'manual', '<input id="beatBpmInput" type="number" min="40" max="240" value="120">')}${field('beatOffsetInput', 'offset', '<input id="beatOffsetInput" type="number" value="0" step="0.01">')}</div>${range('beatPulseInput', 'pulse', 0, 10, 3)}<div class="v5-checks">${check('beatTextCheckbox', 'textPulse', true)}${check('beatBackgroundCheckbox', 'backgroundZoom')}${check('beatColorCheckbox', 'colorCycle')}</div><p id="beatStatus" class="mini-copy" role="status"></p>`, 'advanced-only'));
    $('section-export').insertAdjacentHTML('afterbegin', block('exportRangeSettings', 'interval', `${check('exportRangeCheckbox', 'enableRange')}<div class="row">${field('exportRangeStartInput', 'start', '<input id="exportRangeStartInput" type="number" min="0" value="0" step="0.01">')}${field('exportRangeEndInput', 'end', '<input id="exportRangeEndInput" type="number" min="0" step="0.01" placeholder="—">')}</div><div class="tool-strip">${button('rangeStartHereBtn', 'useStart')}${button('rangeEndHereBtn', 'useEnd')}</div><p id="exportRangeError" class="v5-error" role="status"></p>`, 'advanced-only'));
    $('section-project').insertAdjacentHTML('afterbegin', block('packageSettings', 'bundle', `<div class="tool-strip">${button('exportPackageBtn', 'exportBundle')}<label class="file-button">${label('importBundle')}<input id="importPackageInput" type="file" accept=".zip,.brat" hidden></label>${button('cancelPackageBtn', 'cancel')}</div><progress id="packageProgress" hidden max="1" value="0"></progress><div id="packageStatus" class="mini-copy" role="status"></div>`));
    const editButton = document.createElement('button');
    editButton.id = 'editCanvasBtn'; editButton.type = 'button'; editButton.innerHTML = `<span class="v5-long-label" data-v5-key="editCanvas">${t('editCanvas')}</span><span class="v5-short-label" data-v5-key="editShort">${t('editShort')}</span>`; editButton.setAttribute('aria-label', strings.editCanvas[0]); editButton.setAttribute('aria-pressed', 'false');
    document.querySelector('.stage-toolbar').insertBefore(editButton, document.querySelector('.stage-zoom-controls'));
    document.querySelector('.stage-canvas-zone').insertAdjacentHTML('beforeend', `<div id="canvasEditOverlay" class="v5-canvas-overlay" hidden tabindex="0" role="group" aria-label="text transform"><div class="v5-guide-x"></div><div class="v5-guide-y"></div><div id="canvasTextBox" class="v5-text-box" role="button" tabindex="0" aria-label="move selected text">${['nw','ne','sw','se','e','s'].map(handle => `<button type="button" class="v5-handle v5-handle-${handle}" data-handle="${handle}" aria-label="${['e','s'].includes(handle) ? 'stretch' : 'resize'} text"></button>`).join('')}</div></div>`);
    const hint = document.createElement('p'); hint.id = 'canvasEditHint'; hint.className = 'mini-copy v5-edit-hint'; hint.dataset.v5Key = 'editHint'; hint.textContent = t('editHint'); hint.hidden = true; document.querySelector('.stage-canvas-zone').after(hint);

    let selectedId = state.lyricRows[0]?.id || null;
    let syncing = false;
    let editing = false;
    let drag = null;
    let fontsReady = Promise.resolve();
    let fontError = null;
    let packageAbort = null;
    let unmatched = [];
    let analysisSource = null;
    let beats = [];
    let overlayLayout = null;
    let restoredFonts = null;
    const layoutCache = new Map();
    function cachedLayout(ctx, text, width, height, style, options) {
        const geometry = [style.fontFamily, style.fontScale, style.stretch, style.stretchY, style.letterSpacing, style.lineSpacing, style.positionX, style.verticalPosition, style.entrance];
        const key = JSON.stringify([text, width, height, geometry, options]);
        if (layoutCache.has(key)) return layoutCache.get(key);
        const layout = Motion.createLayout(ctx, text, width, height, style, options);
        if (layoutCache.size >= 64) layoutCache.delete(layoutCache.keys().next().value);
        layoutCache.set(key, layout);
        return layout;
    }
    const perLineKeys = ['fontFamily', 'fontScale', 'textColor', 'positionX', 'verticalPosition', 'stretch', 'stretchY', 'entrance', 'animationMode'];
    function rowById(id = selectedId) { return state.lyricRows.find(row => row.id === id); }
    function activeLine(time = state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec) { return state.timeline.find(line => time >= line.displayStart && time < line.displayEnd); }
    function rowForLine(line) { return rowById(line?.sourceRowId) || state.lyricRows.find(row => Math.abs(row.time - (line?.sourceTimestamp ?? -1)) < 0.001 && row.text.replace(/^\[[^\]]+\]\s*/, '') === line?.text); }
    function lineStyle(line) { const row = rowForLine(line); return { ...state.style, ...row?.style, entrance: BratCore.normalizeEntrance(row?.style?.entrance || state.style.entrance) }; }
    function status(message, error = false, target = 'v5Status') { const node = $(target); node.textContent = message; node.classList.toggle('v5-error', error); }
    function refresh(time = state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec) { renderPreviewAt(time); renderTimeline(); }
    function update(labelText, mutate) { commitProjectChange(labelText, () => { mutate(); syncFontOptions(); showEffectiveControls(); }); saveProjectSettings(); syncControls(); refresh(); }
    function editingRow() { return $('styleScopeSelect').value === 'line' ? rowById() : null; }
    function updateStyle(changes) {
        const row = editingRow();
        if (row) row.style = { ...row.style, ...changes };
        else state.style = { ...state.style, ...changes };
        if (row) syncRowsCache();
    }
    function syncRowsCache() { if (lrcRows?.__rows) lrcRows.__rows = state.lyricRows.map(row => ({ ...row, style: { ...row.style } })); }
    function localize() {
        document.querySelectorAll('[data-v5-key]').forEach(node => { node.textContent = t(node.dataset.v5Key); });
        syncOutputs();
    }
    function syncOutputs() {
        document.querySelectorAll('.v5-range').forEach(container => { const input = container.querySelector('input'); container.querySelector('output').textContent = input.value + (input.id.includes('Duration') ? 'ms' : input.id === 'randomAngleInput' ? '°' : '%'); });
    }
    const baseReadStyle = readStyleControls;
    readStyleControls = function () {
        if (syncing) return;
        const row = editingRow();
        if (!row) return baseReadStyle();
        const globalStyle = state.style;
        const globalMode = state.animationMode;
        baseReadStyle();
        const values = state.style;
        row.style = { ...row.style };
        for (const key of ['fontFamily', 'fontScale', 'textColor', 'verticalPosition', 'stretch']) {
            if (values[key] !== globalStyle[key]) row.style[key] = values[key];
            else delete row.style[key];
        }
        if (state.animationMode !== globalMode) row.style.animationMode = state.animationMode;
        else delete row.style.animationMode;
        state.style = globalStyle;
        state.animationMode = globalMode;
        syncRowsCache();
    };
    const baseWriteStyle = writeStyleControls;
    writeStyleControls = function (style, mode) {
        if (syncing) return baseWriteStyle(style, mode);
        $('styleScopeSelect').value = 'project';
        const result = baseWriteStyle(style, mode);
        syncControls();
        return result;
    };
    function showEffectiveControls() {
        const globalStyle = state.style, globalMode = state.animationMode;
        const row = editingRow();
        syncing = true;
        baseWriteStyle(row ? { ...globalStyle, ...row.style } : globalStyle, row?.style.animationMode || globalMode);
        state.style = globalStyle; state.animationMode = globalMode;
        syncing = false;
        syncTextSettingsControls();
    }
    function syncControls() {
        if (!rowById()) selectedId = state.lyricRows[0]?.id || null;
        const picker = $('phraseSelect');
        const oldValue = selectedId;
        picker.replaceChildren(...state.lyricRows.filter(row => row.text).map(row => { const option = new Option(`${secondsToTag(row.time)} ${row.text.slice(0, 55)}`, row.id); return option; }));
        if (oldValue) picker.value = oldValue;
        $('inheritStyleBtn').disabled = !editingRow();
        const row = rowById();
        $('translationInput').value = row?.translation || '';
        $('translationInput').disabled = !row;
        const style = editingRow() ? { ...state.style, ...editingRow().style } : state.style;
        const entrance = BratCore.normalizeEntrance(style.entrance);
        $('entranceModeSelect').value = entrance.mode;
        $('entranceDurationInput').value = entrance.duration;
        $('entranceIntensityInput').value = Math.round(entrance.intensity * 100);
        $('randomAnglesCheckbox').checked = entrance.randomAngles;
        $('randomAngleInput').value = entrance.angle;
        const translation = state.style.translation || {};
        $('translationScaleInput').value = Math.round((translation.fontScale ?? 0.6) * 100);
        $('translationColorInput').value = translation.color || '#555555';
        syncFontOptions();
        $('translationFontSelect').value = translation.fontFamily || state.style.fontFamily;
        const beat = BratCore.normalizeBeatEffects(state.beatEffects);
        $('beatEnabledCheckbox').checked = beat.enabled; $('beatSourceSelect').value = beat.source;
        $('beatBpmInput').value = beat.bpm; $('beatOffsetInput').value = beat.offset; $('beatPulseInput').value = Math.round(beat.pulse * 100);
        $('beatTextCheckbox').checked = beat.textPulse; $('beatBackgroundCheckbox').checked = beat.backgroundZoom; $('beatColorCheckbox').checked = beat.colorCycle;
        $('beatBpmInput').disabled = beat.source !== 'manual';
        $('beatStatus').textContent = beat.enabled && beat.source === 'audio' && !state.audioAnalysis?.usable ? t('noAudioBeats') : '';
        const range = state.exportRange;
        $('exportRangeCheckbox').checked = range.enabled; $('exportRangeStartInput').value = range.start || 0; $('exportRangeEndInput').value = range.end ?? '';
        showEffectiveControls(); syncOutputs(); syncOverlay();
    }
    function selectPhrase(id, scope = true) {
        selectedId = id;
        if (scope) $('styleScopeSelect').value = 'line';
        const index = state.lyricRows.findIndex(row => row.id === id);
        if (index >= 0) setSelectedRowIndexes([index]);
        syncControls();
    }
    $('styleScopeSelect').addEventListener('change', () => { if (!rowById() && $('styleScopeSelect').value === 'line') { $('styleScopeSelect').value = 'project'; status(t('noPhrase')); } syncControls(); });
    $('phraseSelect').addEventListener('change', () => { selectPhrase($('phraseSelect').value); const line = state.timeline.find(line => line.sourceRowId === selectedId); if (line) seekTo(line.displayStart + 0.001); });
    $('inheritStyleBtn').addEventListener('click', () => update('inherit project style', () => { const row = editingRow(); if (row) row.style = {}; syncRowsCache(); }));
    const entranceInputs = ['entranceModeSelect','entranceDurationInput','entranceIntensityInput','randomAnglesCheckbox','randomAngleInput'];
    entranceInputs.forEach(id => $(id).addEventListener('change', () => {
        const entrance = BratCore.normalizeEntrance({ ...((editingRow()?.style || state.style).entrance || {}), mode: $('entranceModeSelect').value, duration: Number($('entranceDurationInput').value), intensity: Number($('entranceIntensityInput').value) / 100, randomAngles: $('randomAnglesCheckbox').checked, angle: Number($('randomAngleInput').value) });
        update('change entrance', () => updateStyle({ entrance }));
    }));
    entranceInputs.forEach(id => $(id).addEventListener('input', syncOutputs));
    $('tiltedElasticBtn').addEventListener('click', () => update('tilted elastic preset', () => {
        updateStyle({ entrance: BratCore.normalizeEntrance({ mode: 'elastic', duration: 320, intensity: 0.15, randomAngles: true, angle: 8 }) });
        if (editingRow()) editingRow().style.animationMode = 'line';
        else { state.animationMode = 'line'; animationModeSelect.value = 'line'; }
    }));
    $('rerollPhraseBtn').addEventListener('click', () => update('new phrase angles', () => { const row = rowById(); if (row) row.style = { ...row.style, entrance: { ...BratCore.normalizeEntrance(row.style?.entrance || state.style.entrance), seed: ((row.style?.entrance?.seed || 0) + 1) >>> 0 } }; syncRowsCache(); }));
    $('rerollProjectBtn').addEventListener('click', () => update('new project angles', () => { state.seed = (state.seed + 1) >>> 0; }));
    $('translationInput').addEventListener('change', () => update('edit translation', () => { const row = rowById(); if (row) row.translation = $('translationInput').value; syncRowsCache(); }));
    $('associateTranslationsBtn').addEventListener('click', () => {
        const result = BratCore.associateTranslations(getLrcLineObjects(), $('translationImportInput').value);
        update('import translations', () => { state.lyricRows = result.rows; unmatched = result.unmatched; syncRowsCache(); });
        renderUnmatched();
    });
    function renderUnmatched() {
        const container = $('unmatchedTranslations'); container.replaceChildren();
        if (!unmatched.length) return;
        const heading = document.createElement('p'); heading.textContent = t('unmatched'); container.appendChild(heading);
        unmatched.forEach((item, index) => { const wrapper = document.createElement('div'); wrapper.className = 'v5-unmatched-row'; const text = document.createElement('span'); text.textContent = item.text; const action = document.createElement('button'); action.type = 'button'; action.textContent = t('assign'); action.addEventListener('click', () => { if (!rowById()) return; update('assign translation', () => { rowById().translation = item.text; unmatched.splice(index, 1); syncRowsCache(); }); renderUnmatched(); }); wrapper.append(text, action); container.append(wrapper); });
    }
    $('translationFileInput').addEventListener('change', async event => { const file = event.target.files[0]; if (file) { $('translationImportInput').value = await file.text(); $('associateTranslationsBtn').click(); } event.target.value = ''; });
    ['translationScaleInput','translationColorInput','translationFontSelect'].forEach(id => $(id).addEventListener('change', () => update('translation appearance', () => { state.style.translation = { fontScale: Number($('translationScaleInput').value) / 100, color: $('translationColorInput').value, fontFamily: $('translationFontSelect').value }; })));
    ['beatEnabledCheckbox','beatSourceSelect','beatBpmInput','beatOffsetInput','beatPulseInput','beatTextCheckbox','beatBackgroundCheckbox','beatColorCheckbox'].forEach(id => $(id).addEventListener('change', () => update('music effects', () => { state.beatEffects = BratCore.normalizeBeatEffects({ enabled: $('beatEnabledCheckbox').checked, source: $('beatSourceSelect').value, bpm: Number($('beatBpmInput').value), offset: Number($('beatOffsetInput').value), pulse: Number($('beatPulseInput').value) / 100, textPulse: $('beatTextCheckbox').checked, backgroundZoom: $('beatBackgroundCheckbox').checked, colorCycle: $('beatColorCheckbox').checked }); })));
    function readRange() { return BratCore.normalizeExportRange({ enabled: $('exportRangeCheckbox').checked, start: Number($('exportRangeStartInput').value), end: $('exportRangeEndInput').value === '' ? null : Number($('exportRangeEndInput').value) }); }
    function validateRange() { try { Motion.resolveExportRange(state.exportRange, Math.max(1, getTimelineDuration() + 0.6, getAudioExportDuration())); $('exportRangeError').textContent = ''; return true; } catch (_) { $('exportRangeError').textContent = t('invalidRange'); return false; } }
    ['exportRangeCheckbox','exportRangeStartInput','exportRangeEndInput'].forEach(id => $(id).addEventListener('change', () => { update('export interval', () => { state.exportRange = readRange(); }); validateRange(); updateExportEstimate(); }));
    $('rangeStartHereBtn').addEventListener('click', () => { $('exportRangeCheckbox').checked = true; $('exportRangeStartInput').value = (state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec).toFixed(2); $('exportRangeStartInput').dispatchEvent(new Event('change')); });
    $('rangeEndHereBtn').addEventListener('click', () => { $('exportRangeCheckbox').checked = true; $('exportRangeEndInput').value = (state.isPlaying ? getElapsedSeconds() : state.pausedElapsedSec).toFixed(2); $('exportRangeEndInput').dispatchEvent(new Event('change')); });

    function syncFontOptions() {
        const keep = fontFamilySelect.value;
        fontFamilySelect.querySelectorAll('[data-custom-font]').forEach(option => option.remove());
        for (const font of state.fonts) { const option = new Option(font.name, font.family); option.dataset.customFont = font.id; fontFamilySelect.add(option); }
        fontFamilySelect.value = keep;
        const translationKeep = $('translationFontSelect').value;
        $('translationFontSelect').replaceChildren(...Array.from(fontFamilySelect.options, option => new Option(option.textContent, option.value)));
        if (translationKeep) $('translationFontSelect').value = translationKeep;
    }
    function prepareProjectFonts() {
        const signature = JSON.stringify(state.fonts);
        if (signature === restoredFonts) return fontsReady;
        restoredFonts = signature; fontError = null;
        fontsReady = Assets.prepareFonts(state.fonts, loadMediaBlob).then(() => { layoutCache.clear(); syncFontOptions(); showEffectiveControls(); refresh(); $('fontStatus').textContent = ''; }).catch(error => { fontError = error; status(error.message, true, 'fontStatus'); });
        return fontsReady;
    }
    $('customFontInput').addEventListener('change', async event => {
        const files = Array.from(event.target.files);
        for (const file of files) {
            try {
                const assetId = await storeMediaBlob(file, file.name, 'font');
                const font = await Assets.registerFont(file, { name: file.name, assetId });
                layoutCache.clear();
                update('upload font', () => { state.fonts = [...state.fonts, font]; updateStyle({ fontFamily: font.family }); });
                restoredFonts = JSON.stringify(state.fonts); fontError = null; status(`${t('fontLoaded')}: ${file.name}`, false, 'fontStatus');
            } catch (error) { status(error.message, true, 'fontStatus'); }
        }
        event.target.value = '';
    });
    $('replaceMissingFontsBtn').addEventListener('click', () => update('replace custom fonts', () => {
        const families = new Set(state.fonts.map(font => font.family));
        const fallback = fontFamilySelect.options[0].value;
        if (families.has(state.style.fontFamily)) state.style.fontFamily = fallback;
        if (families.has(state.style.translation?.fontFamily)) state.style.translation.fontFamily = fallback;
        state.lyricRows.forEach(row => { if (families.has(row.style?.fontFamily)) row.style.fontFamily = fallback; });
        state.fonts = []; fontError = null; restoredFonts = null; Assets.removeFonts(); prepareProjectFonts();
    }));
    async function prepareExport(checkRange = true) {
        readStyleControls();
        if (checkRange && !validateRange()) return false;
        await prepareProjectFonts();
        if (fontError) { status(fontError.message, true, 'fontStatus'); return false; }
        try { await Assets.awaitFonts(state.fonts); return true; } catch (error) { status(error.message, true, 'fontStatus'); return false; }
    }
    function progress(value) { $('packageProgress').hidden = false; $('packageProgress').value = typeof value === 'number' ? value : (value?.completed || 0) / Math.max(1, value?.total || 1); }
    async function packageAction(action) {
        if (packageAbort) return;
        packageAbort = new AbortController(); $('exportPackageBtn').disabled = true; $('importPackageInput').disabled = true; $('cancelPackageBtn').hidden = false;
        try { await action({ signal: packageAbort.signal, onProgress: progress }); }
        catch (error) { status(error.message, true, 'packageStatus'); }
        finally { packageAbort = null; $('exportPackageBtn').disabled = false; $('importPackageInput').disabled = false; $('cancelPackageBtn').hidden = true; $('packageProgress').hidden = true; }
    }
    $('cancelPackageBtn').hidden = true;
    $('cancelPackageBtn').addEventListener('click', () => packageAbort?.abort());
    $('exportPackageBtn').addEventListener('click', () => packageAction(async options => { const blob = await Assets.exportPackage(structuredClone(buildProjectPayload()), loadMediaBlob, options); downloadBlob(blob, `${buildExportFileBase()}.brat.zip`); window.dispatchEvent(new CustomEvent('brat:backup-exported')); status(t('saved'), false, 'packageStatus'); }));
    async function persistAssets(assets) {
        if (!assets.length) return;
        const db = await openMediaDb();
        if (!db) throw new Error('Local media storage is unavailable.');
        try { await new Promise((resolve, reject) => { const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite'); assets.forEach(asset => tx.objectStore(MEDIA_STORE_NAME).put({ ...asset, savedAt: new Date().toISOString() })); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('Could not save project assets.')); tx.onabort = tx.onerror; }); } finally { db.close(); }
    }
    $('importPackageInput').addEventListener('change', event => { const file = event.target.files[0]; event.target.value = ''; if (!file) return; packageAction(async options => {
        const result = await Assets.importPackage(file, options);
        // Fresh IDs keep a failed import or an older snapshot from overwriting existing media.
        const ids = new Map(result.assets.map(asset => [asset.id, `import-${BratCore.createRowId()}`]));
        const payload = BratCore.migrateProjectPayload(result.payload);
        for (const media of [payload.audio, payload.background, ...payload.fonts]) if (ids.has(media.assetId)) media.assetId = ids.get(media.assetId);
        const assets = result.assets.map(asset => ({ ...asset, id: ids.get(asset.id) }));
        // Validate font binaries before committing media or replacing the current project.
        for (const font of payload.fonts) { const asset = assets.find(asset => asset.id === font.assetId); if (!asset) throw new Error(`Missing font: ${font.name}`); const face = new FontFace(font.family, await asset.blob.arrayBuffer()); await face.load(); }
        if (options.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        await persistAssets(assets);
        if (window.BratEditorWorkspace?.restoreImportedPayload) {
            await window.BratEditorWorkspace.restoreImportedPayload(payload);
        } else {
            restoreProjectSettings(payload);
            saveProjectSettings();
        }
        await prepareProjectFonts();
        window.dispatchEvent(new CustomEvent('brat:project-imported'));
        status(t('loaded'), false, 'packageStatus');
    }); });

    const originalRefreshRows = refreshFromRows;
    refreshFromRows = function (rows, options) {
        originalRefreshRows(rows, options);
        lrcRows.querySelectorAll('.lrc-row').forEach(wrapper => {
            const index = Number(wrapper.dataset.index), row = rows[index]; if (!row?.text) return;
            const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'row-style-btn'; edit.textContent = t('lineSettings');
            edit.addEventListener('click', () => { selectPhrase(row.id); document.querySelector('[data-open-tab="design"]').click(); $('textSettings').scrollIntoView({ block: 'start' }); }); wrapper.appendChild(edit);
        });
        syncControls();
    };
    const originalRestore = restoreProjectSettings;
    restoreProjectSettings = function (payload, options) {
        $('styleScopeSelect').value = 'project';
        const restored = originalRestore(payload, options);
        selectedId = state.lyricRows[0]?.id || null; restoredFonts = null;
        syncControls(); prepareProjectFonts(); renderLrcRows(); return restored;
    };
    const originalSave = saveProjectSettings;
    saveProjectSettings = function () { originalSave(); syncOverlay(); };
    const originalRenderTimeline = renderTimeline;
    renderTimeline = function () {
        originalRenderTimeline(); if (!state.exportRange.enabled) return;
        const ctx = timelineCanvas.getContext('2d'), duration = Math.max(getTimelineDuration(), 1);
        ctx.save(); ctx.strokeStyle = '#b85c32'; ctx.fillStyle = '#b85c32'; ctx.lineWidth = 3;
        [state.exportRange.start, state.exportRange.end ?? duration].forEach(time => { const x = Math.max(0, Math.min(timelineCanvas.width, time / duration * timelineCanvas.width)); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, timelineCanvas.height); ctx.stroke(); }); ctx.restore();
    };
    const originalEstimate = updateExportEstimate;
    updateExportEstimate = function () { originalEstimate(); if (state.exportRange.enabled) { try { const range = Motion.resolveExportRange(state.exportRange, Math.max(1, getTimelineDuration() + 0.6, getAudioExportDuration())); exportEstimate.textContent += ` · ${range.start.toFixed(2)}–${range.end.toFixed(2)}s (${range.duration.toFixed(2)}s)`; } catch (_) {} } };

    // Resolve per-phrase settings without altering the project defaults or any saved UI values.
    const originalDrawScene = drawScene;
    drawScene = function (ctx, width, height, time, options = {}) {
        const oldStyle = state.style, oldMode = state.animationMode;
        const line = activeLine(time);
        if (oldStyle.lyricsMode === 'brat' && line) { state.style = lineStyle(line); state.animationMode = rowForLine(line)?.style?.animationMode || oldMode; }
        try {
            const envelope = getBeatEnvelope(time);
            if (state.beatEffects.enabled && state.beatEffects.colorCycle) state.style = { ...state.style, textColor: mixHex(state.style.textColor, state.style.wordAnimation?.color || '#ffffff', envelope * 0.55) };
            originalDrawScene(ctx, width, height, time, options);
        } finally { state.style = oldStyle; state.animationMode = oldMode; }
    };
    function getBeatEnvelope(time) {
        if (analysisSource !== state.audioAnalysis) { analysisSource = state.audioAnalysis; beats = Motion.estimateBeats(analysisSource); }
        return Motion.beatEnvelope(time + (state.beatEffects.source === 'audio' ? getAudioTimelineOffset() : 0), state.beatEffects, beats);
    }
    const originalBackground = drawBackgroundMedia;
    drawBackgroundMedia = function (ctx, width, height, time) {
        const zoom = state.beatEffects.enabled && state.beatEffects.backgroundZoom ? getBeatEnvelope(time) * state.beatEffects.pulse : 0;
        ctx.save(); ctx.translate(width / 2, height / 2); ctx.scale(1 + zoom, 1 + zoom); ctx.translate(-width / 2, -height / 2); originalBackground(ctx, width, height, time); ctx.restore();
    };
    const originalDrawContent = drawSceneContent;
    drawSceneContent = function (ctx, width, height, time, options = {}) {
        const visible = getVisibleTextAt(time), row = rowForLine(visible.line);
        const entrance = BratCore.normalizeEntrance(state.style.entrance);
        const special = state.style.lyricsMode === 'brat' && (editing || entrance.mode !== 'none' || entrance.randomAngles || row?.translation || state.style.positionX !== undefined || state.style.stretchY !== undefined || state.beatEffects.enabled);
        if (!special) return originalDrawContent(ctx, width, height, time, options);
        const theme = getFrameTheme(time, visible);
        ctx.save(); ctx.clearRect(0, 0, width, height);
        if (!options.textOnly) { drawConfiguredBackground(ctx, width, height, theme); if (state.background.target !== 'text') drawBackgroundMedia(ctx, width, height, time); }
        const fullText = visible.line?.text ?? visible.text;
        const translation = row?.translation ? { text: row.translation, ...(state.style.translation || {}), fontFamily: state.style.translation?.fontFamily || state.style.fontFamily } : null;
        const layout = cachedLayout(ctx, fullText, width, height, state.style, { seed: state.seed, lineId: row?.id || 'placeholder', translation, beatPulseMax: state.beatEffects.enabled && state.beatEffects.textPulse ? state.beatEffects.pulse : 0 });
        const revealed = Array.from(visible.text).length;
        const pulse = state.beatEffects.enabled && state.beatEffects.textPulse ? 1 + getBeatEnvelope(time) * state.beatEffects.pulse : 1;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = theme.text; ctx.globalAlpha = visible.alpha ?? 1;
        ctx.font = `400 ${layout.fontSize}px ${layout.fontFamily}`; ctx.filter = `blur(${state.style.blur || 0}px)`;
        try { ctx.letterSpacing = `${layout.letterSpacing}px`; } catch (_) {}
        layout.rows.forEach((visual, index) => {
            const text = Array.from(fullText).slice(visual.startChar, Math.min(visual.endChar + 1, revealed)).join('');
            if (!text) return;
            const firstChar = visible.line?.chars?.find(char => char.endChar >= visual.startChar);
            const start = ['typewriter','word','letter-chunks','phrase'].includes(state.animationMode) ? Math.max(visible.line?.displayStart || 0, firstChar?.timestamp || 0) : visible.line?.displayStart || 0;
            const duration = Math.max(0.001, (visible.line?.vocalEnd ?? visible.line?.displayEnd ?? 1) - start);
            const transform = Motion.getRowTransform(entrance, time - start, duration, index, visual.angle);
            ctx.save(); ctx.translate(visual.x, visual.y); ctx.rotate(transform.rotation); ctx.scale(layout.stretchX * transform.scaleX * pulse, layout.stretchY * transform.scaleY * pulse); ctx.globalAlpha *= transform.alpha ?? 1;
            // Left-align the revealed prefix within the full row, keeping glyph positions stable.
            ctx.textAlign = 'left'; ctx.fillText(text, -visual.width / 2, 0); ctx.restore();
        });
        ctx.filter = 'none'; ctx.globalAlpha = 1;
        if (translation && visible.text) {
            ctx.font = `400 ${layout.translationFontSize}px ${layout.translationFontFamily}`; ctx.fillStyle = state.style.translation?.color || theme.text; ctx.textAlign = 'center';
            try { ctx.letterSpacing = '0px'; } catch (_) {}
            layout.translationRows.forEach(item => ctx.fillText(item.text, item.x, item.y));
        }
        ctx.restore(); if (options.guides) drawSafeZones(ctx, width, height);
    };

    function currentLayout() {
        const line = activeLine(); if (!line || state.style.lyricsMode !== 'brat') return null;
        const row = rowForLine(line); if (!row) return null;
        const style = lineStyle(line);
        const layout = cachedLayout(previewCtx, line.text, previewCanvas.width, previewCanvas.height, style, { seed: state.seed, lineId: row.id, translation: row.translation ? { text: row.translation, ...(state.style.translation || {}) } : null, beatPulseMax: state.beatEffects.enabled && state.beatEffects.textPulse ? state.beatEffects.pulse : 0 });
        return { line, row, style, layout };
    }
    function syncOverlay() {
        const overlay = $('canvasEditOverlay'); if (!overlay) return;
        const current = editing ? currentLayout() : null;
        overlay.hidden = !current; $('canvasEditHint').hidden = !editing;
        if (!current) return;
        overlayLayout = current;
        const canvasRect = previewCanvas.getBoundingClientRect(), zoneRect = overlay.parentElement.getBoundingClientRect();
        overlay.style.left = `${canvasRect.left - zoneRect.left + overlay.parentElement.scrollLeft}px`; overlay.style.top = `${canvasRect.top - zoneRect.top + overlay.parentElement.scrollTop}px`;
        overlay.style.width = `${canvasRect.width}px`; overlay.style.height = `${canvasRect.height}px`;
        const bounds = current.layout.totalBounds || current.layout.bounds;
        const box = $('canvasTextBox'); box.style.left = `${bounds.x / previewCanvas.width * 100}%`; box.style.top = `${bounds.y / previewCanvas.height * 100}%`; box.style.width = `${bounds.width / previewCanvas.width * 100}%`; box.style.height = `${bounds.height / previewCanvas.height * 100}%`;
        overlay.classList.toggle('v5-centered-x', Math.abs((current.style.positionX ?? 0.5) - 0.5) < 0.012);
        overlay.classList.toggle('v5-centered-y', Math.abs(current.style.verticalPosition || 0) < 0.012);
    }
    $('editCanvasBtn').addEventListener('click', () => {
        if (state.style.lyricsMode !== 'brat') { document.querySelector('[data-open-tab="design"]').click(); status('Text transforms are available in Brat canvas.'); return; }
        editing = !editing; $('editCanvasBtn').setAttribute('aria-pressed', String(editing));
        if (editing) { stopPlayback(true); const line = activeLine(); if (line) selectPhrase(rowForLine(line)?.id); }
        refresh(); syncOverlay();
    });
    previewCanvas.addEventListener('click', () => { const line = activeLine(); if (line && rowForLine(line)) { stopPlayback(true); editing = true; selectPhrase(rowForLine(line).id); $('editCanvasBtn').setAttribute('aria-pressed', 'true'); refresh(); syncOverlay(); } });
    $('canvasTextBox').addEventListener('pointerdown', event => {
        if (event.button !== 0 || !overlayLayout) return;
        event.preventDefault(); event.stopPropagation(); stopPlayback(true);
        selectPhrase(overlayLayout.row.id);
        drag = { x: event.clientX, y: event.clientY, handle: event.target.dataset.handle || 'move', before: structuredClone(buildProjectPayload()), style: structuredClone(overlayLayout.row.style), effective: { ...overlayLayout.style }, rowId: overlayLayout.row.id, pointer: event.pointerId };
        $('canvasTextBox').setPointerCapture(event.pointerId); $('canvasTextBox').focus();
    });
    $('canvasTextBox').addEventListener('pointermove', event => {
        if (!drag) return;
        const row = rowById(drag.rowId); if (!row) return;
        const rect = previewCanvas.getBoundingClientRect(), dx = (event.clientX - drag.x) / rect.width, dy = (event.clientY - drag.y) / rect.height;
        const style = drag.effective; row.style = { ...drag.style };
        if (drag.handle === 'move') { row.style.positionX = clamp((style.positionX ?? 0.5) + dx, 0.05, 0.95); row.style.verticalPosition = clamp((style.verticalPosition || 0) + dy, -0.3, 0.3); if (Math.abs(row.style.positionX - 0.5) < 0.012) row.style.positionX = 0.5; if (Math.abs(row.style.verticalPosition) < 0.012) row.style.verticalPosition = 0; }
        else if (drag.handle === 'e') row.style.stretch = clamp((style.stretch || 0.94) + dx * 2, 0.7, 1.3);
        else if (drag.handle === 's') row.style.stretchY = clamp((style.stretchY || 1) + dy * 2, 0.7, 1.3);
        else { const signX = drag.handle.includes('w') ? -1 : 1, signY = drag.handle.includes('n') ? -1 : 1; row.style.fontScale = clamp((style.fontScale || 1) * (1 + (dx * signX + dy * signY)), 0.1, 2); }
        syncRowsCache(); showEffectiveControls(); refresh(); syncOverlay();
    });
    function finishDrag(cancel = false) {
        if (!drag) return;
        const pending = drag; drag = null;
        if (cancel) { const row = rowById(pending.rowId); if (row) row.style = pending.style; syncRowsCache(); }
        else if (JSON.stringify(pending.before) !== JSON.stringify(buildProjectPayload())) { state.undoStack.push({ label: 'transform text', payload: pending.before }); if (state.undoStack.length > UNDO_LIMIT) state.undoStack.shift(); state.redoStack = []; updateUndoRedoState(); saveProjectSettings(); }
        syncControls(); refresh();
    }
    $('canvasTextBox').addEventListener('pointerup', () => finishDrag());
    $('canvasTextBox').addEventListener('pointercancel', () => finishDrag(true));
    $('canvasTextBox').addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (drag) finishDrag(true); else { editing = false; $('editCanvasBtn').setAttribute('aria-pressed', 'false'); syncOverlay(); } return; }
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation(); if (!rowById()) return;
        const step = event.shiftKey ? 10 : 1;
        update('move text', () => { const row = rowById(); const style = { ...state.style, ...row.style }; row.style = { ...row.style, positionX: clamp((style.positionX ?? 0.5) + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0) / previewCanvas.width, 0.05, 0.95), verticalPosition: clamp((style.verticalPosition || 0) + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0) / previewCanvas.height, -0.3, 0.3) }; syncRowsCache(); });
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && drag) { event.preventDefault(); finishDrag(true); } });
    const originalPreview = renderPreviewAt;
    renderPreviewAt = function (time) { originalPreview(time); syncOverlay(); };
    window.addEventListener('resize', syncOverlay);
    new ResizeObserver(syncOverlay).observe(previewCanvas);
    function setEditorMode(value) { const mode = value === 'advanced' ? 'advanced' : 'simple'; document.body.dataset.uiMode = mode; $('editorModeSelect').value = mode; localStorage.setItem('bratAnimator.editorMode', mode); }
    const hasExisting = window.BratWasReturningUser === true;
    setEditorMode(localStorage.getItem('bratAnimator.editorMode') || (hasExisting ? 'advanced' : 'simple'));
    $('editorModeSelect').addEventListener('change', () => setEditorMode($('editorModeSelect').value));
    document.querySelectorAll('#section-design > .effect-settings-grid, #section-design > .contrast-tool, #section-design > .range-grid, #section-design > details, #section-timing > details, #section-timing > .tool-strip, .text-settings-ranges, .v5-font-upload').forEach(node => node.classList.add('advanced-only'));
    const oldApplyLanguage = window.BratI18n.applyLanguage;
    window.BratI18n.applyLanguage = function (language) { const result = oldApplyLanguage(language); localize(); renderUnmatched(); return result; };
    window.BratEditor = { prepareExport, getLineStyle: lineStyle, getRow: rowForLine, getBeatEnvelope, syncControls, selectPhrase, prepareProjectFonts, persistAssets, currentLayout, localize, get selectedId() { return selectedId; } };
    commandDefinitions.push({ name: 'tilted elastic preset', run: () => $('tiltedElasticBtn').click() }, { name: 'export complete project', run: () => $('exportPackageBtn').click() }, { name: 'advanced editor', run: () => setEditorMode('advanced') });
    syncControls(); prepareProjectFonts(); renderLrcRows(); localize(); refresh();
})();
