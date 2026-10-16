import { use, useState } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { AuthContext } from '../../../context/AuthContext.js';
import { LocaleContext } from '../../../context/LocaleContext.js';
import { getDataset } from '../../../api/static.js';
import { lockDataset } from '../../../api/conflation.js';
import { downloadSeparateOsmPatches } from '../ImportStep/downloadOsmPatch.js';

export const DownloadOsmPatchFileButton: React.FC<{
  refTag: string;
  datasetId: string;
}> = ({ refTag, datasetId }) => {
  const { $ } = use(LocaleContext);
  const { maybeSuggestLoggingIn } = use(AuthContext);
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const isLoggedIn = await maybeSuggestLoggingIn({
        reason: $('DownloadOsmPatchFileButton.loginReason'),
        canSkip: true,
      });
      const osmPatch = await getDataset(refTag, datasetId);
      if (isLoggedIn) {
        await lockDataset(refTag, datasetId);
      }
      await downloadSeparateOsmPatches({ [datasetId]: osmPatch });
    } catch (error) {
      console.error(error);
      // eslint-disable-next-line no-alert
      alert($('ProjectPage.download_error'));
    }
    setLoading(false);
  }

  return (
    <Tooltip label={$('ProjectPage.download')} withArrow>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        loading={loading}
        onClick={onClick}
        style={{ flexShrink: 0 }}
        aria-label={$('ProjectPage.download')}
      >
        <IconDownload size={14} stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );
};
