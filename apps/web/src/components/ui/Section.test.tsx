import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Section } from './Section';

describe('Section', () => {
  it('renders children', () => {
    render(<Section>Content</Section>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<Section title="My Section">Content</Section>);
    expect(screen.getByText('My Section')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<Section className="mt-4">Content</Section>);
    expect(screen.getByText('Content')).toHaveClass('mt-4');
  });
});
