import { use } from 'react';
import { Link } from 'react-router';
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Flex,
  Group,
  Image,
  Stack,
  Text,
} from '@mantine/core';
import { IconExternalLink, IconPlus } from '@tabler/icons-react';
import TimeAgo from 'react-timeago-i18n';
import { LocaleContext } from '../context/LocaleContext.js';
import { DataContext, type HomePageItem } from '../context/DataContext.js';
import { OverallProgress } from '../components/OverallProgress.js';
import { RegionBadge } from '../components/RegionBadge.js';
import { OidcBadge } from '../components/OidcBadge.js';
import { OsmTag } from '../components/OsmTag.js';
import classes from './HomePage.module.css';

const HomePageCard: React.FC<HomePageItem> = ({
  count,
  region,
  osmKey,
  to,
  timestamp,
  operator,
  name,
  description,
  metrics,
  wikiPageLink,
  image,
  regionFlag,
}) => {
  const { locale } = use(LocaleContext);
  return (
    <Card
      shadow="sm"
      padding="md"
      withBorder
      w={300}
      maw="100%"
      className={classes.card}
    >
      <Card.Section pos="relative">
        <Image
          src={
            image ||
            'https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg'
          }
          height={160}
          alt="decorative image"
          style={{ filter: 'grayscale(0.9)' }}
        />
        <Group pos="absolute" right="8px" top="8px" gap={4}>
          <Badge color="indigo">
            {count.toLocaleString(locale, {
              notation: 'compact',
              compactDisplay: 'short',
            })}{' '}
            rows
          </Badge>
          <RegionBadge region={region} regionFlag={regionFlag} />
        </Group>

        {osmKey && (
          <OsmTag
            tag={osmKey}
            pos="absolute"
            left={8}
            bottom={8}
            style={{ zIndex: 1 }}
          />
        )}
      </Card.Section>

      <Text fw={500} mt="md" mb="xs">
        <Link
          to={to}
          className={classes.title} // this css maximises the link so it covers the whole card
        >
          {name}
        </Link>{' '}
        <span className={classes.nonclickable}>
          <ActionIcon
            size="sm"
            variant="subtle"
            component="a"
            href={wikiPageLink}
            target="_blank"
            rel="noopener"
          >
            <IconExternalLink size={16} />
          </ActionIcon>
          <OidcBadge operator={operator} timestamp={timestamp} />
        </span>
      </Text>

      <Text size="sm" c="dimmed">
        {description} — Last Updated <TimeAgo date={timestamp} />.
      </Text>
      <Box mt="auto" pt="md">
        <OverallProgress metrics={metrics} />
      </Box>
    </Card>
  );
};

export const HomePage: React.FC = () => {
  const { $ } = use(LocaleContext);
  const { homePageItems } = use(DataContext);
  return (
    <>
      {$('Layer.areas')}

      <Flex wrap="wrap" gap="md" align="stretch">
        {homePageItems.map((p) => (
          <HomePageCard key={p.osmKey + p.name} {...p} />
        ))}
        <Card
          shadow="sm"
          padding="md"
          withBorder
          w={300}
          maw="100%"
          component={Link}
          to="/new"
          className={`${classes.card} ${classes.createNewCard}`}
        >
          <Stack align="center" justify="center" gap="xs" h="100%">
            <IconPlus size={48} stroke={1.5} />
            <Text fw={500}>Create Import Project</Text>
          </Stack>
        </Card>
      </Flex>
    </>
  );
};
