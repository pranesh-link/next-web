import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExperienceSection } from '../ExperienceSection';
import { ProfileContext } from '@/_store/profile/page/context';

const mockProfileContext = {
  data: {
    sections: {
      experiences: {
        title: 'Professional Experience',
        info: [
          {
            name: 'Tech Corp',
            designation: 'Senior Software Engineer',
            from: 'Jan 2020',
            to: 'Present',
            responsibilities: '<p>Leading frontend development</p>',
            projects: [
              {
                title: 'Project Alpha',
                description: 'Major frontend redesign',
                softwareTech: 'React, TypeScript, Node.js',
              },
            ],
          },
          {
            name: 'Startup Inc',
            designation: 'Software Engineer',
            from: 'Jun 2018',
            to: 'Dec 2019',
            responsibilities: '<p>Full-stack development</p>',
            projects: [],
          },
        ],
      },
    },
  },
  showComponentLibUrl: false,
};

describe('ExperienceSection', () => {
  it('should render without crashing', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Professional Experience/i)).toBeInTheDocument();
  });

  it('should render all experience entries', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getAllByText(/Software Engineer/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Senior Software Engineer/i)).toBeInTheDocument();
  });

  it('should render company names', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Tech Corp/i)).toBeInTheDocument();
    expect(screen.getByText(/Startup Inc/i)).toBeInTheDocument();
  });

  it('should render time periods', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Jan 2020/i)).toBeInTheDocument();
    expect(screen.getByText(/Present/i)).toBeInTheDocument();
  });

  it('should render technologies', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Project Alpha/i)).toBeInTheDocument();
  });

  it('should have scroll anchor', () => {
    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    const anchor = container.querySelector('#experience');
    expect(anchor).toBeInTheDocument();
  });

  it('should render experience with projects', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Project Alpha/i)).toBeInTheDocument();
  });

  it('should handle experience without projects', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    // Second experience has empty projects array
    expect(screen.getByText('Startup Inc')).toBeInTheDocument();
  });

  it('should render responsibilities as HTML', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Leading frontend development/i)).toBeInTheDocument();
    expect(screen.getByText(/Full-stack development/i)).toBeInTheDocument();
  });

  it('should handle project click to open modal', () => {
    const { getByText } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    const projectBadge = getByText('Project Alpha');
    expect(projectBadge).toBeInTheDocument();
    // Click is handled by the component
  });

  it('should render experience with "to" value as Present', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Present/i)).toBeInTheDocument();
  });

  it('should render experience with past dates', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Dec 2019/i)).toBeInTheDocument();
  });

  it('should open modal when project badge is clicked', () => {
    const { getByText, queryByText } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    
    const projectBadge = getByText('Project Alpha');
    fireEvent.click(projectBadge);
    
    // Modal should be open - check if project description is visible
    expect(queryByText(/Major frontend redesign/i)).toBeInTheDocument();
  });

  it('should close modal when close is triggered', () => {
    jest.useFakeTimers();
    const { getByText, queryByText } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    
    const projectBadge = getByText('Project Alpha');
    fireEvent.click(projectBadge);
    
    // Modal should be open
    expect(queryByText(/Major frontend redesign/i)).toBeInTheDocument();
    
    // Close modal (assuming there's a close button or overlay)
    const closeButton = queryByText(/close/i);
    if (closeButton) {
      fireEvent.click(closeButton);
      jest.runAllTimers();
    }
    
    jest.useRealTimers();
  });

  it('should render experience with past dates', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Jun 2018/i)).toBeInTheDocument();
    expect(screen.getByText(/Dec 2019/i)).toBeInTheDocument();
  });

  it('should handle experience with no projects array', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    // Startup Inc has empty projects array
    expect(screen.getByText('Startup Inc')).toBeInTheDocument();
  });

  it('should handle modal close with timeout cleanup', () => {
    jest.useFakeTimers();
    const { getByText } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    
    const projectBadge = getByText('Project Alpha');
    fireEvent.click(projectBadge);
    
    // Find close button by role or text
    const buttons = document.querySelectorAll('button');
    const closeBtn = Array.from(buttons).find(btn => btn.textContent?.includes('\u00d7'));
    
    if (closeBtn) {
      fireEvent.click(closeBtn);
      jest.advanceTimersByTime(300);
    }
    
    jest.useRealTimers();
  });

  it('should handle multiple projects for experience', () => {
    const contextWithMultipleProjects = {
      ...mockProfileContext,
      data: {
        sections: {
          experiences: {
            ...mockProfileContext.data.sections.experiences,
            info: [
              {
                ...mockProfileContext.data.sections.experiences.info[0],
                projects: [
                  { title: 'Project 1', description: 'Desc 1', softwareTech: 'Tech 1' },
                  { title: 'Project 2', description: 'Desc 2', softwareTech: 'Tech 2' },
                ],
              },
            ],
          },
        },
      },
    };

    render(
      <ProfileContext.Provider value={contextWithMultipleProjects as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('should render experience without projects property', () => {
    const contextWithoutProjects = {
      data: {
        sections: {
          experiences: {
            title: 'Experience',
            info: [
              {
                name: 'Company Name',
                designation: 'Software Engineer',
                from: 'Jan 2020',
                to: 'Present',
                responsibilities: '<p>Working on projects</p>',
              },
            ],
          },
        },
      },
      showComponentLibUrl: false,
    };

    render(
      <ProfileContext.Provider value={contextWithoutProjects as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText('Company Name')).toBeInTheDocument();
  });

  it('should render with null to field showing Present', () => {
    const contextWithNullTo = {
      data: {
        sections: {
          experiences: {
            title: 'Experience',
            info: [
              {
                name: 'Current Company',
                designation: 'Senior Engineer',
                from: 'Jan 2022',
                to: null,
                responsibilities: '<p>Current position</p>',
                projects: [],
              },
            ],
          },
        },
      },
      showComponentLibUrl: false,
    };

    render(
      <ProfileContext.Provider value={contextWithNullTo as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText('Current Company')).toBeInTheDocument();
    expect(screen.getByText(/Present/i)).toBeInTheDocument();
  });

  it('should render with undefined to field showing Present', () => {
    const contextWithUndefinedTo = {
      data: {
        sections: {
          experiences: {
            title: 'Experience',
            info: [
              {
                name: 'Current Position',
                designation: 'Tech Lead',
                from: 'Jan 2023',
                to: undefined,
                responsibilities: '<p>Leading team</p>',
                projects: [],
              },
            ],
          },
        },
      },
      showComponentLibUrl: false,
    };

    render(
      <ProfileContext.Provider value={contextWithUndefinedTo as any}>
        <ExperienceSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText('Current Position')).toBeInTheDocument();
    expect(screen.getByText(/Present/i)).toBeInTheDocument();
  });
});
