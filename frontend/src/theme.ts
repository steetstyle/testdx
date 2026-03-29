import { MantineThemeOverride, Button, ActionIcon, Input, Card, Paper, Tabs, Slider, SegmentedControl, Select, Text } from '@mantine/core';

export const theme: MantineThemeOverride = {
  fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  primaryColor: 'green',
  primaryShade: 8,
  autoContrast: true,
  white: '#fff',
  fontSizes: {
    xxs: '11px',
    xs: '12px',
    sm: '13px',
    md: '15px',
    lg: '16px',
    xl: '18px',
  },
  spacing: {
    xxxs: 'calc(0.375rem * var(--mantine-scale))',
    xxs: 'calc(0.5rem * var(--mantine-scale))',
    xs: 'calc(0.625rem * var(--mantine-scale))',
    sm: 'calc(0.75rem * var(--mantine-scale))',
    md: 'calc(1rem * var(--mantine-scale))',
    lg: 'calc(1.25rem * var(--mantine-scale))',
    xl: 'calc(2rem * var(--mantine-scale))',
  },
  colors: {
    green: [
      '#eafff6',
      '#cdfee7',
      '#a0fad5',
      '#63f2bf',
      '#25e2a5',
      '#00c28a',
      '#00a475',
      '#008362',
      '#00674e',
      '#005542',
    ],
    gray: [
      '#FAFAFA',
      '#e6e6ee',
      '#D7D8DB',
      '#aeaeb7',
      '#A1A1AA',
      '#868691',
      '#7e7e8b',
      '#6c6c79',
      '#5f5f6e',
      '#515264',
    ],
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  headings: {
    fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    Button: Button.extend({
      defaultProps: {
        variant: 'primary',
      },
      styles: (theme) => ({
        root: {
          '--button-bg': 'var(--color-primary-button-bg)',
          '--button-hover': 'var(--color-primary-button-bg-hover)',
          '--button-color': 'var(--color-primary-button-text)',
          backgroundColor: 'var(--color-primary-button-bg)',
          color: 'var(--color-primary-button-text)',
          '&:hover': {
            backgroundColor: 'var(--color-primary-button-bg-hover)',
          },
        },
      }),
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        variant: 'subtle',
        color: 'gray',
      },
    }),
    Input: Input.extend({
      styles: {
        input: {
          backgroundColor: 'var(--color-bg-field)',
          border: '1px solid var(--color-border)',
        },
      },
    }),
    Card: Card.extend({
      styles: (theme) => ({
        root: {
          backgroundColor: 'var(--color-bg-body)',
          border: '1px solid var(--color-border)',
        },
      }),
    }),
    Paper: Paper.extend({
      styles: (theme) => ({
        root: {
          backgroundColor: 'var(--color-bg-muted)',
          border: '1px solid var(--color-border)',
        },
      }),
    }),
    Tabs: Tabs.extend({
      styles: {
        tab: {
          color: 'var(--color-text-secondary)',
          '&[data-active]': {
            color: 'var(--color-text-brand)',
          },
        },
      },
    }),
    Slider: Slider.extend({
      styles: {
        bar: {
          backgroundColor: 'var(--color-bg-brand)',
        },
        thumb: {
          borderColor: 'var(--color-bg-brand)',
        },
      },
    }),
    SegmentedControl: SegmentedControl.extend({
      styles: {
        root: {
          backgroundColor: 'var(--color-bg-field)',
        },
        indicator: {
          backgroundColor: 'var(--color-bg-field-highlighted)',
        },
      },
    }),
    Select: Select.extend({
      styles: {
        input: {
          border: '1px solid var(--color-border)',
        },
      },
    }),
    Text: Text.extend({
      styles: (_theme, props) => {
        if (props.c === 'danger' || props.color === 'danger') {
          return { root: { color: 'var(--color-text-danger)' } };
        }
        return {};
      },
    }),
  },
};