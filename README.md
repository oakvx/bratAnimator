# Brat Animator

**Brat Animator** is a static browser-based tool for creating brat-style lyric videos from synchronized **LRC, TTML, Lyricsfile YAML/JSON, SRT and WebVTT lyrics**. It runs locally in the browser, keeps project data in browser storage, and exports MP4/WebM or PNG without a backend.

Live demo: **https://oakvx.github.io/bratAnimator/**

## Kinetic collage — progressive auto-fit word placement

Choose **Design → Lyrics display → Kinetic collage (stacked words)**, or use the **Kinetic collage · blue / cream** preset.

Unlike a scrolling word window, this mode **keeps every word of the current composition on screen as it appears**. Words arrive following their LRC / Enhanced LRC timestamps, with a brief per-word fade/scale entrance. Earlier words stay in fixed positions; the layout does not reflow every time a new word arrives.

A seeded, deterministic free-space packing algorithm measures **all** the words before showing the first one. It sorts them by estimated footprint, searches available rectangles, and scales the whole composition down if needed so nothing overlaps or spills outside the canvas. Positions look varied rather than forming a uniform grid, but seeking or exporting produces identical placement. Preview, PNG and MP4/WebM use the same canvas renderer.

The editor exposes:
- **LRC lines per composition (1–4, default 2):** the number of consecutive lyric rows contributing to one complete collage, *not* a maximum number of words. Every word within those rows is retained until the scene changes.
- **Word spacing:** the available padding between packed words.
- **Size contrast:** variation between smaller and larger words.
- **Transition speed:** how quickly each new word appears.

An explicit empty LRC line or a pause of more than 0.85 seconds begins a new composition. The blue/cream preset alternates its palette on lyric lines. A composition automatically ends at the beginning of the next grouped scene. Imported project settings and native word timing remain compatible with the existing schema.

## Version 5.0

- Simple and advanced editor modes, with a persistent preference. New users start in simple mode; existing users retain the full editor.
- Direct Brat canvas editing: drag text, resize with corner handles, stretch with side handles, and use center guides. A drag pauses playback and creates one undo operation; Escape cancels.
- Project-wide or per-phrase font, color and size, plus per-phrase Brat position, stretch and entrance settings. Reset a phrase to inherit the project defaults.
- Horizontal, vertical and elastic stretch entrances. The tilted elastic preset uses a 320 ms entrance, 15% deformation and random angles within 8 degrees. Advanced controls reach 800 ms, 30% and 15 degrees.
- Random inclination belongs to each visual wrapped row and stays fixed after its entrance. Persisted seeds keep angles identical after seeking, reopening and exporting; reroll a phrase or the project explicitly.
- Custom TTF, OTF, WOFF and WOFF2 fonts stored locally and included in portable projects. Missing fonts require reloading or explicit replacement before export.
- Manual bilingual lyrics, plain-text/LRC translation association, unmatched-line assignment and independent translation size, font and color. Brat, Music and Cinematic reserve space beneath the original text.
- Optional text pulses, background zoom and color transitions driven by estimated audio onsets or a manual 40-240 BPM grid. Effects start disabled and reuse the same beat events in preview and export.
- Optional export clips with start/end controls and timeline markers. Clips preserve original animation/media timing, start the output at zero and apply audio fades at the clip boundaries.
- Complete `.brat.zip` projects bundle the v5 manifest, uploaded audio, backgrounds and fonts for transfer and offline reopening. JSON export remains available for project metadata and references.
- Italian UI, including controls, messages and tutorial; first-run language follows Italian browser preferences, while saved language choices take precedence.

