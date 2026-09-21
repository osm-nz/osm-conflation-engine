import { use } from 'react';
import { Badge, type BadgeProps } from '@mantine/core';
import { LocaleContext } from '../context/LocaleContext.js';

export const RegionBadge: React.FC<
  { region: string; regionFlag: string | null } & BadgeProps
> = ({ region, regionFlag, ...props }) => {
  const { $ } = use(LocaleContext);

  return (
    <Badge
      color="cyan"
      leftSection={
        regionFlag && (
          <img src={regionFlag} alt={region} style={{ width: 20 }} />
        )
      }
      {...props}
    >
      {region === '001' ? `🌏 ${$('RegionBadge.global')}` : region}
    </Badge>
  );
};
