import { useMemo, useState } from 'react';
import { Card, Group, Paper, Stack, Text } from '@mantine/core';
import {
  ResponsiveSankey,
  type SankeyLinkDatum,
  type SankeyNodeDatum,
} from '@nivo/sankey';
import { useProject } from '../hooks/useProject.js';
import { FullPageLoading } from '../components/FullPageLoading.js';
import { MatchType } from '../shared.def.js';
import { Strong } from '../components/Strong.js';

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
  'toDelete',
] as const;
type NodeKey = (typeof NODE_KEYS)[number];

const NODE_LABELS = (refTag: string): Record<NodeKey, string> => ({
  sourceDataset: 'Source data',
  osmWithRef: `OSM – with ${refTag}`,
  osmDuplicateRefs: `OSM – with duplicate ${refTag}`,
  osmSemi: `OSM – with ${refTag} containing semicolon`,
  osmNoRef: `OSM – no ${refTag}`,
  ignored: 'Ignored',
  matching: 'Matching',
  oneToOne: '1:1',
  oneToMany: '1:many',
  manyToOne: 'many:1',
  manyToMany: 'many:many',
  deleted: '0:1',
  guess: '1:?',
  conflation: 'Conflation',
  perfect: 'Perfect',
  edit: 'Tags wrong',
  create: 'Missing',
  toDelete: 'To delete',
});

const COLOURS: Record<NodeKey, string> = {
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
  toDelete: '#d03b3b',
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
  refTag: string,
): React.FC<{ node: SankeyNodeDatum<SankeyNode, SankeyLink> }> {
  return ({ node }) => (
    <Paper withBorder shadow="sm" px="sm" py={6}>
      <Text size="sm" fw={600}>
        {NODE_LABELS(refTag)[node.id]} · {node.formattedValue}
      </Text>
    </Paper>
  );
}

function createLinkTooltip(
  refTag: string,
): React.FC<{ link: SankeyLinkDatum<SankeyNode, SankeyLink> }> {
  return ({ link }) => (
    <Paper withBorder shadow="sm" px="sm" py={6}>
      <Strong>{link.formattedValue}</Strong>
      <Text size="sm">
        from <Strong>{NODE_LABELS(refTag)[link.source.id]}</Strong> to{' '}
        <Strong>{NODE_LABELS(refTag)[link.target.id]}</Strong>
      </Text>
    </Paper>
  );
}

enum Inflow {
  Osm = 1 << 0,
  SourceData = 1 << 1,
}

export const MetricsPage: React.FC = () => {
  const { metrics } = useProject();
  const counts = metrics?.countsByPhase;
  const [inflow, setInflow] = useState<Inflow>(Inflow.Osm | Inflow.SourceData);

  const data = useMemo(() => {
    if (!counts) return undefined;
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
        target: 'toDelete',
        value: counts.conflated.delete,
      },
    ];
    if (inflow & Inflow.Osm) {
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
    }
    if (inflow & Inflow.SourceData) {
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
        if (!(inflow & Inflow.Osm) && id.startsWith('osm')) return false;
        if (!(inflow & Inflow.SourceData) && id === 'sourceDataset') {
          return false;
        }
        return true;
      }).map((id): SankeyNode => ({ id })),
      links: links.filter((link) => link.value > 0),
    };
  }, [counts, inflow]);

  if (!data || !counts || !metrics) return <FullPageLoading />;

  const refTag = metrics.config.merge.osm_key;

  return (
    <Stack gap="md">
      <Group>
        <input
          type="checkbox"
          checked={!!(inflow & Inflow.Osm)}
          onChange={(event) => {
            setInflow((c) =>
              event.target.checked ? c | Inflow.Osm : c & ~Inflow.Osm,
            );
          }}
        />
        <input
          type="checkbox"
          checked={!!(inflow & Inflow.SourceData)}
          onChange={(event) => {
            setInflow((c) =>
              event.target.checked
                ? c | Inflow.SourceData
                : c & ~Inflow.SourceData,
            );
          }}
        />
      </Group>

      <Card withBorder padding="xs" bg="#fcfcfb">
        <div style={{ height: 620 }}>
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
            label={(node) => NODE_LABELS(refTag)[node.id]}
            labelPosition="outside"
            labelPadding={10}
            labelTextColor="#0b0b0b"
            nodeTooltip={createNodeTooltip(refTag)}
            linkTooltip={createLinkTooltip(refTag)}
            theme={{
              text: {
                fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
                fontSize: 13,
              },
            }}
          />
        </div>
      </Card>
    </Stack>
  );
};

export { MetricsPage as Component };
