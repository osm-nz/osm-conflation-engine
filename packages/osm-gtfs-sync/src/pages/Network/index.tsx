import { use, useCallback, useState } from 'react';
import { useParams } from 'react-router';
import { getAllDatabaseNames } from 'gtfs-sqlite';
import { ConfigContext } from '../../context/ConfigContext';
import { useAsync } from '../../hooks/useAsync';
import { ImportNetwork } from './ImportNetwork';
import { Execute } from './Execute';
import { NetworkNavbar } from './NetworkNavbar';

export const Network: React.FC = () => {
  const { qId } = useParams();
  const { config } = use(ConfigContext);

  const [key, setKey] = useState(0);
  const reloadDBList = useCallback(() => setKey((c) => c + 1), []);

  const [databaseNames, error] = useAsync(getAllDatabaseNames, [key]);

  const network = config.networks.find((n) => n.networkWikidata === qId);

  if (error) return <>DB error</>;

  if (!network) return <>Could not find network “{network}”</>;

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
