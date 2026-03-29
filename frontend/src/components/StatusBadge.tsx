import { Badge } from '@mantine/core';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import type { RunStatus } from '../types';

const STATUS_COLORS: Record<RunStatus, string> = {
  success: 'green',
  failed: 'red',
  running: 'yellow',
};

interface StatusBadgeProps {
  status?: RunStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null;

  const icons = {
    success: <CheckCircle size={12} />,
    failed: <XCircle size={12} />,
    running: <Clock size={12} />,
  };

  return (
    <Badge
      variant="filled"
      color={STATUS_COLORS[status]}
      leftSection={icons[status]}
      size="sm"
    >
      {status}
    </Badge>
  );
}

export { STATUS_COLORS };
