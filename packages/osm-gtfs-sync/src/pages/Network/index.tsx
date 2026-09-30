import { useCallback, useState } from 'react';
import { getAllDatabaseNames } from 'gtfs-sqlite';
import { useAsync } from '../../hooks/useAsync.js';
import { config } from '../../config/config.ts';
import { ImportNetwork } from './ImportNetwork.js';
import { Execute } from './Execute.js';
import { NetworkNavbar } from './NetworkNavbar.js';

export const App: React.FC<{ qId: string }> = ({ qId }) => {
  const [key, setKey] = useState(0);
  const reloadDBList = useCallback(() => setKey((c) => c + 1), []);

  const [databaseNames, error] = useAsync(getAllDatabaseNames, [key]);

  const network = config.networks.find((n) => n.networkWikidata === qId);

  if (error) return <>DB error</>;

  if (!network) return <>Could not find network “{qId}”</>;

  if (!databaseNames) return <>Loading...</>;

  const isImported = databaseNames.includes(network.networkWikidata);

  if (!isImported) {
    return (
      <>
        <NetworkNavbar network={network} />
        <ImportNetwork network={network} onComplete={reloadDBList} />
      </>
    );
  }

  return (
    <>
      <NetworkNavbar network={network} />
      <Execute network={network} reloadDBList={reloadDBList} />
    </>
  );
};
