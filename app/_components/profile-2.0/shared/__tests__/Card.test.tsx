import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardContent } from '../Card';

describe('Card Component', () => {
  describe('Card', () => {
    it('should render children', () => {
      render(
        <Card>
          <div>Card Content</div>
        </Card>
      );
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should render with default variant', () => {
      render(<Card>Default Card</Card>);
      expect(screen.getByText('Default Card')).toBeInTheDocument();
    });

    it('should render with gradient variant', () => {
      render(<Card variant="gradient">Gradient Card</Card>);
      expect(screen.getByText('Gradient Card')).toBeInTheDocument();
    });

    it('should render with outlined variant', () => {
      render(<Card variant="outlined">Outlined Card</Card>);
      expect(screen.getByText('Outlined Card')).toBeInTheDocument();
    });

    it('should render as hoverable', () => {
      render(<Card hoverable>Hoverable Card</Card>);
      expect(screen.getByText('Hoverable Card')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-class">Custom Card</Card>);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('should render children', () => {
      render(<CardHeader>Card Header</CardHeader>);
      expect(screen.getByText('Card Header')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<CardHeader className="custom-header">Header</CardHeader>);
      expect(container.querySelector('.custom-header')).toBeInTheDocument();
    });
  });

  describe('CardContent', () => {
    it('should render children', () => {
      render(<CardContent>Card Content</CardContent>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<CardContent className="custom-content">Content</CardContent>);
      expect(container.querySelector('.custom-content')).toBeInTheDocument();
    });
  });

  describe('Card with Header and Content', () => {
    it('should render complete card structure', () => {
      render(
        <Card>
          <CardHeader>My Header</CardHeader>
          <CardContent>My Content</CardContent>
        </Card>
      );
      expect(screen.getByText('My Header')).toBeInTheDocument();
      expect(screen.getByText('My Content')).toBeInTheDocument();
    });

    it('should render CardHeader with icon', () => {
      const icon = <span data-testid="header-icon">★</span>;
      render(
        <Card>
          <CardHeader icon={icon}>Header</CardHeader>
        </Card>
      );
      expect(screen.getByTestId('header-icon')).toBeInTheDocument();
    });

    it('should render all variant combinations', () => {
      const variants = ['default', 'gradient', 'outlined'] as const;
      variants.forEach(variant => {
        const { unmount } = render(<Card variant={variant}>Test</Card>);
        expect(screen.getByText('Test')).toBeInTheDocument();
        unmount();
      });
    });

    it('should combine hoverable with all variants', () => {
      const variants = ['default', 'gradient', 'outlined'] as const;
      variants.forEach(variant => {
        const { unmount } = render(<Card variant={variant} hoverable>Test</Card>);
        expect(screen.getByText('Test')).toBeInTheDocument();
        unmount();
      });
    });

    it('should render hoverable with className', () => {
      render(<Card hoverable className="hover-card">Content</Card>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render outlined variant with hoverable', () => {
      render(<Card variant="outlined" hoverable>Outlined Hover</Card>);
      expect(screen.getByText('Outlined Hover')).toBeInTheDocument();
    });

    it('should render gradient variant with custom class', () => {
      const { container } = render(
        <Card variant="gradient" className="gradient-custom">Gradient</Card>
      );
      expect(container.querySelector('.gradient-custom')).toBeInTheDocument();
    });
  });
});