- Static app, no framework and no `package.json`.
- Reworked editor layout with a unified charcoal/ivory visual system, responsive controls, preview toolbar, and transport controls.
- Live zoom controls, keyboard-first commands, and automatic WCAG contrast correction.
- Text settings accessible from the header and preview, with 10–200% text size, live values, spacing/position controls, and a text-only reset. Smaller brat text preserves its fitted line breaks and shrinks proportionally in preview and export.
- Solid, linear, and radial canvas fills with optional text/background palette exchange by line, word, or typewriter letter.
- Uploaded images and videos can fill the background, the text, or both. Exchanging a gradient palette places the gradient inside the text.
- Project schema `version: 5` with stable phrase identities, styles, translations, font references, random seed, beat effects and export range; migration from v2-v4 JSON and snapshots keeps the new effects disabled.
- Local IndexedDB media storage for uploaded audio/video/background blobs; project JSON stores metadata and references, not binary blobs.
- Switchable LRCLIB/lrc.red search, multi-format import/paste, native word start/end timing, Enhanced LRC, compact LRC editor, multi-select timing tools, undo/redo, and waveform/timeline marker dragging.
- Shared word/character timeline for typewriter, word reveal and karaoke, with punctuation-aware text estimates, Unicode grapheme handling, explicit Enhanced LRC anchors, repeated timestamps and instrumental gaps.
- Natural phrase durations no longer stretch to fill the interval before the next lyric. Punctuation creates pauses, repeated vowels add a separate sung hold, and completed text stays still until the next line or an explicit empty timestamp.
- Estimated speed (0.5–2×) is stored with projects, snapshots and JSON; explicit LRC onsets and terminal word timestamps remain fixed. The timing report distinguishes the sung window from the estimated trailing pause.
- Channel-independent audio energy analysis guides estimated word boundaries without replacing explicit timestamps. It is not speech recognition or forced alignment; review estimated timings before exporting.
- Starting the timeline at zero trims the same leading interval from preview and exported audio. Timing analysis reports dense lines and inconsistent word timestamps in the editor.
- Normalizing or shifting editable rows preserves Enhanced LRC tags, millisecond word precision, metadata offsets and timestamp-only gap markers. Rewriting lyric text discards stale word anchors for that row.
- Background image/video uploads or direct CORS-enabled URLs, with real-time export for frame-accurate video backgrounds and preflight for tainted canvas cases.
- Word animation modes: `progress`, `fade`, `scale`, `pop`, `glow`, `shake`, `color`, plus configurable letter chunks with spaces excluded.
- Fast MP4 is vendored through `vendor/mp4-muxer.mjs` pinned to `mp4-muxer@5.2.2` (MIT).
- Fast MP4 remains video-only when supported. Audio export uses realtime MediaRecorder and can merge loaded local or direct CORS-enabled media audio with volume/fade controls.
- YouTube is preview/reference only. The app does not download YouTube videos and does not extract audio from YouTube.
- EN/IT/RU/ZH UI strings, localized SEO pages, manifest, sitemap, service worker assets, GitHub Pages workflow, core tests and a manual QA checklist.

## Using the Editor

Choose **simple** for loading lyrics/media, changing text size and presets, playback and export. Choose **advanced** to reveal phrase overrides, custom fonts, translations, stretch entrances, music effects and export intervals. The settings button keeps the 10-200% text size control within reach in either mode.

In advanced text settings, choose **whole project** or **selected phrase** before changing font, color or size. **Use project settings** clears the selected phrase's overrides. In Brat mode, **edit text in preview** enables dragging and transform handles; the tilted elastic preset gives every visual row a repeatable random inclination without changing lyric timestamps.

Enter a translation for the selected phrase or paste translated text/LRC into the bilingual controls. Plain text associates by order when the phrase counts match; LRC associates within 20 ms of each source timestamp. Assign unmatched translations manually. Translation stays horizontal beneath the original.

Export a **complete portable project** to keep uploaded assets with the project. A JSON project stores references to local browser assets, so use the portable ZIP when moving to another browser or computer. A package containing unavailable assets must be repaired before it can be exported. Remote URLs remain subject to network access and CORS restrictions.

Editing, audio analysis, font loading, package creation and rendering run in the browser; there is no processing backend. LRCLIB/lrc.red searches, remote media and YouTube previews still use their respective network services. Once the app shell is cached on localhost/HTTPS, portable projects with all assets included can reopen offline.

## Lyric Sources And Formats

