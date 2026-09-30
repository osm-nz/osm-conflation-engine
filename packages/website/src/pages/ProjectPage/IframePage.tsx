import { lazy } from 'react';
import { PageNotFound } from '../../components/PageNotFound.js';
import classes from './IframePage.module.css';

const LazyGtfsApp = lazy(() => import('@osm-conflation-engine/osm-gtfs-sync'));

/** temporary solution until we migrate all the old websites into the new system */
export const IframePage: React.FC<{ refTag: string }> = ({ refTag }) => {
  const [, type, id] = refTag!.split('::');

  if (type === 'missing_streets') {
    return (
      <iframe
        src={`https://osm-nz.github.io/missing-streets/?region=${id}`}
        title={id}
        className={classes.iframe}
      />
    );
  }

  if (type === 'gtfs') {
    return <LazyGtfsApp qId={id!} />;
  }

  return <PageNotFound />;
};
