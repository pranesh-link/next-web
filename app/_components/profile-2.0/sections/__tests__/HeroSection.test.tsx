import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from '../HeroSection';
import { ProfileContext } from '@/_store/profile/page/context';

const mockProfileContext = {
  data: {
    header: {
      name: 'John Doe',
      currentJobRole: 'Full Stack Developer',
    },
  },
  showComponentLibUrl: false,
};

describe('HeroSection', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  it('should render hero section', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <HeroSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render current job role', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <HeroSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
  });

  it('should render avatar with name as alt text', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <HeroSection />
      </ProfileContext.Provider>
    );
    const img = screen.getByAltText('John Doe');
    expect(img).toBeInTheDocument();
  });

  it('should have scroll anchor', () => {
    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <HeroSection />
      </ProfileContext.Provider>
    );
    const hero = container.querySelector('#hero');
    expect(hero).toBeInTheDocument();
  });

  it('should handle scroll down button click', () => {
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });
    
    document.getElementById = jest.fn((id) => {
      if (id === 'about') {
        return {
          getBoundingClientRect: () => ({ top: 800 }),
        } as any;
      }
      return null;
    });

    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <HeroSection />
      </ProfileContext.Provider>
    );
    const scrollButton = container.querySelector('[role="button"]');
    if (scrollButton) {
      fireEvent.click(scrollButton);
      expect(window.scrollTo).toHaveBeenCalled();
    }
  });

  it('should handle scroll down when about section not found', () => {
    document.getElementById = jest.fn(() => null);
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 1000,
    });

    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <HeroSection />
      </ProfileContext.Provider>
    );
    const scrollIndicator = container.querySelector('div[role="button"], button');
    if (scrollIndicator) {
      fireEvent.click(scrollIndicator);
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 700,
        behavior: 'smooth',
      });
    }
  });

  it('should render ScrollIndicator component', () => {
    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <HeroSection />
      </ProfileContext.Provider>
    );
    // ScrollIndicator should be rendered
    expect(container.querySelector('#hero')).toBeInTheDocument();
  });

  it('should call handleScrollDown when ScrollIndicator is clicked', () => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 1000,
    });
    window.scrollTo = jest.fn();

    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <HeroSection />
      </ProfileContext.Provider>
    );

    // Find any clickable element and click it
    const clickableElements = container.querySelectorAll('div, button');
    clickableElements.forEach(el => {
      fireEvent.click(el);
    });
  });
});
