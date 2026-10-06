import { use } from 'react';
import type { Tags } from 'osm-api';
import { Anchor, Text } from '@mantine/core';
import { TAG2LINK } from '../api/tag2link.js';
import { LocaleContext } from '../context/LocaleContext.js';
import classes from './TagDiff.module.css';

interface DiffLine {
  type: '+' | '-';
  key: string;
  value: string;
}

export function getTagDiff(tags: Tags, oldTags: Tags | undefined): DiffLine[] {
  const lines: DiffLine[] = [];
  for (const key in tags) {
    const oldValue = oldTags?.[key] || '';
    const newValue = tags[key] === '🗑️' ? '' : tags[key] || '';
    if (oldValue === newValue) continue;

    if (oldValue) lines.push({ type: '-', key, value: oldValue });
    if (newValue) lines.push({ type: '+', key, value: newValue });
  }
  return lines;
}

export const TagDiff: React.FC<{
  tags: Tags;
  oldTags: Tags | undefined;
}> = ({ tags, oldTags }) => {
  const { $$ } = use(LocaleContext);
  const lines = getTagDiff(tags, oldTags);
  if (!lines.length) {
    return (
      <Text size="xs" c="dimmed">
        {$$('TagDiff.no_changes')}
      </Text>
    );
  }

  return (
    <div className={classes.tagDiff}>
      {lines.map((line) => {
        const link =
          TAG2LINK[line.key!]?.replaceAll('$1', line.value) ||
          (line.value.startsWith('https://') && line.value);

        return (
          <div
            key={`${line.type}${line.key}`}
            className={`${classes.line} ${classes[line.type === '+' ? 'added' : 'removed']}`}
          >
            {line.type}{' '}
            <Anchor
              href={`https://osm.wiki/Key:${line.key}`}
              target="_blank"
              rel="noopener"
              inherit
            >
              {line.key}
            </Anchor>
            =
            {link ? (
              <Anchor href={link} target="_blank" rel="noopener" inherit>
                {line.value}
              </Anchor>
            ) : (
              line.value
            )}
          </div>
        );
      })}
    </div>
  );
};
