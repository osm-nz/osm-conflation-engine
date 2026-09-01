import { use, useMemo, useState } from 'react';
import { Group, Paper, Radio, Text } from '@mantine/core';
import {
  ResponsiveSankey,
  type SankeyLinkDatum,
  type SankeyNodeDatum,
} from '@nivo/sankey';
import type { ConflateResult } from '@osm-conflation-engine/cli';
import {
  type I$,
  type I$$,
  LocaleContext,
} from '../../context/LocaleContext.js';
import { MatchType } from '../../shared.def.js';
import { Strong } from '../../components/Strong.js';
import { ChartCard } from './ChartCard.js';

export const NODE_KEYS = [
  'sourceDataset',
  'osmWithRef',
  'osmDuplicateRefs',
  'osmSemi',
  'osmNoRef',
  'ignored',
  'matching',
  'oneToOne',
  'oneToMany',
  'manyToOne',
  'manyToMany',
  'deleted',
  'guess',
  'conflation',
  'perfect',
  'edit',
  'create',
  'delete',
] as const;
type NodeKey = (typeof NODE_KEYS)[number];

export const NODE_LABELS = (
  $: I$,
  refTag: string,
): Record<NodeKey, string> => ({
  sourceDataset: $('Common.sourceDataset'),
  osmWithRef: $('Sankey.osmWithRef', { refTag }),
  osmDuplicateRefs: $('Sankey.osmDuplicateRefs', { refTag }),
  osmSemi: $('Sankey.osmSemi', { refTag }),
  osmNoRef: $('Sankey.osmNoRef', { refTag }),
  ignored: $('Common.ignored'),
  matching: $('Sankey.matching'),
  oneToOne: $('MatchType.OneToOne'),
  oneToMany: $('MatchType.OneToMany'),
  manyToOne: $('MatchType.ManyToOne'),
  manyToMany: $('MatchType.ManyToMany'),
  deleted: $('MatchType.Delete'),
  guess: $('MatchType.Guess'),
  conflation: $('Sankey.conflation'),
  perfect: $('Conflation.perfect'),
  edit: $('Conflation.edit'),
  create: $('Conflation.create'),
  delete: $('Conflation.delete'),
});

export const COLOURS: Record<NodeKey, string> = {
  sourceDataset: '#898781',
  osmWithRef: '#898781',
  osmDuplicateRefs: '#898781',
  osmSemi: '#898781',
  osmNoRef: '#898781',
  ignored: '#c3c2b7',
  matching: '#c3c2b7',
  oneToOne: '#2a78d6',
  oneToMany: '#eb6834',
  manyToOne: '#1baf7a',
  manyToMany: '#eda100',
  deleted: '#e87ba4',
  guess: '#008300',
  conflation: '#c3c2b7',
  perfect: '#0ca30c',
  edit: '#fab219',
  create: '#ec835a',
  delete: '#d03b3b',
};

interface SankeyNode {
  id: NodeKey;
}

interface SankeyLink {
  source: NodeKey;
  target: NodeKey;
  value: number;
}

function createNodeTooltip(
  $: I$,
  refTag: string,
): React.FC<{ node: SankeyNodeDatum<SankeyNode, SankeyLink> }> {
  return ({ node }) => (
    <Paper withBorder shadow="sm" px="sm" py={6}>
      <Text size="sm" fw={600}>
        {NODE_LABELS($, refTag)[node.id]} · {node.formattedValue}
      </Text>
    </Paper>
  );
}

function createLinkTooltip(
  $: I$,
  $$: I$$,
  refTag: string,
): React.FC<{ link: SankeyLinkDatum<SankeyNode, SankeyLink> }> {
  return ({ link }) => {
    const labels = NODE_LABELS($, refTag);
    return (
      <Paper withBorder shadow="sm" px="sm" py={6}>
        <Strong>{link.formattedValue}</Strong>
        <Text size="sm">
          {$$('Sankey.link_tooltip', {
            source: labels[link.source.id],
            target: labels[link.target.id],
          })}
        </Text>
      </Paper>
    );
  };
}

type Inflow = 'sourceDataset' | 'osm';

