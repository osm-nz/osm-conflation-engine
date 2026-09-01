import { use, useMemo } from 'react';
import { Menu } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { LocaleContext } from '../context/LocaleContext.js';
import { type Locale, TRANSLATIONS } from '../translations/index.js';

function getLanguageLabel(locale: Locale, displayLocale: Locale) {
  const endonym = new Intl.DisplayNames(locale, { type: 'language' }).of(
    locale,
  );
  const exonym = new Intl.DisplayNames(displayLocale, { type: 'language' }).of(
    locale,
  );

  return endonym === exonym ? endonym : `${exonym} – ${endonym}`;
}

export const NavbarLanguageSwitcher: React.FC = () => {
  const { $, locale, setLocale } = use(LocaleContext);

  const languages = useMemo(() => {
    return (Object.keys(TRANSLATIONS) as Locale[]).map((value) => ({
      value,
      label: getLanguageLabel(value, locale),
    }));
  }, [locale]);

  return (
    <Menu.Sub>
      <Menu.Sub.Target>
        <Menu.Sub.Item leftSection={<IconLanguage size={20} />}>
          {$('NavbarLanguageSwitcher.language')}
        </Menu.Sub.Item>
      </Menu.Sub.Target>

      <Menu.Sub.Dropdown>
        <Menu.RadioGroup
          value={locale}
          onChange={(value) => setLocale(value as Locale)}
        >
          {languages.map((language) => (
            <Menu.RadioItem
              key={language.value}
              value={language.value}
              closeMenuOnClick
            >
              {language.label}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Sub.Dropdown>
    </Menu.Sub>
  );
};
