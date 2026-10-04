import { use } from 'react';
import { Badge, type BadgeProps } from '@mantine/core';
import { LocaleContext, WORLDWIDE } from '../context/LocaleContext.js';

export const RegionBadge: React.FC<
  { region: string; regionFlag: string | undefined } & BadgeProps
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
      {region === WORLDWIDE ? `🌏 ${$('RegionBadge.global')}` : region}
    </Badge>
  );
};
