import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Tabs } from './Tabs';

const tabs = [
  { id: 'tab1', label: 'First Tab' },
  { id: 'tab2', label: 'Second Tab' },
  { id: 'tab3', label: 'Third Tab', icon: <span data-testid="tab-icon">I</span> },
];

describe('Tabs', () => {
  it('renders all tabs', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onChange={vi.fn()} />);
    expect(screen.getByText('First Tab')).toBeInTheDocument();
    expect(screen.getByText('Second Tab')).toBeInTheDocument();
    expect(screen.getByText('Third Tab')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<Tabs tabs={tabs} activeTab="tab2" onChange={vi.fn()} />);
    const activeButton = screen.getByText('Second Tab').closest('button');
    expect(activeButton).toHaveClass('text-neon-400');
  });

  it('calls onChange with tab id on click', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="tab1" onChange={onChange} />);
    fireEvent.click(screen.getByText('Second Tab'));
    expect(onChange).toHaveBeenCalledWith('tab2');
  });

  it('renders icon when provided', () => {
    render(<Tabs tabs={tabs} activeTab="tab1" onChange={vi.fn()} />);
    expect(screen.getByTestId('tab-icon')).toBeInTheDocument();
  });
});
