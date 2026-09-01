export const TRANSLATIONS = {
  en: () => import('./en.json'),
  de: () => import('./de.json'),
  'zh-Hans': () => import('./zh-Hans.json'),
};

export type Locale = keyof typeof TRANSLATIONS;

export type TranslationsFile = Awaited<
  ReturnType<(typeof TRANSLATIONS)[Locale]>
>;

export type TranslationKey = keyof TranslationsFile['default'];
