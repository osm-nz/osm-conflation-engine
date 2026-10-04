import { lazy, use } from 'react';
import { Button, Center } from '@mantine/core';
import { IconLogin } from '@tabler/icons-react';
import { PageNotFound } from '../../components/PageNotFound.js';
import { AuthContext } from '../../context/AuthContext.js';
import { LocaleContext } from '../../context/LocaleContext.js';
import fullPageClasses from '../../components/FullPage.module.css';
import classes from './IframePage.module.css';

const LazyGtfsApp = lazy(() => import('@osm-conflation-engine/osm-gtfs-sync'));

/** temporary solution until we migrate all the old websites into the new system */
export const IframePage: React.FC<{ refTag: string }> = ({ refTag }) => {
  const { user, login } = use(AuthContext);
  const { $, $$ } = use(LocaleContext);
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
    if (!user) {
      return (
        <Center className={fullPageClasses.fullPage}>
          <Button onClick={login} leftSection={<IconLogin size={18} />}>
            {$('AuthContext.login')}
          </Button>
        </Center>
      );
    }
    return (
      <LazyGtfsApp code={id!} username={user.display_name} $={$} $$={$$} />
    );
  }

  return <PageNotFound />;
};
