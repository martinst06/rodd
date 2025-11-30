export type Language = "mk" | "de" | "en";

export type LanguageOption = {
  code: Language;
  label: string;
  emoji: string;
};

export const languageOptions: LanguageOption[] = [
  { code: "mk", label: "Македонски", emoji: "🇲🇰" },
  { code: "de", label: "Deutsch", emoji: "🇩🇪" },
  { code: "en", label: "English", emoji: "🇬🇧" },
];

export type Translation = {
  locale: string;
  heroTitle: string;
  heroSubtitle: string;
  uploadCardTitle: string;
  uploadButton: {
    idle: string;
    uploading: string;
    ready: (count: number) => string;
  };
  pendingStatus: {
    none: string;
    ready: (count: number) => string;
  };
  readyTitle: (count: number) => string;
  discardAll: string;
  discardOne: string;
  galleryTitle: string;
  loading: string;
  empty: string;
  download: string;
  downloadAll: string;
  delete: string;
  confirmDelete: string;
  previewClose: string;
  errors: {
    loadImages: string;
    uploadSelection: string;
    uploadFailed: string;
    uploadConfig: string;
    deleteFailed: string;
    deleteGeneric: string;
    invalidFile: string;
  };
};

export type ErrorKey = keyof Translation["errors"];

export const translations: Record<Language, Translation> = {
  mk: {
    locale: "mk-MK",
    heroTitle: "Споделена галерија",
    heroSubtitle: "Сите овде ја гледаат истата галерија.",
    uploadCardTitle: "Додај фотографии",
    uploadButton: {
      idle: "Изберете",
      uploading: "Се прикачува…",
      ready: (count: number) =>
        count === 1 ? "Прикачи 1 фотографија" : `Прикачи ${count} фотографии`,
    },
    pendingStatus: {
      none: "Нема одбрани фотографии",
      ready: (count: number) =>
        count === 1
          ? "1 фотографија подготвена"
          : `${count} фотографии подготвени`,
    },
    readyTitle: (count: number) => `Подготвено за прикачување (${count})`,
    discardAll: "Отстрани ги сите",
    discardOne: "Отстрани",
    galleryTitle: "Галерија",
    loading: "Се вчитуваат фотографии…",
    empty: "Сè уште нема фотографии. Прикачете за да започнете.",
    download: "Преземи",
    downloadAll: "Преземи ги сите",
    delete: "Избриши",
    confirmDelete:
      "Да ја избришам ли оваа фотографија од заедничката галерија?",
    previewClose: "Назад",
    errors: {
      loadImages: "Галеријата не може да се вчита. Обидете се повторно.",
      uploadSelection:
        "Изберете најмалку една фотографија и потврдете го прегледот.",
      uploadFailed: "Прикачувањето не успеа. Обидете се повторно.",
      uploadConfig: "Прикачувањето не успеа. Проверете ја конфигурацијата.",
      deleteFailed: "Бришењето не успеа. Обидете се повторно.",
      deleteGeneric: "Бришењето не успеа. Обидете се подоцна.",
      invalidFile:
        "Некои избрани датотеки не беа поддржани и беа игнорирани.",
    },
  },
  de: {
    locale: "de-DE",
    heroTitle: "Geteilte Fotogalerie",
    heroSubtitle: "Alle hier sehen dieselbe Galerie.",
    uploadCardTitle: "Fotos hinzufügen",
    uploadButton: {
      idle: "Wähle aus",
      uploading: "Wird hochgeladen…",
      ready: (count: number) =>
        count === 1 ? "1 Foto hochladen" : `${count} Fotos hochladen`,
    },
    pendingStatus: {
      none: "Noch keine Fotos ausgewählt",
      ready: (count: number) =>
        count === 1 ? "1 Foto bereit" : `${count} Fotos bereit`,
    },
    readyTitle: (count: number) => `Bereit zum Hochladen (${count})`,
    discardAll: "Alle verwerfen",
    discardOne: "Verwerfen",
    galleryTitle: "Galerie",
    loading: "Fotos werden geladen…",
    empty: "Noch keine Fotos. Lade eines hoch, um zu starten.",
    download: "Herunterladen",
    downloadAll: "Alle herunterladen",
    delete: "Löschen",
    confirmDelete:
      "Dieses Foto für alle aus dem geteilten Speicher löschen?",
    previewClose: "Zurück",
    errors: {
      loadImages:
        "Bilder konnten nicht geladen werden. Bitte versuche es erneut.",
      uploadSelection:
        "Bitte wähle mindestens ein Foto aus und bestätige die Vorschau.",
      uploadFailed: "Upload fehlgeschlagen. Bitte versuche es erneut.",
      uploadConfig:
        "Upload fehlgeschlagen. Bitte prüfe die Konfiguration.",
      deleteFailed: "Löschen fehlgeschlagen. Bitte versuche es erneut.",
      deleteGeneric:
        "Löschen fehlgeschlagen. Bitte später erneut versuchen.",
      invalidFile:
        "Einige ausgewählte Dateien wurden nicht unterstützt und ignoriert.",
    },
  },
  en: {
    locale: "en-US",
    heroTitle: "Shared picture bucket",
    heroSubtitle: "Everyone here sees the same gallery.",
    uploadCardTitle: "Tap to add pictures",
    uploadButton: {
      idle: "Choose",
      uploading: "Uploading…",
      ready: (count: number) =>
        `Upload ${count} ${count === 1 ? "picture" : "pictures"}`,
    },
    pendingStatus: {
      none: "No pictures selected yet",
      ready: (count: number) =>
        `${count} ${count === 1 ? "picture ready" : "pictures ready"}`,
    },
    readyTitle: (count: number) => `Ready to upload (${count})`,
    discardAll: "Discard all",
    discardOne: "Discard",
    galleryTitle: "Gallery",
    loading: "Loading pictures…",
    empty: "No pictures yet. Upload one to get started.",
    download: "Download",
    downloadAll: "Download all",
    delete: "Delete",
    confirmDelete:
      "Delete this picture from the shared bucket for everyone?",
    previewClose: "Go back",
    errors: {
      loadImages: "Failed to load images. Please try again.",
      uploadSelection:
        "Please choose at least one image file and confirm the previews.",
      uploadFailed: "Upload failed. Please try again.",
      uploadConfig:
        "Upload failed. Please check your configuration.",
      deleteFailed: "Delete failed. Please try again.",
      deleteGeneric: "Delete failed. Please try again in a moment.",
      invalidFile: "Some selected files were not supported and were ignored.",
    },
  },
};


