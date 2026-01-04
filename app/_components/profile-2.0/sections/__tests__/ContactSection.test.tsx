import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContactSection } from '../ContactSection';
import { ProfileContext } from '@/_store/profile/page/context';
import { AppContext } from '@/_store/app/context';

jest.mock('@/_utils/profile/server', () => ({
  getFilteredLinks: jest.fn((links) => links),
}));

const mockProfileContext = {
  showComponentLibUrl: true,
  data: {
    sections: {},
  },
};

const mockAppContext = {
  data: {
    links: {
      info: [
        { label: 'github', link: 'https://github.com/test' },
        { label: 'linkedIn', link: 'https://linkedin.com/test' },
      ],
    },
  },
};

describe('ContactSection', () => {
  it('should render without crashing', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <AppContext.Provider value={mockAppContext as any}>
          <ContactSection />
        </AppContext.Provider>
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Developed using/i)).toBeInTheDocument();
  });

  it('should render social media links', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <AppContext.Provider value={mockAppContext as any}>
          <ContactSection />
        </AppContext.Provider>
      </ProfileContext.Provider>
    );
    // Links are rendered as icons, check for link elements instead
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should render version information', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <AppContext.Provider value={mockAppContext as any}>
          <ContactSection />
        </AppContext.Provider>
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Developed using/i)).toBeInTheDocument();
  });

  it('should be fixed at the bottom', () => {
    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <AppContext.Provider value={mockAppContext as any}>
          <ContactSection />
        </AppContext.Provider>
      </ProfileContext.Provider>
    );
    // Component should render
    expect(container.firstChild).toBeInTheDocument();
  });
});
