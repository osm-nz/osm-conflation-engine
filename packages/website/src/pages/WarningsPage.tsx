import { use } from 'react';
import { Stack, Table, Text, Title } from '@mantine/core';
import { useProject } from '../hooks/useProject.js';
import { FullPageLoading } from '../components/FullPageLoading.js';
import { PageNotFound } from '../components/PageNotFound.js';
import { LocaleContext } from '../context/LocaleContext.js';

export const WarningsPage: React.FC = () => {
  const { $ } = use(LocaleContext);
  const { metrics, notFound } = useProject();

  if (notFound) return <PageNotFound />;
  if (!metrics) return <FullPageLoading />;

  return (
    <Stack gap="sm" p="md">
      <Title order={2}>{$('Navbar.warnings')}</Title>
      {metrics.warnings.length ? (
        <>
          <Text c="dimmed" size="sm">
            {$('WarningsPage.count', { count: metrics.warnings.length })}
          </Text>

          <Table.ScrollContainer minWidth={520}>
            <Table stickyHeader highlightOnHover striped verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{$('WarningsPage.column')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {metrics.warnings.map((message) => (
                  <Table.Tr key={message}>
                    <Table.Td>
                      <Text size="sm" style={{ wordBreak: 'break-word' }}>
                        {message}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </>
      ) : (
        <Text c="dimmed">{$('Common.no_data')}</Text>
      )}
    </Stack>
  );
};