export const Sankey: React.FC<{ metrics: ConflateResult }> = ({ metrics }) => {
  const { $, $$ } = use(LocaleContext);
  const counts = metrics.countsByPhase;
  const [inflow, setInflow] = useState<Inflow>('sourceDataset');

  const data = useMemo(() => {
    const links: SankeyLink[] = [
      {
        source: 'matching',
        target: 'oneToOne',
        value: counts.matched[MatchType.OneToOne],
      },
      {
        source: 'matching',
        target: 'oneToMany',
        value: counts.matched[MatchType.OneToMany],
      },
      {
        source: 'matching',
        target: 'manyToOne',
        value: counts.matched[MatchType.ManyToOne],
      },
      {
        source: 'matching',
        target: 'manyToMany',
        value: counts.matched[MatchType.ManyToMany],
      },
      {
        source: 'matching',
        target: 'deleted',
        value: counts.matched[MatchType.Delete],
      },
      {
        source: 'matching',
        target: 'guess',
        value: counts.matched[MatchType.Guess],
      },

      {
        source: 'oneToOne',
        target: 'conflation',
        value: counts.matched[MatchType.OneToOne],
      },
      {
        source: 'oneToMany',
        target: 'conflation',
        value: counts.matched[MatchType.OneToMany],
      },
      {
        source: 'manyToOne',
        target: 'conflation',
        value: counts.matched[MatchType.ManyToOne],
      },
      {
        source: 'manyToMany',
        target: 'conflation',
        value: counts.matched[MatchType.ManyToMany],
      },
      {
        source: 'deleted',
        target: 'conflation',
        value: counts.matched[MatchType.Delete],
      },
      {
        source: 'guess',
        target: 'conflation',
        value: counts.matched[MatchType.Guess],
      },

      {
        source: 'conflation',
        target: 'perfect',
        value: counts.conflated.perfect,
      },
      { source: 'conflation', target: 'edit', value: counts.conflated.edit },
      {
        source: 'conflation',
        target: 'create',
        value: counts.conflated.create,
      },
      {
        source: 'conflation',
        target: 'delete',
        value: counts.conflated.delete,
      },
    ];
    if (inflow === 'osm') {
      links.unshift(
        {
          source: 'osmWithRef',
          target: 'matching',
          value: counts.init.osm.withRef,
        },
        {
          source: 'osmDuplicateRefs',
          target: 'matching',
          value: counts.init.osm.duplicateRefs,
        },
        { source: 'osmSemi', target: 'matching', value: counts.init.osm.semi },
        {
          source: 'osmNoRef',
          target: 'matching',
          value: counts.init.osm.noRef,
        },
      );
    } else {
      links.unshift(
        {
          source: 'sourceDataset',
          target: 'ignored',
          value: counts.init.ignored,
        },
        {
          source: 'sourceDataset',
          target: 'matching',
          value: Math.max(0, counts.init.sourceDataset - counts.init.ignored),
        },
      );
    }
    return {
      nodes: NODE_KEYS.filter((id) => {
        if (inflow === 'osm') return id !== 'sourceDataset' && id !== 'ignored';
        return !id.startsWith('osm');
      }).map((id): SankeyNode => ({ id })),
      links: links.filter((link) => link.value > 0),
    };
  }, [counts, inflow]);

  const refTag = metrics.config.merge.osm_key;

  return (
    <ChartCard
      width="full"
      height={620}
      title={$('Sankey.title')}
      description={$('Sankey.description')}
      controls={
        <Radio.Group
          size="xs"
          value={inflow}
          onChange={(value) => setInflow(value as Inflow)}
        >
          <Group gap="md" wrap="nowrap">
            <Radio value="sourceDataset" label={$('Common.sourceDataset')} />
            <Radio value="osm" label={$('Common.osmData')} />
          </Group>
        </Radio.Group>
      }
    >
      <ResponsiveSankey<SankeyNode, SankeyLink>
        data={data}
        sort="input"
        margin={{ top: 12, right: 116, bottom: 12, left: 116 }}
        colors={(node) => COLOURS[node.id]}
        valueFormat=",d"
        nodeThickness={16}
        nodeSpacing={18}
        nodeOpacity={1}
        nodeBorderWidth={2}
        nodeBorderColor="#fcfcfb"
        nodeBorderRadius={2}
        linkOpacity={0.34}
        linkHoverOthersOpacity={0.08}
        linkBlendMode="normal"
        enableLinkGradient
        label={(node) => NODE_LABELS($, refTag)[node.id]}
        labelPosition="outside"
        labelPadding={10}
        labelTextColor="#0b0b0b"
        nodeTooltip={createNodeTooltip($, refTag)}
        linkTooltip={createLinkTooltip($, $$, refTag)}
        theme={{
          text: {
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            fontSize: 13,
          },
        }}
      />
    </ChartCard>
  );
};
