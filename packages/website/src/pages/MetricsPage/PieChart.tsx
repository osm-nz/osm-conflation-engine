import { use } from 'react';
import { Center, Loader, Paper, Text } from '@mantine/core';
import { ResponsivePie } from '@nivo/pie';
import { LocaleContext } from '../../context/LocaleContext.js';
import { ChartCard } from './ChartCard.js';

export const GREY = '#898781';

export interface PieSlice {
  id: string;
  value: number;
  colour: string;
}

export const PieChart: React.FC<{
  title: string;
  description?: string;
  data: PieSlice[] | undefined;
}> = ({ title, description, data }) => {
  const { $ } = use(LocaleContext);

  return (
    <ChartCard title={title} description={description} height={280}>
      {data?.length ? (
        <ResponsivePie<PieSlice>
          data={data}
          margin={{ top: 20, right: 90, bottom: 20, left: 90 }}
          colors={(slice) => slice.data.colour}
          innerRadius={0.5}
          padAngle={1}
          cornerRadius={2}
          borderWidth={2}
          borderColor="#fcfcfb"
          activeOuterRadiusOffset={6}
          valueFormat=",d"
          enableArcLabels={false}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLinkLabelsTextColor="#0b0b0b"
          arcLinkLabelsThickness={2}
          tooltip={({ datum }) => (
            <Paper withBorder shadow="sm" px="sm" py={6}>
              <Text size="sm" fw={600}>
                {datum.id} · {datum.formattedValue}
              </Text>
            </Paper>
          )}
          theme={{
            text: {
              fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
              fontSize: 13,
            },
          }}
        />
      ) : (
        <Center h="100%">
          {data ? (
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
