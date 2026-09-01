//
// copy-pasted from https://github.com/k-yle/osm-simple-route-editor/blob/599d60cb0b58c5c3914d8d6b202131503086f322/src/context/AuthGateway.tsx
//
import {
  type PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useCallback } from 'react';
import { type OsmOwnUser, getUser, isLoggedIn, login, logout } from 'osm-api';
import { Button, LoadingOverlay } from '@mantine/core';
import { FullPageError } from '../components/FullPageError.js';

type IAuthContext = {
  user: OsmOwnUser | undefined;
  login(): void;
  logout(): void;
};
export const AuthContext = createContext<IAuthContext>(undefined!);
AuthContext.displayName = 'AuthContext';

export const AuthWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const [error, setError] = useState<Error>();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<OsmOwnUser>();

  useEffect(() => {
    if (loggedIn) {
      getUser('me')
        .then(setUser)
        .then(() => setIsLoading(false))
        .catch(setError);
    }
  }, [loggedIn]);

  const onClickLogin = useCallback(async () => {
    try {
      await login({
        clientId:
          // the clientId is not confidential, it's alright to define it here
          window.location.hostname === '127.0.0.1'
            ? 'oPbyNuXQIEh8ZI3zbjVWVmVyIaNB2guU6uLP2gQ3sfs'
            : 'ZkRBVnOoBeMgwSajgG7E2bhgP5bR61knGYxsh9KKaHc',
        mode: 'popup',
        redirectUrl:
          window.location.hostname === '127.0.0.1'
            ? 'http://127.0.0.1:4884/osm-conflation-engine/land.html'
            : 'https://osm-nz.github.io/land.html',
        scopes: ['read_prefs', 'write_api'],
      });
      setIsLoading(true);
      setLoggedIn(true);
      setError(undefined);
    } catch (ex) {
      setError(ex as Error);
    }
  }, []);

  const onLogout = useCallback(() => {
    logout();
    setLoggedIn(false);
    setUser(undefined);
    setError(undefined);
  }, []);

  const ctx = useMemo(
    () => ({ user, logout: onLogout, login: onClickLogin }),
    [user, onLogout, onClickLogin],
  );

  if (window.location.hostname === 'localhost') return <>use 127.0.0.1</>;

  if (error) {
    return (
      <FullPageError error={error}>
        Unable to login. <Button onClick={onLogout}>Logout</Button>
      </FullPageError>
    );
  }

  return (
    <AuthContext value={ctx}>
      <LoadingOverlay
        visible={isLoading}
        pos="fixed"
        loaderProps={{ size: 'lg' }}
      />
      {children}
    </AuthContext>
  );
};
