import { StrictMode } from 'react';
import { RouterProvider, createHashRouter } from 'react-router';
import { ConfigWrapper } from './context/ConfigContext';
import { Home } from './pages/Home';
import { Network } from './pages/Network';
import { CoepGateway } from './context/CoepGateway';

const router = createHashRouter([
  { path: '/', Component: Home },
  { path: '/network/:qId', Component: Network },
]);

export const App: React.FC = () => (
  <StrictMode>
    <ConfigWrapper>
      <CoepGateway>
        <RouterProvider router={router} />
      </CoepGateway>
    </ConfigWrapper>
  </StrictMode>
);
