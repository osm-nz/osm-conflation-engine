import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAllDatabaseNames } from 'gtfs-sqlite';
import type { OsmPatch } from 'osm-api';
import { useAsync } from '../../hooks/useAsync.js';
import { CONFIG } from '../../config/_index.ts';
import { type ConflationResult, conflate } from '../../conflate/index.js';
import { type OsmSource, clearOsmCache } from '../../api/osm.js';
import { HostContext } from '../../context/HostContext.js';
import type { IHostContext } from '../../types/host.def.js';
import { ErrorMessage } from '../../components/ErrorMessage.js';
import { FullPageSpinner } from '../../components/FullPageSpinner.js';
import { ImportNetwork } from './ImportNetwork.js';
import { DownloadFromOsm } from './DownloadFromOsm.js';
import { Conflating } from './Conflating.js';
import { Review } from './Review.js';
import { Step, Steps } from './Steps.js';
import classes from './Steps.module.css';

export type PatchFiles = Record<string, OsmPatch>;
export type ImportStep = React.FC<{ osmPatchFiles: PatchFiles }>;

type Props = {
  code: string;
  ImportStep: ImportStep;
};

const Network: React.FC<Props> = ({ code, ImportStep }) => {
  const { $ } = use(HostContext);
  const [key, setKey] = useState(0);
  const reloadDBList = useCallback(() => setKey((c) => c + 1), []);

  const [databaseNames, dbError] = useAsync(getAllDatabaseNames, [key]);

  const network = CONFIG.find((n) => n.code === code);
  const isImported = !!network && !!databaseNames?.includes(network.code);

  /** undefined until the user picks a step, or we know if the DB exists */
  const [chosenStep, setChosenStep] = useState<Step>();
  const [storeResults, setStoreResults] = useState(true);
  const [result, setResult] = useState<ConflationResult>();
  const [patchFiles, setPatchFiles] = useState<PatchFiles>();
  const [error, setError] = useState<unknown>();
  const abortRef = useRef<AbortController>(undefined);

  useEffect(() => () => abortRef.current?.abort(), []);

  const onSelectPatchFiles = useCallback((newPatchFiles: PatchFiles) => {
    setPatchFiles(newPatchFiles);
    setChosenStep(Step.Upload);
  }, []);

  if (dbError) {
    return (
      <ErrorMessage
        title={$('gtfs.Network.db_error')}
        error={dbError}
        onRetry={reloadDBList}
      />
    );
  }

  if (!network) {
    return <ErrorMessage title={$('gtfs.Network.not_found', { code })} />;
  }

  if (!databaseNames) return <FullPageSpinner />;

  const step = chosenStep ?? (isImported ? Step.Download : Step.Import);
  const isReviewAvailable = isImported && step !== Step.Conflate && !!result;
  const isUploadAvailable = isReviewAvailable && !!patchFiles;

  function setStep(newStep: Step) {
    if (step === Step.Conflate) {
      // leaving the loading state cancels the conflation
      abortRef.current?.abort();
      setResult(undefined);
      setPatchFiles(undefined);
      setError(undefined);
    }
    setChosenStep(newStep);
  }

  async function startConflation(source: OsmSource | undefined) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setResult(undefined);
    setPatchFiles(undefined);
    setError(undefined);
    setChosenStep(Step.Conflate);

    try {
      if (source) await clearOsmCache(network!.code);
      await conflate(
        network!,
        (progress) => signal.aborted || setResult(progress),
        signal,
        source || 'overpass',
        storeResults && !!source, // don't reupload results if using cache
      );
      if (!signal.aborted) setChosenStep(Step.Review);
    } catch (ex) {
      console.error(ex);
      if (!signal.aborted) setError(ex);
    }
  }

  return (
    <div className={classes.page}>
      <Steps
        step={step}
        setStep={setStep}
        isImported={isImported}
        isReviewAvailable={isReviewAvailable}
        isUploadAvailable={isUploadAvailable}
      />
      {step === Step.Import && (
        <ImportNetwork
          network={network}
          onComplete={() => {
            setResult(undefined);
            setPatchFiles(undefined);
            setChosenStep(Step.Download);
            reloadDBList();
          }}
        />
      )}
      {step === Step.Download && (
        <DownloadFromOsm
          network={network}
          storeResults={storeResults}
          setStoreResults={setStoreResults}
          onStart={startConflation}
        />
      )}
      {step === Step.Conflate && (
        <Conflating message={result?.message} error={error} />
      )}
      {step === Step.Review && result && (
        <Review
          network={network}
          result={result}
          onSelect={onSelectPatchFiles}
        />
      )}
      {step === Step.Upload && patchFiles && (
        <ImportStep osmPatchFiles={patchFiles} />
      )}
    </div>
  );
};

const GtfsApp: React.FC<Props & IHostContext> = ({
  $,
  $$,
  username,
  ...props
}) => {
  const host = useMemo(() => ({ $, $$, username }), [$, $$, username]);

  return (
    <HostContext value={host}>
      <Network {...props} />
    </HostContext>
  );
};

export default GtfsApp;
