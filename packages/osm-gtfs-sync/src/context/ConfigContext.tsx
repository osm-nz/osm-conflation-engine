import {
  type PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import stripJsonComments from 'strip-json-comments';
import { ConfigSchema } from '../types/config.def';
import configFile from './config-temp.json?raw';

// const { isDev } = localStorage;
// const url =
//   isDev
//     ? '/config-temp.json'
//     : 'https://raw.githubusercontent.com/wiki/k-yle/osm-gtfs-sync/Config.md';

export interface IConfigContext {
  config: ConfigSchema;
}

export const ConfigContext = createContext({} as IConfigContext);
ConfigContext.displayName = 'ConfigContext';

export const ConfigWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const [config, setConfig] = useState<ConfigSchema>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    Promise.resolve(configFile)
      .then(stripJsonComments)
      .then(JSON.parse)
      .then(ConfigSchema.parse)
      .then(setConfig)
      .catch(setError);
  }, []);

  const context = useMemo<IConfigContext>(() => {
    return { config: config! };
  }, [config]);

  if (error) {
    return (
      <>
        Failed to load the config file :<pre>{`${error}`}</pre>
      </>
    );
  }

  if (!config) return <>Loading...</>;

  return <ConfigContext value={context}>{children}</ConfigContext>;
};
