import { use, useMemo, useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { FullPageLoading } from '../../components/FullPageLoading.js';
import { AuthContext } from '../../context/AuthContext.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { useProject } from '../../hooks/useProject.js';
import { MegaTable } from '../../components/MegaTable/index.js';
import { PageNotFound } from '../../components/PageNotFound.js';
import { DEFAULT_FILTERS, DEFAULT_SORT, getColumns } from './columns.js';
import { ReviewModal } from './ReviewModal.js';
import { ReviewProgress } from './ReviewProgress.js';

export const IgnoredPage: React.FC = () => {
  const { $ } = use(LocaleContext);
  const { maybeSuggestLoggingIn } = use(AuthContext);
  const { ignoreList, fetchIgnoreList, notFound } = useProject();
  const columns = useMemo(() => getColumns($), [$]);
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [modalOpen, modal] = useDisclosure(false);

  async function onClickReview() {
    const isLoggedIn = await maybeSuggestLoggingIn({
      reason: $('IgnoredPage.loginReason'),
    });
    if (isLoggedIn) modal.open();
  }

  if (notFound) return <PageNotFound />;
  if (!ignoreList) return <FullPageLoading />;

  if (!ignoreList.length) {
    return (
      <Text c="dimmed" p="md">
        {$('Common.no_data')}
      </Text>
    );
  }

  return (
    <Stack gap="sm" p="md">
      <ReviewProgress rows={ignoreList} />
      <MegaTable
        rows={ignoreList}
        columns={columns}
        rowKey="rowId"
        defaultSort={DEFAULT_SORT}
        defaultFilters={DEFAULT_FILTERS}
        selection={{ selected, onChange: setSelected }}
        toolbar={
          !!selected.size && (
            <>
              <Button size="xs" onClick={onClickReview}>
                {$('IgnoredPage.review', { count: selected.size })}
              </Button>
              <Button
                size="compact-xs"
                variant="subtle"
                onClick={() => setSelected(new Set())}
              >
                {$('IgnoredPage.clear_selection')}
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
