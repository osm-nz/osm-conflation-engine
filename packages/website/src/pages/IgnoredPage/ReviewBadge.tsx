import { Badge, HoverCard, Stack, Text } from '@mantine/core';
import type { IgnoredRow } from '../../api/conflation.js';
import { ReviewDecision } from './columns.js';

export const ReviewBadge: React.FC<{ row: IgnoredRow }> = ({ row }) => {
  if (row.review_decision === null) return null;

  const isApproved = row.review_decision === ReviewDecision.Approved;
  const badge = (
    <Badge size="xs" variant="light" color={isApproved ? 'green' : 'red'}>
      {isApproved ? 'Approved' : 'Rejected'}
    </Badge>
  );

  if (!row.reviews?.length) return badge;

  return (
    <HoverCard width={280} position="right" shadow="md" withArrow openDelay={0}>
      <HoverCard.Target>
        <Stack gap={0} align="flex-start" style={{ cursor: 'help' }}>
          {badge}
          <Text size="xs" c="dimmed">
            by {row.reviews.map((review) => review.review_username).join(', ')}
          </Text>
        </Stack>
      </HoverCard.Target>

      <HoverCard.Dropdown>
        <Stack gap={2}>
          {row.reviews.map((review) => (
            <Text
              key={review.review_username + review.review_timestamp}
              size="xs"
            >
              {review.review_username}:{' '}
              {review.review_comment || <em>(no comment)</em>}
            </Text>
          ))}
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
};
