import { Anchor, type AnchorProps } from '@mantine/core';

export const OsmUsername: React.FC<{ user: string } & AnchorProps> = ({
  user,
  ...props
}) => (
  <Anchor
    {...props}
    href={`https://osm.org/user/${user}`}
    target="_blank"
    rel="noopener"
  >
    {user}
  </Anchor>
);
