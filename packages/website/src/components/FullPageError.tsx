import type { PropsWithChildren } from 'react';
import { Alert, Center, Code, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

export const FullPageError: React.FC<
  PropsWithChildren & {
    error: unknown;
  }
> = ({ children, error }) => {
  return (
    <Center h="100vh" p="md">
      <Alert
        variant="light"
        color="red"
        icon={<IconAlertTriangle />}
        title="Failed to load the app"
        w="100%"
        maw={500}
      >
        <Stack>
          <Text>{children}</Text>
          <Code block style={{ textWrap: 'auto' }}>{`${error}`}</Code>
        </Stack>
      </Alert>
    </Center>
  );
};
