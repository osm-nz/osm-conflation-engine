import { Center, Loader, Stack } from '@mantine/core';

export const FullPageLoading: React.FC = () => {
  return (
    <Center h="100vh">
      <Stack align="center" gap="sm">
        <Loader size="lg" />
      </Stack>
    </Center>
  );
};
