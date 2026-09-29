import { use } from 'react';
import { Link } from 'react-router';
import { Anchor, List, Stack, Text, Title } from '@mantine/core';
import { FullPageLoading } from '../components/FullPageLoading.js';
import { PageNotFound } from '../components/PageNotFound.js';
import { useProject } from '../hooks/useProject.js';
import { LocaleContext } from '../context/LocaleContext.js';

export const ReportListPage: React.FC = () => {
  const { $, $$ } = use(LocaleContext);
  const { project, indexFile, notFound } = useProject();

  if (notFound) return <PageNotFound />;
  if (!project || !indexFile) return <FullPageLoading />;

  return (
    <Stack gap="sm" p="md">
      <Title order={2}>{$('Common.reports')}</Title>
      <Text c="dimmed">
        {$$(
          'ReportListPage.description',
          { import: $('Navbar.import') },
          {
            a: ({ children }) => (
              <Anchor
                component={Link}
                to={`/project/${project.refTag}`}
                inherit
              >
                {children}
              </Anchor>
            ),
          },
        )}
      </Text>
      {indexFile.__reports.length ? (
        <List>
          {indexFile.__reports.map((fileName) => (
            <List.Item key={fileName}>
              <Anchor
                component={Link}
                to={`/project/${project.refTag}/reports/${fileName}`}
              >
                {fileName}
              </Anchor>
            </List.Item>
          ))}
        </List>
      ) : (
        <Text c="dimmed">{$('Common.no_data')}</Text>
      )}
    </Stack>
  );
};
