import { use } from 'react';
import { HoverCard, Text } from '@mantine/core';
import TimeAgo from 'react-timeago-i18n';
import { LocaleContext } from '../../../context/LocaleContext.js';
import { OsmUsername } from '../../../components/OsmUsername.js';
import type { Lock } from '../../../api/conflation.js';

export const LockWarning: React.FC<{ lock: Lock }> = ({ lock }) => {
  const { $, $$ } = use(LocaleContext);

  // hack so that translations can customise the message based
  // on whether the username is undefined or not.
  const params = { isAnonymous: `${!lock.username}` };
  const markup = {
    user: () => <OsmUsername user={lock.username} inherit />,
    when: () => <TimeAgo date={lock.timestamp} />,
  };

  return (
    <HoverCard width={390} shadow="md" withArrow openDelay={150}>
      <HoverCard.Target>
        <Text size="xs" c="orange" style={{ cursor: 'help' }}>
          {$$('SelectDatasetsStep.locked', params, markup)}
        </Text>
      </HoverCard.Target>

      <HoverCard.Dropdown>
        <Text size="sm">
          {$$('SelectDatasetsStep.locked_explanation', params, markup)}
        </Text>
        <Text size="sm" c="dimmed" mt={8}>
          {$('SelectDatasetsStep.locked_advice')}
        </Text>
      </HoverCard.Dropdown>
    </HoverCard>
  );
};
