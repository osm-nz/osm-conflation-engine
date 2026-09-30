import { useState } from 'react';
import { Anchor, Radio, SimpleGrid, Stack, Text } from '@mantine/core';
import {
  IconBuildingStore,
  IconBusFilled,
  IconDots,
  IconMailbox,
  IconRoad,
} from '@tabler/icons-react';
import { SourceCodeLink } from '../components/SourceCodeLink.js';
import classes from './CreateNewProjectPage.module.css';

const PROJECT_TYPES = [
  {
    value: 'openaddresses',
    label: 'OpenAddresses',
    Icon: IconMailbox,
    blurb: (
      <>
        TODO: There will be a plugin in the future make addresses easier to
        setup
      </>
    ),
  },
  {
    value: 'alltheplaces',
    label: 'All The Places',
    Icon: IconBuildingStore,
    blurb: <>TODO:??</>,
  },
  {
    value: 'gtfs',
    label: 'GTFS (Public Transport)',
    Icon: IconBusFilled,
    blurb: (
      <>
        To configure Public Transport (GTFS) conflation for a new region, create
        or edit the configuration file for the corresponding country, which is
        located in{' '}
        <Anchor
          href="https://github.com/osm-nz/osm-conflation-engine/tree/test/packages/osm-gtfs-sync/src/config"
          target="_blank"
          rel="noopener"
          fw={600}
        >
          this folder
        </Anchor>{' '}
        of{' '}
        <SourceCodeLink
          provider="github.com"
          org="osm-nz"
          repo="osm-conflation-engine"
          size="sm"
        />
        . For your own data analysis and prototyping, you can use the separate{' '}
        <Anchor
          href="https://kyle.kiwi/gtfs-sqlite/"
          target="_blank"
          rel="noopener"
        >
          sqlite query tool
        </Anchor>
        .
      </>
    ),
  },
  {
    value: 'roadnames',
    label: 'Road Names',
    Icon: IconRoad,
    blurb: (
      <>
        For historical reasons, conflating road names and geometry is done using
        a legacy system. The code for all regions are stored in a single
        repository, see{' '}
        <SourceCodeLink
          provider="github.com"
          org="osm-nz"
          repo="missing-streets"
          size="sm"
        />{' '}
        for details.
      </>
    ),
  },
  {
    value: 'other',
    label: 'Other',
    Icon: IconDots,
    blurb: <>See the README / wiki. TODO: write better docs</>,
  },
] as const;

type ProjectType = (typeof PROJECT_TYPES)[number]['value'];

export const CreateNewProjectPage: React.FC = () => {
  const [type, setType] = useState<ProjectType>('openaddresses');
  const active = PROJECT_TYPES.find((t) => t.value === type);

  return (
    <>
      <Radio.Group
        value={type}
        onChange={(value) => setType(value as ProjectType)}
        label="What type of data do you want to import?"
        mt="md"
      >
        <SimpleGrid
          cols={{ base: 1, xs: 2, sm: 4 }}
          spacing={{ base: 'xs', sm: 'md' }}
          mt="xs"
        >
          {PROJECT_TYPES.map(({ value, label, Icon }) => (
            <Radio.Card
              key={value}
              value={value}
              withBorder
              radius="md"
              p={{ base: 'sm', sm: 'md' }}
              className={classes.card}
            >
              <Stack
                align="center"
                justify="center"
                gap="xs"
                className={classes.cardBody}
              >
                <Icon size={48} stroke={1.5} />
                <Text fw={500}>{label}</Text>
              </Stack>
            </Radio.Card>
          ))}
        </SimpleGrid>
      </Radio.Group>
      <Text size="sm" mt="md">
        {active?.blurb}
      </Text>
    </>
  );
};
