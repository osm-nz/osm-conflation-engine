import { type PropsWithChildren, use } from 'react';
import { Button, Menu } from '@mantine/core';
import {
  IconArrowsSort,
  IconChevronDown,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from '@tabler/icons-react';
import { LocaleContext } from '../context/LocaleContext.js';

export type SortDirection = 'asc' | 'desc';

const SORT_ICONS = {
  undefined: IconArrowsSort,
  asc: IconSortAscending,
  desc: IconSortDescending,
};

export const FilterPill: React.FC<
  PropsWithChildren<{
    label: string;
    valueLabel: string | undefined;
    /** if undefined, then there is no filtering */
    onClear: (() => void) | undefined;
    sort: SortDirection | undefined;
    onToggleSort(): void;
  }>
> = ({ label, valueLabel, onClear, sort, onToggleSort, children }) => {
  const { $ } = use(LocaleContext);
  const SortIcon = SORT_ICONS[`${sort}`];

  return (
    <Button.Group>
      <Button.GroupSection variant="default" size="xs" radius="xl" fw={600}>
        {label}
      </Button.GroupSection>
      {onClear && (
        <Menu shadow="md" position="bottom-start">
          <Menu.Target>
            <Button
              variant="default"
              size="xs"
              radius="xl"
              fw="normal"
              c={valueLabel ? undefined : 'dimmed'}
              rightSection={<IconChevronDown size={14} stroke={1.5} />}
            >
              {valueLabel || $('FilterPill.all')}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>{children}</Menu.Dropdown>
        </Menu>
      )}
      {valueLabel && onClear && (
        <Button
          variant="default"
          size="xs"
          radius="xl"
          px={6}
          onClick={onClear}
        >
          <IconX size={14} stroke={1.5} />
        </Button>
      )}
      <Button
        variant={sort ? 'filled' : 'default'}
        size="xs"
        radius="xl"
        px={8}
        onClick={onToggleSort}
      >
        <SortIcon size={16} stroke={1.5} />
      </Button>
    </Button.Group>
  );
};
