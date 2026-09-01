import { Avatar, Badge, type BadgeProps } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import type { Operator } from '../util/conflation.js';

export const SOURCE_CODE_PROVIDER_INFO: Record<
  Operator['provider'],
  {
    brandName: string;
    icon: React.ReactNode;
    oidcExplainer: string;
    profileUrl: string;
    profilePicUrl: string;
  }
> = {
  'github.com': {
    brandName: 'GitHub Actions',
    icon: <IconBrandGithub size={12} />,
    oidcExplainer:
      'https://docs.github.com/en/actions/concepts/security/openid-connect',
    profileUrl: 'https://github.com/$1',
    profilePicUrl: 'https://github.com/$1.png?size=40',
  },
};

export const SourceCodeLink: React.FC<
  {
    provider: Operator['provider'];
    showProfilePic?: boolean;
    org: string;
    repo?: string;
  } & BadgeProps
> = ({ provider, org, repo, showProfilePic = true, ...props }) => {
  const { icon, profilePicUrl } = SOURCE_CODE_PROVIDER_INFO[provider];
  return (
    <Badge
      variant="default"
      color="blue"
      size="xs"
      leftSection={
        showProfilePic ? (
          <Avatar
            src={profilePicUrl.replace('$1', org)}
            name={org}
            size={12}
            alt=""
          />
        ) : (
          icon
        )
      }
      component="a"
      href={`https://${provider}/${org}/${repo || ''}`}
      target="_blank"
      rel="noopener"
      {...props}
      style={{ cursor: 'pointer', ...props.style }}
    >
      {repo ? `${org}/${repo}` : `@${org}`}
    </Badge>
  );
};
