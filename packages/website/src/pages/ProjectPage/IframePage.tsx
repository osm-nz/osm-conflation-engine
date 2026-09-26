import { PageNotFound } from '../../components/PageNotFound.js';
import classes from './IframePage.module.css';

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

  return <PageNotFound />;
};
