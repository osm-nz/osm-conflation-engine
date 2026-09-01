import { Stack, Table, Text, Title } from '@mantine/core';
import { useProject } from '../hooks/useProject.js';
import { FullPageLoading } from '../components/FullPageLoading.js';

export const WarningsPage: React.FC = () => {
  const { metrics } = useProject();

  if (!metrics) return <FullPageLoading />;

  return (
    <Stack gap="sm" p="md">
      <Title order={2}>Warnings</Title>
      {metrics.warnings.length ? (
        <>
          <Text c="dimmed" size="sm">
            {metrics.warnings.length} warnings from the last run
          </Text>

          <Table.ScrollContainer minWidth={520}>
            <Table stickyHeader highlightOnHover striped verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Warning</Table.Th>
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
        <Text c="dimmed">None.</Text>
      )}
    </Stack>
  );
};
