import { use, useState } from 'react';
import { Link } from 'react-router';
import { Anchor, Radio, SimpleGrid, Stack, Text } from '@mantine/core';
import {
  IconArrowLeft,
  IconBuilding,
  IconBuildingStore,
  IconBusFilled,
  IconDots,
  IconMailbox,
  IconRoad,
} from '@tabler/icons-react';
import { SourceCodeLink } from '../components/SourceCodeLink.js';
import { OsmTag } from '../components/OsmTag.js';
import { LocaleContext } from '../context/LocaleContext.js';
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
          href="https://github.com/osm-nz/osm-conflation-engine/tree/main/packages/osm-gtfs-sync/src/config"
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
        for details. Eventually, road geometry conflation will be properly
        integrated into this tool.
      </>
    ),
  },
  {
    value: 'buildings',
    label: 'Buildings',
    Icon: IconBuilding,
    blurb: (
      <>
        Importing <OsmTag tag="building" /> requires conflation based on
        overlapping geometry, rather than conflation based on tags or IDs.
        Therefore, this tool should probably not be used for building imports.
        It would be better to use an existing system like{' '}
        <Anchor href="https://mapwith.ai/rapid" target="_blank" rel="noopener">
          RapiD
        </Anchor>
        .
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
  const { $ } = use(LocaleContext);
  const [type, setType] = useState<ProjectType>('openaddresses');
  const active = PROJECT_TYPES.find((t) => t.value === type);

  return (
    <>
      <Anchor
        component={Link}
        to="/"
        size="sm"
        mt="md"
        display="inline-flex"
        style={{ alignItems: 'center', gap: 4 }}
      >
        <IconArrowLeft size={16} />
        {$('Steps.back')}
      </Anchor>
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
