# Brat Animator

Brat Animator is a browser-based tool that turns **LRC lyrics** into **square brat-style lyric videos**.

It lets you:

* paste or load synced lyrics in LRC format
* search lyrics through **LRCLIB**
* optionally use an audio file only to improve lyric timing
* preview the animation in the browser
* export a **video without audio**
* export a static frame as PNG

Live demo:
**https://oakvx.github.io/bratAnimator/**

---

## Features

* **LRC input** with `[MM:SS.xx]` timestamp parsing
* **Square brat-style rendering**
* **Phrase-block timing** instead of showing full lines all at once
* **Optional audio-assisted timing refinement**
* **Video-only export** directly in the browser
* **Format fallback** depending on browser support
* **Responsive layout** with mobile media queries
* **SEO-ready** setup for Google indexing and social sharing

---

## Important note about export

The final export is **video only**.

Even if you upload an audio file, **audio is not included** in the exported file. It is only used to help improve lyric timing.

Also, on supported browsers, export **does not require waiting for the full real-time duration of the song**. A faster rendering path is used, so download can be close to instant compared to the actual lyric timeline.

If that mode is not supported by the browser, a more traditional fallback is used.

---

## Supported formats

### Input

* `LRC` for synced lyrics
* optional audio files: `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`

### Output

* `MP4` if supported by the browser
* `WebM` as fallback
* `PNG` for single-frame export

---

## How to use

1. Open the website or the `index.html` file
2. Paste LRC lyrics or search for a song
3. Optionally upload an audio file to improve timing
4. Start the preview
5. Export the video or save a PNG frame

---

## Tech stack

* HTML
* CSS
* Vanilla JavaScript
* Canvas API
* MediaRecorder API
* LRCLIB API for lyric search
* Invidious for external video preview

---

## SEO and indexing

The project is already prepared for Google indexing with:

* meta title and meta description
* canonical URL
* Open Graph tags
* Twitter Card tags
* favicon and web manifest
* `robots.txt`
* `sitemap.xml`
* `JSON-LD` structured data
* real indexable on-page text content
* responsive mobile-first layout

Base URL:
**https://oakvx.github.io/bratAnimator/**

Sitemap:
**https://oakvx.github.io/bratAnimator/sitemap.xml**

---

## File structure

```text
root/                                                 sorry y'all idk 
├── index.html
├── README.md
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── favicon.svg
├── icon-192.png
├── icon-512.png
└── social-preview.png
```

---

## Deploy on GitHub Pages

### Simple setup

1. Upload all files to the repository
2. Open the repository settings
3. Go to **Pages**
4. Select the published branch
5. Save

If the repository is configured correctly, the site will be available at:

**https://oakvx.github.io/bratAnimator/**

---

## Current limitations

* `MP4` support depends on the browser
* the external video preview player is not part of the final export
* export is generated locally, so speed depends on the user’s device and browser

---

## Possible roadmap

* drag and drop LRC upload
* more social format presets
* selectable export bitrate
* multiple visual themes beyond brat style
* batch queue for multiple lyric videos
* forced MP4 conversion through a dedicated client-side pipeline

---

## License

To be defined.

every use without notice will result in a lawsuit (nah im joking but give me credits at least)
