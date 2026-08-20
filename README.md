# Brat Animator

**Brat Animator** is a static browser-based tool for creating square lyric videos from synchronized **LRC lyrics**, with classic **brat-style** visuals and an optional music-style synced scrolling lyrics mode.

Live demo: **https://oakvx.github.io/bratAnimator/**

---

## Version 3.0 updates

* New v3.0 main menu with a branded command dock, grouped controls, compact mobile layout, and clearer active states
* Modernized visual system with cleaner surfaces, sharper controls, improved spacing, and a less dated product feel
* Better mobile experience with a refined top menu, bottom editor sheet, touch-friendly controls, and no horizontal page overflow
* Built-in tutorial for first-time users
* Project tools for browser snapshots, share links, starter LRC, copied LRC, and project JSON handoff
* Enhanced SEO with richer metadata, JSON-LD structured data, localized entry pages, updated sitemap, and an improved web manifest

## TODO

* Add automated visual regression checks for the desktop and mobile layouts, especially the v3.0 main menu and editor sheet.
* Expand localization coverage for the newest tutorial, project, and SEO copy.
* Add a clearer project import flow to pair with the existing project JSON export/share tools.

---

## Languages

* 🇬🇧 [English](#-english)
* 🇮🇹 [Italiano](#-italiano)
* 🇪🇸 [Español](#-español)
* 🇫🇷 [Français](#-français)
* 🇩🇪 [Deutsch](#-deutsch)
* 🇵🇹 [Português](#-português)
* 🇷🇺 [Русский](#-русский)
* 🇨🇳 [中文](#-中文)
* 🇯🇵 [日本語](#-日本語)
* 🇰🇷 [한국어](#-한국어)
* 🇮🇳 [हिन्दी](#-हिन्दी)
* 🇬🇷 [Ελληνικά](#-ελληνικά)

---

# 🇬🇧 English

## Overview

**Brat Animator** is a static browser-based tool that turns synchronized **LRC lyrics** into square **brat-style lyric videos**.

It supports both a classic single-line lyric canvas and an optional music-style synced scrolling lyrics mode for exports that need a full-screen lyric interface.

Live demo: **https://oakvx.github.io/bratAnimator/**

## Features

* LRC input with `[MM:SS.xx]` timestamp parsing
* Enhanced LRC support with word timing tags such as `<00:12.34>` when available
* LRCLIB lyric search
* Optional audio-assisted timing refinement
* Classic brat-style single-line canvas mode
* Music-style synced scroll mode
* Large scrolling lyric lines
* Active-line focus with dimmed surrounding lyrics
* Optional word-progress highlight
* Canvas-based preview
* Video-only export: MP4 when supported, WebM fallback otherwise
* PNG single-frame export
* v3.0 command dock main menu
* First-run tutorial and help overlay
* Project snapshots saved in the browser
* Share links, starter LRC, copied LRC, and project JSON handoff tools
* EN / RU / ZH interface switcher
* Drag and drop for LRC and audio files
* Autosave through `localStorage`
* Browser compatibility panel for export
* SEO-ready metadata, JSON-LD structured data, sitemap, robots.txt, and localized entry pages
* PWA-ready service worker and web manifest
* Static deployment on GitHub Pages

## Important export note

The final export is **video only**.

Uploaded audio is used only to help refine lyric timing and is **not** included in the exported file.

## No affiliation

This project is not affiliated with Apple Music, Apple Inc., Charli XCX, Atlantic Records, or any other artist, label, brand, platform, or rights holder.

The term **“brat-style”** is used only as a descriptive visual reference.

## Permission and copyright

This project is publicly visible for demonstration and informational purposes only.

Usage, copying, modification, redistribution, self-hosting, commercial use, integration, cloning, publishing, hosting, reverse engineering, scraping, or creation of derivative works requires **explicit prior written permission from the author**.

No license is granted by the public availability of this repository.

All rights are reserved.

Unauthorized use may result in enforcement action, including takedown requests, cease-and-desist notices, legal complaints, claims for damages, recovery of profits, and any other remedies available under applicable law.

This project does not grant any rights to copyrighted lyrics, songs, audio, brands, videos, images, trademarks, logos, or any other protected third-party content. Users are solely responsible for ensuring that they have all necessary rights, licenses, permissions, and clearances before exporting, publishing, distributing, or otherwise using any content generated, processed, displayed, or referenced through this tool.

---

# 🇮🇹 Italiano

## Panoramica

**Brat Animator** è uno strumento statico basato su browser che trasforma **lyrics sincronizzate in formato LRC** in video quadrati con estetica **brat-style**.

Supporta sia una modalità classica con lyric a singola riga su canvas, sia una modalità opzionale con lyrics sincronizzate a scorrimento in stile music player.

Demo online: **https://oakvx.github.io/bratAnimator/**

## Funzionalità

* Input LRC con parsing dei timestamp `[MM:SS.xx]`
* Supporto Enhanced LRC con tag di timing parola-per-parola come `<00:12.34>`, quando disponibili
* Ricerca lyrics tramite LRCLIB
* Rifinitura opzionale del timing assistita da audio
* Modalità classica brat-style con canvas a singola riga
* Modalità lyrics sincronizzate con scorrimento music-style
* Righe lyric grandi e scorrevoli
* Focus sulla riga attiva con lyrics circostanti attenuate
* Evidenziazione opzionale del progresso parola-per-parola
* Anteprima basata su Canvas
* Esportazione solo video: MP4 quando supportato, altrimenti fallback WebM
* Esportazione PNG di un singolo frame
* Main menu v3.0 in stile command dock
* Tutorial iniziale e overlay di aiuto
* Snapshot del progetto salvati nel browser
* Share link, starter LRC, copia LRC e strumenti di handoff tramite project JSON
* Interfaccia EN / RU / ZH
* Drag and drop per file LRC e audio
* Autosave tramite `localStorage`
* Pannello di compatibilità browser per l’export
* SEO migliorata con metadata, JSON-LD, sitemap, robots.txt e pagine localizzate
* Service worker e web manifest PWA-ready
* Deploy statico su GitHub Pages

## Nota importante sull’export

L’export finale è **solo video**.

L’audio caricato viene usato esclusivamente per aiutare a rifinire il timing delle lyrics e **non** viene incluso nel file esportato.

## Nessuna affiliazione

Questo progetto non è affiliato con Apple Music, Apple Inc., Charli XCX, Atlantic Records o qualsiasi altro artista, etichetta, brand, piattaforma o titolare di diritti.

Il termine **“brat-style”** è usato esclusivamente come riferimento visivo descrittivo.

## Permessi e copyright

Questo progetto è pubblicamente visibile solo per scopi dimostrativi e informativi.

Uso, copia, modifica, redistribuzione, self-hosting, uso commerciale, integrazione, clonazione, pubblicazione, hosting, reverse engineering, scraping o creazione di opere derivate richiedono **esplicito permesso scritto preventivo dell’autore**.

La disponibilità pubblica di questo repository non concede alcuna licenza.

Tutti i diritti sono riservati.

Qualsiasi uso non autorizzato può comportare azioni di enforcement, inclusi takedown, diffide, reclami legali, richieste di risarcimento danni, recupero dei profitti e ogni altro rimedio previsto dalla legge applicabile.

Questo progetto non concede alcun diritto su lyrics, canzoni, audio, brand, video, immagini, marchi, loghi o altri contenuti di terze parti protetti. Gli utenti sono gli unici responsabili di assicurarsi di possedere tutti i diritti, le licenze, i permessi e le autorizzazioni necessari prima di esportare, pubblicare, distribuire o utilizzare qualsiasi contenuto generato, elaborato, mostrato o referenziato tramite questo strumento.

---

# 🇪🇸 Español

## Descripción general

**Brat Animator** es una herramienta estática basada en navegador que convierte **lyrics sincronizadas en formato LRC** en videos cuadrados con estética **brat-style**.

Soporta tanto un modo clásico de una sola línea sobre Canvas como un modo opcional de lyrics sincronizadas con desplazamiento estilo reproductor musical.

Demo en vivo: **https://oakvx.github.io/bratAnimator/**

## Funciones

* Entrada LRC con parsing de timestamps `[MM:SS.xx]`
* Soporte Enhanced LRC con etiquetas de timing por palabra como `<00:12.34>`, cuando estén disponibles
* Búsqueda de lyrics mediante LRCLIB
* Refinamiento opcional del timing asistido por audio
* Modo clásico brat-style de una sola línea en Canvas
* Modo de lyrics sincronizadas con desplazamiento music-style
* Líneas de lyrics grandes y desplazables
* Enfoque en la línea activa con lyrics cercanas atenuadas
* Resaltado opcional del progreso palabra por palabra
* Vista previa basada en Canvas
* Exportación solo video: MP4 cuando sea compatible, WebM como fallback
* Exportación PNG de un único frame
* Selector de interfaz EN / RU / ZH
* Drag and drop para archivos LRC y audio
* Autosave mediante `localStorage`
* Panel de compatibilidad del navegador para exportación
* Service worker y web manifest PWA-ready
* Deploy estático en GitHub Pages

## Nota importante sobre la exportación

La exportación final es **solo video**.

El audio cargado se utiliza únicamente para ayudar a refinar el timing de las lyrics y **no** se incluye en el archivo exportado.

## Sin afiliación

Este proyecto no está afiliado con Apple Music, Apple Inc., Charli XCX, Atlantic Records ni con ningún otro artista, sello, marca, plataforma o titular de derechos.

El término **“brat-style”** se usa únicamente como referencia visual descriptiva.

## Permiso y copyright

Este proyecto está públicamente visible solo con fines demostrativos e informativos.

El uso, copia, modificación, redistribución, self-hosting, uso comercial, integración, clonación, publicación, hosting, reverse engineering, scraping o creación de obras derivadas requiere **permiso explícito previo por escrito del autor**.

La disponibilidad pública de este repositorio no concede ninguna licencia.

Todos los derechos están reservados.

Cualquier uso no autorizado puede dar lugar a acciones de enforcement, incluidas solicitudes de takedown, cartas de cese y desistimiento, reclamaciones legales, reclamaciones por daños, recuperación de beneficios y cualquier otro recurso disponible bajo la ley aplicable.

Este proyecto no concede ningún derecho sobre lyrics, canciones, audio, marcas, videos, imágenes, trademarks, logos u otros contenidos protegidos de terceros. Los usuarios son los únicos responsables de asegurarse de contar con todos los derechos, licencias, permisos y autorizaciones necesarios antes de exportar, publicar, distribuir o utilizar cualquier contenido generado, procesado, mostrado o referenciado mediante esta herramienta.

---

# 🇫🇷 Français

## Présentation

**Brat Animator** est un outil statique basé sur le navigateur qui transforme des **lyrics synchronisées au format LRC** en vidéos carrées au style **brat-style**.

Il prend en charge un mode classique à une seule ligne sur Canvas ainsi qu’un mode optionnel de lyrics synchronisées avec défilement de type lecteur musical.

Démo en ligne : **https://oakvx.github.io/bratAnimator/**

## Fonctionnalités

* Entrée LRC avec parsing des timestamps `[MM:SS.xx]`
* Support Enhanced LRC avec tags de timing mot par mot comme `<00:12.34>`, lorsqu’ils sont disponibles
* Recherche de lyrics via LRCLIB
* Raffinement optionnel du timing assisté par audio
* Mode classique brat-style avec Canvas sur une seule ligne
* Mode de lyrics synchronisées avec défilement music-style
* Grandes lignes de lyrics défilantes
* Focus sur la ligne active avec lyrics environnantes atténuées
* Surlignage optionnel de la progression mot par mot
* Aperçu basé sur Canvas
* Exportation vidéo uniquement : MP4 si pris en charge, sinon fallback WebM
* Export PNG d’une seule frame
* Sélecteur d’interface EN / RU / ZH
* Drag and drop pour fichiers LRC et audio
* Autosave via `localStorage`
* Panneau de compatibilité navigateur pour l’export
* Service worker et web manifest PWA-ready
* Déploiement statique sur GitHub Pages

## Note importante sur l’export

L’export final est **uniquement vidéo**.

L’audio importé sert seulement à affiner le timing des lyrics et **n’est pas** inclus dans le fichier exporté.

## Aucune affiliation

Ce projet n’est affilié ni à Apple Music, ni à Apple Inc., ni à Charli XCX, ni à Atlantic Records, ni à aucun autre artiste, label, marque, plateforme ou titulaire de droits.

Le terme **“brat-style”** est utilisé uniquement comme référence visuelle descriptive.

## Autorisation et copyright

Ce projet est publiquement visible uniquement à des fins de démonstration et d’information.

L’utilisation, la copie, la modification, la redistribution, le self-hosting, l’usage commercial, l’intégration, le clonage, la publication, l’hébergement, le reverse engineering, le scraping ou la création d’œuvres dérivées nécessitent **l’autorisation écrite explicite et préalable de l’auteur**.

La disponibilité publique de ce dépôt ne concède aucune licence.

Tous droits réservés.

Toute utilisation non autorisée peut entraîner des mesures d’enforcement, notamment des demandes de retrait, des mises en demeure, des plaintes juridiques, des demandes de dommages-intérêts, la récupération des profits et tout autre recours disponible en vertu de la loi applicable.

Ce projet ne concède aucun droit sur des lyrics, chansons, fichiers audio, marques, vidéos, images, trademarks, logos ou autres contenus tiers protégés. Les utilisateurs sont seuls responsables de s’assurer qu’ils disposent de tous les droits, licences, autorisations et clearances nécessaires avant d’exporter, publier, distribuer ou utiliser tout contenu généré, traité, affiché ou référencé via cet outil.

---

# 🇩🇪 Deutsch

## Überblick

**Brat Animator** ist ein statisches browserbasiertes Tool, das synchronisierte **LRC-Lyrics** in quadratische **brat-style Lyric-Videos** umwandelt.

Es unterstützt sowohl einen klassischen Single-Line-Canvas-Modus als auch einen optionalen music-style synchronisierten Scroll-Modus für Exporte, die ein Full-Screen-Lyric-Interface benötigen.

Live-Demo: **https://oakvx.github.io/bratAnimator/**

## Funktionen

* LRC-Eingabe mit Parsing von `[MM:SS.xx]`-Zeitstempeln
* Enhanced-LRC-Unterstützung mit Wort-Timing-Tags wie `<00:12.34>`, sofern verfügbar
* Lyrics-Suche über LRCLIB
* Optionale audio-gestützte Timing-Verfeinerung
* Klassischer brat-style Single-Line-Canvas-Modus
* Music-style synced scroll mode
* Große scrollende Lyric-Zeilen
* Fokus auf die aktive Zeile mit abgedimmten umliegenden Lyrics
* Optionale Wort-für-Wort-Fortschrittsmarkierung
* Canvas-basierte Vorschau
* Video-only Export: MP4, wenn unterstützt, sonst WebM-Fallback
* PNG-Export eines einzelnen Frames
* Interface-Umschalter EN / RU / ZH
* Drag and drop für LRC- und Audiodateien
* Autosave über `localStorage`
* Browser-Kompatibilitätspanel für den Export
* PWA-ready Service Worker und Web Manifest
* Statisches Deployment auf GitHub Pages

## Wichtiger Exporthinweis

Der finale Export ist **nur Video**.

Hochgeladenes Audio wird ausschließlich zur Verfeinerung des Lyric-Timings verwendet und ist **nicht** in der exportierten Datei enthalten.

## Keine Zugehörigkeit

Dieses Projekt ist nicht mit Apple Music, Apple Inc., Charli XCX, Atlantic Records oder einem anderen Künstler, Label, einer Marke, Plattform oder einem Rechteinhaber verbunden.

Der Begriff **“brat-style”** wird ausschließlich als beschreibende visuelle Referenz verwendet.

## Erlaubnis und Copyright

Dieses Projekt ist öffentlich sichtbar, jedoch ausschließlich zu Demonstrations- und Informationszwecken.

Nutzung, Kopieren, Änderung, Weiterverbreitung, Self-Hosting, kommerzielle Nutzung, Integration, Klonen, Veröffentlichung, Hosting, Reverse Engineering, Scraping oder Erstellung abgeleiteter Werke erfordern **die ausdrückliche vorherige schriftliche Genehmigung des Autors**.

Die öffentliche Verfügbarkeit dieses Repositorys gewährt keine Lizenz.

Alle Rechte vorbehalten.

Jede nicht autorisierte Nutzung kann Enforcement-Maßnahmen nach sich ziehen, einschließlich Takedown-Anfragen, Unterlassungsaufforderungen, rechtlicher Beschwerden, Schadensersatzforderungen, Gewinnabschöpfung und aller weiteren nach anwendbarem Recht verfügbaren Rechtsbehelfe.

Dieses Projekt gewährt keine Rechte an Lyrics, Songs, Audio, Marken, Videos, Bildern, Trademarks, Logos oder anderen geschützten Inhalten Dritter. Nutzer sind allein dafür verantwortlich sicherzustellen, dass sie alle erforderlichen Rechte, Lizenzen, Genehmigungen und Freigaben besitzen, bevor sie Inhalte exportieren, veröffentlichen, verbreiten oder verwenden, die mit diesem Tool generiert, verarbeitet, angezeigt oder referenziert werden.

---

# 🇵🇹 Português

## Visão geral

**Brat Animator** é uma ferramenta estática baseada em navegador que transforma **lyrics sincronizadas em formato LRC** em vídeos quadrados com estética **brat-style**.

Ele suporta tanto um modo clássico de uma linha em Canvas quanto um modo opcional de lyrics sincronizadas com rolagem em estilo music player.

Demo online: **https://oakvx.github.io/bratAnimator/**

## Funcionalidades

* Entrada LRC com parsing de timestamps `[MM:SS.xx]`
* Suporte a Enhanced LRC com tags de timing por palavra como `<00:12.34>`, quando disponíveis
* Busca de lyrics via LRCLIB
* Refinamento opcional de timing assistido por áudio
* Modo clássico brat-style em Canvas com linha única
* Modo music-style synced scroll
* Linhas grandes de lyrics com rolagem
* Foco na linha ativa com lyrics ao redor esmaecidas
* Destaque opcional de progresso palavra por palavra
* Preview baseado em Canvas
* Exportação apenas de vídeo: MP4 quando suportado, WebM como fallback
* Exportação PNG de um único frame
* Seletor de interface EN / RU / ZH
* Drag and drop para arquivos LRC e áudio
* Autosave via `localStorage`
* Painel de compatibilidade do navegador para exportação
* Service worker e web manifest PWA-ready
* Deploy estático no GitHub Pages

## Nota importante sobre exportação

A exportação final é **somente vídeo**.

O áudio enviado é usado apenas para ajudar a refinar o timing das lyrics e **não** é incluído no arquivo exportado.

## Sem afiliação

Este projeto não é afiliado à Apple Music, Apple Inc., Charli XCX, Atlantic Records ou qualquer outro artista, gravadora, marca, plataforma ou titular de direitos.

O termo **“brat-style”** é usado apenas como referência visual descritiva.

## Permissão e copyright

Este projeto está publicamente visível apenas para fins demonstrativos e informativos.

Uso, cópia, modificação, redistribuição, self-hosting, uso comercial, integração, clonagem, publicação, hospedagem, engenharia reversa, scraping ou criação de obras derivadas requerem **permissão explícita prévia por escrito do autor**.

A disponibilidade pública deste repositório não concede nenhuma licença.

Todos os direitos reservados.

Qualquer uso não autorizado pode resultar em medidas de enforcement, incluindo pedidos de remoção, notificações de cease-and-desist, reclamações legais, pedidos de indenização, recuperação de lucros e quaisquer outros recursos disponíveis pela lei aplicável.

Este projeto não concede nenhum direito sobre lyrics, músicas, áudio, marcas, vídeos, imagens, trademarks, logos ou qualquer outro conteúdo protegido de terceiros. Os usuários são os únicos responsáveis por garantir que possuem todos os direitos, licenças, permissões e autorizações necessárias antes de exportar, publicar, distribuir ou usar qualquer conteúdo gerado, processado, exibido ou referenciado por meio desta ferramenta.

---

# 🇷🇺 Русский

## Обзор

**Brat Animator** — это статический браузерный инструмент, который превращает синхронизированные **LRC lyrics** в квадратные **brat-style lyric videos**.

Он поддерживает как классический single-line lyric canvas, так и опциональный music-style synced scrolling lyrics mode для экспортов, которым нужен full-screen lyric interface.

Demo: **https://oakvx.github.io/bratAnimator/**

## Возможности

* Ввод LRC с парсингом timestamp `[MM:SS.xx]`
* Поддержка Enhanced LRC с word timing tags вроде `<00:12.34>`, если они доступны
* Поиск lyrics через LRCLIB
* Опциональная корректировка тайминга через аудио
* Классический brat-style single-line Canvas mode
* Music-style synced scroll mode
* Большие прокручиваемые lyric lines
* Фокус на активной строке с приглушением соседних lyrics
* Опциональный word-progress highlight
* Canvas preview
* Video-only экспорт: MP4 при поддержке, иначе WebM fallback
* Экспорт одного кадра PNG
* Переключатель интерфейса EN / RU / ZH
* Drag and drop для LRC и аудио
* Autosave через `localStorage`
* Панель совместимости браузера для экспорта
* PWA-ready service worker и web manifest
* Статический deploy на GitHub Pages

## Важно про экспорт

Финальный экспорт — **только видео**.

Загруженное аудио используется только для уточнения тайминга lyrics и **не** включается в экспортированный файл.

## Нет аффилиации

Этот проект не связан с Apple Music, Apple Inc., Charli XCX, Atlantic Records или любыми другими артистами, лейблами, брендами, платформами или правообладателями.

Термин **“brat-style”** используется только как описательная визуальная ссылка.

## Разрешение и copyright

Этот проект публично доступен только для демонстрационных и информационных целей.

Использование, копирование, изменение, распространение, self-hosting, коммерческое использование, интеграция, клонирование, публикация, хостинг, reverse engineering, scraping или создание производных работ требуют **явного предварительного письменного разрешения автора**.

Публичная доступность этого репозитория не предоставляет никакой лицензии.

Все права защищены.

Любое несанкционированное использование может привести к enforcement actions, включая takedown requests, cease-and-desist notices, legal complaints, claims for damages, recovery of profits и любые другие средства правовой защиты, доступные по применимому законодательству.

Этот проект не предоставляет никаких прав на lyrics, песни, аудио, бренды, видео, изображения, trademarks, логотипы или другой защищённый сторонний контент. Пользователи несут полную ответственность за наличие всех необходимых прав, лицензий, разрешений и clearances перед экспортом, публикацией, распространением или использованием любого контента, созданного, обработанного, отображённого или упомянутого через этот инструмент.

---

# 🇨🇳 中文

## 概述

**Brat Animator** 是一个静态浏览器工具，可以把同步 **LRC 歌词** 转换成方形 **brat-style 歌词视频**。

它支持经典单行歌词 Canvas 模式，也支持可选的音乐播放器风格同步滚动歌词模式，适合需要全屏歌词界面的导出场景。

在线演示：**https://oakvx.github.io/bratAnimator/**

## 功能

* LRC `[MM:SS.xx]` 时间戳解析
* 支持 Enhanced LRC，例如可用时支持 `<00:12.34>` 这样的逐词 timing 标签
* 通过 LRCLIB 搜索歌词
* 可选音频辅助 timing 优化
* 经典 brat-style 单行 Canvas 模式
* 音乐播放器风格的同步滚动歌词模式
* 大号滚动歌词行
* 当前行聚焦，周围 lyrics 变暗
* 可选逐词进度高亮
* Canvas 预览
* Video-only 导出：支持时 MP4，否则 WebM fallback
* PNG 单帧导出
* EN / RU / ZH 界面切换
* LRC 和音频 drag and drop
* 通过 `localStorage` 自动保存
* 导出兼容性面板
* PWA-ready service worker 和 web manifest
* 可静态部署到 GitHub Pages

## 关于导出

最终导出是 **仅视频**。

上传的音频只用于辅助歌词 timing 优化，**不会**包含在导出文件中。

## 无关联声明

本项目与 Apple Music、Apple Inc.、Charli XCX、Atlantic Records 或任何其他艺人、唱片公司、品牌、平台或权利持有人均无关联。

**“brat-style”** 一词仅作为描述性视觉参考使用。

## 授权和版权

本项目公开可见仅用于演示和信息展示目的。

使用、复制、修改、再分发、self-hosting、商业用途、集成、克隆、发布、托管、逆向工程、scraping 或创建衍生作品都需要**作者事先明确书面许可**。

本仓库的公开可访问性不授予任何许可。

保留所有权利。

任何未经授权的使用都可能导致 enforcement action，包括 takedown requests、cease-and-desist notices、法律投诉、损害赔偿请求、利润追缴以及适用法律允许的任何其他救济措施。

本项目不授予任何歌词、歌曲、音频、品牌、视频、图像、商标、logo 或任何其他受保护第三方内容的权利。用户在导出、发布、分发或使用通过本工具生成、处理、显示或引用的任何内容之前，应自行确保拥有所有必要权利、许可、授权和 clearances。

---

# 🇯🇵 日本語

## 概要

**Brat Animator** は、同期された **LRC 歌詞** を正方形の **brat-style リリックビデオ** に変換する、静的なブラウザベースのツールです。

クラシックな単一行 lyric canvas モードと、全画面 lyric interface が必要な export 向けの任意の music-style 同期スクロール lyrics モードをサポートしています。

ライブデモ: **https://oakvx.github.io/bratAnimator/**

## 機能

* `[MM:SS.xx]` タイムスタンプを含む LRC 入力の解析
* 利用可能な場合、`<00:12.34>` のような単語単位 timing tag を含む Enhanced LRC をサポート
* LRCLIB による lyrics 検索
* 音声を用いた任意の timing 補正
* クラシックな brat-style 単一行 Canvas モード
* Music-style synced scroll mode
* 大きなスクロール lyric lines
* アクティブ行へのフォーカスと周辺 lyrics の減光
* 任意の単語進行ハイライト
* Canvas ベースのプレビュー
* Video-only エクスポート: 対応時は MP4、非対応時は WebM fallback
* 単一フレーム PNG エクスポート
* EN / RU / ZH インターフェース切替
* LRC および音声ファイルの drag and drop
* `localStorage` による autosave
* エクスポート用ブラウザ互換性パネル
* PWA-ready service worker と web manifest
* GitHub Pages への静的デプロイ

## エクスポートに関する重要事項

最終エクスポートは **動画のみ** です。

アップロードされた音声は lyrics の timing 補正のみに使用され、エクスポートされたファイルには**含まれません**。

## 非提携について

本プロジェクトは Apple Music、Apple Inc.、Charli XCX、Atlantic Records、その他のアーティスト、レーベル、ブランド、プラットフォーム、権利者とは一切関係ありません。

**“brat-style”** という用語は、視覚的特徴を説明するための参照としてのみ使用されています。

## 許可および著作権

本プロジェクトは、デモンストレーションおよび情報提供のみを目的として公開されています。

使用、コピー、変更、再配布、self-hosting、商用利用、統合、クローン、公開、ホスティング、リバースエンジニアリング、scraping、派生作品の作成には、**作者による事前の明示的な書面許可**が必要です。

このリポジトリが公開されていることは、いかなるライセンスの付与も意味しません。

All rights reserved.

不正使用は、takedown requests、cease-and-desist notices、法的申立て、損害賠償請求、利益の返還請求、および適用法上利用可能なその他の救済措置を含む enforcement action の対象となる可能性があります。

本プロジェクトは、lyrics、楽曲、音声、ブランド、動画、画像、商標、ロゴ、その他の保護された第三者コンテンツに関する権利を一切付与しません。本ツールを通じて生成、処理、表示、参照されるコンテンツをエクスポート、公開、配布、使用する前に、必要なすべての権利、ライセンス、許可、clearances を取得していることを確認する責任はユーザーにあります。

---

# 🇰🇷 한국어

## 개요

**Brat Animator**는 동기화된 **LRC 가사**를 정사각형 **brat-style lyric video**로 변환하는 정적 브라우저 기반 도구입니다.

클래식 단일 라인 lyric canvas 모드와 전체 화면 lyric interface가 필요한 export를 위한 선택적 music-style synchronized scrolling lyrics 모드를 모두 지원합니다.

라이브 데모: **https://oakvx.github.io/bratAnimator/**

## 기능

* `[MM:SS.xx]` 타임스탬프가 포함된 LRC 입력 파싱
* 사용 가능한 경우 `<00:12.34>` 같은 단어 단위 timing tag를 포함한 Enhanced LRC 지원
* LRCLIB를 통한 lyrics 검색
* 선택적 오디오 기반 timing 보정
* 클래식 brat-style 단일 라인 Canvas 모드
* Music-style synced scroll mode
* 큰 스크롤 lyric lines
* 활성 라인 포커스 및 주변 lyrics dim 처리
* 선택적 단어 진행 하이라이트
* Canvas 기반 preview
* Video-only export: 지원 시 MP4, 그렇지 않으면 WebM fallback
* 단일 프레임 PNG export
* EN / RU / ZH 인터페이스 전환
* LRC 및 오디오 파일 drag and drop
* `localStorage`를 통한 autosave
* Export용 브라우저 호환성 패널
* PWA-ready service worker 및 web manifest
* GitHub Pages 정적 배포

## Export 관련 중요 사항

최종 export는 **비디오 전용**입니다.

업로드된 오디오는 lyrics timing 보정을 돕기 위해서만 사용되며, export된 파일에는 **포함되지 않습니다**.

## 비제휴 고지

이 프로젝트는 Apple Music, Apple Inc., Charli XCX, Atlantic Records 또는 기타 아티스트, 레이블, 브랜드, 플랫폼, 권리자와 아무런 관련이 없습니다.

**“brat-style”**이라는 용어는 시각적 스타일을 설명하기 위한 참고 표현으로만 사용됩니다.

## 허가 및 저작권

이 프로젝트는 데모 및 정보 제공 목적으로만 공개되어 있습니다.

사용, 복사, 수정, 재배포, self-hosting, 상업적 사용, 통합, 클론, 게시, 호스팅, reverse engineering, scraping 또는 파생 저작물 생성에는 **저자의 명시적인 사전 서면 허가**가 필요합니다.

이 저장소가 공개되어 있다는 사실은 어떠한 라이선스도 부여하지 않습니다.

All rights reserved.

무단 사용은 takedown requests, cease-and-desist notices, legal complaints, 손해배상 청구, 이익 환수 및 적용 법률상 가능한 기타 구제 수단을 포함한 enforcement action의 대상이 될 수 있습니다.

이 프로젝트는 lyrics, 음악, 오디오, 브랜드, 비디오, 이미지, 상표, 로고 또는 기타 보호되는 제3자 콘텐츠에 대한 어떠한 권리도 부여하지 않습니다. 사용자는 이 도구를 통해 생성, 처리, 표시 또는 참조된 콘텐츠를 export, 게시, 배포 또는 사용하기 전에 필요한 모든 권리, 라이선스, 허가 및 clearances를 보유하고 있는지 스스로 확인할 책임이 있습니다.

---

# 🇮🇳 हिन्दी

## Overview

**Brat Animator** एक static browser-based tool है जो synchronized **LRC lyrics** को square **brat-style lyric videos** में बदलता है।

यह classic single-line lyric canvas mode और optional music-style synced scrolling lyrics mode दोनों को support करता है, उन exports के लिए जिन्हें full-screen lyric interface चाहिए।

Live demo: **https://oakvx.github.io/bratAnimator/**

## Features

* `[MM:SS.xx]` timestamp parsing के साथ LRC input
* उपलब्ध होने पर `<00:12.34>` जैसे word timing tags के साथ Enhanced LRC support
* LRCLIB के माध्यम से lyrics search
* Optional audio-assisted timing refinement
* Classic brat-style single-line Canvas mode
* Music-style synced scroll mode
* बड़ी scrolling lyric lines
* Active line focus और surrounding lyrics को dim करना
* Optional word-progress highlight
* Canvas-based preview
* Video-only export: supported होने पर MP4, अन्यथा WebM fallback
* Single-frame PNG export
* EN / RU / ZH interface switcher
* LRC और audio files के लिए drag and drop
* `localStorage` के माध्यम से autosave
* Export के लिए browser compatibility panel
* PWA-ready service worker और web manifest
* GitHub Pages पर static deployment

## Important export note

Final export **video-only** है।

Uploaded audio केवल lyrics timing refine करने में मदद के लिए उपयोग किया जाता है और exported file में **शामिल नहीं** होता।

## No affiliation

यह project Apple Music, Apple Inc., Charli XCX, Atlantic Records या किसी अन्य artist, label, brand, platform या rights holder से affiliated नहीं है।

**“brat-style”** शब्द केवल descriptive visual reference के रूप में उपयोग किया गया है।

## Permission and copyright

यह project केवल demonstration और informational purposes के लिए publicly visible है।

Usage, copying, modification, redistribution, self-hosting, commercial use, integration, cloning, publishing, hosting, reverse engineering, scraping या derivative works बनाने के लिए **author की explicit prior written permission** आवश्यक है।

इस repository की public availability कोई license grant नहीं करती।

All rights reserved.

Unauthorized use के कारण enforcement action हो सकता है, जिसमें takedown requests, cease-and-desist notices, legal complaints, claims for damages, recovery of profits और applicable law के तहत उपलब्ध अन्य remedies शामिल हो सकते हैं।

यह project copyrighted lyrics, songs, audio, brands, videos, images, trademarks, logos या किसी अन्य protected third-party content पर कोई अधिकार प्रदान नहीं करता। Users स्वयं यह सुनिश्चित करने के लिए जिम्मेदार हैं कि इस tool के माध्यम से generated, processed, displayed या referenced किसी भी content को export, publish, distribute या use करने से पहले उनके पास सभी आवश्यक rights, licenses, permissions और clearances मौजूद हों।

---

# 🇬🇷 Ελληνικά

## Επισκόπηση

**Brat Animator** είναι ένα στατικό browser-based εργαλείο που μετατρέπει συγχρονισμένα **LRC lyrics** σε τετράγωνα **brat-style lyric videos**.

Υποστηρίζει τόσο την κλασική λειτουργία single-line lyric canvas όσο και μια προαιρετική music-style λειτουργία συγχρονισμένης κύλισης lyrics για exports που χρειάζονται full-screen lyric interface.

Live demo: **https://oakvx.github.io/bratAnimator/**

## Χαρακτηριστικά

* LRC input με parsing timestamp `[MM:SS.xx]`
* Υποστήριξη Enhanced LRC με word timing tags όπως `<00:12.34>`, όταν είναι διαθέσιμα
* Αναζήτηση lyrics μέσω LRCLIB
* Προαιρετική audio-assisted βελτίωση timing
* Κλασική brat-style single-line Canvas λειτουργία
* Music-style synced scroll mode
* Μεγάλες scrolling lyric lines
* Focus στην ενεργή γραμμή με dimmed surrounding lyrics
* Προαιρετικό word-progress highlight
* Canvas-based preview
* Video-only export: MP4 όταν υποστηρίζεται, διαφορετικά WebM fallback
* PNG single-frame export
* EN / RU / ZH interface switcher
* Drag and drop για LRC και audio files
* Autosave μέσω `localStorage`
* Browser compatibility panel για export
* PWA-ready service worker και web manifest
* Static deployment στο GitHub Pages

## Σημαντική σημείωση για το export

Το τελικό export είναι **μόνο video**.

Το uploaded audio χρησιμοποιείται αποκλειστικά για τη βελτίωση του lyric timing και **δεν** περιλαμβάνεται στο exported file.

## Καμία σύνδεση ή συνεργασία

Αυτό το project δεν συνδέεται, δεν συνεργάζεται και δεν είναι affiliated με Apple Music, Apple Inc., Charli XCX, Atlantic Records ή οποιονδήποτε άλλο artist, label, brand, platform ή rights holder.

Ο όρος **“brat-style”** χρησιμοποιείται αποκλειστικά ως περιγραφική οπτική αναφορά.

## Άδεια και copyright

Αυτό το project είναι publicly visible αποκλειστικά για demonstration και informational purposes.

Η χρήση, αντιγραφή, τροποποίηση, αναδιανομή, self-hosting, εμπορική χρήση, ενσωμάτωση, cloning, publishing, hosting, reverse engineering, scraping ή δημιουργία derivative works απαιτεί **ρητή προηγούμενη γραπτή άδεια από τον author**.

Η δημόσια διαθεσιμότητα αυτού του repository δεν παραχωρεί καμία license.

All rights reserved.

Οποιαδήποτε μη εξουσιοδοτημένη χρήση μπορεί να οδηγήσει σε enforcement actions, συμπεριλαμβανομένων takedown requests, cease-and-desist notices, legal complaints, claims for damages, recovery of profits και κάθε άλλου ένδικου μέσου που προβλέπεται από την εφαρμοστέα νομοθεσία.

Αυτό το project δεν παραχωρεί κανένα δικαίωμα σε copyrighted lyrics, songs, audio, brands, videos, images, trademarks, logos ή οποιοδήποτε άλλο protected third-party content. Οι users είναι αποκλειστικά υπεύθυνοι να διασφαλίσουν ότι διαθέτουν όλα τα απαραίτητα rights, licenses, permissions και clearances πριν κάνουν export, publish, distribute ή χρησιμοποιήσουν οποιοδήποτε content generated, processed, displayed ή referenced μέσω αυτού του tool.
