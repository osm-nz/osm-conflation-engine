import { getLogo, useNsi } from '../../hooks/useNsi.js';
import type { NetworkConfig } from '../../types/config.def.js';

export const NetworkNavbar: React.FC<{
  network: NetworkConfig;
}> = ({ network }) => {
  const [nsi] = useNsi();

  const nsiItem = nsi?.wikidata[network.networkWikidata];

  return (
    <header>
      {nsiItem ? (
        <>
          {nsiItem.logos && (
            <img
              src={getLogo(nsiItem.logos)}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 20 }}
            />
          )}
          <a
            href={`https://wikidata.org/wiki/${network.networkWikidata}`}
            target="_blank"
          >
            {nsiItem.label}
          </a>
          {' | '}
          <code>{network.code}</code>
        </>
      ) : (
        <>
          <a
            href={`https://wikidata.org/wiki/${network.networkWikidata}`}
            target="_blank"
          >
            {network.networkName}
          </a>
          {' | '}
          <strong>No entry in NSI, consider creating one first</strong>
        </>
      )}
      <hr />
    </header>
  );
};
