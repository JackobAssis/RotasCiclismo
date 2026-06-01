import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingState message="Loading rides..." />);
    expect(screen.getByText('Loading rides...')).toBeInTheDocument();
  });

  it('renders as fullPage when enabled', () => {
    render(<LoadingState fullPage />);
    const container = screen.getByText('Carregando...').closest('.h-screen');
    expect(container).toBeInTheDocument();
  });
});
