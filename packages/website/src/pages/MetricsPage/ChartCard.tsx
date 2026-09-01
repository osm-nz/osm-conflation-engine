import type { PropsWithChildren } from 'react';
import { Card, Group, Stack, Text } from '@mantine/core';
import classes from './MetricsPage.module.css';

export const ChartCard: React.FC<
  PropsWithChildren & {
    title: string;
    description?: string;
    width?: 'full' | 'half';
    height: number;
    controls?: React.ReactNode;
  }
> = ({ title, description, width, height, controls, children }) => (
  <Card
    withBorder
    padding="xs"
    bg="#fcfcfb"
    className={`${classes.card} ${width === 'full' ? classes.fullWidth : ''}`}
  >
    <Stack gap="xs">
      <Group justify="space-between" align="flex-start" wrap="nowrap" p={4}>
        <div>
          <Text fw={600} size="sm">
            {title}
          </Text>
          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}
        </div>
        {controls}
      </Group>

      <div style={{ height }}>{children}</div>
    </Stack>
  </Card>
);
