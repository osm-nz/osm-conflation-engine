import { Badge, type BadgeProps } from '@mantine/core';

export const RegionBadge: React.FC<
  { region: string; regionFlag: string | null } & BadgeProps
> = ({ region, regionFlag, ...props }) => {
  return (
    <Badge
      color="cyan"
      leftSection={
        regionFlag && <img src={regionFlag} alt="flag" style={{ width: 20 }} />
      }
      {...props}
    >
      {region}
    </Badge>
  );
};
