import React from 'react';
import { render, screen } from '@testing-library/react';
import { AboutSection } from '../AboutSection';
import { ProfileContext } from '@/_store/profile/page/context';

const mockProfileContext = {
  data: {
    sections: {
      aboutMe: {
        info: '<p>Full Stack Developer with 5 years of experience building modern web applications</p>',
      },
      details: {
        info: [
          { label: 'Name', info: 'John Doe', canCopy: false },
          { label: 'Email', info: 'john@example.com', canCopy: true },
          { label: 'Mobile', info: '+1234567890', canCopy: true },
          { label: 'Location', info: 'San Francisco, CA', canCopy: false },
        ],
      },
    },
  },
  showComponentLibUrl: false,
};

describe('AboutSection', () => {
  it('should render without crashing', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <AboutSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/About/i)).toBeInTheDocument();
  });

  it('should render about content from context', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <AboutSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Full Stack Developer/i)).toBeInTheDocument();
  });

  it('should render contact information', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <AboutSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
  });

  it('should have scroll anchor for navigation', () => {
    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <AboutSection />
      </ProfileContext.Provider>
    );
    const anchor = container.querySelector('#about');
    expect(anchor).toBeInTheDocument();
  });
});
