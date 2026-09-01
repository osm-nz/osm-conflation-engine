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
import { Strong } from '../../components/Strong.js';
import { ReviewDecision } from './columns.js';

const DECISIONS: {
  value: ReviewDecision;
  label: React.ReactNode;
  description: React.ReactNode;
  consequence: React.ReactNode;
  color: MantineColor;
}[] = [
  {
    value: ReviewDecision.Approved,
    label: 'Approve',
    description: 'These features were correctly deleted.',
    consequence: (
      <>
        The import will <strong>not</strong> recreate these features, they will
        remain deleted.
      </>
    ),
    color: 'green',
  },
  {
    value: ReviewDecision.Rejected,
    label: 'Reject',
    description: 'These features should not have been deleted.',
    consequence: (
      <>The import will recreate these features when it runs next.</>
    ),
    color: 'red',
  },
];

export const ReviewModal: React.FC<{
  rowIds: ReadonlySet<string>;
  opened: boolean;
  onClose(): void;
  onSave(): void;
}> = ({ rowIds, opened, onClose, onSave: onSaved }) => {
  const refTag = useParams<'refTag'>().refTag!;
  const { user, login } = use(AuthContext);

  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  const chosen = DECISIONS.find((option) => option.value === decision);

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
      title={`Review ${rowIds.size} deletions`}
      centered
    >
      <Stack gap="md">
        <Radio.Group
          value={`${decision}`}
          onChange={(v) => setDecision(+v)}
          label="Decision"
          withAsterisk
        >
          <Group grow align="stretch" gap="xs" mt="xs">
            {DECISIONS.map((option) => {
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
          label="Comment"
          value={comment}
          onChange={(event) => setComment(event.currentTarget.value)}
          autosize
          minRows={3}
        />

        {!!user && (
          <Text component="div" size="xs" c="dimmed">
            If you click save, your OSM username{' '}
            <Avatar
              src={user.img?.href}
              name={user.display_name}
              size={18}
              radius="xl"
              display="inline-flex"
              style={{ verticalAlign: 'text-bottom' }}
            />{' '}
            <Strong>{user.display_name}</Strong> will be stored and visible to
            anyone who looks at this list of ignored features.
          </Text>
        )}

        {!!error && (
          <Alert
            variant="light"
            color="red"
            p="sm"
            icon={<IconAlertTriangle size={18} />}
            title="Failed to save"
          >
            {`${error}`}
          </Alert>
        )}

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={close} disabled={isLoading}>
            Cancel
          </Button>
          {user ? (
            <Button
              onClick={onSave}
              disabled={decision === null}
              loading={isLoading}
            >
              Save
            </Button>
          ) : (
            <Button onClick={login} leftSection={<IconLogin size={18} />}>
              Login
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
};
