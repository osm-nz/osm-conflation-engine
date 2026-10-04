import { use, useState } from 'react';
import {
  Anchor,
  Button,
  Card,
  FileButton,
  List,
  Progress,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { importDBFromZip } from 'gtfs-sqlite';
import { HostContext } from '../../context/HostContext.js';
import { ErrorMessage } from '../../components/ErrorMessage.js';
import type { NetworkConfig } from '../../types/config.def.js';

export const ImportNetwork: React.FC<{
  network: NetworkConfig;
  onComplete(): void;
}> = ({ network, onComplete }) => {
  const { $, $$ } = use(HostContext);
  const [error, setError] = useState<unknown>();
  const [progress, setProgress] = useState<importDBFromZip.Progress>();

  async function onChange(file: File | null) {
    try {
      if (!file) return;

      await importDBFromZip({
        zipFile: file,
        databaseName: network.code,
        onProgress: setProgress,
        exclude: ['shapes.txt'],
      });
      onComplete();
    } catch (ex) {
      console.error(ex);
      setError(ex);
    }
    setProgress(undefined);
  }

  if (error) {
    return (
      <ErrorMessage
        title={$('gtfs.ImportNetwork.error')}
        error={error}
        onRetry={() => setError(undefined)}
      />
    );
  }

  if (progress) {
    return (
      <Stack>
        <Card withBorder>
          <Stack gap="xs">
            <Text>
              {$$('gtfs.ImportNetwork.importing', {
                message: progress.message,
              })}
            </Text>
            <Progress value={100} color="yellow" striped animated />
          </Stack>
        </Card>
        {!!progress.warnings.size && (
          <>
            <Title order={3}>{$('Navbar.warnings')}</Title>
            <List>
              {[...progress.warnings].map((w, index) => (
                // eslint-disable-next-line @eslint-react/no-array-index-key
                <List.Item key={index}>{w}</List.Item>
              ))}
            </List>
          </>
        )}
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{$('gtfs.ImportNetwork.column_file')}</Table.Th>
              <Table.Th>{$('gtfs.ImportNetwork.column_progress')}</Table.Th>
              <Table.Th w="50%" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Object.entries(progress.perFile).map(([file, { done, total }]) => {
              const isFinished = !!total && done === total;
              const percentage = total ? Math.round((done / total) * 100) : 0;
              return (
                <Table.Tr key={file}>
                  <Table.Td>{file}</Table.Td>
                  <Table.Td>
                    {total
                      ? $('gtfs.ImportNetwork.file_progress', {
                          done,
                          total,
                          percentage,
                        })
                      : $('gtfs.ImportNetwork.enqueued')}
                  </Table.Td>
                  <Table.Td>
                    <Progress
                      value={percentage}
                      color={isFinished ? 'green' : 'yellow'}
                      striped={!isFinished}
                      animated={!isFinished}
                    />
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Stack>
    );
  }

  return (
    <Stack align="flex-start">
      <Text>
        {$$(
          'gtfs.ImportNetwork.instructions',
          {
            networkName: network.networkName,
            host: new URL(network.gtfsSource.url).host,
          },
          {
            a: ({ children }) => (
              <Anchor
                href={network.gtfsSource.url}
                target="_blank"
                rel="noreferrer"
              >
                {children}
              </Anchor>
            ),
          },
        )}
      </Text>
      <FileButton accept=".zip" onChange={onChange}>
        {(props) => (
          <Button {...props}>{$('gtfs.ImportNetwork.upload')}</Button>
        )}
      </FileButton>
    </Stack>
  );
};
