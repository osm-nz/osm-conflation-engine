import { use } from 'react';
import { Card, Stack, Text } from '@mantine/core';
import { LocaleContext } from '../../context/LocaleContext.js';
import classes from './MetricsPage.module.css';

export const StatCard: React.FC<{
  label: React.ReactNode;
  count: number;
  total: number;
}> = ({ label, count, total }) => {
  const { $, locale } = use(LocaleContext);

  return (
    <Card withBorder padding="xs" bg="#fcfcfb" className={classes.statCard}>
      <Stack gap={2} p={4}>
        <Text fw={600} size="sm">
          {label}
        </Text>
        <Text fw={600} fz={40} lh={1.1}>
          {total
            ? (count / total).toLocaleString(locale, {
                style: 'percent',
                maximumFractionDigits: 1,
              })
            : '–'}
        </Text>
        <Text size="xs" c="dimmed">
          {$('Common.count_of_total', { count, total })}
        </Text>
      </Stack>
    </Card>
  );
};
