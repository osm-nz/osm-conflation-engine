import { use } from 'react';
import { Flex } from '@mantine/core';
import { useProject } from '../../hooks/useProject.js';
import { FullPageLoading } from '../../components/FullPageLoading.js';
import { PageNotFound } from '../../components/PageNotFound.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { Sankey } from './Sankey.js';
import { Venn } from './Venn.js';
import { ConflationResult } from './ConflationResult.js';
import { IgnoredByUser } from './IgnoredByUser.js';
import { IgnoredByReview } from './IgnoredByReview.js';
import { StatCard } from './StatCard.js';

export const MetricsPage: React.FC = () => {
  const { $, $$ } = use(LocaleContext);
  const { metrics, ignoreList, notFound } = useProject();

  if (notFound) return <PageNotFound />;
  if (!metrics) return <FullPageLoading />;

  const { osm } = metrics.countsByPhase.init;
  const totalOsm = osm.withRef + osm.duplicateRefs + osm.semi + osm.noRef;

  return (
    <Flex wrap="wrap" gap="md" align="stretch">
      <Sankey metrics={metrics} />

      <ConflationResult metrics={metrics} />
      <Venn metrics={metrics} />
      <IgnoredByUser ignoreList={ignoreList} />
      <IgnoredByReview ignoreList={ignoreList} />

      <StatCard
        label={$$('MetricsPage.recent_check_date', {
          key: metrics.config.o_data.check_date_key || 'check_date',
        })}
        count={osm.recentlyChecked}
        total={totalOsm}
      />
      <StatCard
        label={$('MetricsPage.recently_modified')}
        count={osm.recentlyChanged}
        total={totalOsm}
      />
      <StatCard
        label={$('MetricsPage.last_edited_by_importer')}
        count={osm.lastEditedByImporter}
        total={totalOsm}
      />
    </Flex>
  );
};

export { MetricsPage as Component };
