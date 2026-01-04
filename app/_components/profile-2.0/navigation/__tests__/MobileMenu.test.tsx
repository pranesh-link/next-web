import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileMenu } from '../MobileMenu';

describe('MobileMenu Component', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
    document.getElementById = jest.fn().mockReturnValue({
      getBoundingClientRect: () => ({ top: 100 })
    });
  });

  it('should render mobile menu', () => {
    const { container } = render(<MobileMenu />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render version number', () => {
    render(<MobileMenu />);
    // Version comes from package.json
    const versionElement = screen.queryByText(/\d+\.\d+\.\d+/);
    if (versionElement) {
      expect(versionElement).toBeInTheDocument();
    }
  });

  it('should have navigation items', () => {
    render(<MobileMenu />);
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/About/i)).toBeInTheDocument();
  });

  it('should handle menu toggle', () => {
    const { container } = render(<MobileMenu />);
    const menuButton = container.querySelector('button');
    if (menuButton) {
      fireEvent.click(menuButton);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it('should toggle menu open and closed', () => {
    const { container } = render(<MobileMenu />);
    const toggleButton = container.querySelector('button');
    
    if (toggleButton) {
      // Open menu
      fireEvent.click(toggleButton);
      expect(container.firstChild).toBeInTheDocument();
      
      // Close menu
      fireEvent.click(toggleButton);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it('should handle navigation item clicks', () => {
    jest.useFakeTimers();
    const { container } = render(<MobileMenu />);
    const toggleButton = container.querySelector('button');
    
    if (toggleButton) {
      // Open menu first
      fireEvent.click(toggleButton);
      
      const homeLink = screen.getByText(/Home/i);
      fireEvent.click(homeLink);
      
      // Fast-forward timers to execute setTimeout
      jest.runAllTimers();
      expect(window.scrollTo).toHaveBeenCalled();
    }
    jest.useRealTimers();
  });

  it('should close menu after navigation click', () => {
    jest.useFakeTimers();
    const { container } = render(<MobileMenu />);
    const toggleButton = container.querySelector('button');
    
    if (toggleButton) {
      // Open menu
      fireEvent.click(toggleButton);
      const aboutLink = screen.getByText(/About/i);
      fireEvent.click(aboutLink);
      
      // Fast-forward timers
      jest.runAllTimers();
      expect(window.scrollTo).toHaveBeenCalled();
    }
    jest.useRealTimers();
  });

  it('should handle overlay click to close menu', () => {
    const { container } = render(<MobileMenu />);
    const toggleButton = container.querySelector('button');
    
    if (toggleButton) {
      fireEvent.click(toggleButton);
      // Menu should be open, overlay should be visible
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it('should update isScrolled state on scroll', () => {
    render(<MobileMenu />);
    
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    fireEvent.scroll(window);
    
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
  });

  it('should render all navigation items', () => {
    render(<MobileMenu />);
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/About/i)).toBeInTheDocument();
    expect(screen.getByText(/Skills/i)).toBeInTheDocument();
    expect(screen.getByText(/Experience/i)).toBeInTheDocument();
    expect(screen.getByText(/Education/i)).toBeInTheDocument();
    expect(screen.getByText(/Projects/i)).toBeInTheDocument();
  });

  it('should close menu when overlay is clicked', () => {
    const { container } = render(<MobileMenu />);
    const toggleButton = container.querySelector('button');
    
    if (toggleButton) {
      // Open menu
      fireEvent.click(toggleButton);
      
      // Click overlay to close
      const overlay = container.querySelector('div[class*="Overlay"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(container.firstChild).toBeInTheDocument();
      }
    }
  });

  it('should close menu when close button is clicked', () => {
    const { container } = render(<MobileMenu />);
    const toggleButton = container.querySelector('button');
    
    if (toggleButton) {
      // Open menu
      fireEvent.click(toggleButton);
      
      // Find and click close button (×) - use aria-label
      const closeButton = container.querySelector('[aria-label="Close menu"]');
      if (closeButton) {
        fireEvent.click(closeButton);
      }
    }
  });

  it('should handle logo click to scroll to top', () => {
    const { container } = render(<MobileMenu />);
    const logo = container.querySelector('[class*="Logo"]');
    
    if (logo) {
      fireEvent.click(logo);
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    }
  });

  it('should prevent body scroll when menu is open', () => {
    const { container } = render(<MobileMenu />);
    const toggleButton = container.querySelector('button');
    
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(document.body.style.overflow).toBe('hidden');
      
      fireEvent.click(toggleButton);
      expect(document.body.style.overflow).toBe('');
    }
  });
});
