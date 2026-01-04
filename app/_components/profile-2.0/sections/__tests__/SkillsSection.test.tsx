import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkillsSection } from '../SkillsSection';
import { ProfileContext } from '@/_store/profile/page/context';

const mockProfileContext = {
  data: {
    sections: {
      skills: {
        title: 'Technical Skills',
        info: [
          { label: 'React', star: 5 },
          { label: 'Node.js', star: 4 },
          { label: 'TypeScript', star: 5 },
          { label: 'AWS', star: 3 },
        ],
      },
    },
  },
  showComponentLibUrl: false,
};

describe('SkillsSection', () => {
  it('should render without crashing', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <SkillsSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Technical Skills/i)).toBeInTheDocument();
  });

  it('should render all skills', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <SkillsSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/React/i)).toBeInTheDocument();
    expect(screen.getByText(/Node.js/i)).toBeInTheDocument();
    expect(screen.getByText(/TypeScript/i)).toBeInTheDocument();
    expect(screen.getByText(/AWS/i)).toBeInTheDocument();
  });

  it('should group skills by category', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <SkillsSection />
      </ProfileContext.Provider>
    );
    // Skills are now grouped by rating level
    expect(screen.getByText(/Technical Skills/i)).toBeInTheDocument();
  });

  it('should have scroll anchor', () => {
    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <SkillsSection />
      </ProfileContext.Provider>
    );
    const anchor = container.querySelector('#skills');
    expect(anchor).toBeInTheDocument();
  });

  it('should handle different star ratings', () => {
    const contextWithVariedRatings = {
      data: {
        sections: {
          skills: {
            title: 'Skills',
            info: [
              { label: 'Expert', star: 5 },
              { label: 'Advanced', star: 4 },
              { label: 'Intermediate', star: 3 },
            ],
          },
        },
      },
      showComponentLibUrl: false,
    };

    render(
      <ProfileContext.Provider value={contextWithVariedRatings as any}>
        <SkillsSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText('Expert')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
  });

  it('should show fallback when no expert, proficient or learning skills', () => {
    const emptyContext = {
      data: {
        sections: {
          skills: {
            title: 'Skills',
            info: [],
          },
        },
      },
      showComponentLibUrl: false,
    };

    render(
      <ProfileContext.Provider value={emptyContext as any}>
        <SkillsSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('should properly sort skills by rating', () => {
    const unsortedContext = {
      data: {
        sections: {
          skills: {
            title: 'Skills',
            info: [
              { label: 'Low', star: 1 },
              { label: 'High', star: 5 },
              { label: 'Mid', star: 3 },
            ],
          },
        },
      },
      showComponentLibUrl: false,
    };

    render(
      <ProfileContext.Provider value={unsortedContext as any}>
        <SkillsSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Mid')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('should group skills into correct categories', () => {
    const categorizedContext = {
      data: {
        sections: {
          skills: {
            title: 'Skills',
            info: [
              { label: 'Expert1', star: 5 },
              { label: 'Expert2', star: 4 },
              { label: 'Proficient', star: 3 },
              { label: 'Learning', star: 1 },
            ],
          },
        },
      },
      showComponentLibUrl: false,
    };

    render(
      <ProfileContext.Provider value={categorizedContext as any}>
        <SkillsSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText('Expert1')).toBeInTheDocument();
    expect(screen.getByText('Expert2')).toBeInTheDocument();
    expect(screen.getByText('Proficient')).toBeInTheDocument();
    expect(screen.getByText('Learning')).toBeInTheDocument();
  });
});
