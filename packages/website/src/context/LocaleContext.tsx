import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Code } from '@mantine/core';
import { MessageFormat } from 'messageformat';
import { type MarkupHandlers, formatToJsx } from 'react-mf2';
import { TimeAgoProvider } from 'react-timeago-i18n';
import {
  type Locale,
  TRANSLATIONS,
  type TranslationKey,
  type TranslationsFile,
} from '../translations/index.js';
import { FullPageError } from '../components/FullPageError.js';
import { FullPageLoading } from '../components/FullPageLoading.js';
import { Strong } from '../components/Strong.js';

const MARKUP: MarkupHandlers = {
  b: Strong,
  i: 'i',
  em: 'em',
  u: 'u',
  code: Code,
  br: 'br',
};

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

/** like {@link I$}, but for messages containing markup */
export type I$$ = (
  key: TranslationKey,
  params?: Record<string, unknown>,
  markup?: MarkupHandlers,
) => React.ReactNode;

export interface ILocaleContext {
  $: I$;
  $$: I$$;
  locale: Locale;
  setLocale(locale: Locale): void;
}
export const LocaleContext = createContext<ILocaleContext>(undefined!);
LocaleContext.displayName = 'LocaleContext';

export const LocaleWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(getDefaultLocale);
  const [translations, setTranslations] = useState<TranslationsFile>();
  const [error, setError] = useState<unknown>();
  const mfCacheRef = useRef<{
    [locale: string]: { [value: string]: MessageFormat };
  }>({});

  useEffect(() => {
    // sync to <html> element
    document.documentElement.lang = locale;

    // clear cache
    mfCacheRef.current = {};

    // when the locale changes, download the new translations
    TRANSLATIONS[locale]().then(setTranslations).catch(setError);
  }, [locale]);

  const getMessage = useCallback(
    (key: TranslationKey) => {
      const value = translations!.default[key];

      // TS will catch this at build time, so no need for a runtime error
      if (!value) return '❓';

      // MessageFormat() is expensive, avoid it for trivial strings
      if (!value.includes('{')) return value;

      // no try…catch, we check for invalid MF2 syntax at build time
      mfCacheRef.current[locale] ||= {};
      mfCacheRef.current[locale][value] ||= new MessageFormat(locale, value);
      return mfCacheRef.current[locale][value];
    },
    [locale, translations],
  );

  const $ = useCallback<I$>(
    (key, params) => {
      const message = getMessage(key);
      if (typeof message === 'string') return message;
      return message.format(params);
    },
    [getMessage],
  );

  const $$ = useCallback<I$$>(
    (key, params, markup) => {
      const message = getMessage(key);
      if (typeof message === 'string') return message;
      return formatToJsx(message, params, { ...MARKUP, ...markup });
    },
    [getMessage],
  );

  const ctx = useMemo<ILocaleContext>(
    () => ({ locale, setLocale, $, $$ }),
    [locale, $, $$],
  );

  if (error) {
    return (
      <FullPageError error={error}>
        The <Code>{locale}</Code> translations could not be downloaded.
      </FullPageError>
    );
  }

  if (!translations) return <FullPageLoading />;

  return (
    <LocaleContext value={ctx}>
      <TimeAgoProvider locale={locale}>{children}</TimeAgoProvider>
    </LocaleContext>
  );
};
