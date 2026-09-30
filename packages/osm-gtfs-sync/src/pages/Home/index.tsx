import { use } from 'react';
import { Link } from 'react-router';
import { ConfigContext } from '../../context/ConfigContext';
import { getLogo, useNsi } from '../../hooks/useNsi';

export const Home: React.FC = () => {
  const { config } = use(ConfigContext);
  const [nsi] = useNsi();

  const grouped = Object.entries(
    Object.groupBy(config.networks, (network) => network.code.split('-')[0]),
  );

  return (
    <>
      Hi
      <ul>
        {grouped.map(([group, networks]) => {
          return (
            <li key={group}>
              {group}
              <ul>
                {networks!.map((network) => {
                  const nsiItem = nsi?.wikidata[network.networkWikidata];
                  return (
                    <li key={network.networkName}>
                      {nsiItem?.logos && (
                        <img
                          src={getLogo(nsiItem.logos)}
                          alt=""
                          crossOrigin="anonymous"
                          style={{ width: 20 }}
                        />
                      )}
                      <Link to={`/network/${network.networkWikidata}`}>
                        {nsiItem?.label || network.networkName}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </>
  );
};
