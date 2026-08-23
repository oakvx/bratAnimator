# Brat Animator

**Brat Animator** is a static browser-based tool for creating square brat-style lyric videos from synchronized **LRC lyrics**. It runs locally in the browser, keeps project data in browser storage, and exports MP4/WebM or PNG without a backend.

Live demo: **https://oakvx.github.io/bratAnimator/**

## Version 3.0

- Static app, no framework and no `package.json`.
- Stable project schema `version: 3` with migration from older v2/v3 JSON.
- Local IndexedDB media storage for uploaded audio/video/background blobs; project JSON stores metadata and references, not binary blobs.
- LRCLIB search, LRC import/paste, Enhanced LRC word timing, compact LRC editor, multi-select timing tools, undo/redo, and waveform/timeline marker dragging.
- Background image/video uploads or direct CORS-enabled URLs, with export preflight for tainted canvas cases.
- Word animation modes: `progress`, `fade`, `scale`, `pop`, `glow`, `shake`, `color`, plus configurable letter chunks with spaces excluded.
- Fast MP4 is vendored through `vendor/mp4-muxer.mjs` pinned to `mp4-muxer@5.2.2` (MIT).
- Fast MP4 remains video-only when supported. Audio export uses realtime MediaRecorder and can merge loaded local or direct CORS-enabled media audio with volume/fade controls.
- YouTube is preview/reference only. The app does not download YouTube videos and does not extract audio from YouTube.
- EN/RU/ZH UI strings, localized SEO pages, manifest, sitemap, service worker cache list, GitHub Pages workflow, core tests, and manual QA checklist are aligned for 3.0.

## Running Locally

Open `index.html` directly for a simple file-based run, or serve the folder over localhost to test the PWA pieces.

```bash
python -m http.server 4173
```

Then open `http://localhost:4173/`.

## Checks

```bash
node --check assets/js/core.js
node --check assets/js/media.js
node --check assets/js/export.js
node --check assets/js/i18n.js
node --check assets/js/app.js
node --check sw.js
node --test
```

Manual release checks live in [tests/manual-checklist.md](tests/manual-checklist.md).

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
