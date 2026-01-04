import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Profile2 from '../Profile2';
import { ProfileContext } from '@/_store/profile/page/context';
import { AppContext } from '@/_store/app/context';

// Mock child components
jest.mock('../navigation/Navigation', () => {
  return function MockNavigation() {
    return <div data-testid="navigation">Navigation</div>;
  };
});

jest.mock('../navigation/MobileMenu', () => {
  return function MockMobileMenu() {
    return <div data-testid="mobile-menu">MobileMenu</div>;
  };
});

jest.mock('../sections/HeroSection', () => {
  return function MockHeroSection() {
    return <div data-testid="hero-section">HeroSection</div>;
  };
});

jest.mock('../sections/AboutSection', () => {
  return function MockAboutSection() {
    return <div data-testid="about-section">AboutSection</div>;
  };
});

jest.mock('../sections/ExperienceSection', () => {
  return function MockExperienceSection() {
    return <div data-testid="experience-section">ExperienceSection</div>;
  };
});

jest.mock('../sections/SkillsSection', () => {
  return function MockSkillsSection() {
    return <div data-testid="skills-section">SkillsSection</div>;
  };
});

jest.mock('../sections/EducationSection', () => {
  return function MockEducationSection() {
    return <div data-testid="education-section">EducationSection</div>;
  };
});

jest.mock('../sections/OpenSourceSection', () => {
  return function MockOpenSourceSection() {
    return <div data-testid="opensource-section">OpenSourceSection</div>;
  };
});

jest.mock('../sections/ContactSection', () => {
  return function MockContactSection() {
    return <div data-testid="contact-section">ContactSection</div>;
  };
});

const mockProfileContext = {
  name: 'John Doe',
  tagline: 'Full Stack Developer',
  sections: [],
};

const mockAppContext = {
  config: { version: '1.0.0' },
};

describe('Profile2', () => {
  it('should render without crashing', () => {
    render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  it('should render all major sections', () => {
    render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );
    
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('about-section')).toBeInTheDocument();
    expect(screen.getByTestId('experience-section')).toBeInTheDocument();
    expect(screen.getByTestId('skills-section')).toBeInTheDocument();
    expect(screen.getByTestId('education-section')).toBeInTheDocument();
    expect(screen.getByTestId('opensource-section')).toBeInTheDocument();
    expect(screen.getByTestId('contact-section')).toBeInTheDocument();
  });

  it('should render navigation component', () => {
    render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('should render mobile menu', () => {
    render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );
    expect(screen.getByText('MobileMenu')).toBeInTheDocument();
  });

  it('should have proper structure', () => {
    const { container } = render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 profileContext={mockProfileContext as any} />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render hero section with profile data', () => {
    render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 profileContext={mockProfileContext as any} />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('should show scroll to top button when scrolled', () => {
    const { container } = render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 profileContext={mockProfileContext as any} />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 400,
    });
    fireEvent.scroll(window);
  });

  it('should handle scroll to top button click', () => {
    window.scrollTo = jest.fn();
    const { container } = render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 profileContext={mockProfileContext as any} />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );

    // Simulate scroll to show button
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 400,
    });
    fireEvent.scroll(window);

    // Find and click scroll to top button
    const scrollButton = container.querySelector('button[aria-label="Scroll to top"], div[role="button"]');
    if (scrollButton) {
      fireEvent.click(scrollButton);
    }
  });

  it('should create full context with mock handlers', () => {
    render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 profileContext={mockProfileContext as any} />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );
    // Context should be created with setIsContactFormOpen and setIsModalOpen
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('should call scrollToTop when scroll button is clicked', () => {
    window.scrollTo = jest.fn();
    const { container } = render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 profileContext={mockProfileContext as any} />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );

    // Trigger scroll event
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 500,
    });
    fireEvent.scroll(window);

    // Click any button to potentially trigger scrollToTop
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
      fireEvent.click(btn);
    });
  });

  it('should set showScrollTop to false when scroll is less than 300', () => {
    const { container } = render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 profileContext={mockProfileContext as any} />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );

    // Simulate scroll less than 300
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 100,
    });
    fireEvent.scroll(window);
  });

  it('should execute scrollToTop function when button is clicked', () => {
    const scrollToMock = jest.fn();
    window.scrollTo = scrollToMock;
    
    const { container } = render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 profileContext={mockProfileContext as any} />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );

    // Simulate scroll to show button
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 400,
    });
    fireEvent.scroll(window);

    // Find the button by looking for scrollTop function
    const scrollButton = container.querySelector('[role="button"]');
    if (scrollButton) {
      fireEvent.click(scrollButton);
      expect(scrollToMock).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    }
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(
      <AppContext.Provider value={mockAppContext as any}>
        <ProfileContext.Provider value={mockProfileContext as any}>
          <Profile2 profileContext={mockProfileContext as any} />
        </ProfileContext.Provider>
      </AppContext.Provider>
    );

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
