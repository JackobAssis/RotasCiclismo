import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { rerender } = render(<Card variant="glass">Glass</Card>);
    expect(screen.getByText('Glass')).toHaveClass('glass');

    rerender(<Card variant="neon">Neon</Card>);
    expect(screen.getByText('Neon')).toHaveClass('border-neon-900/40');

    rerender(<Card variant="flat">Flat</Card>);
    expect(screen.getByText('Flat')).toHaveClass('bg-dark-850');
  });

  it('applies padding class', () => {
    const { rerender } = render(<Card padding="sm">Small</Card>);
    expect(screen.getByText('Small')).toHaveClass('p-3');

    rerender(<Card padding="lg">Large</Card>);
    expect(screen.getByText('Large')).toHaveClass('p-6');

    rerender(<Card padding="none">None</Card>);
    expect(screen.getByText('None')).not.toHaveClass('p-');
  });
});
