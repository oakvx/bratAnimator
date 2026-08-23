const BRAT_TRANSLATIONS = {
  en: {
    controls: "controls",
    loadDemo: "load demo",
    requestPermission: "request permission",
    includeAudioInExport: "include loaded audio",
    exportAudioNoFile: "Load one audio/video file in Timing; export can merge the extracted audio automatically.",
    exportAudioReady: "will be merged into export. Extracted audio stays local; YouTube is preview only.",
    permissionNoticeKicker: "usage note",
    permissionNoticeTitle: "use it freely. ask before publishing.",
    permissionNoticeText: "You are free to use Brat Animator as much as you want. To publish, share publicly, redistribute, self-host, commercialize, or integrate anything made with it, please ask permission first.",
    permissionNoticeAcknowledge: "i understand",
    permissionNoticePermission: "ask permission",
    recoveryText: "autosaved project restored in this browser",
    recoveryKeep: "keep",
    recoveryDiscard: "discard",
    panelTitle: "brat lyric video editor",
    panelIntro: "Search a song on LRCLIB, paste or load LRC lyrics, use cleared audio/video for timing, and optionally merge extracted audio into the final export.",
    lyricsSearch: "lyrics search",
    searchSongLabel: "search LRCLIB or paste YouTube link",
    searchPlaceholder: "artist - title or YouTube link",
    search: "search / load",
    clearResults: "clear results",
    lyricsTiming: "lyrics and timing",
    lrcText: "LRC lyrics",
    dropLrc: "Drop a .lrc file here or click to load lyrics",
    optionalAudio: "optional audio/video for timing analysis",
    dropAudio: "Drop an audio or video file here to extract audio",
    useAudioTiming: "use audio to improve timing",
    startFromZero: "start timeline from 0:00",
    clearSaved: "clear saved project",
    start: "start",
    play: "play",
    pause: "pause",
    restart: "restart",
    reset: "reset",
    export: "export",
    exportIntro: "Video-only export stays fast when supported. If loaded audio is enabled, export records in real time and merges only extracted local or direct CORS-enabled media audio you have permission to use.",
    videoSize: "video size",
    fastMp4: "Fast MP4",
    mediaRecorder: "MediaRecorder",
    recommendedPreset: "Recommended",
    exportVideo: "export video",
    exportPng: "export PNG frame",
    exportNote: "video-only by default; loaded local audio/video or direct media audio can be merged when enabled",
    externalPreview: "external video preview",
    videoSelection: "video selection",
    videoPreview: "video preview",
    closePreview: "close preview",
    hint: "export a frame or render the video",
    aboutLink: "about",
    aboutTitle: "Brat-style LRC lyric video generator",
    aboutText: "Brat Animator is a static, browser-based creative tool for turning synced LRC lyrics into lyric videos. It processes lyrics locally and can export MP4/WebM with or without loaded permitted audio.",
    siteLinksTitle: "Site links",
    jumpEditor: "Open editor",
    jumpAbout: "About Brat Animator",
    openEnglish: "English page",
    openRussian: "Russian page",
    openChinese: "Chinese page",
    openSitemap: "Sitemap",
    whyTitle: "Why it exists",
    whyOne: "Create fast brat-style lyric visuals without editing software.",
    whyTwo: "Use YouTube only as preview/reference; merge audio only from local files or permitted CORS URLs.",
    whyThree: "Keep everything static and deployable on GitHub Pages.",
    permissionTitle: "Permission required",
    permissionText: "You can use Brat Animator freely. Publishing, public sharing, redistribution, self-hosting, commercial use, or integration requires explicit written permission from the author.",
    workflowTitle: "How it works",
    workflowOne: "Search LRCLIB or paste synced LRC lyrics.",
    workflowTwo: "Use optional cleared audio/video to check timing and export with volume/fades.",
    workflowThree: "Customize the canvas and export MP4/WebM with or without loaded audio.",
    browserTitle: "Browser-first tools",
    browserOne: "Project snapshots stay in this browser.",
    browserTwo: "Share links and project JSON make handoff simple.",
    browserThree: "The built-in tutorial helps first-time users start quickly.",
    noSearch: "no search yet",
    noAudio: "no audio loaded",
    noExport: "no export yet",
    estimateNA: "estimated export time: n/a",
    noVideo: "no video loaded"
  },
  ru: {
    controls: "панель",
    loadDemo: "демо",
    requestPermission: "запросить разрешение",
    includeAudioInExport: "добавить загруженное аудио",
    exportAudioNoFile: "Загрузите аудио или видео в Timing; экспорт сможет добавить извлеченное аудио автоматически.",
    exportAudioReady: "будет добавлено в экспорт. Аудио остается локальным; YouTube только для preview.",
    permissionNoticeKicker: "заметка",
    permissionNoticeTitle: "используйте свободно. перед публикацией спросите разрешение.",
    permissionNoticeText: "Вы можете пользоваться Brat Animator сколько угодно. Для публикации, публичного шаринга, распространения, self-hosting, коммерческого использования или интеграции сначала запросите разрешение.",
    permissionNoticeAcknowledge: "понятно",
    permissionNoticePermission: "запросить разрешение",
    recoveryText: "autosave проекта восстановлен в этом браузере",
    recoveryKeep: "оставить",
    recoveryDiscard: "сбросить",
    panelTitle: "brat lyric video editor",
    panelIntro: "Ищите песню в LRCLIB, вставляйте или загружайте LRC, используйте разрешенное аудио/видео для тайминга и при необходимости добавляйте извлеченное аудио в экспорт.",
    lyricsSearch: "поиск lyrics",
    searchSongLabel: "поиск LRCLIB или YouTube link",
    searchPlaceholder: "artist - title или YouTube link",
    search: "поиск / загрузить",
    clearResults: "очистить",
    lyricsTiming: "lyrics и тайминг",
    lrcText: "LRC lyrics",
    dropLrc: "Перетащите .lrc файл сюда или нажмите для загрузки lyrics",
    optionalAudio: "опциональное аудио/видео для тайминга",
    dropAudio: "Перетащите аудио или видео сюда, чтобы извлечь аудио",
    useAudioTiming: "использовать аудио для улучшения тайминга",
    startFromZero: "начать timeline с 0:00",
    clearSaved: "очистить сохраненный проект",
    start: "старт",
    play: "play",
    pause: "пауза",
    restart: "заново",
    reset: "сброс",
    export: "экспорт",
    exportIntro: "Video-only экспорт остается самым быстрым. Если включено загруженное аудио, экспорт идет в реальном времени и добавляет только локальное или CORS media-аудио, на которое у вас есть права.",
    videoSize: "размер видео",
    fastMp4: "Fast MP4",
    mediaRecorder: "MediaRecorder",
    recommendedPreset: "Рекомендация",
    exportVideo: "экспорт видео",
    exportPng: "экспорт PNG кадра",
    exportNote: "по умолчанию video-only; локальное аудио/видео или direct media audio можно добавить при включении",
    externalPreview: "external video preview",
    videoSelection: "выбор видео",
    videoPreview: "video preview",
    closePreview: "закрыть preview",
    hint: "экспортируйте кадр или видео",
    aboutLink: "о проекте",
    aboutTitle: "Brat-style LRC lyric video generator",
    aboutText: "Brat Animator - статический браузерный creative tool для синхронизированных LRC lyric videos. Он обрабатывает lyrics локально и экспортирует MP4/WebM с загруженным разрешенным аудио или без него.",
    siteLinksTitle: "Ссылки",
    jumpEditor: "Открыть editor",
    jumpAbout: "О Brat Animator",
    openEnglish: "English page",
    openRussian: "Russian page",
    openChinese: "Chinese page",
    openSitemap: "Sitemap",
    whyTitle: "Зачем это нужно",
    whyOne: "Быстро создавать brat-style lyric visuals без видеоредактора.",
    whyTwo: "YouTube используется только как preview/reference; аудио добавляется только из локальных файлов или разрешенных CORS URL.",
    whyThree: "Проект остается статическим и совместимым с GitHub Pages.",
    permissionTitle: "Требуется разрешение",
    permissionText: "Вы можете свободно пользоваться Brat Animator. Публикация, публичный шаринг, распространение, self-hosting, коммерческое использование или интеграция требуют письменного разрешения автора.",
    workflowTitle: "Как это работает",
    workflowOne: "Найдите lyrics через LRCLIB или вставьте синхронизированный LRC.",
    workflowTwo: "Используйте разрешенное аудио/видео для проверки тайминга и экспорта с volume/fades.",
    workflowThree: "Настройте canvas и экспортируйте MP4/WebM с загруженным аудио или без него.",
    browserTitle: "Browser-first tools",
    browserOne: "Project snapshots остаются в этом браузере.",
    browserTwo: "Share links и project JSON упрощают передачу проекта.",
    browserThree: "Встроенный tutorial помогает быстро начать.",
    noSearch: "поиска еще нет",
    noAudio: "аудио не загружено",
    noExport: "экспорта еще нет",
    estimateNA: "примерное время экспорта: n/a",
    noVideo: "видео не загружено"
  },
  zh: {
    controls: "控制",
    loadDemo: "加载演示",
    requestPermission: "申请许可",
    includeAudioInExport: "包含已加载音频",
    exportAudioNoFile: "在 Timing 中加载一个音频/视频文件；导出时可自动合并提取出的音频。",
    exportAudioReady: "会被合并到导出中。提取出的音频保留在本地；YouTube 仅用于预览。",
    permissionNoticeKicker: "使用提醒",
    permissionNoticeTitle: "可以自由使用。发布前请先询问。",
    permissionNoticeText: "你可以随意使用 Brat Animator。发布、公开分享、再分发、self-hosting、商业用途或集成前，请先申请许可。",
    permissionNoticeAcknowledge: "我知道了",
    permissionNoticePermission: "申请许可",
    recoveryText: "已在此浏览器中恢复 autosave 项目",
    recoveryKeep: "保留",
    recoveryDiscard: "丢弃",
    panelTitle: "brat lyric video editor",
    panelIntro: "通过 LRCLIB 搜索歌曲，粘贴或加载 LRC 歌词，使用已授权的音频/视频校准 timing，并可将提取出的音频合并到最终导出。",
    lyricsSearch: "歌词搜索",
    searchSongLabel: "搜索 LRCLIB 或粘贴 YouTube 链接",
    searchPlaceholder: "artist - title 或 YouTube link",
    search: "搜索 / 加载",
    clearResults: "清空结果",
    lyricsTiming: "歌词和 timing",
    lrcText: "LRC 歌词",
    dropLrc: "将 .lrc 文件拖到这里，或点击加载歌词",
    optionalAudio: "用于 timing 分析的可选音频/视频",
    dropAudio: "将音频或视频拖到这里以提取音频",
    useAudioTiming: "使用音频优化 timing",
    startFromZero: "从 0:00 开始 timeline",
    clearSaved: "清除已保存项目",
    start: "开始",
    play: "播放",
    pause: "暂停",
    restart: "重新开始",
    reset: "重置",
    export: "导出",
    exportIntro: "支持时 video-only 导出最快。如果启用已加载音频，导出会实时录制，并只合并你有权使用的本地或 CORS media 音频。",
    videoSize: "视频尺寸",
    fastMp4: "Fast MP4",
    mediaRecorder: "MediaRecorder",
    recommendedPreset: "推荐",
    exportVideo: "导出视频",
    exportPng: "导出 PNG 帧",
    exportNote: "默认 video-only；启用后可合并本地音频/视频或 direct media audio",
    externalPreview: "外部视频预览",
    videoSelection: "视频选择",
    videoPreview: "视频预览",
    closePreview: "关闭预览",
    hint: "导出一帧或渲染视频",
    aboutLink: "关于",
    aboutTitle: "Brat-style LRC 歌词视频生成器",
    aboutText: "Brat Animator 是静态浏览器 creative tool，可将同步 LRC 歌词转换为 lyric videos。它在本地处理歌词，并可导出带或不带已授权加载音频的 MP4/WebM。",
    siteLinksTitle: "站点链接",
    jumpEditor: "打开编辑器",
    jumpAbout: "关于 Brat Animator",
    openEnglish: "English page",
    openRussian: "Russian page",
    openChinese: "Chinese page",
    openSitemap: "Sitemap",
    whyTitle: "为什么需要它",
    whyOne: "不用视频编辑软件也能快速创建 brat-style lyric visuals。",
    whyTwo: "YouTube 仅作 preview/reference；音频只从本地文件或已授权 CORS URL 合并。",
    whyThree: "保持完全静态，并兼容 GitHub Pages 部署。",
    permissionTitle: "需要许可",
    permissionText: "你可以自由使用 Brat Animator。发布、公开分享、再分发、self-hosting、商业用途或集成前，请先获得作者书面许可。",
    workflowTitle: "工作流程",
    workflowOne: "通过 LRCLIB 搜索，或粘贴同步 LRC 歌词。",
    workflowTwo: "使用已授权音频/视频检查 timing，并用 volume/fades 导出。",
    workflowThree: "自定义 canvas，并导出带或不带已加载音频的 MP4/WebM。",
    browserTitle: "浏览器优先工具",
    browserOne: "Project snapshots 会保存在当前浏览器中。",
    browserTwo: "Share links 和 project JSON 让交接更简单。",
    browserThree: "内置 tutorial 帮助新用户快速开始。",
    noSearch: "尚未搜索",
    noAudio: "未加载音频",
    noExport: "尚未导出",
    estimateNA: "预计导出时间：n/a",
    noVideo: "未加载视频"
  }
};

