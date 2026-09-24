import { use, useEffect, useMemo, useState } from 'react';
import { Anchor, Center, Loader, Paper, Stack, Text } from '@mantine/core';
import { ResponsiveLine } from '@nivo/line';
import type { ConflateResult } from '@osm-conflation-engine/cli';
import type { OsmFeatureType } from 'osm-api';
import {
  type Chronology,
  TAGINFO_BASE_URL,
  getTaginfoKeyChronology,
} from '../../api/taginfo.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { OsmTag } from '../../components/OsmTag.js';
import { ChartCard } from './ChartCard.js';

type OsmTypePlural = `${OsmFeatureType}s`;
const OSM_TYPES: OsmTypePlural[] = ['nodes', 'ways', 'relations'];

const COLOURS: Record<OsmTypePlural, string> = {
  nodes: '#2a78d6',
  ways: '#1baf7a',
  relations: '#eda100',
};

interface LineSeries {
  id: OsmTypePlural;
  data: { x: string; y: number }[];
}

/**
 * taginfo returns the diff (+ or -), not the sum. So we convert
 * to a sum, and then batch the rows into 1 point per month.
 */
function parseTaginfoData(chronology: Chronology[]): LineSeries[] {
  const cumsum: Chronology = {
    date: '',
    nodes: 0,
    ways: 0,
    relations: 0,
  };
  const byMonth: Record<string, Chronology> = {};

  for (const entry of chronology) {
    for (const osmType of OSM_TYPES) {
      cumsum[osmType] += entry[osmType];
    }

    // if this is the last record for that month, then keep it.
    byMonth[entry.date.slice(0, 7)] = {
      ...cumsum,
      date: entry.date,
    };
  }

  return OSM_TYPES.map((osmType): LineSeries => ({
    id: osmType,
    data: Object.values(byMonth).map((month) => ({
      x: month.date,
      y: month[osmType],
    })),
  }));
}

export const TagHistory: React.FC<{ metrics: ConflateResult }> = ({
  metrics,
}) => {
  const { $, $$, locale } = use(LocaleContext);
  const [raw, setRaw] = useState<Chronology[]>();

  const refTag = metrics.config.merge.osm_key;

  useEffect(() => {
    /* eslint-disable-next-line @eslint-react/set-state-in-effect, react-hooks/set-state-in-effect */
    setRaw(undefined);
    getTaginfoKeyChronology(refTag).then(setRaw).catch(console.error);
  }, [refTag]);

  const processed = useMemo(() => raw && parseTaginfoData(raw), [raw]);

  const numberFormat = useMemo(
    () => new Intl.NumberFormat(locale, { notation: 'compact' }).format,
    [locale],
  );

  return (
    <ChartCard
      width="full"
      height={340}
      title={$('TagHistory.title')}
      description={$$(
        'TagHistory.description',
        {},
        {
          osmKey: () => <OsmTag tag={refTag} />,
          taginfo: ({ children }) => (
            <Anchor
              href={`${TAGINFO_BASE_URL}/keys/${refTag}#chronology`}
              target="_blank"
              rel="noopener"
              inherit
            >
              {children}
            </Anchor>
          ),
        },
      )}
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
            format: numberFormat,
            tickSize: 0,
            tickPadding: 8,
            tickValues: 5,
          }}
          enableSlices="x"
          enableTouchCrosshair
          sliceTooltip={({ slice }) => {
            const total = {
              id: '',
              seriesColor: 'transparent',
              seriesId: $('Common.total'),
              data: {
                y: slice.points.reduce((Σ, point) => Σ + point.data.y, 0),
              },
            };
            return (
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
                      { year: 'numeric', month: 'long' },
                    )}
                  </Text>
                  {[...slice.points.toReversed(), total].map((point) => {
                    return (
                      <Text key={point.id} size="sm">
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            marginRight: 6,
                            borderRadius: 2,
                            background: point.seriesColor,
                          }}
                        />
                        {point.seriesId}: {point.data.y.toLocaleString(locale)}
                      </Text>
                    );
                  })}
                </Stack>
              </Paper>
            );
          }}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              translateY: 56,
              itemWidth: 100,
              itemHeight: 16,
              symbolSize: 10,
              symbolShape: 'circle',
              data: OSM_TYPES.map((osmType) => ({
                id: osmType,
                label: osmType,
                color: COLOURS[osmType],
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
