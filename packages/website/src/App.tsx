import { StrictMode } from 'react';
import { RouterProvider, createHashRouter } from 'react-router';
import { LocaleWrapper } from './context/LocaleContext.js';
import { AuthWrapper } from './context/AuthContext.js';
import { DataWrapper } from './context/DataContext.js';
import { ThemeWrapper } from './context/ThemeContext.js';
import { Layout } from './components/Layout.js';
import { HomePage } from './pages/HomePage.js';
import { ProjectPage } from './pages/ProjectPage/ProjectPage.js';
import { CreateNewProjectPage } from './pages/CreateNewProjectPage.js';
import { WarningsPage } from './pages/WarningsPage.js';
import { IgnoredPage } from './pages/IgnoredPage/IgnoredPage.js';
import { ReportListPage } from './pages/ReportListPage.js';
import { ReportDetailsPage } from './pages/ReportDetailsPage.js';

const router = createHashRouter([
  {
    Component: Layout,
    children: [
      { path: '/', Component: HomePage },
      { path: '/new', Component: CreateNewProjectPage },
      { path: '/project/:refTag', Component: ProjectPage },
      { path: '/project/:refTag/warnings', Component: WarningsPage },
      {
        path: '/project/:refTag/metrics',
        lazy: () => import('./pages/MetricsPage/MetricsPage.js'), // bc of @nivo/*
      },
      { path: '/project/:refTag/ignored', Component: IgnoredPage },
      { path: '/project/:refTag/reports', Component: ReportListPage },
      {
        path: '/project/:refTag/reports/:fileName',
        Component: ReportDetailsPage,
      },
      {
        path: '/network/:qId',
        lazy: () => import('./pages/NetworkPage.js'), // bc of sqlite
      },
    ],
  },
]);

export const App: React.FC = () => {
  return (
    <StrictMode>
      <ThemeWrapper>
        <LocaleWrapper>
          <AuthWrapper>
            <DataWrapper>
              <RouterProvider router={router} />
            </DataWrapper>
          </AuthWrapper>
        </LocaleWrapper>
      </ThemeWrapper>
    </StrictMode>
  );
};