(function () {
  const STORAGE_KEY = "bratAnimator.language";

  function normalizeLanguage(lang) {
    return BRAT_TRANSLATIONS[lang] ? lang : "en";
  }

  function getLanguageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("lang");
  }

  function getSavedLanguage() {
    return normalizeLanguage(getLanguageFromUrl() || localStorage.getItem(STORAGE_KEY) || "en");
  }

  function translate(lang, key) {
    const safeLang = normalizeLanguage(lang);
    return BRAT_TRANSLATIONS[safeLang]?.[key] || BRAT_TRANSLATIONS.en[key] || key;
  }

  function applyLanguage(lang) {
    const safeLang = normalizeLanguage(lang);
    localStorage.setItem(STORAGE_KEY, safeLang);
    document.documentElement.lang = safeLang === "zh" ? "zh-CN" : safeLang;

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      node.textContent = translate(safeLang, key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      const key = node.getAttribute("data-i18n-placeholder");
      node.setAttribute("placeholder", translate(safeLang, key));
    });

    document.querySelectorAll("[data-status-key]").forEach((node) => {
      const key = node.getAttribute("data-status-key");
      if (!node.dataset.statusCustom) node.textContent = translate(safeLang, key);
    });

    document.querySelectorAll(".lang-btn").forEach((button) => {
      const active = button.dataset.lang === safeLang;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    return safeLang;
  }

  window.BratI18n = {
    translations: BRAT_TRANSLATIONS,
    t(key) {
      return translate(getSavedLanguage(), key);
    },
    translate,
    normalizeLanguage,
    getSavedLanguage,
    applyLanguage
  };
})();
