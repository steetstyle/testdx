import { Stack, Box, Group, Button, Code, Select, Text, CopyButton, ActionIcon, Tooltip } from '@mantine/core';
import { Download, Copy, Check } from 'lucide-react';
import type { CodeLanguage } from '../../services/configGenerator';

const languageOptions = [
  { value: 'node', label: 'Node.js' },
  { value: 'go', label: 'Go' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
];

interface CodePanelProps {
  content: string;
  language: CodeLanguage;
  onLanguageChange: (language: CodeLanguage) => void;
  onDownload: (content: string, filename: string) => void;
}

export function CodePanel({ content, language, onLanguageChange, onDownload }: CodePanelProps) {
  const extension = language === 'python' ? 'py' : language;

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          SDK initialization code
        </Text>
        <Select
          size="xs"
          w={120}
          data={languageOptions}
          value={language}
          onChange={(val) => onLanguageChange(val as CodeLanguage)}
        />
      </Group>
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
          {content}
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
          onClick={() => onDownload(content, `otel-config.${extension}`)}
        >
          Download Code
        </Button>
      </Group>
    </Stack>
  );
}