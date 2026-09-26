import { use, useCallback, useRef, useState } from 'react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogin } from '@tabler/icons-react';
import { LocaleContext } from '../context/LocaleContext.js';
import type { IAuthContext } from '../context/AuthContext.js';

export interface LoginSuggestionOptions {
  reason: React.ReactNode;
  canSkip?: boolean;
}

export function useLoginSuggestion({
  user,
  login,
}: Pick<IAuthContext, 'user' | 'login'>) {
  const { $ } = use(LocaleContext);
  const [opened, modal] = useDisclosure(false);
  const promiseRef = useRef<(isLoggedIn: boolean) => void>(undefined);
  const [options, setOptions] = useState<LoginSuggestionOptions>();

  function onComplete(isLoggedIn: boolean) {
    modal.close();
    promiseRef.current?.(isLoggedIn);
    promiseRef.current = undefined;
  }

  async function onClickLogin() {
    modal.close();
    await login();
    onComplete(true);
  }

  /** returns a promise that hangs until the user clicks login or skip */
  const open = useCallback(
    async (newOptions: LoginSuggestionOptions) => {
      if (user) return true; // already logged in, immediately resolve

      setOptions(newOptions);
      modal.open();
      return new Promise<boolean>((resolve) => {
        promiseRef.current = resolve;
      });
    },
    [modal, user],
  );

  const element = options && (
    <Modal
      opened={opened}
      onClose={() => onComplete(false)}
      title={$('LoginPrompt.title')}
      centered
    >
      <Text size="sm">{options.reason}</Text>
      <Group justify="flex-end" gap="xs" mt="md">
        {options.canSkip && (
          <Button variant="default" onClick={() => onComplete(false)}>
            {$('LoginPrompt.skip')}
          </Button>
        )}
        <Button onClick={onClickLogin} leftSection={<IconLogin size={18} />}>
          {$('AuthContext.login')}
        </Button>
      </Group>
    </Modal>
  );

  return [open, element] as const;
}
