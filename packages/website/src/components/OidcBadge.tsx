import { use } from 'react';
import { Anchor, Divider, Group, HoverCard, Text } from '@mantine/core';
import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react';
import TimeAgo from 'react-timeago-i18n';
import { LocaleContext } from '../context/LocaleContext.js';
import { parseOperator } from '../util/conflation.js';
import { SOURCE_CODE_PROVIDER_INFO, SourceCodeLink } from './SourceCodeLink.js';

export const OidcBadge: React.FC<{
  operator: string;
  timestamp: string;
  size?: number;
}> = ({ operator, timestamp, size = 18 }) => {
  const { $, $$ } = use(LocaleContext);
  const parsed = parseOperator(operator);
  if (!parsed) return undefined;
  const { org, provider, repo, triggerer } = parsed;
  const { brandName, oidcExplainer } = SOURCE_CODE_PROVIDER_INFO[provider];
  return (
    <HoverCard width={390} shadow="md" withArrow openDelay={150}>
      <HoverCard.Target>
        <IconRosetteDiscountCheckFilled
          size={size}
          color="var(--mantine-color-blue-5)"
          style={{ cursor: 'help', flexShrink: 0 }}
        />
      </HoverCard.Target>

      <HoverCard.Dropdown>
        <Group gap="xs" mb={4} wrap="nowrap">
          <IconRosetteDiscountCheckFilled
            size={20}
            color="var(--mantine-color-blue-5)"
          />
          <Text fw={600} size="sm">
            {$('OidcBadge.verified')}
          </Text>
        </Group>
        <Text component="div" size="sm" c="dimmed">
          {$$(
            'OidcBadge.explanation',
            { brandName },
            {
              oidc: ({ children }) => (
                <Anchor href={oidcExplainer} target="_blank" rel="noopener">
                  {children}
                </Anchor>
              ),
              repo: () => (
                <SourceCodeLink
                  provider={provider}
                  org={org}
                  repo={repo}
                  showProfilePic={org !== triggerer}
                />
              ),
              provider: ({ children }) => (
                <Anchor
                  href={`https://${provider}`}
                  target="_blank"
                  rel="noopener"
                >
                  {children}
                </Anchor>
              ),
            },
          )}
          <Divider my={8} />
          {$$('OidcBadge.trigger', undefined, {
            task: ({ children }) => (
              <Anchor
                href={operator.split('#', 1)[0]}
                target="_blank"
                rel="noopener"
              >
                {children}
              </Anchor>
            ),
            when: () => <TimeAgo date={timestamp} />,
            triggerer: () => (
              <SourceCodeLink provider={provider} org={triggerer} />
            ),
          })}
        </Text>
      </HoverCard.Dropdown>
    </HoverCard>
  );
};
