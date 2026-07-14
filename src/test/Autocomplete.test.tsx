import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Autocomplete } from '../components/Autocomplete';
import type { SearchOption } from '../hooks/useElectionData';

const mockOptions: SearchOption[] = [
  { id: '99', name: 'Deutschland', type: 'Bund', parentName: null },
  { id: '09', name: 'Bayern', type: 'Land', parentName: null },
  { id: '188', name: 'München-West', type: 'Wahlkreis', parentName: 'Bayern' },
];

describe('Autocomplete Component', () => {
  it('renders with placeholder and label', () => {
    render(
      <Autocomplete
        options={mockOptions}
        selectedId={null}
        onSelect={() => {}}
        placeholder="Select a territory..."
        label="Territory Selector"
      />,
    );

    expect(screen.getByText('Territory Selector')).toBeDefined();
    expect(screen.getByText('Select a territory...')).toBeDefined();
  });

  it('renders selected option value and type badge', () => {
    render(
      <Autocomplete
        options={mockOptions}
        selectedId="09"
        onSelect={() => {}}
        placeholder="Select a territory..."
        label="Territory Selector"
      />,
    );

    expect(screen.getByText('Bayern')).toBeDefined();
    expect(screen.getByText('Land')).toBeDefined();
  });

  it('calls onSelect when clear button is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <Autocomplete
        options={mockOptions}
        selectedId="188"
        onSelect={handleSelect}
        placeholder="Select a territory..."
        label="Territory Selector"
      />,
    );

    const clearButton = screen.getByRole('button', { name: 'Auswahl aufheben' });
    fireEvent.click(clearButton);

    expect(handleSelect).toHaveBeenCalledWith(null);
  });
});
