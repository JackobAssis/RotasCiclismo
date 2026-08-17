import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={vi.fn()} title="Test" children={<p>Content</p>} />);
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Test" children={<p>Content</p>} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onClose when clicking overlay', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} children={<p>Content</p>} />);
    const overlay = document.querySelector('.fixed.inset-0');
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} children={<p>Content</p>} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders actions footer', () => {
    render(
      <Modal
        open={true}
        onClose={vi.fn()}
        actions={<button>Confirm</button>}
        children={<p>Content</p>}
      />,
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('locks body scroll when open', () => {
    const { unmount } = render(<Modal open={true} onClose={vi.fn()} children={<p>Content</p>} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
