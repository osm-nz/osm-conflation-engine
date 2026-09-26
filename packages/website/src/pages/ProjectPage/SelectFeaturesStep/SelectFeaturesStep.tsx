import { use, useMemo } from 'react';
import { Button, Loader, Text } from '@mantine/core';
import { LocaleContext } from '../../../context/LocaleContext.js';
import { MegaTable } from '../../../components/MegaTable/index.js';
import classes from '../ProjectPage.module.css';
import { FeatureMap } from './FeatureMap.js';
import {
  FEATURE_DEFAULT_SORT,
  type FeatureRow,
  getFeatureColumns,
} from './featureColumns.js';

export interface SelectFeaturesStepProps {
  rows: FeatureRow[];
  selected: ReadonlySet<string>;
  onChangeSelected(selected: ReadonlySet<string>): void;
  /** must be stable! */
  onToggle(id: string): void;
  pending: number;
  errors: ReadonlySet<string>;
}

export const SelectFeaturesStep: React.FC<SelectFeaturesStepProps> = ({
  rows,
  selected,
  onChangeSelected,
  onToggle,
  pending,
  errors,
}) => {
  const { $ } = use(LocaleContext);
  const columns = useMemo(() => getFeatureColumns($), [$]);

  if (!rows.length && pending) {
    return (
      <div className={classes.centered}>
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className={classes.split}>
      <div className={classes.tablePane}>
        <MegaTable
          rows={rows}
          columns={columns}
          rowKey="id"
          defaultSort={FEATURE_DEFAULT_SORT}
          minWidth={760}
          selection={{ selected, onChange: onChangeSelected }}
          toolbar={
            <>
              {!!pending && <Loader size="xs" />}
              <Text c="dimmed" size="sm">
                {$('SelectFeaturesStep.count', { count: selected.size })}
              </Text>
              {!!selected.size && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  onClick={() => onChangeSelected(new Set())}
                >
                  {$('Common.clear_selection')}
                </Button>
              )}
              {!!errors.size && (
                <Text c="red" size="sm">
                  {$('ProjectPage.download_failed', { count: errors.size })}
                </Text>
              )}
            </>
          }
        />
      </div>
      <div className={classes.mapPane}>
        <FeatureMap rows={rows} selected={selected} onToggle={onToggle} />
      </div>
    </div>
  );
};
