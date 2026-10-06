import { use, useState } from 'react';
import { Anchor, Button, Group, Modal, Text } from '@mantine/core';
import { LocaleContext } from '../context/LocaleContext.js';

const key = 'ackImportRulesModal';

export const ImportRulesModal: React.FC = () => {
  const { $, $$ } = use(LocaleContext);
  const [acked, setAcked] = useState(key in localStorage);

  function onClose() {
    setAcked(true);
    localStorage[key] = '';
  }

  if (acked) return null;

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
