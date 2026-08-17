import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders with aria-label from label prop', () => {
    render(
      <IconButton label="Close" onClick={vi.fn()}>
        <span>X</span>
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <IconButton label="Close" onClick={onClick}>
        <span>X</span>
      </IconButton>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled', () => {
    render(
      <IconButton label="Close" disabled>
        <span>X</span>
      </IconButton>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
