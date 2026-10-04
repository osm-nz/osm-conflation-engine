import { Center, Loader, Stack, Text } from '@mantine/core';

export const FullPageSpinner: React.FC<{ message?: string }> = ({
  message,
}) => (
  <Center pt="30vh">
    <Stack align="center">
      <Loader size="xl" />
      {message && <Text c="dimmed">{message}</Text>}
    </Stack>
  </Center>
);
