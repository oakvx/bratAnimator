# Brat Animator

**Languages**

* 🇬🇧 [English](#-english)
* 🇷🇺 [Русский](#-русский)
* 🇨🇳 [中文](#-中文)

---

# 🇬🇧 English

## Brat Animator

**Brat Animator** is a browser-based tool that turns synced **LRC lyrics** into square **brat-style lyric videos**.

It allows you to:

* paste or load synced lyrics in LRC format
* search lyrics through **LRCLIB**
* optionally use an audio file only to improve lyric timing
* preview the animation directly in the browser
* export a **video without audio**
* export a static frame as PNG

Live demo:
**https://oakvx.github.io/bratAnimator/**

---

## Features

* LRC input with `[MM:SS.xx]` timestamp parsing
* Square brat-style rendering
* Phrase-block timing instead of showing full lines all at once
* Optional audio-assisted timing refinement
* Video-only export directly in the browser
* Format fallback depending on browser support
* Responsive layout with mobile media queries
* SEO-ready setup for Google indexing and social sharing

---

## Important note about export

The final export is **video only**.

Even if an audio file is uploaded, **audio is not included** in the exported file. The audio file is only used to help improve lyric timing.

On supported browsers, export may use a faster rendering path instead of waiting for the full real-time duration of the song, so the download can be almost instant compared to the actual lyric timeline.

If that mode is not supported by the browser, a traditional fallback is used.

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

Public use, copying, modification, redistribution, self-hosting, commercial use, or non-commercial use of this project requires **explicit written permission from the author**.

To request permission, contact the repository author before using, copying, modifying, publishing, hosting, or redistributing this project.

Technical usage after authorization:

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

The project is prepared for Google indexing with:

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
root/
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

## Copyright and third-party content

This project does not grant any rights to copyrighted lyrics, songs, audio, brands, videos, images, or any other third-party protected content.

Users are responsible for ensuring they have the necessary rights before exporting, publishing, or distributing any content generated with this tool.

---

## License

**All Rights Reserved.**

This project is publicly visible for demonstration and informational purposes only.

You may not use, copy, modify, redistribute, sell, integrate, publish, host, clone, or create derivative works from this project without explicit written permission from the author.

Any use of the code, interface, application logic, assets, or the project as a whole requires prior written permission from the author.

Copyright © 2026 oakvx.
All rights reserved.

---

# 🇷🇺 Русский

## Brat Animator

**Brat Animator** — это браузерный инструмент, который превращает синхронизированные тексты песен в формате **LRC** в квадратные **brat-style lyric videos**.

Он позволяет:

* вставлять или загружать синхронизированные lyrics в формате LRC
* искать lyrics через **LRCLIB**
* опционально использовать аудиофайл только для улучшения тайминга
* просматривать анимацию прямо в браузере
* экспортировать **видео без аудио**
* экспортировать статичный кадр в формате PNG

Онлайн-демо:
**https://oakvx.github.io/bratAnimator/**

---

## Возможности

* Ввод LRC с парсингом таймстампов `[MM:SS.xx]`
* Квадратный brat-style rendering
* Тайминг по фразам/блокам вместо показа всей строки сразу
* Опциональная корректировка тайминга с помощью аудиофайла
* Экспорт video-only прямо в браузере
* Fallback формата в зависимости от поддержки браузера
* Адаптивный layout с media queries для мобильных устройств
* SEO-ready настройка для индексации Google и social sharing

---

## Важное замечание об экспорте

Финальный экспорт — **только видео**.

Даже если загружен аудиофайл, **аудио не включается** в экспортированный файл. Аудиофайл используется только как вспомогательный источник для улучшения тайминга lyrics.

В поддерживаемых браузерах экспорт может использовать более быстрый способ рендеринга вместо ожидания полной реальной длительности песни, поэтому скачивание может быть почти мгновенным относительно полной lyric timeline.

Если этот режим не поддерживается браузером, используется традиционный fallback.

---

## Поддерживаемые форматы

### Input

* `LRC` для синхронизированных lyrics
* опциональные аудиофайлы: `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`

### Output

* `MP4`, если поддерживается браузером
* `WebM` как fallback
* `PNG` для экспорта одного кадра

---

## Как использовать

Публичное использование, копирование, изменение, распространение, self-hosting, коммерческое или некоммерческое использование этого проекта требует **явного письменного разрешения автора**.

Чтобы запросить разрешение, свяжитесь с автором репозитория до использования, копирования, изменения, публикации, хостинга или распространения этого проекта.

Техническое использование после получения разрешения:

1. Открыть сайт или файл `index.html`
2. Вставить LRC lyrics или найти песню
3. Опционально загрузить аудиофайл для улучшения тайминга
4. Запустить preview
5. Экспортировать видео или сохранить PNG-кадр

---

## Tech stack

* HTML
* CSS
* Vanilla JavaScript
* Canvas API
* MediaRecorder API
* LRCLIB API для поиска lyrics
* Invidious для внешнего video preview

---

## SEO и индексация

Проект подготовлен для индексации Google с помощью:

* meta title и meta description
* canonical URL
* Open Graph tags
* Twitter Card tags
* favicon и web manifest
* `robots.txt`
* `sitemap.xml`
* структурированных данных `JSON-LD`
* реального индексируемого текстового контента на странице
* адаптивного mobile-first layout

Base URL:
**https://oakvx.github.io/bratAnimator/**

Sitemap:
**https://oakvx.github.io/bratAnimator/sitemap.xml**

---

## Структура файлов

```text
root/
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

1. Загрузить все файлы в репозиторий
2. Открыть настройки репозитория
3. Перейти в раздел **Pages**
4. Выбрать branch для публикации
5. Сохранить

Если репозиторий настроен правильно, сайт будет доступен по адресу:

**https://oakvx.github.io/bratAnimator/**

---

## Текущие ограничения

* Поддержка `MP4` зависит от браузера
* внешний video preview player не является частью финального экспорта
* экспорт генерируется локально, поэтому скорость зависит от устройства и браузера пользователя

---

## Возможная roadmap

* drag and drop загрузка LRC
* дополнительные social format presets
* выбор bitrate экспорта
* несколько визуальных тем помимо brat style
* batch queue для нескольких lyric videos
* принудительная MP4-конвертация через отдельный client-side pipeline

---

## Авторские права и сторонний контент

Этот проект не предоставляет никаких прав на copyrighted lyrics, песни, аудио, бренды, видео, изображения или любой другой защищённый контент третьих лиц.

Пользователи самостоятельно несут ответственность за наличие необходимых прав перед экспортом, публикацией или распространением любого контента, созданного с помощью этого инструмента.

---

## Лицензия

**All Rights Reserved.**

Этот проект публично доступен только в демонстрационных и информационных целях.

Запрещено использовать, копировать, изменять, распространять, продавать, интегрировать, публиковать, размещать, клонировать или создавать производные работы на основе этого проекта без явного письменного разрешения автора.

Любое использование кода, интерфейса, логики приложения, assets или проекта в целом требует предварительного письменного разрешения автора.

Copyright © 2026 oakvx.
All rights reserved.

---

# 🇨🇳 中文

## Brat Animator

**Brat Animator** 是一个基于浏览器的工具，可以把同步歌词 **LRC** 转换成方形的 **brat 风格歌词视频**。

它可以：

* 粘贴或加载 LRC 格式的同步歌词
* 通过 **LRCLIB** 搜索歌词
* 可选上传音频文件，仅用于优化歌词时间轴
* 直接在浏览器中预览动画
* 导出 **无音频视频**
* 将静态画面导出为 PNG

在线演示：
**https://oakvx.github.io/bratAnimator/**

---

## 功能

* 支持 LRC 输入，并解析 `[MM:SS.xx]` 时间戳
* 方形 brat 风格渲染
* 使用短语/分块时间控制，而不是一次显示整行歌词
* 可选的音频辅助时间轴优化
* 直接在浏览器中导出 video-only 文件
* 根据浏览器支持情况自动使用格式 fallback
* 支持移动端 media queries 的响应式布局
* SEO-ready 设置，适合 Google 索引和社交平台分享

---

## 关于导出的重要说明

最终导出结果是 **仅视频**。

即使上传了音频文件，**音频也不会被包含在导出的文件中**。音频文件只用于辅助优化歌词 timing。

在支持的浏览器中，导出可能会使用更快的渲染路径，而不需要等待歌曲的完整实时长度，因此下载速度可能比真实歌词时间轴快很多。

如果浏览器不支持该模式，则会使用传统 fallback 方式。

---

## 支持的格式

### Input

* `LRC` 同步歌词文件
* 可选音频文件：`.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`

### Output

* 如果浏览器支持，则导出 `MP4`
* `WebM` 作为 fallback
* `PNG` 用于导出单帧图片

---

## 如何使用

本项目的公开使用、复制、修改、再分发、self-hosting、商业使用或非商业使用，都需要获得**作者的明确书面许可**。

在使用、复制、修改、发布、托管或分发本项目之前，请先联系仓库作者并请求授权。

获得授权后的技术使用流程：

1. 打开网站或 `index.html` 文件
2. 粘贴 LRC 歌词或搜索歌曲
3. 可选上传音频文件以优化 timing
4. 启动 preview
5. 导出视频或保存 PNG 画面

---

## Tech stack

* HTML
* CSS
* Vanilla JavaScript
* Canvas API
* MediaRecorder API
* LRCLIB API 用于歌词搜索
* Invidious 用于外部 video preview

---

## SEO 和索引

该项目已经为 Google 索引做好准备，包括：

* meta title 和 meta description
* canonical URL
* Open Graph tags
* Twitter Card tags
* favicon 和 web manifest
* `robots.txt`
* `sitemap.xml`
* `JSON-LD` structured data
* 页面内真实可索引文本内容
* mobile-first 响应式布局

Base URL:
**https://oakvx.github.io/bratAnimator/**

Sitemap:
**https://oakvx.github.io/bratAnimator/sitemap.xml**

---

## 文件结构

```text
root/
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

1. 将所有文件上传到 repository
2. 打开 repository settings
3. 进入 **Pages**
4. 选择要发布的 branch
5. 保存

如果仓库配置正确，网站将会发布在：

**https://oakvx.github.io/bratAnimator/**

---

## 当前限制

* `MP4` 支持取决于浏览器
* 外部 video preview player 不属于最终导出内容
* 导出在本地生成，因此速度取决于用户设备和浏览器

---

## Possible roadmap

* 支持 drag and drop 上传 LRC
* 更多社交平台格式 presets
* 可选择 export bitrate
* 除 brat style 以外的多个视觉主题
* 用于多个 lyric videos 的 batch queue
* 通过专用 client-side pipeline 强制转换为 MP4

---

## 版权和第三方内容

本项目不授予任何关于 copyrighted lyrics、歌曲、音频、品牌、视频、图片或其他第三方受保护内容的权利。

用户在导出、发布或分发使用本工具生成的任何内容之前，必须自行确保拥有必要的权利。

---

## License

**All Rights Reserved.**

本项目公开可见仅用于演示和信息展示目的。

未经作者明确书面许可，不得使用、复制、修改、再分发、出售、集成、发布、托管、克隆本项目，或基于本项目创建 derivative works。

任何对代码、界面、应用逻辑、assets 或整个项目的使用，都需要作者事先提供书面许可。

Copyright © 2026 oakvx.
All rights reserved.
