import { use, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CheckIcon, type ComboboxItem, Group, Select } from '@mantine/core';
import { DataContext } from '../context/DataContext.js';
import { RegionBadge } from './RegionBadge.js';

interface ProjectOption extends ComboboxItem {
  region: string;
  regionFlag: string | null;
}

export const NavbarProjectSelector: React.FC = () => {
  const { allProjects } = use(DataContext);
  const { refTag } = useParams<'refTag'>();
  const navigate = useNavigate();

  const options = useMemo<ProjectOption[]>(
    () =>
      allProjects.map((project) => ({
        value: project.refTag,
        label: project.metrics.config.metadata.name,
        region: project.metrics.config.metadata.region,
        regionFlag: project.regionFlagImage,
      })),
    [allProjects],
  );

  return (
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
      placeholder="Select a project"
      size="xs"
      w={260}
      searchable
      allowDeselect={false}
    />
  );
};
