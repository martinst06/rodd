"use client";

import { languageOptions, type Language } from "@/lib/i18n";

import { useLanguage } from "./LanguageProvider";

export function SiteHeader() {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="relative mx-auto flex max-w-4xl items-center justify-center px-6 py-4">
        <div className="text-center text-base font-semibold tracking-tight">
          Yovana&apos;s Birthday
        </div>
        <div className="absolute right-6">
          <label className="relative inline-flex items-center">
            <span className="sr-only">Select language</span>
            <select
              aria-label="Select language"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="appearance-none rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 pr-8 py-1.5 text-lg focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/30"
            >
              {languageOptions.map((option) => (
                <option
                  key={option.code}
                  value={option.code}
                  aria-label={option.label}
                  title={option.label}
                >
                  {option.emoji}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-zinc-400">
              ▾
            </span>
          </label>
        </div>
      </div>
    </header>
  );
}

