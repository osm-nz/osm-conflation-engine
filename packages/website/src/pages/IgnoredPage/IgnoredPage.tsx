import { useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { FullPageLoading } from '../../components/FullPageLoading.js';
import { useProject } from '../../hooks/useProject.js';
import { MegaTable } from '../../components/MegaTable/index.js';
import { COLUMNS, DEFAULT_FILTERS, DEFAULT_SORT } from './columns.js';
import { ReviewModal } from './ReviewModal.js';
import { ReviewProgress } from './ReviewProgress.js';

export const IgnoredPage: React.FC = () => {
  const { ignoreList, fetchIgnoreList } = useProject();
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [modalOpen, modal] = useDisclosure(false);

  if (!ignoreList) return <FullPageLoading />;

  if (!ignoreList.length) {
    return (
      <Text c="dimmed" p="md">
        No data.
      </Text>
    );
  }

  return (
    <Stack gap="sm" p="md">
      <ReviewProgress rows={ignoreList} />
      <MegaTable
        rows={ignoreList}
        columns={COLUMNS}
        rowKey="rowId"
        defaultSort={DEFAULT_SORT}
        defaultFilters={DEFAULT_FILTERS}
        selection={{ selected, onChange: setSelected }}
        toolbar={
          !!selected.size && (
            <>
              <Button size="xs" onClick={modal.open}>
                Review {selected.size} deletions
              </Button>
              <Button
                size="compact-xs"
                variant="subtle"
                onClick={() => setSelected(new Set())}
              >
                Clear selection
              </Button>
            </>
          )
        }
      />

      <ReviewModal
        rowIds={selected}
        opened={modalOpen}
        onClose={modal.close}
        onSave={() => {
          setSelected(new Set());
          fetchIgnoreList();
        }}
      />
    </Stack>
  );
};
