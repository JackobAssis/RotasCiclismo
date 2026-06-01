import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Distance" value="15 km" />);
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('15 km')).toBeInTheDocument();
  });

  it('renders positive trend', () => {
    render(<StatCard label="Speed" value="25 km/h" trend={{ value: 10, positive: true }} />);
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('renders negative trend', () => {
    render(<StatCard label="Speed" value="25 km/h" trend={{ value: 5, positive: false }} />);
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<StatCard label="Test" value="1" icon={<span data-testid="icon">★</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies neon variant class', () => {
    render(<StatCard label="Test" value="1" variant="neon" />);
    expect(screen.getByText('1')).toHaveClass('neon-text-dim');
  });
});
