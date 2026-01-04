import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpenSourceSection } from '../OpenSourceSection';
import { ProfileContext } from '@/_store/profile/page/context';

const mockProfileContext = {
  data: {
    sections: {
      openSourceProjects: {
        title: 'Open Source Contributions',
        info: [
          {
            title: 'Awesome Library',
            description: '<p>A powerful utility library for modern JavaScript</p>',
            github: 'https://github.com/user/awesome-lib',
            npm: 'https://npmjs.com/package/awesome-lib',
            skillsUsed: 'TypeScript, Jest',
          },
          {
            title: 'React Components',
            description: '<p>Collection of reusable React components</p>',
            github: 'https://github.com/user/react-components',
            skillsUsed: 'React, CSS',
          },
        ],
      },
    },
  },
};

describe('OpenSourceSection', () => {
  it('should render without crashing', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Open Source/i)).toBeInTheDocument();
  });

  it('should render all projects', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Awesome Library/i)).toBeInTheDocument();
    expect(screen.getAllByText(/React Components/i).length).toBeGreaterThan(0);
  });

  it('should render project descriptions', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/powerful utility library/i)).toBeInTheDocument();
    expect(screen.getByText(/reusable React components/i)).toBeInTheDocument();
  });

  it('should render project languages', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getAllByText(/TypeScript/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/React/i).length).toBeGreaterThan(0);
  });

  it('should render skill stacks', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Jest/i)).toBeInTheDocument();
    expect(screen.getByText(/CSS/i)).toBeInTheDocument();
  });

  it('should have scroll anchor', () => {
    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    const anchor = container.querySelector('#open-source');
    expect(anchor).toBeInTheDocument();
  });

  it('should render GitHub buttons for all projects', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    const githubButtons = screen.getAllByText(/View on GitHub/i);
    expect(githubButtons.length).toBeGreaterThan(0);
  });

  it('should render NPM button when npm link exists', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/NPM Package/i)).toBeInTheDocument();
  });

  it('should not render NPM button when npm link missing', () => {
    const contextWithoutNpm = {
      data: {
        sections: {
          openSourceProjects: {
            title: 'Projects',
            info: [{
              title: 'Project',
              description: '<p>Description</p>',
              github: 'https://github.com/test',
              skillsUsed: 'React',
            }],
          },
        },
      },
    };
    render(
      <ProfileContext.Provider value={contextWithoutNpm as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    expect(screen.queryByText(/NPM Package/i)).not.toBeInTheDocument();
  });

  it('should handle GitHub button click', () => {
    window.open = jest.fn();
    const { getAllByText } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    const githubButtons = getAllByText(/View on GitHub/i);
    expect(githubButtons.length).toBeGreaterThan(0);
  });

  it('should handle NPM button click', () => {
    window.open = jest.fn();
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    const npmButton = screen.getByText(/NPM Package/i);
    expect(npmButton).toBeInTheDocument();
  });

  it('should render project with skillsUsed', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/TypeScript, Jest/i)).toBeInTheDocument();
  });

  it('should call handleOpenLink when GitHub button clicked', () => {
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
    
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    
    const githubButtons = screen.getAllByText(/View on GitHub/i);
    fireEvent.click(githubButtons[0]);
    
    expect(windowOpenSpy).toHaveBeenCalledWith('https://github.com/user/awesome-lib', '_blank');
    windowOpenSpy.mockRestore();
  });

  it('should call handleOpenLink when NPM button clicked', () => {
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
    
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <OpenSourceSection />
      </ProfileContext.Provider>
    );
    
    const npmButton = screen.getByText(/NPM Package/i);
    fireEvent.click(npmButton);
    
    expect(windowOpenSpy).toHaveBeenCalledWith('https://npmjs.com/package/awesome-lib', '_blank');
    windowOpenSpy.mockRestore();
  });
});
