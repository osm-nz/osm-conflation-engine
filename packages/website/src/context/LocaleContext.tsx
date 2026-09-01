import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Code } from '@mantine/core';
import { MessageFormat } from 'messageformat';
import {
  type Locale,
  TRANSLATIONS,
  type TranslationKey,
  type TranslationsFile,
} from '../translations/index.js';
import { FullPageError } from '../components/FullPageError.js';
import { FullPageLoading } from '../components/FullPageLoading.js';

export const DEFAULT_LOCALE = 'en';

export function getDefaultLocale(): Locale {
  const candidates = Object.keys(TRANSLATIONS).map((key) => ({
    key: key as Locale,
    expanded: new Intl.Locale(key).maximize(),
  }));

  for (const original of navigator.languages) {
    const locale = new Intl.Locale(original).maximize();

    // TODO: import from somewhere?
    const matched = candidates.find(
      (c) =>
        c.expanded.baseName === locale.baseName ||
        c.expanded.language === locale.language,
    )?.key;

    if (matched) return matched;
  }
  return DEFAULT_LOCALE;
}

export type I$ = (
  key: TranslationKey,
  params?: Record<string, unknown>,
) => string;

export interface ILocaleContext {
  $: I$;
  locale: Locale;
  setLocale(locale: Locale): void;
}
export const LocaleContext = createContext<ILocaleContext>(undefined!);
LocaleContext.displayName = 'LocaleContext';

export const LocaleWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(getDefaultLocale);
  const [translations, setTranslations] = useState<TranslationsFile>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    // sync to <html> element
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    // when the locale changes, download the new translations
    TRANSLATIONS[locale]().then(setTranslations).catch(setError);
  }, [locale]);

  const $ = useCallback<I$>(
    (key, params) => {
      const value = translations!.default[key];

      // TS will catch this at build time, so no need for a runtime error
      if (!value) return '❓';

      // MessageFormat() is expensive, avoid it for trivial strings
      if (!value.includes('{')) return value;

      // no try…catch, we check for invalid MF2 syntax at build time
      return new MessageFormat(locale, value).format(params);
    },
    [locale, translations],
  );

  const ctx = useMemo<ILocaleContext>(
    () => ({ locale, setLocale, $ }),
    [locale, $],
  );

  if (error) {
    return (
      <FullPageError error={error}>
        The <Code>{locale}</Code> translations could not be downloaded.
      </FullPageError>
    );
  }

  if (!translations) return <FullPageLoading />;

  return <LocaleContext value={ctx}>{children}</LocaleContext>;
};
