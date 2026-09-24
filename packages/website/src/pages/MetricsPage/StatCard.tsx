import { use } from 'react';
import { Card, Stack, Text } from '@mantine/core';
import { LocaleContext } from '../../context/LocaleContext.js';
import classes from './MetricsPage.module.css';

export const GenericCard: React.FC<{
  label: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
}> = ({ label, title, subtitle }) => {
  return (
    <Card withBorder padding="xs" bg="#fcfcfb" className={classes.statCard}>
      <Stack gap={2} p={4}>
        <Text fw={600} size="sm">
          {label}
        </Text>
        <Text fw={600} fz={40} lh={1.1}>
          {title}
        </Text>
        <Text size="xs" c="dimmed">
          {subtitle}
        </Text>
      </Stack>
    </Card>
  );
};

export const StatCard: React.FC<{
  label: React.ReactNode;
  count: number;
  total: number;
  disabledMessage?: React.ReactNode;
}> = ({ label, count, total, disabledMessage }) => {
  const { $, locale } = use(LocaleContext);

  if (disabledMessage) {
    return <GenericCard label={label} title="?" subtitle={disabledMessage} />;
  }

  const title = total
    ? (count / total).toLocaleString(locale, {
        style: 'percent',
        maximumFractionDigits: 1,
      })
    : '?';

  return (
    <GenericCard
      label={label}
      title={title}
      subtitle={$('Common.count_of_total', { count, total })}
    />
  );
};
