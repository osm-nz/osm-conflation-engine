import { use, useMemo, useState } from 'react';
import { Group, Menu } from '@mantine/core';
import {
  type I$,
  LocaleContext,
  WORLDWIDE,
  getFlagEmoji,
} from '../context/LocaleContext.js';
import type { HomePageItem } from '../context/DataContext.js';
import { FilterPill, type SortDirection } from '../components/FilterPill.js';

const PROJECT_TYPES = ($: I$) => ({
  other: $('HomePage.type.other'),
  missing_streets: $('HomePage.type.missing_streets'),
  gtfs: $('HomePage.type.gtfs'),
});
type ProjectType = keyof ReturnType<typeof PROJECT_TYPES>;

function getProjectType(refTag: string): ProjectType {
  if (refTag.startsWith('::gtfs::')) return 'gtfs';
  if (refTag.startsWith('::missing_streets::')) return 'missing_streets';
  return 'other';
}

const getCountry = (region: string) => region.split('-', 1)[0]!;

type SortKey = 'type' | 'region' | 'size';

export function useHomePageFilters(original: HomePageItem[]) {
  const { $, locale } = use(LocaleContext);

  const [typeFilter, setTypeFilter] = useState<ProjectType>();
  const [regionFilter, setRegionFilter] = useState<string>();
  const [sort, setSort] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>();

  const intl = useMemo(() => {
    const displayNames = new Intl.DisplayNames(locale, { type: 'region' });
    return {
      collator: new Intl.Collator(locale),
      getCountryName(country: string) {
        if (country === WORLDWIDE) return $('RegionBadge.global');
        try {
          return displayNames.of(country) || country;
        } catch {
          return country;
        }
      },
    };
  }, [locale, $]);

  const countries = useMemo(() => {
    const byCountry: {
      [country: string]: { [region: string]: string | undefined };
    } = {};
    for (const item of original) {
      const country = getCountry(item.region);
      byCountry[country] ||= {};
      if (item.region !== country) {
        byCountry[country][item.region] ||= item.regionFlag;
      }
    }
    return Object.entries(byCountry)
      .map(([code, subRegions]) => ({
        code,
        name: intl.getCountryName(code),
        flag: getFlagEmoji(code),
        subRegions: Object.entries(subRegions)
          .map(([region, flagImage]) => ({ region, flagImage }))
          .toSorted((a, b) => intl.collator.compare(a.region, b.region)),
      }))
      .toSorted((a, b) => intl.collator.compare(a.name, b.name));
  }, [original, intl]);

  const sorted = useMemo(() => {
    const filtered = original.filter(
      (item) =>
        (!typeFilter || getProjectType(item.refTag) === typeFilter) &&
        (!regionFilter ||
          item.region === regionFilter ||
          item.region.startsWith(`${regionFilter}-`)),
    );
    if (!sort) return filtered;

    const getSortKeys = (item: HomePageItem) => {
      switch (sort.key) {
        case 'type': {
          return [PROJECT_TYPES($)[getProjectType(item.refTag)]];
        }
        case 'region': {
          return [intl.getCountryName(getCountry(item.region)), item.region];
        }
        case 'size': {
          return [item.count.toString().padStart(15, '0')];
        }
        default: {
          throw new Error(sort.key satisfies never);
        }
      }
    };

    return filtered
      .map((item) => ({ item, keys: getSortKeys(item) }))
      .toSorted((a, b) => {
        for (const [index, key] of a.keys.entries()) {
          const sign = sort.direction === 'asc' ? 1 : -1;
          const result = intl.collator.compare(key, b.keys[index]!);
          if (result) return sign * result;
        }
        return 0;
      })
      .map(({ item }) => item);
  }, [$, original, typeFilter, regionFilter, sort, intl]);

  function toggleSort(key: SortKey) {
    setSort((current) => {
      // undefined->asc
      if (current?.key !== key) return { key, direction: 'asc' };
      // asc->desc
      if (current.direction === 'asc') return { key, direction: 'desc' };
      // desc->undefined
      return undefined;
    });
  }

  const children = (
    <Group gap="sm">
      <FilterPill
        label={$('HomePage.filter.type')}
        valueLabel={typeFilter && PROJECT_TYPES($)[typeFilter]}
        onClear={() => setTypeFilter(undefined)}
        sort={sort?.key === 'type' ? sort.direction : undefined}
        onToggleSort={() => toggleSort('type')}
      >
        {Object.entries(PROJECT_TYPES($)).map(([type, label]) => (
          <Menu.Item
            key={type}
            onClick={() => setTypeFilter(type as ProjectType)}
          >
            {label}
          </Menu.Item>
        ))}
      </FilterPill>
      <FilterPill
        label={$('HomePage.filter.region')}
        valueLabel={
          regionFilter &&
          (regionFilter.includes('-')
            ? regionFilter
            : intl.getCountryName(regionFilter))
        }
        onClear={() => setRegionFilter(undefined)}
        sort={sort?.key === 'region' ? sort.direction : undefined}
        onToggleSort={() => toggleSort('region')}
      >
        {countries.map((country) =>
          country.subRegions.length ? (
            <Menu.Sub key={country.code}>
              <Menu.Sub.Target>
                <Menu.Sub.Item leftSection={country.flag}>
                  {country.name}
                </Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <Menu.Item
                  leftSection={country.flag}
                  onClick={() => setRegionFilter(country.code)}
                >
                  {country.name}
                </Menu.Item>
                <Menu.Divider />
                {country.subRegions.map(({ region, flagImage }) => (
                  <Menu.Item
                    key={region}
                    leftSection={
                      flagImage && (
                        <img
                          src={flagImage}
                          alt={region}
                          style={{ width: 20 }}
                        />
                      )
                    }
                    onClick={() => setRegionFilter(region)}
                  >
                    {region}
                  </Menu.Item>
                ))}
              </Menu.Sub.Dropdown>
            </Menu.Sub>
          ) : (
            <Menu.Item
              key={country.code}
              leftSection={country.flag}
              onClick={() => setRegionFilter(country.code)}
            >
              {country.name}
            </Menu.Item>
          ),
        )}
      </FilterPill>
      <FilterPill
        label={$('HomePage.filter.size')}
        valueLabel={undefined}
        onClear={undefined} // no filtering, only sorting
        sort={sort?.key === 'size' ? sort.direction : undefined}
        onToggleSort={() => toggleSort('size')}
      />
    </Group>
  );

  return [sorted, children] as const;
}
