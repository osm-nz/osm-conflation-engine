import { useCallback, useState } from 'react';
import { getAllDatabaseNames } from 'gtfs-sqlite';
import { useAsync } from '../../hooks/useAsync.js';
import { CONFIG } from '../../config/_index.ts';
import { ImportNetwork } from './ImportNetwork.js';
import { Execute } from './Execute.js';
import { NetworkNavbar } from './NetworkNavbar.js';

const GtfsApp: React.FC<{ code: string }> = ({ code }) => {
  const [key, setKey] = useState(0);
  const reloadDBList = useCallback(() => setKey((c) => c + 1), []);

  const [databaseNames, error] = useAsync(getAllDatabaseNames, [key]);

  const network = CONFIG.find((n) => n.code === code);

  if (error) return <>DB error</>;

  if (!network) return <>Could not find network “{code}”</>;

  if (!databaseNames) return <>Loading...</>;

  const isImported = databaseNames.includes(network.code);

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

export default GtfsApp;
