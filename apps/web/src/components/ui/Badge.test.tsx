import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { rerender } = render(<Badge variant="success">Done</Badge>);
    expect(screen.getByText('Done')).toHaveClass('bg-neon-900/30');

    rerender(<Badge variant="warning">Pending</Badge>);
    expect(screen.getByText('Pending')).toHaveClass('bg-yellow-900/30');

    rerender(<Badge variant="danger">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('bg-red-900/30');

    rerender(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('bg-blue-900/30');

    rerender(<Badge variant="default">Neutral</Badge>);
    expect(screen.getByText('Neutral')).toHaveClass('bg-dark-800');
  });
});
