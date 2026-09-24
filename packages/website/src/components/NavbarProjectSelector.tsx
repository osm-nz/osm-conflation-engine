import { use, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CheckIcon, type ComboboxItem, Group, Select } from '@mantine/core';
import { DataContext } from '../context/DataContext.js';
import { LocaleContext } from '../context/LocaleContext.js';
import { useProject } from '../hooks/useProject.js';
import { RegionBadge } from './RegionBadge.js';
import { OidcBadge } from './OidcBadge.js';

interface ProjectOption extends ComboboxItem {
  region: string;
  regionFlag: string | null;
}

export const NavbarProjectSelector: React.FC = () => {
  const { $ } = use(LocaleContext);
  const { refTag } = useParams<'refTag'>();
  const navigate = useNavigate();

  const { allProjects } = use(DataContext);
  const project = useProject();

  const options = useMemo<ProjectOption[]>(
    () =>
      allProjects.map((p) => ({
        value: p.refTag,
        label: p.metrics.config.metadata.name,
        region: p.metrics.config.metadata.region,
        regionFlag: p.regionFlagImage,
      })),
    [allProjects],
  );

  return (
    <>
      <Select
        data={options}
        value={refTag}
        onChange={(value) => value && navigate(`/project/${value}`)}
        renderOption={({ option, checked }) => {
          const { region, regionFlag } = option as ProjectOption;
          return (
            <Group gap="xs" wrap="nowrap" flex={1}>
              <span>{option.label}</span>
              <RegionBadge
                region={region}
                regionFlag={regionFlag}
                size="xs"
                ml="auto"
              />
              {checked && <CheckIcon size={12} />}
            </Group>
          );
        }}
        placeholder={$('NavbarProjectSelector.select')}
        size="xs"
        w={260}
        searchable
        allowDeselect={false}
      />
      {project.project && (
        <OidcBadge
          operator={project.project.operator}
          timestamp={project.project.timestamp}
        />
      )}
    </>
  );
};
