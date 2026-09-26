import { use } from 'react';
import { Anchor, Button, Group, Modal, Text } from '@mantine/core';
import { LocaleContext } from '../context/LocaleContext.js';

export const ImportRulesModal: React.FC<{
  onClose(): void;
}> = ({ onClose }) => {
  const { $, $$ } = use(LocaleContext);

  return (
    <Modal opened onClose={onClose} title={$('ImportRules.title')} centered>
      <Text size="sm">
        {$$(
          'ImportRules.description',
          {},
          {
            a: ({ children }) => (
              <Anchor
                href="https://osm.wiki/Import/Guidelines#Using_a_Dedicated_User_Account_for_Imports"
                target="_blank"
                rel="noopener"
                inherit
              >
                {children}
              </Anchor>
            ),
          },
        )}
      </Text>
      <Group justify="flex-end" mt="md">
        <Button onClick={onClose}>{$('Common.got-it')}</Button>
      </Group>
    </Modal>
  );
};
