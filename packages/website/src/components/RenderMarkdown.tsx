import { Anchor } from '@mantine/core';
import Markdown from 'react-markdown';

const Link: React.FC<React.ComponentProps<'a'>> = (props) => {
  return <Anchor href={props.href} target="_blank" rel="noopener" {...props} />;
};

export const RenderMarkdown: React.FC<{ text: string }> = ({ text }) => {
  return <Markdown components={{ a: Link }}>{text}</Markdown>;
};
