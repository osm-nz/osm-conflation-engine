import { use, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Group,
  type MantineColor,
  Modal,
  Radio,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { IconAlertTriangle, IconLogin } from '@tabler/icons-react';
import { useParams } from 'react-router';
import { markIgnoreListAsReviewed } from '../../api/conflation.js';
import { AuthContext } from '../../context/AuthContext.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { ReviewDecision } from './columns.js';

interface Decision {
  value: ReviewDecision;
  label: string;
  description: string;
  consequence: React.ReactNode;
  color: MantineColor;
}

export const ReviewModal: React.FC<{
  rowIds: ReadonlySet<string>;
  opened: boolean;
  onClose(): void;
  onSave(): void;
}> = ({ rowIds, opened, onClose, onSave: onSaved }) => {
  const refTag = useParams<'refTag'>().refTag!;
  const { user, login } = use(AuthContext);
  const { $, $$ } = use(LocaleContext);

  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  const decisions: Decision[] = [
    {
      value: ReviewDecision.Approved,
      label: $('ReviewModal.approve'),
      description: $('ReviewModal.approve_description'),
      consequence: $$('ReviewModal.approve_consequence'),
      color: 'green',
    },
    {
      value: ReviewDecision.Rejected,
      label: $('ReviewModal.reject'),
      description: $('ReviewModal.reject_description'),
      consequence: $('ReviewModal.reject_consequence'),
      color: 'red',
    },
  ];

  const chosen = decisions.find((option) => option.value === decision);

  const close = () => {
    setDecision(null);
    setComment('');
    setError(undefined);
    onClose();
  };

  const onSave = async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      await markIgnoreListAsReviewed(refTag, {
        rowIds: [...rowIds],
        review_comment: comment,
        review_decision: decision === ReviewDecision.Approved,
      });
      close();
      onSaved();
    } catch (ex) {
      setError(ex);
    }
    setIsLoading(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      closeButtonProps={{ disabled: isLoading }}
      title={$('IgnoredPage.review', { count: rowIds.size })}
      centered
    >
      <Stack gap="md">
        <Radio.Group
          value={`${decision}`}
          onChange={(v) => setDecision(+v)}
          label={$('ReviewModal.decision')}
          withAsterisk
        >
          <Group grow align="stretch" gap="xs" mt="xs">
            {decisions.map((option) => {
              const isChecked = decision === option.value;
              return (
                <Radio.Card
                  key={option.value}
                  value={`${option.value}`}
                  p="sm"
                  style={
                    isChecked
                      ? {
                          borderColor: `var(--mantine-color-${option.color}-filled)`,
                          backgroundColor: `var(--mantine-color-${option.color}-light)`,
                        }
                      : undefined
                  }
                >
                  <Group wrap="nowrap" align="flex-start" gap="xs">
                    <Radio.Indicator color={option.color} />
                    <div>
                      <Text
                        size="sm"
                        fw={600}
                        c={isChecked ? option.color : undefined}
                      >
                        {option.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {option.description}
                      </Text>
                    </div>
                  </Group>
                </Radio.Card>
              );
            })}
          </Group>
        </Radio.Group>
        {!!chosen && (
          <Text component="div" size="xs" c="dimmed">
            {chosen.consequence}
          </Text>
        )}

        <Textarea
          label={$('ReviewModal.comment')}
          value={comment}
          onChange={(event) => setComment(event.currentTarget.value)}
          autosize
          minRows={3}
        />

        {!!user && (
          <Text component="div" size="xs" c="dimmed">
            {$$(
              'ReviewModal.username_notice',
              { username: user.display_name },
              {
                avatar: () => (
                  <Avatar
                    src={user.img?.href}
                    name={user.display_name}
                    size={18}
                    radius="xl"
                    display="inline-flex"
                    style={{ verticalAlign: 'text-bottom' }}
                  />
                ),
              },
            )}
          </Text>
        )}

        {!!error && (
          <Alert
            variant="light"
            color="red"
            p="sm"
            icon={<IconAlertTriangle size={18} />}
            title={$('ReviewModal.error')}
          >
            {`${error}`}
          </Alert>
        )}

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={close} disabled={isLoading}>
            {$('Common.cancel')}
          </Button>
          {user ? (
            <Button
              onClick={onSave}
              disabled={decision === null}
              loading={isLoading}
            >
              {$('Common.save')}
            </Button>
          ) : (
            <Button onClick={login} leftSection={<IconLogin size={18} />}>
              {$('AuthContext.login')}
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};
