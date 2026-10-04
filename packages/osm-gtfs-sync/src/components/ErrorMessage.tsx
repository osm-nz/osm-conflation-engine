import { use } from 'react';
import { Alert, Button, Stack, Text } from '@mantine/core';
import { HostContext } from '../context/HostContext.js';

export const ErrorMessage: React.FC<{
  title: string;
  error?: unknown;
  onRetry?(): void;
}> = ({ title, error, onRetry }) => {
  const { $ } = use(HostContext);

  return (
    <Alert color="red" title={title}>
      <Stack align="flex-start">
        {!!error && (
          <Text size="sm">
            {error instanceof Error ? error.message : `${error}`}
          </Text>
        )}
        {onRetry && (
          <Button variant="default" size="xs" onClick={onRetry}>
            {$('gtfs.ErrorMessage.retry')}
          </Button>
        )}
      </Stack>
    </Alert>
  );
};
