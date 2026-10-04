import { use } from 'react';
import {
  Anchor,
  Button,
  Checkbox,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { Link } from 'react-router';
import { useAsync } from '../../hooks/useAsync.js';
import { HostContext } from '../../context/HostContext.js';
import { type OsmSource, hasOsmCache } from '../../api/osm.js';
import type { NetworkConfig } from '../../types/config.def.js';

export const DownloadFromOsm: React.FC<{
  network: NetworkConfig;
  storeResults: boolean;
  setStoreResults(storeResults: boolean): void;
  onStart(source: OsmSource | undefined): void;
}> = ({ network, storeResults, setStoreResults, onStart }) => {
  const { $, $$, username } = use(HostContext);
  const [hasCache] = useAsync(() => hasOsmCache(network.code), [network.code]);

  return (
    <Stack>
      <Text>
        {$$('gtfs.DownloadFromOsm.instructions', {
          networkName: network.networkName,
        })}
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Button
          variant="default"
          size="xl"
          h={120}
          onClick={() => onStart('postpass')}
        >
          Postpass
        </Button>
        <Button
          variant="default"
          size="xl"
          h={120}
          onClick={() => onStart('overpass')}
        >
          Overpass
        </Button>
        <Button
          variant="default"
          size="xl"
          h={120}
          disabled={!hasCache}
          onClick={() => onStart(undefined)}
        >
          {$('gtfs.DownloadFromOsm.local_cache')}
        </Button>
      </SimpleGrid>
      <Checkbox
        checked={storeResults}
        onChange={(event) => setStoreResults(event.currentTarget.checked)}
        label={$('gtfs.DownloadFromOsm.store_results.label')}
        description={$$(
          'gtfs.DownloadFromOsm.store_results.description',
          undefined,
          {
            home: ({ children }) => (
              <Anchor component={Link} to="/" target="_blank" inherit>
                {children}
              </Anchor>
            ),
            user: () => (
              <Anchor
                href={`https://osm.org/user/${username}`}
                target="_blank"
                rel="noopener"
                inherit
              >
                {username}
              </Anchor>
            ),
          },
        )}
      />
    </Stack>
  );
};
