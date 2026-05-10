import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Avatar from '../Avatar';

describe('Avatar', () => {
  it('should render with default props', () => {
    render(<Avatar src="/test-avatar.jpg" alt="Test User" />);
    const img = screen.getByAltText('Test User');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toMatch(/test-avatar\.jpg/);
  });

  it('should render with default medium size when size not specified', () => {
    const { container } = render(<Avatar src="/test-avatar.jpg" alt="Test User" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with small size', () => {
    render(<Avatar src="/test-avatar.jpg" alt="Test User" size="small" />);
    const img = screen.getByAltText('Test User');
    expect(img).toBeInTheDocument();
  });

  it('should render with medium size', () => {
    render(<Avatar src="/test-avatar.jpg" alt="Test User" size="medium" />);
    const img = screen.getByAltText('Test User');
    expect(img).toBeInTheDocument();
  });

  it('should render with large size', () => {
    render(<Avatar src="/test-avatar.jpg" alt="Test User" size="large" />);
    const img = screen.getByAltText('Test User');
    expect(img).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Avatar src="/test-avatar.jpg" alt="Test User" className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should handle missing alt text', () => {
    const { container } = render(<Avatar src="/test-avatar.jpg" alt="" />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute('src')).toMatch(/test-avatar\.jpg/);
  });

  it('should handle image load event', () => {
    render(<Avatar src="/test-avatar.jpg" alt="Test User" />);
    const img = screen.getByAltText('Test User');
    fireEvent.load(img);
    expect(img).toBeInTheDocument();
  });

  it('should handle image error event', () => {
    render(<Avatar src="/invalid.jpg" alt="Test User" />);
    const img = screen.getByAltText('Test User');
    fireEvent.error(img);
    expect(img).toBeInTheDocument();
  });

  it('should render all size variants correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    sizes.forEach(size => {
      const { container } = render(<Avatar src="/test.jpg" alt="Test" size={size} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
