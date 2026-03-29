import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithMantine } from '../../test/setup';
import { ResourcePanel } from '../../components/OTelConfig/ResourcePanel';
import { defaultOTelConfig } from '../../components/OTelConfig/useOTelConfig';
import type { OtelSdkConfig } from '../../types';

describe('ResourcePanel', () => {
  const mockUpdateConfig = vi.fn();
  let config: OtelSdkConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    config = JSON.parse(JSON.stringify(defaultOTelConfig)) as OtelSdkConfig;
  });

  const renderPanel = () => {
    return renderWithMantine(
      <ResourcePanel config={config} updateConfig={mockUpdateConfig} />
    );
  };

  describe('Service Name', () => {
    it('renders with current service name value', () => {
      config.resource!.serviceName = 'my-custom-resource-service';
      renderPanel();
      
      const input = screen.getByLabelText('Service Name') as HTMLInputElement;
      expect(input.value).toBe('my-custom-resource-service');
    });

    it('renders with default service name', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Service Name') as HTMLInputElement;
      expect(input.value).toBe('synthetic-service');
    });

    it('calls updateConfig when service name changes', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Service Name');
      fireEvent.change(input, { target: { value: 'new-resource-service' } });
      
      expect(mockUpdateConfig).toHaveBeenCalledWith('resource.serviceName', 'new-resource-service');
    });
  });

  describe('Service Namespace', () => {
    it('renders with current service namespace value', () => {
      config.resource!.serviceNamespace = 'production';
      renderPanel();
      
      const input = screen.getByLabelText('Service Namespace') as HTMLInputElement;
      expect(input.value).toBe('production');
    });

    it('renders with empty service namespace by default', () => {
      config.resource!.serviceNamespace = '';
      renderPanel();
      
      const input = screen.getByLabelText('Service Namespace') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('calls updateConfig when service namespace changes', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Service Namespace');
      fireEvent.change(input, { target: { value: 'staging' } });
      
      expect(mockUpdateConfig).toHaveBeenCalledWith('resource.serviceNamespace', 'staging');
    });
  });

  describe('Service Instance ID', () => {
    it('renders with current service instance ID value', () => {
      config.resource!.serviceInstanceId = 'instance-001';
      renderPanel();
      
      const input = screen.getByLabelText('Service Instance ID') as HTMLInputElement;
      expect(input.value).toBe('instance-001');
    });

    it('renders with empty service instance ID by default', () => {
      config.resource!.serviceInstanceId = '';
      renderPanel();
      
      const input = screen.getByLabelText('Service Instance ID') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('calls updateConfig when service instance ID changes', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Service Instance ID');
      fireEvent.change(input, { target: { value: 'instance-002' } });
      
      expect(mockUpdateConfig).toHaveBeenCalledWith('resource.serviceInstanceId', 'instance-002');
    });
  });

  describe('Service Version', () => {
    it('renders with current service version value', () => {
      config.resource!.serviceVersion = '1.0.0';
      renderPanel();
      
      const input = screen.getByLabelText('Service Version') as HTMLInputElement;
      expect(input.value).toBe('1.0.0');
    });

    it('renders with empty service version by default', () => {
      config.resource!.serviceVersion = '';
      renderPanel();
      
      const input = screen.getByLabelText('Service Version') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('calls updateConfig when service version changes', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Service Version');
      fireEvent.change(input, { target: { value: '2.0.0' } });
      
      expect(mockUpdateConfig).toHaveBeenCalledWith('resource.serviceVersion', '2.0.0');
    });
  });

  describe('Deployment Environment', () => {
    it('renders with current deployment environment value', () => {
      config.resource!.deploymentEnvironment = 'production';
      renderPanel();
      
      const input = screen.getByLabelText('Deployment Environment') as HTMLInputElement;
      expect(input.value).toBe('production');
    });

    it('renders with empty deployment environment by default', () => {
      config.resource!.deploymentEnvironment = '';
      renderPanel();
      
      const input = screen.getByLabelText('Deployment Environment') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('calls updateConfig when deployment environment changes', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Deployment Environment');
      fireEvent.change(input, { target: { value: 'development' } });
      
      expect(mockUpdateConfig).toHaveBeenCalledWith('resource.deploymentEnvironment', 'development');
    });
  });

  describe('Attributes Section', () => {
    it('renders attributes info text', () => {
      renderPanel();
      
      expect(screen.getByText('Resource attributes can be configured in each signal tab')).toBeInTheDocument();
    });
  });

  describe('Empty Resource Config', () => {
    it('handles undefined resource', () => {
      config.resource = undefined as any;
      renderPanel();
      
      const serviceNameInput = screen.getByLabelText('Service Name') as HTMLInputElement;
      expect(serviceNameInput.value).toBe('');
    });

    it('handles null values in resource fields', () => {
      config.resource = {
        serviceName: '',
        serviceNamespace: '',
        serviceInstanceId: '',
        serviceVersion: '',
        deploymentEnvironment: '',
        attributes: {},
      };
      renderPanel();
      
      const inputs = [
        screen.getByLabelText('Service Name'),
        screen.getByLabelText('Service Namespace'),
        screen.getByLabelText('Service Instance ID'),
        screen.getByLabelText('Service Version'),
        screen.getByLabelText('Deployment Environment'),
      ];
      
      inputs.forEach(input => {
        expect((input as HTMLInputElement).value).toBe('');
      });
    });
  });
});