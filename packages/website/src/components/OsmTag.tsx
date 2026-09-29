import { Anchor, type AnchorProps, Code } from '@mantine/core';
import { TAG2LINK } from '../api/tag2link.js';
import classes from './OsmTag.module.css';

export const OsmTag: React.FC<
  { tag: string; hideKey?: boolean } & AnchorProps
> = ({ tag, hideKey, ...props }) => {
  const [key, value] = tag.split('=');

  const values = value?.split(';');

  return (
    <span className={classes.osmTag}>
      <Anchor
        href={`https://osm.wiki/Key:${key}`}
        target="_blank"
        rel="noopener"
        {...props}
        style={{ color: 'var(--mantine-color-pink-7)', ...props.style }}
      >
        <Code c="inherit">{hideKey ? '' : `${key}=`}</Code>
      </Anchor>
      {values?.length ? (
        values.flatMap((v, i) => {
          const link =
            TAG2LINK[key!]?.replaceAll('$1', v) ||
            (v.startsWith('https://') && v);

          const child = link ? (
            <Anchor
              // eslint-disable-next-line @eslint-react/no-array-index-key -- stable
              key={v + i}
              href={link}
              target="_blank"
              rel="noopener"
              {...props}
            >
              <Code c="inherit">{v}</Code>
            </Anchor>
          ) : (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- stable
            <Code key={v + i} c="inherit">
              {v}
            </Code>
          );
          return [!!i && ';', child];
        })
      ) : (
        <Code c="inherit">*</Code>
      )}
    </span>
  );
};
