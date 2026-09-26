import { use, useMemo } from 'react';
import { Button, Text } from '@mantine/core';
import { LocaleContext } from '../../../context/LocaleContext.js';
import { MegaTable } from '../../../components/MegaTable/index.js';
import classes from '../ProjectPage.module.css';
import {
  DEFAULT_DATASET_SORT,
  type DatasetRow,
  getDatasetColumns,
} from './datasetColumns.js';
import { DatasetMap } from './DatasetMap.js';

export interface SelectDatasetsStepProps {
  rows: DatasetRow[];
  refTag: string;
  selected: ReadonlySet<string>;
  onChangeSelected(selected: ReadonlySet<string>): void;
  hiddenCount: number;
  onShowHidden(): void;
  /** must be stable! */
  onToggle(title: string): void;
  /** must be stable! */
  onHide(title: string): void;
}

export const SelectDatasetsStep: React.FC<SelectDatasetsStepProps> = ({
  rows,
  refTag,
  selected,
  onChangeSelected,
  hiddenCount,
  onShowHidden,
  onToggle,
  onHide,
}) => {
  const { $, locale } = use(LocaleContext);
  const columns = useMemo(
    () => getDatasetColumns($, locale, refTag),
    [$, locale, refTag],
  );

  return (
    <div className={classes.split}>
      <div className={classes.tablePane}>
        <MegaTable
          rows={rows}
          columns={columns}
          rowKey="title"
          defaultSort={DEFAULT_DATASET_SORT}
          minWidth={760}
          selection={{ selected, onChange: onChangeSelected }}
          toolbar={
            <>
              {!!selected.size && (
                <>
                  <Text c="dimmed" size="sm">
                    {$('SelectDatasetsStep.count', { count: selected.size })}
                  </Text>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    onClick={() => onChangeSelected(new Set())}
                  >
                    {$('Common.clear_selection')}
                  </Button>
                </>
              )}
              {!!hiddenCount && (
                <>
                  <Text c="dimmed" size="sm">
                    {$('ProjectPage.hidden_count', { count: hiddenCount })}
                  </Text>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    onClick={onShowHidden}
                  >
                    {$('ProjectPage.show_all')}
                  </Button>
                </>
              )}
            </>
          }
        />
      </div>
      <div className={classes.mapPane}>
        <DatasetMap
          rows={rows}
          selected={selected}
          onToggle={onToggle}
          onHide={onHide}
        />
      </div>
    </div>
  );
};
