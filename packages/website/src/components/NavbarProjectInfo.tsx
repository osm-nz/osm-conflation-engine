import { use } from 'react';
import { useParams } from 'react-router';
import { ActionIcon, Anchor, Popover, Table, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import TimeAgo from 'react-timeago-i18n';
import { DataContext } from '../context/DataContext.js';
import { LocaleContext } from '../context/LocaleContext.js';
import { parseOperator } from '../util/conflation.js';
import { OsmTag } from './OsmTag.js';
import { OverallProgress } from './OverallProgress.js';
import { RegionBadge } from './RegionBadge.js';
import { SourceCodeLink } from './SourceCodeLink.js';

export const NavbarProjectInfo: React.FC = () => {
  const { refTag } = useParams<'refTag'>();
  const { $, $$, locale } = use(LocaleContext);
  const { homePageItems } = use(DataContext);

  const project = homePageItems.find((p) => p.refTag === refTag);
  if (!project) return undefined;

  const operator = parseOperator(project.operator);

  return (
    <Popover width={360} position="bottom-start" shadow="md" withArrow>
      <Popover.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={$('NavbarProjectInfo.title')}
          c="dimmed"
        >
          <IconInfoCircle size={20} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <Text fw={600}>{project.name}</Text>
        {project.description && (
          <Text size="sm" c="dimmed">
            {project.description}
          </Text>
        )}
        <Table variant="vertical" withRowBorders={false} mt="xs" fz="sm">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th>{$('NavbarProjectInfo.region')}</Table.Th>
              <Table.Td>
                <RegionBadge
                  region={project.region}
                  regionFlag={project.regionFlag}
                />
              </Table.Td>
            </Table.Tr>
            {operator && (
              <Table.Tr>
                <Table.Th>{$('NavbarProjectInfo.source_code')}</Table.Th>
                <Table.Td>
                  <SourceCodeLink
                    provider={operator.provider}
                    org={operator.org}
                    repo={operator.repo}
                  />
                </Table.Td>
              </Table.Tr>
            )}
            <Table.Tr>
              <Table.Th>{$('NavbarProjectInfo.wiki_page')}</Table.Th>
              <Table.Td style={{ wordBreak: 'break-all' }}>
                <Anchor
                  href={project.wikiPageLink}
                  target="_blank"
                  rel="noopener"
                  size="sm"
                >
                  {new URL(project.wikiPageLink).pathname
                    .slice(1)
                    .replaceAll('_', ' ')}
                </Anchor>
              </Table.Td>
            </Table.Tr>
            {project.osmKey && (
              <Table.Tr>
                <Table.Th>{$('NavbarProjectInfo.primary_key')}</Table.Th>
                <Table.Td>
                  <OsmTag tag={project.osmKey} />
                </Table.Td>
              </Table.Tr>
            )}
            {operator && (
              <Table.Tr>
                <Table.Th>{$('NavbarProjectInfo.contact')}</Table.Th>
                <Table.Td>
                  <SourceCodeLink
                    provider={operator.provider}
                    org={operator.triggerer}
                  />
                </Table.Td>
              </Table.Tr>
            )}
            <Table.Tr>
              <Table.Th>{$('NavbarProjectInfo.total_rows')}</Table.Th>
              <Table.Td>{project.count.toLocaleString(locale)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>{$('NavbarProjectInfo.progress')}</Table.Th>
              <Table.Td>
                <OverallProgress metrics={project.metrics} />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>{$('NavbarProjectInfo.last_updated')}</Table.Th>
              <Table.Td>
                {operator ? (
                  $$('NavbarProjectInfo.last_updated_value', undefined, {
                    when: () => <TimeAgo date={project.timestamp} />,
                    a: ({ children }) => (
                      <Anchor
                        href={project.operator.split('#', 1)[0]}
                        target="_blank"
                        rel="noopener"
                        size="sm"
                      >
                        {children}
                      </Anchor>
                    ),
                  })
                ) : (
                  <TimeAgo date={project.timestamp} />
                )}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Popover.Dropdown>
    </Popover>
  );
};
