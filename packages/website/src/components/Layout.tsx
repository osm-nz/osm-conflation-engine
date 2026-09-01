import { Outlet } from 'react-router';
import { AppShell } from '@mantine/core';
import { Navbar } from './Navbar.js';

export const Layout: React.FC = () => {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Navbar />
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};
