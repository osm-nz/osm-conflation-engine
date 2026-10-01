import { useState } from 'react';
import { importDBFromZip } from 'gtfs-sqlite';
import type { NetworkConfig } from '../../types/config.def.js';

export const ImportNetwork: React.FC<{
  network: NetworkConfig;
  onComplete(): void;
}> = ({ network, onComplete }) => {
  const [error, setError] = useState<unknown>();
  const [progress, setProgress] = useState<importDBFromZip.Progress>();

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      await importDBFromZip({
        zipFile: file,
        databaseName: network.code,
        onProgress: setProgress,
        exclude: ['shapes.txt'],
      });
      onComplete();
    } catch (ex) {
      console.error(ex);
      setError(ex);
    }
    setProgress(undefined);
  }

  if (error) {
    return <>cannot import {`${error}`}</>;
  }

  if (progress) {
    return (
      <>
        Importing: <strong>{progress.message}</strong>
        <br />
        {!!progress.warnings.size && (
          <>
            <h3>Warnings</h3>
            <ul>
              {[...progress.warnings].map((w, index) => (
                // eslint-disable-next-line @eslint-react/no-array-index-key
                <li key={index}>{w}</li>
              ))}
            </ul>
          </>
        )}
        <h3>Files</h3>
        <ul>
          {Object.entries(progress.perFile).map(([file, { done, total }]) => (
            <li key={file}>
              {file}:{' '}
              {total
                ? `${
                    done ? (done === total ? '✅' : '🚧') : '❌'
                  } ${done.toLocaleString()}/${total.toLocaleString()} (${Math.round((done / total) * 100)}%)`
                : 'enqueued'}
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <>
      You need to download the GTFS file for {network.networkName} by going to{' '}
      <a href={network.gtfsSource.url} target="_blank" rel="noreferrer">
        this page on {new URL(network.gtfsSource.url).host}
      </a>
      . Once the file is downloaded, come back to this page and upload it.
      <br />
      <br />
      <input accept="*.zip" type="file" onChange={onChange} />
    </>
  );
};
