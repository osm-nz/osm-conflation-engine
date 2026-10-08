import { lazy, use } from 'react';
import { AuthGateway } from '../../components/AuthGateway.js';
import { PageNotFound } from '../../components/PageNotFound.js';
import { AuthContext } from '../../context/AuthContext.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import fullPageClasses from '../../components/FullPage.module.css';
import classes from './IframePage.module.css';
import { ImportStep } from './ImportStep/ImportStep.js';

const LazyGtfsApp = lazy(() => import('@osm-conflation-engine/osm-gtfs-sync'));

const GtfsPage: React.FC<{ code: string }> = ({ code }) => {
  const { user } = use(AuthContext);
  const { $, $$ } = use(LocaleContext);

  return (
    <LazyGtfsApp
      code={code}
      username={user!.display_name}
      $={$}
      $$={$$}
      ImportStep={ImportStep}
    />
  );
};

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
    return (
      <AuthGateway className={fullPageClasses.fullPage}>
        <GtfsPage code={id!} />
      </AuthGateway>
    );
  }

  return <PageNotFound />;
};
