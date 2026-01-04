import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render with primary variant', () => {
    render(<Button variant="primary">Primary Button</Button>);
    expect(screen.getByText('Primary Button')).toBeInTheDocument();
  });

  it('should render with secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    expect(screen.getByText('Secondary Button')).toBeInTheDocument();
  });

  it('should render with outline variant', () => {
    render(<Button variant="outline">Outline Button</Button>);
    expect(screen.getByText('Outline Button')).toBeInTheDocument();
  });

  it('should render with ghost variant', () => {
    render(<Button variant="ghost">Ghost Button</Button>);
    expect(screen.getByText('Ghost Button')).toBeInTheDocument();
  });

  it('should render with small size', () => {
    render(<Button size="small">Small Button</Button>);
    expect(screen.getByText('Small Button')).toBeInTheDocument();
  });

  it('should render with medium size', () => {
    render(<Button size="medium">Medium Button</Button>);
    expect(screen.getByText('Medium Button')).toBeInTheDocument();
  });

  it('should render with large size', () => {
    render(<Button size="large">Large Button</Button>);
    expect(screen.getByText('Large Button')).toBeInTheDocument();
  });

  it('should render as full width', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    expect(screen.getByText('Full Width Button')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
  });

  it('should not trigger click when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    fireEvent.click(screen.getByText('Disabled Button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render with icon', () => {
    const icon = <span data-testid="test-icon">Icon</span>;
    render(<Button icon={icon}>Button with Icon</Button>);
    expect(screen.getByText('Button with Icon')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Button className="custom-class">Custom Button</Button>);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should handle all variant and size combinations', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;
    const sizes = ['small', 'medium', 'large'] as const;
    
    variants.forEach(variant => {
      sizes.forEach(size => {
        const { unmount } = render(
          <Button variant={variant} size={size}>Test</Button>
        );
        expect(screen.getByText('Test')).toBeInTheDocument();
        unmount();
      });
    });
  });

  it('should render with icon and full width', () => {
    const icon = <span data-testid="icon">→</span>;
    render(<Button icon={icon} fullWidth>Full Button</Button>);
    expect(screen.getByText('Full Button')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should render button without onClick handler', () => {
    render(<Button>No Handler</Button>);
    const button = screen.getByText('No Handler');
    fireEvent.click(button);
    expect(button).toBeInTheDocument();
  });

  it('should apply default size when not specified', () => {
    render(<Button>Default Size</Button>);
    expect(screen.getByText('Default Size')).toBeInTheDocument();
  });

  it('should apply default variant when not specified', () => {
    render(<Button>Default Variant</Button>);
    expect(screen.getByText('Default Variant')).toBeInTheDocument();
  });
});
