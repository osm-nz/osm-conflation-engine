import { use, useEffect, useMemo, useState } from 'react';
import { Center, Loader, Paper, Stack, Text } from '@mantine/core';
import { ResponsiveLine } from '@nivo/line';
import type {
  ConflateResult,
  RecursiveHistoryRow,
} from '@osm-conflation-engine/cli';
import { getMetricsHistory } from '../../api/static.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { ChartCard } from './ChartCard.js';
import { COLOURS, NODE_LABELS } from './Sankey.js';

const RESULTS = ['edit', 'create', 'delete'] as const;
type Result = (typeof RESULTS)[number];

interface LineSeries {
  id: Result;
  data: { x: string; y: number }[];
}

export const MetricsHistory: React.FC<{ metrics: ConflateResult }> = ({
  metrics,
}) => {
  const { $, locale } = use(LocaleContext);
  const [rows, setRows] = useState<RecursiveHistoryRow[]>();

  const refTag = metrics.config.merge.osm_key;
  const labels = NODE_LABELS($, refTag);

  useEffect(() => {
    setRows(undefined);
    getMetricsHistory(refTag)
      .then((file) => setRows(file.rows))
      .catch((error) => {
        console.error(error);
        setRows([]);
      });
  }, [refTag]);

  const processed = useMemo(() => {
    if (!rows) return undefined;

    // there can be multiple runs per day, only keep the last one.
    const byDate: Record<string, RecursiveHistoryRow> = {};
    for (const row of rows) {
      byDate[row.date.split('T', 1)[0]!] = row;
    }

    return RESULTS.map((key): LineSeries => ({
      id: key,
      data: Object.entries(byDate).map(([date, row]) => {
        const total = Object.values(row.conflated).reduce((a, b) => a + b, 0);
        return {
          x: date,
          y: row.conflated[key] / (total + 1e-10),
        };
      }),
    }));
  }, [rows]);

  const percentFormat = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 2,
      }).format,
    [locale],
  );

  return (
    <ChartCard
      width="full"
      height={340}
      title={$('MetricsHistory.title')}
      description={$('MetricsHistory.description', {
        perfect: $('Conflation.perfect'),
      })}
    >
      {processed?.[0]?.data.length ? (
        <ResponsiveLine<LineSeries>
          data={processed}
          margin={{ top: 12, right: 24, bottom: 64, left: 64 }}
          colors={(series) => COLOURS[series.id]}
          xScale={{ type: 'time', format: '%Y-%m-%d', precision: 'day' }}
          yScale={{ type: 'linear', stacked: true, min: 0, max: 'auto' }}
          curve="monotoneX"
          lineWidth={2}
          enableArea
          areaOpacity={0.7}
          enablePoints={false}
          enableGridX={false}
          axisBottom={{
            format: '%Y',
            tickValues: 'every 1 year',
            tickSize: 0,
            tickPadding: 8,
          }}
          axisLeft={{
            format: percentFormat,
            tickSize: 0,
            tickPadding: 8,
            tickValues: 5,
          }}
          enableSlices="x"
          enableTouchCrosshair
          sliceTooltip={({ slice }) => (
            <Paper
              withBorder
              shadow="sm"
              px="sm"
              py={6}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Stack gap={2}>
                <Text size="sm" fw={600}>
                  {new Date(slice.points[0]!.data.x).toLocaleDateString(
                    locale,
                    { dateStyle: 'medium' },
                  )}
                </Text>
                {slice.points.toReversed().map((point) => (
                  <Text key={point.id} size="sm">
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        marginRight: 6,
                        borderRadius: '100%',
                        background: point.seriesColor,
                      }}
                    />
                    {labels[point.seriesId as Result]}:{' '}
                    {percentFormat(point.data.y)}
                  </Text>
                ))}
              </Stack>
            </Paper>
          )}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              translateY: 56,
              itemWidth: 100,
              itemHeight: 16,
              symbolSize: 10,
              symbolShape: 'circle',
              data: RESULTS.map((key) => ({
                id: key,
                label: labels[key],
                color: COLOURS[key],
              })),
            },
          ]}
          theme={{
            text: {
              fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
              fontSize: 13,
            },
            axis: { ticks: { text: { fill: '#6b6a66' } } },
            grid: { line: { stroke: '#e8e7e2' } },
          }}
        />
      ) : (
        <Center h="100%">
          {processed ? (
            <Text size="sm" c="dimmed">
              {$('Common.no_data')}
            </Text>
          ) : (
            <Loader size="sm" />
          )}
        </Center>
      )}
    </ChartCard>
  );
};
