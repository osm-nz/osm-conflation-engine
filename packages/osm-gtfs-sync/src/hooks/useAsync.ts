import { useEffect, useState } from 'react';

export function useAsync<T>(
  getData: () => Promise<T>,
  deps: (string | number)[],
) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Promise.resolve()
      .then(() => {
        setIsLoading(true);
        setError(undefined);
      })
      .then(getData)
      .then(setData)
      .catch(setError)
      .then(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps -- itentional, enforced by eslint in the consumers
  }, deps);

  return <const>[data, error, isLoading];
}
