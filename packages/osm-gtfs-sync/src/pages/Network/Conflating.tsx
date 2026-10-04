import { use } from 'react';
import { HostContext } from '../../context/HostContext.js';
import { ErrorMessage } from '../../components/ErrorMessage.js';
import { FullPageSpinner } from '../../components/FullPageSpinner.js';

export const Conflating: React.FC<{
  message: string | undefined;
  error: unknown;
}> = ({ message, error }) => {
  const { $ } = use(HostContext);

  if (error) {
    return <ErrorMessage title={$('gtfs.Conflating.error')} error={error} />;
  }

  return <FullPageSpinner message={message} />;
};
