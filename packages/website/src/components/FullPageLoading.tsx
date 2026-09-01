import { Center, Loader, Stack } from '@mantine/core';
import classes from './FullPage.module.css';

export const FullPageLoading: React.FC = () => {
  return (
    <Center className={classes.fullPage}>
      <Stack align="center" gap="sm">
        <Loader size="lg" />
      </Stack>
    </Center>
  );
};
