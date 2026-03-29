import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, cleanup, fireEvent } from '@testing-library/react';
import { renderWithMantine } from '../../test/setup';
import { AddVariableForm } from '../../components/Variables/AddVariableForm';

describe('AddVariableForm', () => {
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('renders AddVariableForm with inputs', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      expect(screen.getByPlaceholderText('Variable name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('value')).toBeInTheDocument();
    });

    it('renders with default type as string', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      expect(screen.getByDisplayValue('String')).toBeInTheDocument();
    });

    it('renders plus button', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('returns null when readOnly', () => {
      const { container } = renderWithMantine(<AddVariableForm onAdd={mockOnAdd} readOnly={true} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('User interactions', () => {
    it('allows typing in key input', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      const keyInput = screen.getByPlaceholderText('Variable name');
      fireEvent.change(keyInput, { target: { value: 'API_KEY' } });
      expect((keyInput as HTMLInputElement).value).toBe('API_KEY');
    });

    it('allows typing in value input', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      const valueInput = screen.getByPlaceholderText('value');
      fireEvent.change(valueInput, { target: { value: 'secret123' } });
      expect((valueInput as HTMLInputElement).value).toBe('secret123');
    });

    it('allows changing type to number', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      const typeSelect = screen.getByLabelText('') as HTMLInputElement;
      fireEvent.click(typeSelect);
    });

    it('updates placeholder based on type', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      expect(screen.getByPlaceholderText('value')).toBeInTheDocument();
    });
  });

  describe('Adding variables', () => {
    it('calls onAdd with string value when type is string', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'API_KEY' } });
      fireEvent.change(screen.getByPlaceholderText('value'), { target: { value: 'secret123' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnAdd).toHaveBeenCalledWith('API_KEY', 'secret123');
    });

    it('calls onAdd with number value when type is number', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'TIMEOUT' } });
      
      const typeSelect = document.querySelector('.mantine-Select-input') as HTMLInputElement;
      fireEvent.click(typeSelect);
    });

    it('clears inputs after adding', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'KEY' } });
      fireEvent.change(screen.getByPlaceholderText('value'), { target: { value: 'VALUE' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect((screen.getByPlaceholderText('Variable name') as HTMLInputElement).value).toBe('');
      expect((screen.getByPlaceholderText('value') as HTMLInputElement).value).toBe('');
    });

    it('does not call onAdd when key is empty', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: '' } });
      fireEvent.change(screen.getByPlaceholderText('value'), { target: { value: 'somevalue' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('trims whitespace from key', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: '  KEY  ' } });
      fireEvent.change(screen.getByPlaceholderText('value'), { target: { value: 'VALUE' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnAdd).toHaveBeenCalledWith('KEY', 'VALUE');
    });
  });

  describe('Type conversion', () => {
    it('converts string type to string value', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'NAME' } });
      fireEvent.change(screen.getByPlaceholderText('value'), { target: { value: 'John' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnAdd).toHaveBeenCalledWith('NAME', 'John');
    });

    it('converts number type to number value', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'PORT' } });
      fireEvent.change(screen.getByPlaceholderText('value'), { target: { value: '8080' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnAdd).toHaveBeenCalledWith('PORT', 8080);
    });

    it('handles non-numeric input for number type', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'COUNT' } });
      fireEvent.change(screen.getByPlaceholderText('value'), { target: { value: 'abc' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnAdd).toHaveBeenCalledWith('COUNT', 0);
    });

    it('converts boolean type correctly for true', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'ENABLED' } });
      fireEvent.change(screen.getByPlaceholderText('true/false'), { target: { value: 'true' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnAdd).toHaveBeenCalledWith('ENABLED', true);
    });

    it('converts boolean type correctly for false', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'DEBUG' } });
      fireEvent.change(screen.getByPlaceholderText('true/false'), { target: { value: 'false' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnAdd).toHaveBeenCalledWith('DEBUG', false);
    });

    it('converts array type to array value', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'TAGS' } });
      fireEvent.change(screen.getByPlaceholderText('a,b,c'), { target: { value: 'a, b, c' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnAdd).toHaveBeenCalledWith('TAGS', ['a', 'b', 'c']);
    });

    it('filters empty strings from array', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'ITEMS' } });
      fireEvent.change(screen.getByPlaceholderText('a,b,c'), { target: { value: 'a, , b, , c' } });
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockOnAdd).toHaveBeenCalledWith('ITEMS', ['a', 'b', 'c']);
    });
  });

  describe('Button state', () => {
    it('button is disabled when key is empty', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      const button = screen.getByRole('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('button is enabled when key has value', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: 'KEY' } });
      
      const button = screen.getByRole('button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it('button is disabled when key is only whitespace', () => {
      renderWithMantine(<AddVariableForm onAdd={mockOnAdd} />);
      
      fireEvent.change(screen.getByPlaceholderText('Variable name'), { target: { value: '   ' } });
      
      const button = screen.getByRole('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });
});