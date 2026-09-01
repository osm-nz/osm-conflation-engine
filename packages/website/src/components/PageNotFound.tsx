import { use } from 'react';
import { LocaleContext } from '../context/LocaleContext.js';
import { FullPageError } from './FullPageError.js';

export const PageNotFound: React.FC = () => {
  const { $ } = use(LocaleContext);

  return (
    <FullPageError error={undefined}>{$('PageNotFound.message')}</FullPageError>
  );
};
