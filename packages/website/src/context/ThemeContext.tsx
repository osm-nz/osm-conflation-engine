import type { PropsWithChildren } from 'react';
import { Badge, MantineProvider, createTheme } from '@mantine/core';

const theme = createTheme({
  components: {
    Badge: Badge.extend({ defaultProps: { tt: 'none' } }),
  },
});

export const ThemeWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};
