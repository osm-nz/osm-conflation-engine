import { type PropsWithChildren, use } from 'react';
import { Button, Center, type CenterProps } from '@mantine/core';
import { IconLogin } from '@tabler/icons-react';
import { AuthContext } from '../context/AuthContext.js';
import { LocaleContext } from '../context/LocaleContext.js';

/** only renders its children if logged in */
export const AuthGateway: React.FC<PropsWithChildren<CenterProps>> = ({
  children,
  ...props
}) => {
  const { user, login } = use(AuthContext);
  const { $ } = use(LocaleContext);

  if (user) return children;

  return (
    <Center p="xl" {...props}>
      <Button onClick={login} leftSection={<IconLogin size={18} />}>
        {$('AuthContext.login')}
      </Button>
    </Center>
  );
};
