import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithMantine } from '../../test/setup';
import { VariablesEditor } from '../../components/Variables/VariablesEditor';

vi.mock('../../components/Variables/VariablesTable', () => ({
  VariablesTable: ({ variables, title, badgeColor, readOnly, onDelete }: any) => (
    <div data-testid="variables-table" data-title={title} data-badge-color={badgeColor} data-readonly={readOnly}>
      <span data-testid="table-vars-count">{variables.length}</span>
      {variables.map((v: any) => (
        <div key={v.key} data-testid={`var-${v.key}`} onClick={() => onDelete?.(v.key)}>
          {v.key}: {JSON.stringify(v.value)}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../components/Variables/AddVariableForm', () => ({
  AddVariableForm: ({ onAdd, readOnly }: any) => (
    readOnly ? null :
    <div data-testid="add-variable-form" onClick={() => onAdd?.('newKey', 'newValue')}>
      AddVariableForm
    </div>
  ),
}));

vi.mock('../../components/Variables/InheritedVariablesAccordion', () => ({
  InheritedVariablesAccordion: ({ inheritedProjectVariables, inheritedServiceVariables }: any) => (
    <div data-testid="inherited-variables-accordion">
      <span data-testid="inherited-project-count">{Object.keys(inheritedProjectVariables || {}).length}</span>
      <span data-testid="inherited-service-count">{Object.keys(inheritedServiceVariables || {}).length}</span>
    </div>
  ),
  convertToVariableEntries: (vars: Record<string, unknown> | undefined) => {
    if (!vars || typeof vars !== 'object') return [];
    const entries: Array<{ key: string; value: unknown }> = [];
    for (const [key, value] of Object.entries(vars)) {
      if (value !== undefined) {
        entries.push({ key, value });
      }
    }
    return entries;
  },
}));

describe('VariablesEditor', () => {
  const mockOnProjectVariablesChange = vi.fn();
  const mockOnServiceVariablesChange = vi.fn();
  const mockOnScenarioVariablesChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    projectVariables: {},
    serviceVariables: {},
    scenarioVariables: {},
    inheritedProjectVariables: {},
    inheritedServiceVariables: {},
    onProjectVariablesChange: mockOnProjectVariablesChange,
    onServiceVariablesChange: mockOnServiceVariablesChange,
    onScenarioVariablesChange: mockOnScenarioVariablesChange,
    readOnly: false,
    showInheritance: true,
  };

  describe('Rendering', () => {
    it('renders VariablesEditor with card', () => {
      renderWithMantine(<VariablesEditor {...defaultProps} />);
      expect(screen.getByText('Variables')).toBeInTheDocument();
    });

    it('shows badge with total variable count', () => {
      renderWithMantine(<VariablesEditor {...defaultProps} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('shows badge with count when variables exist', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        scenarioVariables={{ userId: 123, sessionToken: 'abc' }}
      />);
      const badges = screen.getAllByText('2');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('renders VariablesTable for scenario variables', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        scenarioVariables={{ userId: 123 }}
      />);
      expect(screen.getByTestId('variables-table')).toBeInTheDocument();
    });

    it('renders AddVariableForm when not readOnly', () => {
      renderWithMantine(<VariablesEditor {...defaultProps} readOnly={false} />);
      const forms = screen.getAllByTestId('add-variable-form');
      expect(forms.length).toBeGreaterThan(0);
    });

    it('does not render AddVariableForm when readOnly', () => {
      renderWithMantine(<VariablesEditor {...defaultProps} readOnly={true} />);
      expect(screen.queryByTestId('add-variable-form')).not.toBeInTheDocument();
    });

    it('renders InheritedVariablesAccordion when showInheritance is true', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        showInheritance={true}
        inheritedProjectVariables={{ inheritedEnv: 'prod' }}
      />);
      expect(screen.getByTestId('inherited-variables-accordion')).toBeInTheDocument();
    });

    it('does not render InheritedVariablesAccordion when showInheritance is false', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        showInheritance={false}
      />);
      expect(screen.queryByTestId('inherited-variables-accordion')).not.toBeInTheDocument();
    });

    it('returns null when no variables and readOnly', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        readOnly={true}
        projectVariables={{}}
        serviceVariables={{}}
        scenarioVariables={{}}
      />);
      expect(screen.queryByText('Variables')).not.toBeInTheDocument();
    });
  });

  describe('Expansion', () => {
    it('is expanded by default', () => {
      renderWithMantine(<VariablesEditor {...defaultProps} />);
      expect(screen.getByTestId('variables-table')).toBeInTheDocument();
    });
  });

  describe('Variable deletion', () => {
    it('calls onScenarioVariablesChange when delete is triggered', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        scenarioVariables={{ userId: 123 }}
      />);
      
      const varElement = screen.getByTestId('var-userId');
      varElement.click();
      
      expect(mockOnScenarioVariablesChange).toHaveBeenCalledWith({});
    });

    it('calls onProjectVariablesChange when delete is triggered', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        projectVariables={{ env: 'production' }}
        showInheritance={true}
      />);
      
      const varElement = screen.getByTestId('var-env');
      varElement.click();
      
      expect(mockOnProjectVariablesChange).toHaveBeenCalledWith({});
    });

    it('calls onServiceVariablesChange when delete is triggered', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        serviceVariables={{ endpoint: 'http://api.example.com' }}
        showInheritance={true}
      />);
      
      const varElement = screen.getByTestId('var-endpoint');
      varElement.click();
      
      expect(mockOnServiceVariablesChange).toHaveBeenCalledWith({});
    });
  });

  describe('Adding variables', () => {
    it('calls onScenarioVariablesChange when AddVariableForm is clicked', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        scenarioVariables={{}}
      />);
      
      const addForms = screen.getAllByTestId('add-variable-form');
      addForms[0].click();
      
      expect(mockOnScenarioVariablesChange).toHaveBeenCalledWith({ newKey: 'newValue' });
    });
  });

  describe('Variable counts', () => {
    it('shows correct total count across all variable types', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        projectVariables={{ projVar: 'a' }}
        serviceVariables={{ svcVar: 'b' }}
        scenarioVariables={{ scenVar: 'c' }}
        showInheritance={true}
      />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('ReadOnly mode', () => {
    it('does not render AddVariableForm in readOnly mode', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        readOnly={true}
        scenarioVariables={{ userId: 123 }}
      />);
      
      expect(screen.queryByTestId('add-variable-form')).not.toBeInTheDocument();
    });

    it('still renders VariablesTable in readOnly mode', () => {
      renderWithMantine(<VariablesEditor
        {...defaultProps}
        readOnly={true}
        scenarioVariables={{ userId: 123 }}
      />);
      
      expect(screen.getByTestId('variables-table')).toBeInTheDocument();
    });
  });
});