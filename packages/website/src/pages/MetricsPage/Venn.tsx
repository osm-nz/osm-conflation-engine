import { use } from 'react';
import { Tooltip } from '@mantine/core';
import type { ConflateResult } from '@osm-conflation-engine/cli';
import { MatchType } from '../../shared.def.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { ChartCard } from './ChartCard.js';

const LEFT_COLOUR = '#2a78d6';
const RIGHT_COLOUR = '#1baf7a';
const TEXT = '#0b0b0b';
const TEXT_DIMMED = '#6b6a66';

const WIDTH = 450;
const HEIGHT = 320;
const R = 125;
const D = 90;
const CY = 172;
const CX_LEFT = WIDTH / 2 - D / 2;
const CX_RIGHT = WIDTH / 2 + D / 2;

const LENS_HALF_HEIGHT = Math.sqrt(R ** 2 - (D / 2) ** 2);

/** the overlapping part */
const LENS_PATH = [
  `M ${WIDTH / 2} ${CY - LENS_HALF_HEIGHT}`,
  `A ${R} ${R} 0 0 1 ${WIDTH / 2} ${CY + LENS_HALF_HEIGHT}`,
  `A ${R} ${R} 0 0 1 ${WIDTH / 2} ${CY - LENS_HALF_HEIGHT}`,
  'Z',
].join(' ');

/** the centre of the non-overlapping sections */
const CRESCENT_X = {
  LEFT: CX_LEFT - R + D / 2,
  RIGHT: CX_RIGHT + R - D / 2,
};

const ROW_COUNT = 5;
const ROW_HEIGHT = 30;
const rowY = (index: number) => CY + (index - (ROW_COUNT - 1) / 2) * ROW_HEIGHT;

const lensWidth = (y: number) =>
  2 * (Math.sqrt(R ** 2 - (y - CY) ** 2) - D / 2);

export const Venn: React.FC<{ metrics: ConflateResult }> = ({ metrics }) => {
  const { $, $$, locale } = use(LocaleContext);
  const { matched } = metrics.countsByPhase;

  const rows: { label: string; count: number; description: string }[] = [
    {
      label: $('MatchType.OneToOne'),
      count: matched[MatchType.OneToOne],
      description: $('Venn.one_to_one_description'),
    },
    {
      label: $('MatchType.OneToMany'),
      count: matched[MatchType.OneToMany],
      description: $('Venn.one_to_many_description'),
    },
    {
      label: $('MatchType.ManyToOne'),
      count: matched[MatchType.ManyToOne],
      description: $('Venn.many_to_one_description'),
    },
    {
      label: $('MatchType.ManyToMany'),
      count: matched[MatchType.ManyToMany],
      description: $('Venn.many_to_many_description'),
    },
  ];

  const bothTotal = rows.reduce((total, row) => total + row.count, 0);

  return (
    <ChartCard
      title={$('Venn.title')}
      description={$('Venn.description')}
      height={320}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        fontFamily='system-ui, -apple-system, "Segoe UI", sans-serif'
      >
        <circle
          // left circle
          cx={CX_LEFT}
          cy={CY}
          r={R}
          fill={LEFT_COLOUR}
          fillOpacity={0.18}
          stroke={LEFT_COLOUR}
          strokeWidth={2}
        />
        <circle
          // right circle
          cx={CX_RIGHT}
          cy={CY}
          r={R}
          fill={RIGHT_COLOUR}
          fillOpacity={0.18}
          stroke={RIGHT_COLOUR}
          strokeWidth={2}
        />

        <text
          // left circle label
          x={CRESCENT_X.LEFT}
          y={26}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill={LEFT_COLOUR}
        >
          {$('Common.sourceDataset')}
        </text>
        <text
          // right circle label
          x={CRESCENT_X.RIGHT}
          y={26}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill={RIGHT_COLOUR}
        >
          OSM
        </text>

        <text
          // left side number
          x={CRESCENT_X.LEFT}
          y={CY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={22}
          fontWeight={600}
          fill={TEXT}
        >
          {matched[MatchType.Guess].toLocaleString(locale)}
        </text>
        <text
          // right side number
          x={CRESCENT_X.RIGHT}
          y={CY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={22}
          fontWeight={600}
          fill={TEXT}
        >
          {matched[MatchType.Delete].toLocaleString(locale)}
        </text>

        {/* the match types, within the overlapping section */}
        {rows.map((row, index) => (
          <g key={row.label} dominantBaseline="central" fontSize={12}>
            <text
              x={WIDTH / 2 - 6}
              y={rowY(index)}
              textAnchor="end"
              fill={TEXT_DIMMED}
            >
              {row.label}
            </text>
            <text
              x={WIDTH / 2 + 6}
              y={rowY(index)}
              textAnchor="start"
              fontWeight={600}
              fill={TEXT}
            >
              {row.count.toLocaleString(locale)}
            </text>
          </g>
        ))}

        <line
          // diving line for the total
          x1={WIDTH / 2 - 55}
          x2={WIDTH / 2 + 55}
          y1={rowY(ROW_COUNT - 1) - 15}
          y2={rowY(ROW_COUNT - 1) - 15}
          stroke={TEXT_DIMMED}
          strokeOpacity={0.3}
        />
        <g dominantBaseline="central" fontSize={12}>
          <text
            x={WIDTH / 2 - 6}
            y={rowY(ROW_COUNT - 1)}
            textAnchor="end"
            fill={TEXT_DIMMED}
          >
            {$('Common.total')}
          </text>
          <text
            x={WIDTH / 2 + 6}
            y={rowY(ROW_COUNT - 1)}
            textAnchor="start"
            fontWeight={600}
            fill={TEXT}
          >
            {bothTotal.toLocaleString(locale)}
          </text>
        </g>

        {/* fake transparent circles with the same geoometry, to make the tooltip work */}
        <Tooltip
          label={$$('Venn.guess_tooltip', { label: $('MatchType.Guess') })}
          multiline
          w={260}
          withArrow
        >
          <circle cx={CX_LEFT} cy={CY} r={R} fill="transparent" />
        </Tooltip>
        <Tooltip
          label={$$('Venn.delete_tooltip', { label: $('MatchType.Delete') })}
          multiline
          w={260}
          withArrow
        >
          <circle cx={CX_RIGHT} cy={CY} r={R} fill="transparent" />
        </Tooltip>
        <Tooltip
          label={$('Venn.both_datasets', { count: bothTotal })}
          multiline
          w={260}
          withArrow
        >
          <path d={LENS_PATH} fill="transparent" />
        </Tooltip>
        {[
          ...rows,
          {
            label: $('Common.total'),
            count: bothTotal,
            description: $('Venn.total_description'),
          },
        ].map((row, index) => (
          <Tooltip
            key={row.label}
            label={$('Venn.match_row_tooltip', {
              label: row.label,
              description: row.description,
            })}
            multiline
            w={260}
            withArrow
          >
            <rect
              x={WIDTH / 2 - lensWidth(rowY(index)) / 2}
              y={rowY(index) - ROW_HEIGHT / 2}
              width={lensWidth(rowY(index))}
              height={ROW_HEIGHT}
              fill="transparent"
            />
          </Tooltip>
        ))}
      </svg>
    </ChartCard>
  );
};
