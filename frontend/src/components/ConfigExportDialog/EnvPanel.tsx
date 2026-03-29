import { Stack, Box, Group, Button, Code, CopyButton, ActionIcon, Tooltip } from '@mantine/core';
import { Download, Copy, Check } from 'lucide-react';

interface EnvPanelProps {
  content: string;
  onDownload: (content: string, filename: string) => void;
}

export function EnvPanel({ content, onDownload }: EnvPanelProps) {
  return (
    <Stack gap="sm">
      <Box
        style={{
          backgroundColor: 'var(--color-bg-muted)',
          borderRadius: 8,
          padding: 16,
          maxHeight: 400,
          overflow: 'auto'
        }}
      >
        <Code block style={{ backgroundColor: 'transparent', whiteSpace: 'pre-wrap' }}>
          {content || '# No configuration set'}
        </Code>
      </Box>
      <Group justify="flex-end">
        <CopyButton value={content}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'}>
              <ActionIcon
                variant="subtle"
                color={copied ? 'green' : 'gray'}
                onClick={copy}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
        <Button
          variant="secondary"
          size="xs"
          leftSection={<Download size={14} />}
          onClick={() => onDownload(content, '.env')}
        >
          Download .env
        </Button>
      </Group>
    </Stack>
  );
}