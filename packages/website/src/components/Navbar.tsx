import { use } from 'react';
import { Link, useMatch, useParams } from 'react-router';
import {
  Anchor,
  Avatar,
  Divider,
  Group,
  Image,
  Menu,
  Text,
} from '@mantine/core';
import {
  IconApi,
  IconBrandGithub,
  IconHelp,
  IconLogin,
  IconLogout,
} from '@tabler/icons-react';
import { AuthContext } from '../context/AuthContext.js';
import { NavbarProjectSelector } from './NavbarProjectSelector.js';

const GITHUB_URL = 'https://github.com/osm-nz/osm-conflation-engine';

/** a navbar link which is highlighted when the current route matches */
const NavItem: React.FC<React.PropsWithChildren<{ to: string }>> = ({
  to,
  children,
}) => {
  const isActive = !!useMatch(to);

  return (
    <Anchor
      component={Link}
      to={to}
      size="sm"
      c={isActive ? undefined : 'dimmed'}
      fw={isActive ? 600 : undefined}
      underline={isActive ? 'always' : 'hover'}
    >
      {children}
    </Anchor>
  );
};

export const Navbar: React.FC = () => {
  const { refTag } = useParams<'refTag'>(); // will be undefined depending on the route
  const { user, login, logout } = use(AuthContext);

  return (
    <Group justify="space-between" h="100%" px="md" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <Anchor component={Link} to="/" c="inherit" underline="never">
          <Group gap="sm" wrap="nowrap">
            <Image
              src="https://osm-nz.github.io/img/logo.png"
              h={28}
              w={28}
              alt=""
            />
            <Text fw={700} size="lg" visibleFrom="xs">
              OSM Conflation Engine
            </Text>
          </Group>
        </Anchor>
        <Group gap="xs" wrap="nowrap" visibleFrom="sm">
          {refTag && (
            <>
              <NavbarProjectSelector />
              <Divider orientation="vertical" />
              <NavItem to={`/project/${refTag}`}>Features</NavItem>
              <Divider orientation="vertical" />
              <NavItem to={`/project/${refTag}/metrics`}>Metrics</NavItem>
              <Divider orientation="vertical" />
              <NavItem to={`/project/${refTag}/warnings`}>Warnings</NavItem>
              <Divider orientation="vertical" />
              <NavItem to={`/project/${refTag}/ignored`}>Ignored</NavItem>
            </>
          )}
        </Group>
      </Group>

      <Menu shadow="md" width={200} position="bottom-end" withArrow>
        <Menu.Target>
          <Avatar
            component="button"
            type="button"
            radius="xl"
            style={{ cursor: 'pointer', border: 'none' }}
            src={user?.img?.href}
            name={user?.display_name}
          />
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            component="a"
            href="https://osm.wiki/Example" // TODO: we need to make a separate wiki page eventually
            target="_blank"
            rel="noopener"
            leftSection={<IconHelp size={20} />}
          >
            Documentation
          </Menu.Item>
          <Menu.Item
            component="a"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener"
            leftSection={<IconBrandGithub size={20} />}
          >
            View source code
          </Menu.Item>
          <Menu.Item
            component="a"
            href="https://osm-conflation-engine.kyle.kiwi/"
            target="_blank"
            rel="noopener"
            leftSection={<IconApi size={20} />}
          >
            API docs
          </Menu.Item>
          <Divider my={4} />
          {user ? (
            <Menu.Item
              onClick={logout}
              color="red"
              leftSection={<IconLogout size={20} />}
            >
              Logout
              <Text size="xs" c="dimmed">
                {user.display_name}
              </Text>
            </Menu.Item>
          ) : (
            <Menu.Item
              onClick={login}
              color="blue"
              leftSection={<IconLogin size={20} />}
            >
              Login
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
};
