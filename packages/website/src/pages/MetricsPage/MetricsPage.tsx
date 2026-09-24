import { use } from 'react';
import { Flex } from '@mantine/core';
import TimeAgo from 'react-timeago-i18n';
import { useProject } from '../../hooks/useProject.js';
import { FullPageLoading } from '../../components/FullPageLoading.js';
import { PageNotFound } from '../../components/PageNotFound.js';
import { OidcBadge } from '../../components/OidcBadge.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { OsmTag } from '../../components/OsmTag.js';
import { Sankey } from './Sankey.js';
import { Venn } from './Venn.js';
import { ConflationResult } from './ConflationResult.js';
import { TagHistory } from './TagHistory.js';
import { IgnoredByUser } from './IgnoredByUser.js';
import { IgnoredByReview } from './IgnoredByReview.js';
import { GenericCard, StatCard } from './StatCard.js';

export const MetricsPage: React.FC = () => {
  const { $, $$ } = use(LocaleContext);
  const { project, metrics, ignoreList, notFound } = useProject();

  if (notFound) return <PageNotFound />;
  if (!metrics || !project) return <FullPageLoading />;

  const { osm } = metrics.countsByPhase.init;
  const totalOsm = osm.withRef + osm.duplicateRefs + osm.semi + osm.noRef;

  const disabledMessage =
    metrics.config.o_data.source.type === 'postpass'
      ? $$('MetricsPage.postpass_unavailable')
      : undefined;

  return (
    <Flex wrap="wrap" gap="md" align="stretch">
      <Sankey metrics={metrics} />
      <TagHistory metrics={metrics} />

      <ConflationResult metrics={metrics} />
      <Venn metrics={metrics} />
      <IgnoredByUser ignoreList={ignoreList} />
      <IgnoredByReview ignoreList={ignoreList} />

      <StatCard
        label={$$(
          'MetricsPage.recent_check_date',
          {},
          {
            osmKey: () => (
              <OsmTag
                tag={metrics.config.o_data.check_date_key || 'check_date'}
              />
            ),
          },
        )}
        count={osm.recentlyChecked}
        total={totalOsm}
        disabledMessage={disabledMessage}
      />
      <StatCard
        label={$('MetricsPage.recently_modified')}
        count={osm.recentlyChanged}
        total={totalOsm}
        disabledMessage={disabledMessage}
      />
      <StatCard
        label={$('MetricsPage.last_edited_by_importer')}
        count={osm.lastEditedByImporter}
        total={totalOsm}
        disabledMessage={disabledMessage}
      />
      <GenericCard
        label={$('MetricsPage.last_updated')}
        title={<TimeAgo date={project.timestamp} />}
        subtitle={
          <OidcBadge
            operator={project.operator}
            timestamp={project.timestamp}
          />
        }
      />
    </Flex>
  );
};

export { MetricsPage as Component };