Choose **LRCLIB** or **lrc.red** above the song search. The selection is saved with
the project. Search results and loaded lyrics link to their source. lrc.red track
details are loaded on demand, followed by Lyricsfile YAML, TTML or LRC in that
order. LRCLIB records prefer their `lyricsfile` field, with synced/plain fallbacks.
Requests identify the client, run sequentially and respect `Retry-After` limits.
Changing providers cancels pending lyric requests and clears old search results.
API references: [LRCLIB](https://lrclib.net/docs), [lrc.red](https://lrc.red/api),
and [Lyricsfile 1.0](https://github.com/tranxuanthang/lyricsfile/blob/main/SPECIFICATION.md).

Drop a file in Timing, use the file picker, or paste structured lyrics directly
into the lyrics editor. Supported imports:

| Format | Timing used |
| --- | --- |
| LRC / Enhanced LRC | Line starts and available word starts/terminal markers |
| TTML (`.ttml`, `.xml`) | Line, word and syllable intervals, including background vocals |
| Lyricsfile 1.0 (`.lyricsfile.yaml`, `.yaml`, `.yml`, `.lyricsfile`, `.json`) | `start_ms` and optional `end_ms` for lines and words; `plain` fallback |
| SRT / WebVTT | Cue starts/ends; WebVTT inline timestamps when present |
| TXT | Plain text for the existing tap-to-sync workflow |

The editor displays LRC, while project rows retain the original intervals.
**Known word starts and ends bypass timing estimates, speed controls and audio
guidance.** Silent gaps and overlapping lines stay intact. Missing intervals use
the existing estimation path. Adjacent syllables form a displayed word, with
their original segment intervals also used for character animation. Shifting a
row moves its complete native timing; editing its text invalidates those anchors.
Project JSON, autosave and `.brat.zip` preserve the intervals; copying only LRC
cannot preserve every individual word end.

TTML accepts clock, offset, frame and tick expressions, parent-relative subtitle
timing and track-absolute Apple Music/lrc.red lyric timing. Sequential (`seq`)
containers are rejected explicitly. TTML styling and source layout are not
imported. Lyricsfile `offset_ms`, when supplied, is applied additively like an LRC
offset. Invalid or oversized imports report an error and leave the project intact.
YAML parsing is local, uses a safe schema and rejects unsupported versions/tags
and duplicate keys. The import limit is 2 MB.

## Running Locally

Open `index.html` directly for a simple file-based run, or serve the folder over localhost to test the PWA pieces.

```bash
python -m http.server 4173
```

Then open `http://localhost:4173/`.

## Checks

```bash
node --check assets/js/core.js
node --check assets/js/lyrics.js
node --check assets/js/lyrics-sources.js
node --check assets/js/timing.js
node --check assets/js/media.js
node --check assets/js/export.js
node --check assets/js/i18n.js
node --check assets/js/app.js
node --check assets/js/motion.js
node --check assets/js/project-assets.js
node --check assets/js/editor-v5.js
node --check assets/js/italian-ui.js
node --check sw.js
node --test
```

Manual release checks live in [tests/manual-checklist.md](tests/manual-checklist.md).

Run the browser checks with Chrome installed (`CHROME_PATH` can select another Chrome executable). They use isolated temporary profiles and require no npm packages:

```bash
node tests/natural-timing-browser.mjs
node tests/text-settings-browser.mjs
node tests/export-format-browser.mjs
node tests/motion-browser.mjs
node tests/music-editor-browser.mjs
node tests/lyrics-browser.mjs
node tests/project-assets-browser.mjs
node tests/editor-v5-browser.mjs
```

These cover timing/pause regressions, proportional text sizing, export formats, real-canvas rotation/stretch bounds, bilingual Music/Cinematic spacing, phrase styles, font/package persistence, direct manipulation and responsive editor behavior. Browser export support depends on available codecs and MediaRecorder.

## Media And Rights

Loaded local audio/video, or a direct CORS-enabled media URL that you have permission to use, can be decoded for timing and optionally merged into realtime exports. Remote media may be blocked by browser CORS rules, and remote backgrounds that taint the canvas are blocked from export.

YouTube links can be used as preview/reference only. Brat Animator does not download YouTube content, does not bypass embed restrictions, and does not extract YouTube audio.

This project does not grant rights to lyrics, songs, audio, brands, videos, images, logos, trademarks, or any other third-party content. Users are responsible for having all rights, licenses, permissions, and clearances before exporting, publishing, sharing, or using any output.

## Permission

You can use Brat Animator freely. Publishing, public sharing, redistribution, self-hosting, commercial use, integration, cloning, or derivative works require explicit prior written permission from the author.

Request permission: **oakvx@icloud.com**

No license is granted by the public availability of this repository. All rights are reserved.

## Languages

- [English](#english)
- [Italiano](#italiano)
- [Español](#español)
- [Français](#français)
- [Deutsch](#deutsch)
- [Português](#português)
- [Русский](#русский)
- [中文](#中文)
- [日本語](#日本語)
- [한국어](#한국어)
- [हिन्दी](#हिन्दी)
- [Ελληνικά](#ελληνικά)

---

## English

Brat Animator creates brat-style lyric videos from LRC lyrics directly in your browser. You can search LRCLIB, paste or import LRC, refine timing with local audio/video, add background media, tune word animations, save project snapshots, and export MP4/WebM or PNG.

Fast MP4 export is the quickest path and stays video-only. If you enable loaded audio, the app records a realtime export and can merge audio decoded from a local file or a direct CORS-enabled media URL you are allowed to use. YouTube remains preview/reference only and is not downloaded or extracted.

## Italiano

Brat Animator crea lyric video brat-style da testi LRC direttamente nel browser. Puoi cercare su LRCLIB, incollare o importare LRC, rifinire il timing con audio/video locale, aggiungere background media, configurare animazioni parola-per-parola, salvare snapshot ed esportare MP4/WebM o PNG.

La versione 5 aggiunge interfaccia italiana, modalita semplice/avanzata, impostazioni per frase, modifica diretta del testo nel canvas, font personali, traduzioni, stretch animato e inclinazioni casuali riproducibili per ogni riga visiva. Gli effetti musicali possono seguire i battiti stimati oppure BPM manuali. Puoi esportare un intervallo o un progetto completo `.brat.zip` con audio, sfondi e font caricati; elaborazione e salvataggio restano nel browser.

L'export Fast MP4 e' il percorso piu veloce e resta video-only. Se abiliti l'audio caricato, l'app registra un export realtime e puo unire audio decodificato da un file locale o da un URL media diretto CORS-enabled che hai il permesso di usare. YouTube resta solo preview/reference e non viene scaricato o estratto.

## Español

Brat Animator crea lyric videos estilo brat desde letras LRC directamente en el navegador. Puedes buscar en LRCLIB, pegar o importar LRC, ajustar timing con audio/video local, añadir fondos, configurar animaciones de palabras, guardar snapshots y exportar MP4/WebM o PNG.

Fast MP4 es la ruta mas rapida y sigue siendo video-only. Si activas audio cargado, la app usa exportacion realtime y puede unir audio decodificado desde un archivo local o una URL media directa CORS-enabled que tengas permiso para usar. YouTube queda solo como preview/reference y no se descarga ni se extrae.

## Français

Brat Animator crée des lyric videos brat-style depuis des paroles LRC directement dans le navigateur. Vous pouvez chercher sur LRCLIB, coller ou importer du LRC, ajuster le timing avec un audio/video local, ajouter un fond media, regler les animations de mots, sauvegarder des snapshots et exporter en MP4/WebM ou PNG.

L'export Fast MP4 est le chemin le plus rapide et reste video-only. Si l'audio charge est active, l'app effectue un export realtime et peut fusionner l'audio decode depuis un fichier local ou une URL media directe CORS-enabled que vous avez le droit d'utiliser. YouTube reste uniquement preview/reference et n'est ni telecharge ni extrait.

## Deutsch

Brat Animator erstellt brat-style Lyric-Videos aus LRC-Lyrics direkt im Browser. Du kannst LRCLIB durchsuchen, LRC einfuegen oder importieren, Timing mit lokalen Audio/Video-Dateien pruefen, Background-Media hinzufuegen, Wortanimationen konfigurieren, Snapshots speichern und MP4/WebM oder PNG exportieren.

Fast MP4 ist der schnellste Weg und bleibt video-only. Wenn geladenes Audio aktiviert ist, nutzt die App einen Realtime-Export und kann Audio aus einer lokalen Datei oder einer direkten CORS-enabled Media-URL zusammenfuehren, fuer die du Rechte hast. YouTube bleibt nur Preview/Reference und wird nicht heruntergeladen oder extrahiert.

## Português

Brat Animator cria lyric videos brat-style a partir de LRC diretamente no navegador. Voce pode pesquisar no LRCLIB, colar ou importar LRC, ajustar timing com audio/video local, adicionar background media, configurar animacoes de palavras, salvar snapshots e exportar MP4/WebM ou PNG.

Fast MP4 e o caminho mais rapido e continua video-only. Ao ativar audio carregado, o app faz export realtime e pode unir audio decodificado de arquivo local ou URL direta CORS-enabled que voce tem permissao para usar. YouTube fica apenas como preview/reference e nao e baixado nem extraido.

## Русский

Brat Animator создает brat-style lyric videos из LRC lyrics прямо в браузере. Можно искать lyrics через LRCLIB, вставлять или импортировать LRC, уточнять timing локальным audio/video, добавлять background media, настраивать word animation, сохранять snapshots и экспортировать MP4/WebM или PNG.

Fast MP4 остается самым быстрым путем и является video-only. Если включить загруженное audio, приложение делает realtime export и может объединить audio из локального файла или direct CORS-enabled media URL, который вы имеете право использовать. YouTube используется только как preview/reference и не скачивается или извлекается.

## 中文

Brat Animator 可以在浏览器中把 LRC 歌词制作成 brat-style 歌词视频。你可以通过 LRCLIB 搜索，粘贴或导入 LRC，用本地音频/视频校准 timing，添加背景媒体，配置逐词动画，保存项目快照，并导出 MP4/WebM 或 PNG。

Fast MP4 是最快的导出方式，并且仍然是 video-only。启用已加载音频时，应用会使用 realtime export，并可以合并来自本地文件或你有权使用的 direct CORS-enabled media URL 的音频。YouTube 只作为 preview/reference，不会被下载或提取。

## 日本語

Brat Animator は、ブラウザ上で LRC 歌詞から brat-style の lyric video を作成するツールです。LRCLIB 検索、LRC の貼り付け/読み込み、ローカル audio/video による timing 調整、background media、word animation、snapshot、MP4/WebM または PNG export に対応しています。

Fast MP4 は最速の export で、video-only のままです。loaded audio を有効にすると realtime export を使い、使用権のあるローカルファイルまたは direct CORS-enabled media URL から decode した audio を結合できます。YouTube は preview/reference のみで、download や audio extraction は行いません。

## 한국어

Brat Animator는 브라우저에서 LRC 가사로 brat-style lyric video를 만드는 도구입니다. LRCLIB 검색, LRC 붙여넣기/가져오기, 로컬 audio/video timing 조정, background media, word animation, snapshot, MP4/WebM 또는 PNG export를 지원합니다.

Fast MP4는 가장 빠른 경로이며 video-only로 유지됩니다. loaded audio를 켜면 realtime export를 사용하고, 권한이 있는 로컬 파일 또는 direct CORS-enabled media URL에서 decode한 audio를 합칠 수 있습니다. YouTube는 preview/reference 전용이며 download나 extraction을 하지 않습니다.

## हिन्दी

Brat Animator browser में LRC lyrics से brat-style lyric video बनाता है। आप LRCLIB search, LRC paste/import, local audio/video से timing refinement, background media, word animation, snapshots, और MP4/WebM या PNG export इस्तेमाल कर सकते हैं।

Fast MP4 सबसे तेज path है और video-only रहता है। Loaded audio enable करने पर app realtime export करता है और local file या ऐसे direct CORS-enabled media URL से decoded audio merge कर सकता है जिसे इस्तेमाल करने की अनुमति आपके पास है। YouTube केवल preview/reference है; उसे download या extract नहीं किया जाता।

## Ελληνικά

Το Brat Animator δημιουργεί brat-style lyric videos από LRC lyrics μέσα στον browser. Υποστηρίζει LRCLIB search, paste/import LRC, timing με local audio/video, background media, word animation, snapshots και export MP4/WebM ή PNG.

Το Fast MP4 είναι η πιο γρήγορη διαδρομή και παραμένει video-only. Αν ενεργοποιηθεί loaded audio, το app κάνει realtime export και μπορεί να ενώσει audio από local file ή direct CORS-enabled media URL που έχεις δικαίωμα να χρησιμοποιήσεις. Το YouTube είναι μόνο preview/reference και δεν γίνεται download ή extraction.
