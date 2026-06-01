# Brat Animator

**Languages**

- 🇬🇧 [English](#-english)
- 🇷🇺 [Русский](#-русский)
- 🇨🇳 [中文](#-中文)

---

# 🇬🇧 English

Brat Animator is a static browser-based tool that turns synced **LRC lyrics** into square **brat-style lyric videos**.

Live demo: **https://oakvx.github.io/bratAnimator/**

## Features

- LRC input with `[MM:SS.xx]` timestamp parsing
- LRCLIB lyric search
- Optional audio-assisted timing refinement
- Canvas-based preview
- Video-only export: MP4 when supported, WebM fallback otherwise
- PNG single-frame export
- EN / RU / ZH interface switcher
- Drag and drop for LRC and audio files
- Autosave through `localStorage`
- Browser compatibility panel for export
- PWA-ready service worker and web manifest
- Static deployment on GitHub Pages

## Important export note

The final export is **video only**. Uploaded audio is used only to help refine lyric timing and is not included in the exported file.

## Permission

Usage, copying, modification, redistribution, self-hosting, commercial use, or integration requires **explicit written permission from the author**.

---

# 🇷🇺 Русский

Brat Animator — статический браузерный инструмент, который превращает синхронизированные **LRC lyrics** в квадратные **brat-style lyric videos**.

Demo: **https://oakvx.github.io/bratAnimator/**

## Возможности

- Парсинг LRC timestamp `[MM:SS.xx]`
- Поиск lyrics через LRCLIB
- Опциональная корректировка тайминга через аудио
- Canvas preview
- Video-only экспорт: MP4 при поддержке, иначе WebM fallback
- Экспорт одного кадра PNG
- Переключатель интерфейса EN / RU / ZH
- Drag and drop для LRC и аудио
- Autosave через `localStorage`
- Панель совместимости браузера для экспорта
- PWA-ready service worker и web manifest
- Статический deploy на GitHub Pages

## Важно про экспорт

Финальный экспорт — **только видео**. Загруженное аудио используется только для уточнения тайминга lyrics и не включается в экспортированный файл.

## Разрешение

Использование, копирование, изменение, распространение, self-hosting, коммерческое использование или интеграция требуют **явного письменного разрешения автора**.

---

# 🇨🇳 中文

Brat Animator 是一个静态浏览器工具，可以把同步 **LRC 歌词** 转换成方形 **brat-style 歌词视频**。

在线演示：**https://oakvx.github.io/bratAnimator/**

## 功能

- LRC `[MM:SS.xx]` 时间戳解析
- 通过 LRCLIB 搜索歌词
- 可选音频辅助 timing 优化
- Canvas 预览
- Video-only 导出：支持时 MP4，否则 WebM fallback
- PNG 单帧导出
- EN / RU / ZH 界面切换
- LRC 和音频 drag and drop
- 通过 `localStorage` 自动保存
- 导出兼容性面板
- PWA-ready service worker 和 web manifest
- 可静态部署到 GitHub Pages

## 关于导出

最终导出是 **仅视频**。上传的音频只用于辅助歌词 timing，不会包含在导出文件中。

## 授权

使用、复制、修改、再分发、self-hosting、商业用途或集成都需要**作者的明确书面许可**。
