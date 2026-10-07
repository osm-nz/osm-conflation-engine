import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { Text } from '@mantine/core';
import { useParams } from 'react-router';
import { type OsmPatch, authReady } from 'osm-api';
import { useProject } from '../../hooks/useProject.js';
import { FullPageLoading } from '../../components/FullPageLoading.js';
import { AuthGateway } from '../../components/AuthGateway.js';
import { PageNotFound } from '../../components/PageNotFound.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import { toggle } from '../../util/object.js';
import { type Lock, getLocks } from '../../api/conflation.js';
import type { DatasetRow } from './SelectDatasetsStep/datasetColumns.js';
import {
  getFeatureId,
  toFeatureRows,
} from './SelectFeaturesStep/featureColumns.js';
import { Steps } from './Steps.js';
import { SelectDatasetsStep } from './SelectDatasetsStep/SelectDatasetsStep.js';
import { SelectFeaturesStep } from './SelectFeaturesStep/SelectFeaturesStep.js';
import { ImportStep } from './ImportStep/ImportStep.js';
import { useOsmPatchFiles } from './useOsmPatchFiles.js';
import classes from './ProjectPage.module.css';
import { IframePage } from './IframePage.js';

const ProjectPageInner: React.FC<{ refTag: string }> = ({ refTag }) => {
  const { $ } = use(LocaleContext);
  const { indexFile, notFound } = useProject();

  const [step, setStep] = useState(0);

  //
  // step 1:
  //
  const [selectedDatasetTitles, setSelectedDatasetTitles] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [hiddenDatasetTitles, setHiddenDatasetTitles] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const [locks, setLocks] = useState<Record<string, Lock>>({});
  const [showLockedDatasets, setShowLockedDatasets] = useState(false);

  useEffect(() => {
    authReady
      .then(() => getLocks(refTag))
      .then((list) => {
        setLocks(
          Object.fromEntries(list.map((lock) => [lock.datasetId, lock])),
        );
      })
      .catch(console.error);
  }, [refTag]);

  const allDatasets = useMemo(
    () =>
      (indexFile?.features || []).map((feature): DatasetRow => ({
        ...feature.properties,
        original: feature,
        lock: locks[feature.properties.id],
      })),
    [indexFile, locks],
  );
  const visibleDatasets = useMemo(() => {
    return allDatasets.filter(
      (row) =>
        !hiddenDatasetTitles.has(row.title) &&
        (showLockedDatasets || !row.lock),
    );
  }, [allDatasets, hiddenDatasetTitles, showLockedDatasets]);

  const selectedDatasets = useMemo(
    () => allDatasets.filter((row) => selectedDatasetTitles.has(row.title)),
    [allDatasets, selectedDatasetTitles],
  );

  //
  // step 2:
  //
  const [deselectedFeatureIds, setDeselectedFeatureIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const osmPatchFiles = useOsmPatchFiles(refTag, selectedDatasets, step > 0);

  const featureRows = useMemo(
    () =>
      selectedDatasets.flatMap((row) => {
        const features = osmPatchFiles.data[row.title]?.features;
        return features ? toFeatureRows(row.title, features) : [];
      }),
    [selectedDatasets, osmPatchFiles.data],
  );

  const selectedFeatureIds = useMemo(() => {
    return new Set(
      featureRows
        .map((row) => row.id)
        .filter((id) => !deselectedFeatureIds.has(id)),
    );
  }, [featureRows, deselectedFeatureIds]);

  const setSelectedFeatureIds = useCallback(
    (next: ReadonlySet<string>) =>
      setDeselectedFeatureIds((current) => {
        const result = new Set(current);
        for (const row of featureRows) {
          if (next.has(row.id)) result.delete(row.id);
          else result.add(row.id);
        }
        return result;
      }),
    [featureRows],
  );

  //
  // step 3:
  //
  const selectedOsmPatchFiles = useMemo(() => {
    const result: Record<string, OsmPatch> = {};
    for (const { title } of selectedDatasets) {
      const osmPatch = osmPatchFiles.data[title];
      if (!osmPatch) continue;

      const features = osmPatch.features.filter(
        (_, index) => !deselectedFeatureIds.has(getFeatureId(title, index)),
      );
      if (features.length) {
        result[title] = { ...osmPatch, features };
      }
    }
    return result;
  }, [selectedDatasets, osmPatchFiles.data, deselectedFeatureIds]);

  const selectedDatasetIds = useMemo(() => {
    return selectedDatasets
      .filter((row) => row.title in selectedOsmPatchFiles)
      .map((row) => row.id);
  }, [selectedDatasets, selectedOsmPatchFiles]);

  //
  // other
  //

  const toggleDataset = useCallback((title: string) => {
    setSelectedDatasetTitles((current) => toggle(current, title));
  }, []);

  const hideDataset = useCallback((title: string) => {
    setHiddenDatasetTitles((current) => new Set(current).add(title));
    setSelectedDatasetTitles((current) => {
      const next = new Set(current);
      next.delete(title);
      return next;
    });
  }, []);

  const toggleFeature = useCallback((id: string) => {
    setDeselectedFeatureIds((current) => toggle(current, id));
  }, []);

  if (notFound) return <PageNotFound />;
  if (!indexFile) return <FullPageLoading />;

  return (
    <div className={classes.page}>
      <Steps
        step={step}
        setStep={setStep}
        datasetCount={selectedDatasets.length}
        datasetFeatureCount={selectedDatasets.reduce(
          (total, row) => total + row.totalCount,
          0,
        )}
        selectedFeatureCount={selectedFeatureIds.size}
      />

      {!allDatasets.length && (
        <Text c="dimmed" p="md">
          {$('Common.no_data')}
        </Text>
      )}

      {!!allDatasets.length &&
        [
          <SelectDatasetsStep
            key={0}
            rows={visibleDatasets}
            refTag={refTag}
            selected={selectedDatasetTitles}
            onChangeSelected={setSelectedDatasetTitles}
            hiddenCount={allDatasets.length - visibleDatasets.length}
            onShowHidden={() => {
              setHiddenDatasetTitles(new Set());
              setShowLockedDatasets(true);
            }}
            onToggle={toggleDataset}
            onHide={hideDataset}
          />,
          <SelectFeaturesStep
            key={0}
            rows={featureRows}
            selected={selectedFeatureIds}
            onChangeSelected={setSelectedFeatureIds}
            onToggle={toggleFeature}
            pending={osmPatchFiles.pending}
            errors={osmPatchFiles.errors}
          />,
          <AuthGateway key={0}>
            <ImportStep
              refTag={refTag}
              osmPatchFiles={selectedOsmPatchFiles}
              datasetIds={selectedDatasetIds}
            />
          </AuthGateway>,
        ][step]}
    </div>
  );
};

export const ProjectPage: React.FC = () => {
  const { refTag } = useParams<'refTag'>();

  if (refTag?.startsWith('::')) {
    return <IframePage refTag={refTag} />;
  }

  return <ProjectPageInner key={refTag} refTag={refTag!} />; // hack
};
