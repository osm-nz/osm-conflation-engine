import { useParams } from 'react-router';
import { App } from '@osm-conflation-engine/osm-gtfs-sync';

export const Component: React.FC = () => {
  const { qId } = useParams<'qId'>();

  return <App qId={qId!} />;
};
