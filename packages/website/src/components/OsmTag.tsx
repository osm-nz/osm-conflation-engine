import { Anchor, type AnchorProps, Code } from '@mantine/core';

export const OsmTag: React.FC<{ tag: string } & AnchorProps> = ({
  tag,
  ...props
}) => {
  const isKey = !tag.includes('=');
  return (
    <Anchor
      href={`https://osm.wiki/${isKey ? 'Key' : 'Tag'}:${tag}`}
      target="_blank"
      rel="noopener"
      {...props}
      style={{ color: 'var(--mantine-color-pink-7)', ...props.style }}
    >
      <Code c="inherit">{isKey ? `${tag}=*` : tag}</Code>
    </Anchor>
  );
};
