import type { PropsWithChildren } from 'react';
import { Text, type TextProps } from '@mantine/core';

export const Strong: React.FC<TextProps & PropsWithChildren> = (props) => (
  <Text component="span" size="sm" fw={600} {...props} />
);
