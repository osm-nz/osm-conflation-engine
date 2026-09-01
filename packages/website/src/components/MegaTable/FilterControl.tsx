import {
  ActionIcon,
  Button,
  Checkbox,
  Popover,
  ScrollArea,
  Stack,
  TextInput,
} from '@mantine/core';
import { IconFilter, IconFilterFilled } from '@tabler/icons-react';
import type { Column, FilterValue } from './types.def.js';

export function FilterControl<Row, ColumnKey extends string>({
  column,
  options,
  value,
  onChange,
}: {
  column: Column<Row, ColumnKey>;
  options: string[];
  value: FilterValue | undefined;
  onChange: (value: FilterValue) => void;
}) {
  const filter = column.filter!;
  const isActive = !!value?.length;
  const Icon = isActive ? IconFilterFilled : IconFilter;

  return (
    <Popover width={260} position="bottom-end" shadow="md" trapFocus withArrow>
      <Popover.Target>
        <ActionIcon variant="subtle" color="gray" size="sm">
          <Icon size={14} stroke={1.5} opacity={isActive ? 1 : 0.4} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        {filter.type === 'text' ? (
          <TextInput
            size="xs"
            data-autofocus // used by <Popover />
            placeholder={`Filter by ${column.label.toLowerCase()}`}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        ) : (
          // else: enum
          <Stack gap="xs">
            <Checkbox.Group
              value={Array.isArray(value) ? value : []}
              onChange={onChange}
            >
              <ScrollArea.Autosize mah={220} type="auto">
                <Stack gap={6}>
                  {options.map((option) => (
                    <Checkbox
                      key={option}
                      value={option}
                      size="xs"
                      label={filter.getLabel?.(option) ?? option}
                    />
                  ))}
                </Stack>
              </ScrollArea.Autosize>
            </Checkbox.Group>
            {isActive && (
              <Button
                size="compact-xs"
                variant="subtle"
                onClick={() => onChange([])}
              >
                Clear
              </Button>
            )}
          </Stack>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
