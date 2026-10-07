import { use, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconFileTypeXml,
  IconInfoCircle,
  IconJson,
} from '@tabler/icons-react';
import type { OsmPatch } from 'osm-api';
import { AuthContext } from '../../../context/AuthContext.js';
import { LocaleContext } from '../../../context/LocaleContext.js';
import { APP_ICON_URL } from '../../../components/Navbar.js';
import { OsmUsername } from '../../../components/OsmUsername.js';
import iDIcon from '../../../assets/iD.svg';
import josmIcon from '../../../assets/JOSM.png';
import rapidIcon from '../../../assets/RapiD.svg';
import { isTruthy } from '../../../util/object.js';
import {
  downloadMergedOsmPatch,
  downloadSeparateOsmPatches,
} from './downloadOsmPatch.js';
import {
  downloadMergedOsmChange,
  downloadSeparateOsmChangeFiles,
} from './downloadOsmChange.js';
import { loadIntoJOSM } from './loadIntoJOSM.js';

const ICON_SIZE = 28;

const ICONS = {
  direct: (
    <img src={APP_ICON_URL} alt="" width={ICON_SIZE} height={ICON_SIZE} />
  ),
  osmPatch: <IconJson size={ICON_SIZE} stroke={1.5} />,
  osmChange: <IconFileTypeXml size={ICON_SIZE} stroke={1.5} />,
  iD: <img src={iDIcon} alt="" width={ICON_SIZE} height={ICON_SIZE} />,
  RapiD: <img src={rapidIcon} alt="" width={ICON_SIZE} height={ICON_SIZE} />,
  JOSM: <img src={josmIcon} alt="" width={ICON_SIZE} height={ICON_SIZE} />,
};

interface Option {
  key: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  hidden?: boolean;
  disabled?: boolean;
  onClick(): void | Promise<void>;
}

export const ImportStep: React.FC<{
  osmPatchFiles: Record<string, OsmPatch>;
}> = ({ osmPatchFiles }) => {
  const { $, $$ } = use(LocaleContext);
  const { user } = use(AuthContext);
  const [isLoading, setIsLoading] = useState<string>();
  const [error, setError] = useState<unknown>();

  const count = Object.keys(osmPatchFiles).length;
  const featureCount = Object.values(osmPatchFiles).reduce(
    (total, osmPatch) => total + osmPatch.features.length,
    0,
  );
  const instructions = new Set(
    Object.values(osmPatchFiles)
      .map((osmPatch) => osmPatch.instructions)
      .filter(isTruthy),
  );

  const merged = $('ImportStep.subtitle.merged');
  const separate = $('ImportStep.subtitle.separate', { count });
  const allAtOnce = $('ImportStep.subtitle.all_at_once');
  const oneByOne = $('ImportStep.subtitle.one_by_one');

  const options: Option[] = [
    {
      key: 'direct',
      icon: ICONS.direct,
      title: $('ImportStep.upload_directly'),
      disabled: true,
      onClick: console.info,
    },
    {
      key: 'RapiD',
      icon: ICONS.RapiD,
      title: $('ImportStep.upload_via', { editor: 'RapiD' }),
      subtitle: oneByOne,
      disabled: true,
      onClick: console.info,
    },
    {
      key: 'JOSM',
      icon: ICONS.JOSM,
      title: $('ImportStep.upload_via', { editor: 'JOSM' }),
      subtitle: allAtOnce,
      onClick: () => loadIntoJOSM(osmPatchFiles),
    },
    {
      key: 'iD',
      icon: ICONS.iD,
      title: $('ImportStep.upload_via', { editor: 'iD' }),
      subtitle: allAtOnce,
      onClick: () => {
        throw new Error('not supported yet');
      },
    },
    {
      key: 'osmPatch',
      icon: ICONS.osmPatch,
      title: $('ImportStep.download_osmPatch'),
      subtitle: merged,
      onClick: () => downloadMergedOsmPatch(osmPatchFiles),
    },
    {
      key: 'osmPatch-separate',
      icon: ICONS.osmPatch,
      title: $('ImportStep.download_osmPatch'),
      subtitle: separate,
      hidden: count === 1,
      onClick: () => downloadSeparateOsmPatches(osmPatchFiles),
    },
    {
      key: 'osmChange',
      icon: ICONS.osmChange,
      title: $('ImportStep.download_osmChange'),
      subtitle: merged,
      onClick: () => downloadMergedOsmChange(osmPatchFiles),
    },
    {
      key: 'osmChange-separate',
      icon: ICONS.osmChange,
      title: $('ImportStep.download_osmChange'),
      subtitle: separate,
      hidden: count === 1,
      onClick: () => downloadSeparateOsmChangeFiles(osmPatchFiles),
    },
  ];

  return (
    <Stack p="md">
      {!!error && (
        <Alert
          variant="light"
          color="red"
          icon={<IconAlertTriangle />}
          title={$('ReviewModal.error')}
          withCloseButton
          onClose={() => setError(undefined)}
        >
          {`${error}`}
        </Alert>
      )}
      {!!instructions.size && (
        <Alert
          variant="light"
          icon={<IconInfoCircle />}
          title={$('ImportStep.instructions')}
        >
          <Stack gap="xs">
            {[...instructions].map((text) => (
              <Text key={text} size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {text}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}
      <div>
        <Title order={3}>{$('ImportStep.heading', { featureCount })}</Title>
        <Text component="div" c="dimmed" size="sm">
          {$$(
            'ImportStep.lock_notice',
            { count },
            {
              user: () => (
                <OsmUsername user={user?.display_name ?? ''} fw={700} inherit />
              ),
              avatar: () => (
                <Avatar
                  src={user?.img?.href}
                  name={user?.display_name}
                  size={18}
                  radius="xl"
                  display="inline-flex"
                  style={{ verticalAlign: 'text-bottom' }}
                />
              ),
            },
          )}
        </Text>
      </div>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {options
          .filter((option) => !option.hidden)
          .map(({ key, icon, title, subtitle, disabled, onClick }) => (
            <Button
              key={key}
              variant="default"
              size="xl"
              h={120}
              leftSection={icon}
              disabled={disabled}
              loading={isLoading === key}
              onClick={async () => {
                setIsLoading(key);
                setError(undefined);
                try {
                  await onClick();
                } catch (ex) {
                  console.error(ex);
                  setError(ex);
                  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                }
                setIsLoading(undefined);
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <Text fw={500}>{title}</Text>
                {subtitle && (
                  <Text c="dimmed" size="sm" fw={400}>
                    {subtitle}
                  </Text>
                )}
              </div>
            </Button>
          ))}
      </SimpleGrid>
    </Stack>
  );
};
