import { useState } from 'react';
import { Group, TextInput, Select, Button } from '@mantine/core';
import { Plus } from 'lucide-react';
import type { VariableValue } from '../../types';

type VariableType = 'string' | 'number' | 'boolean' | 'array';

interface AddVariableFormProps {
  onAdd: (key: string, value: VariableValue) => void;
  readOnly?: boolean;
}

export function AddVariableForm({ onAdd, readOnly = false }: AddVariableFormProps) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<VariableType>('string');

  const handleAdd = () => {
    if (!key.trim()) return;
    
    let parsedValue: VariableValue;
    switch (type) {
      case 'number':
        parsedValue = Number(value) || 0;
        break;
      case 'boolean':
        parsedValue = value.toLowerCase() === 'true';
        break;
      case 'array':
        parsedValue = value.split(',').map(s => s.trim()).filter(Boolean);
        break;
      default:
        parsedValue = value;
    }
    
    onAdd(key.trim(), parsedValue);
    setKey('');
    setValue('');
  };

  if (readOnly) return null;

  return (
    <Group gap="xs" wrap="nowrap" mt="sm">
      <TextInput
        placeholder="Variable name"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        size="xs"
        style={{ flex: '0 0 120px' }}
      />
      <Select
        value={type}
        onChange={(val) => setType(val as VariableType)}
        data={[
          { value: 'string', label: 'String' },
          { value: 'number', label: 'Number' },
          { value: 'boolean', label: 'Boolean' },
          { value: 'array', label: 'Array' },
        ]}
        size="xs"
        style={{ width: 90 }}
      />
      <TextInput
        placeholder={type === 'boolean' ? 'true/false' : type === 'array' ? 'a,b,c' : 'value'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        size="xs"
        style={{ flex: 1 }}
      />
      <Button size="xs" variant="primary" onClick={handleAdd} disabled={!key.trim()}>
        <Plus size={14} />
      </Button>
    </Group>
  );
}