import { use, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  Anchor,
  Breadcrumbs,
  CheckIcon,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { FullPageLoading } from '../components/FullPageLoading.js';
import { FullPageError } from '../components/FullPageError.js';
import { PageNotFound } from '../components/PageNotFound.js';
import { RenderMarkdown } from '../components/RenderMarkdown.js';
import { useProject } from '../hooks/useProject.js';
import { LocaleContext } from '../context/LocaleContext.js';
import { fetchStaticFile } from '../api/static.js';

export const ReportDetailsPage: React.FC = () => {
  const { $ } = use(LocaleContext);
  const { fileName } = useParams<'fileName'>();
  const { project, indexFile, notFound } = useProject();

  const [report, setReport] = useState<string>();
  const [error, setError] = useState<unknown>();

  const isValidFile = !!fileName && !!indexFile?.__reports.includes(fileName);

  useEffect(() => {
    if (!project || !fileName || !isValidFile) return;

    setReport(undefined);
    setError(undefined);
    fetchStaticFile<string>(project.refTag, fileName, true)
      .then(setReport)
      .catch(setError);
  }, [project, fileName, isValidFile]);

  if (notFound || !isValidFile) return <PageNotFound />;
  if (!project || !indexFile) return <FullPageLoading />;

  if (error) {
    return (
      <FullPageError error={error}>
        {$('ProjectPage.download_error')}
      </FullPageError>
    );
  }

  return (
    <Stack gap="sm" p="md">
      <Breadcrumbs>
        <Anchor component={Link} to={`/project/${project.refTag}/reports`}>
          {$('Common.reports')}
        </Anchor>
        <Menu position="bottom-start">
          <Menu.Target>
            <UnstyledButton>
              <Group gap={4} wrap="nowrap">
                <Text>{fileName}</Text>
                <IconChevronDown size={16} />
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            {indexFile.__reports.map((otherFileName) => (
              <Menu.Item
                key={otherFileName}
                component={Link}
                to={`/project/${project.refTag}/reports/${otherFileName}`}
                rightSection={
                  otherFileName === fileName && <CheckIcon size={12} />
                }
              >
                {otherFileName}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </Breadcrumbs>
      {report ? (
        <RenderMarkdown
          text={report.length > 500_000 ? '_file too large_' : report}
        />
      ) : (
        <FullPageLoading />
      )}
    </Stack>
  );
};
