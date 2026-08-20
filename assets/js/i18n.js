const BRAT_TRANSLATIONS = {
  en: {
    controls: "controls",
    loadDemo: "load demo",
    requestPermission: "request permission",
    panelTitle: "brat video lyrics",
    panelIntro: "Search a song on LRCLIB, paste or load LRC lyrics, optionally use audio to refine timing, and export a video-only animation. Audio is never included in the final export.",
    lyricsSearch: "lyrics search",
    searchSongLabel: "search a song",
    searchPlaceholder: "artist - title",
    search: "search",
    clearResults: "clear results",
    lyricsTiming: "lyrics and timing",
    lrcText: "LRC lyrics",
    dropLrc: "Drop a .lrc file here or click to load lyrics",
    optionalAudio: "optional audio for timing analysis",
    dropAudio: "Drop an audio file here or click to load audio",
    useAudioTiming: "use audio to improve timing",
    startFromZero: "start timeline from 0:00",
    clearSaved: "clear saved project",
    start: "start",
    play: "play",
    pause: "pause",
    restart: "restart",
    reset: "reset",
    export: "export",
    exportIntro: "The exported file contains only the rendered video. No external iframe and no audio track are included. On compatible browsers, fast export can render without waiting for the full real-time lyric duration.",
    videoSize: "video size",
    fastMp4: "Fast MP4",
    mediaRecorder: "MediaRecorder",
    recommendedPreset: "Recommended",
    exportVideo: "export video",
    exportPng: "export PNG frame",
    exportNote: "video-only output • fast export when supported • MP4 if available, otherwise WebM fallback",
    externalPreview: "external video preview",
    videoSelection: "video selection",
    videoPreview: "video preview",
    closePreview: "close preview",
    hint: "export a frame or render the video",
    aboutTitle: "Brat-style LRC lyric video generator",
    aboutText: "Brat Animator is a static, browser-based creative tool for turning synced LRC lyrics into square lyric videos. It runs on GitHub Pages, processes lyrics locally in the browser, and exports video-only MP4/WebM files when supported.",
    whyTitle: "Why it exists",
    whyOne: "Create fast brat-style lyric visuals without editing software.",
    whyTwo: "Use audio only as timing assistance; the exported video contains no audio.",
    whyThree: "Keep everything static and deployable on GitHub Pages.",
    permissionTitle: "Permission required",
    permissionText: "Usage, copying, modification, redistribution, self-hosting, commercial use, or integration requires explicit written permission from the author.",
    workflowTitle: "How it works",
    workflowOne: "Search LRCLIB or paste synced LRC lyrics.",
    workflowTwo: "Use optional local audio to check timing.",
    workflowThree: "Customize the square canvas and export video-only MP4/WebM.",
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
    controls: "управление",
    loadDemo: "загрузить демо",
    requestPermission: "запросить разрешение",
    panelTitle: "brat video lyrics",
    panelIntro: "Найдите трек через LRCLIB, вставьте или загрузите LRC lyrics, при необходимости используйте аудио для уточнения тайминга и экспортируйте video-only анимацию. Аудио не включается в финальный экспорт.",
    lyricsSearch: "поиск lyrics",
    searchSongLabel: "найти песню",
    searchPlaceholder: "исполнитель - название",
    search: "поиск",
    clearResults: "очистить результаты",
    lyricsTiming: "lyrics и тайминг",
    lrcText: "LRC lyrics",
    dropLrc: "Перетащите .lrc файл сюда или нажмите для загрузки lyrics",
    optionalAudio: "опциональное аудио для анализа тайминга",
    dropAudio: "Перетащите аудиофайл сюда или нажмите для загрузки аудио",
    useAudioTiming: "использовать аудио для улучшения тайминга",
    startFromZero: "начать timeline с 0:00",
    clearSaved: "очистить сохранённый проект",
    start: "старт",
    play: "play",
    pause: "пауза",
    restart: "перезапуск",
    reset: "сброс",
    export: "экспорт",
    exportIntro: "Экспортированный файл содержит только отрендеренное видео. Внешний iframe и аудиодорожка не включаются. В совместимых браузерах fast export может рендерить без ожидания полной реальной длительности lyrics.",
    videoSize: "размер видео",
    fastMp4: "Fast MP4",
    mediaRecorder: "MediaRecorder",
    recommendedPreset: "Рекомендовано",
    exportVideo: "экспорт видео",
    exportPng: "экспорт PNG кадра",
    exportNote: "video-only output • fast export при поддержке • MP4 если доступно, иначе WebM fallback",
    externalPreview: "внешний video preview",
    videoSelection: "выбор видео",
    videoPreview: "video preview",
    closePreview: "закрыть preview",
    hint: "экспортируйте кадр или отрендерите видео",
    aboutTitle: "Brat-style LRC lyric video generator",
    aboutText: "Brat Animator — статический браузерный creative tool для превращения синхронизированных LRC lyrics в квадратные lyric videos. Он работает на GitHub Pages, обрабатывает lyrics локально в браузере и экспортирует video-only MP4/WebM, если это поддерживается.",
    whyTitle: "Зачем это нужно",
    whyOne: "Быстро создавать brat-style lyric visuals без видеоредактора.",
    whyTwo: "Использовать аудио только как помощь для тайминга; экспорт не содержит аудио.",
    whyThree: "Сохранить проект полностью статическим и совместимым с GitHub Pages.",
    permissionTitle: "Требуется разрешение",
    permissionText: "Использование, копирование, изменение, распространение, self-hosting, коммерческое использование или интеграция требуют явного письменного разрешения автора.",
    workflowTitle: "Как это работает",
    workflowOne: "Найдите lyrics через LRCLIB или вставьте синхронизированные LRC lyrics.",
    workflowTwo: "Используйте опциональное локальное аудио, чтобы проверить тайминг.",
    workflowThree: "Настройте квадратный canvas и экспортируйте video-only MP4/WebM.",
    browserTitle: "Инструменты в браузере",
    browserOne: "Project snapshots остаются в этом браузере.",
    browserTwo: "Share links и project JSON упрощают передачу проекта.",
    browserThree: "Встроенный tutorial помогает быстро начать.",
    noSearch: "поиск ещё не выполнялся",
    noAudio: "аудио не загружено",
    noExport: "экспорт ещё не выполнялся",
    estimateNA: "оценка времени экспорта: н/д",
    noVideo: "видео не загружено"
  },
  zh: {
    controls: "控制",
    loadDemo: "加载演示",
    requestPermission: "申请授权",
    panelTitle: "brat video lyrics",
    panelIntro: "通过 LRCLIB 搜索歌曲，粘贴或加载 LRC 歌词，可选使用音频优化 timing，并导出 video-only 动画。最终导出不会包含音频。",
    lyricsSearch: "歌词搜索",
    searchSongLabel: "搜索歌曲",
    searchPlaceholder: "歌手 - 歌名",
    search: "搜索",
    clearResults: "清空结果",
    lyricsTiming: "歌词和 timing",
    lrcText: "LRC 歌词",
    dropLrc: "将 .lrc 文件拖到这里，或点击加载歌词",
    optionalAudio: "用于 timing 分析的可选音频",
    dropAudio: "将音频文件拖到这里，或点击加载音频",
    useAudioTiming: "使用音频优化 timing",
    startFromZero: "从 0:00 开始 timeline",
    clearSaved: "清除已保存项目",
    start: "开始",
    play: "播放",
    pause: "暂停",
    restart: "重启",
    reset: "重置",
    export: "导出",
    exportIntro: "导出的文件只包含渲染后的视频，不包含外部 iframe，也不包含音轨。在兼容浏览器中，fast export 可以不等待完整实时歌词时长。",
    videoSize: "视频尺寸",
    fastMp4: "Fast MP4",
    mediaRecorder: "MediaRecorder",
    recommendedPreset: "推荐",
    exportVideo: "导出视频",
    exportPng: "导出 PNG 帧",
    exportNote: "video-only 输出 • 支持时使用 fast export • 可用则 MP4，否则 WebM fallback",
    externalPreview: "外部视频预览",
    videoSelection: "视频选择",
    videoPreview: "视频预览",
    closePreview: "关闭预览",
    hint: "导出帧或渲染视频",
    aboutTitle: "Brat-style LRC 歌词视频生成器",
    aboutText: "Brat Animator 是一个静态浏览器 creative tool，可以把同步 LRC 歌词转换为方形歌词视频。它运行在 GitHub Pages 上，在浏览器本地处理歌词，并在支持时导出 video-only MP4/WebM 文件。",
    whyTitle: "为什么做这个",
    whyOne: "不用视频剪辑软件也能快速创建 brat-style lyric visuals。",
    whyTwo: "音频只用于辅助 timing；导出视频不包含音频。",
    whyThree: "保持完全静态，并兼容 GitHub Pages 部署。",
    permissionTitle: "需要授权",
    permissionText: "使用、复制、修改、再分发、self-hosting、商业用途或集成都需要作者的明确书面许可。",
    workflowTitle: "工作流程",
    workflowOne: "通过 LRCLIB 搜索，或粘贴同步 LRC 歌词。",
    workflowTwo: "使用可选本地音频检查 timing。",
    workflowThree: "自定义方形 canvas，并导出 video-only MP4/WebM。",
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
      node.textContent = translate(safeLang, key);
    });

    document.querySelectorAll(".lang-btn").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.lang === safeLang));
    });

    return safeLang;
  }

  window.BratI18n = {
    getSavedLanguage,
    applyLanguage,
    t(key) {
      return translate(getSavedLanguage(), key);
    }
  };
})();
