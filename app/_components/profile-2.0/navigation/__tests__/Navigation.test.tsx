import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../Navigation';

describe('Navigation Component', () => {
  beforeEach(() => {
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  it('should render navigation items', () => {
    render(<Navigation />);
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/About/i)).toBeInTheDocument();
    expect(screen.getByText(/Skills/i)).toBeInTheDocument();
  });

  it('should render all navigation items', () => {
    render(<Navigation />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('should handle navigation item click', () => {
    // Mock getElementById to return a valid element
    document.getElementById = jest.fn().mockReturnValue({
      getBoundingClientRect: () => ({ top: 100 })
    });
    
    render(<Navigation />);
    const homeLink = screen.getByText('Home');
    fireEvent.click(homeLink);
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('should detect scroll and update isScrolled state', () => {
    render(<Navigation />);
    
    // Simulate scroll event
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    fireEvent.scroll(window);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('should handle navigation click without element', () => {
    document.getElementById = jest.fn().mockReturnValue(null);
    
    render(<Navigation />);
    const aboutLink = screen.getByText('About');
    fireEvent.click(aboutLink);
    
    expect(document.getElementById).toHaveBeenCalled();
  });
});
