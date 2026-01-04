import React from 'react';
import { render, screen } from '@testing-library/react';
import { EducationSection } from '../EducationSection';
import { ProfileContext } from '@/_store/profile/page/context';

const mockProfileContext = {
  data: {
    sections: {
      education: {
        title: 'Education',
        info: '<div><strong>Bachelor of Science in Computer Science</strong><br/>University of Technology, 2015 - 2019<br/>Graduated with honors</div><div><strong>Master of Science in Software Engineering</strong><br/>Tech University, 2019 - 2021<br/>Focus on distributed systems</div>',
      },
    },
  },
  showComponentLibUrl: false,
};

describe('EducationSection', () => {
  it('should render without crashing', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <EducationSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Education/i)).toBeInTheDocument();
  });

  it('should render all education entries', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <EducationSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/Bachelor of Science/i)).toBeInTheDocument();
    expect(screen.getByText(/Master of Science/i)).toBeInTheDocument();
  });

  it('should render institution names', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <EducationSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/University of Technology/i)).toBeInTheDocument();
    expect(screen.getByText(/Tech University/i)).toBeInTheDocument();
  });

  it('should render education years', () => {
    render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <EducationSection />
      </ProfileContext.Provider>
    );
    expect(screen.getByText(/2015 - 2019/i)).toBeInTheDocument();
    expect(screen.getByText(/2019 - 2021/i)).toBeInTheDocument();
  });

  it('should have scroll anchor', () => {
    const { container } = render(
      <ProfileContext.Provider value={mockProfileContext as any}>
        <EducationSection />
      </ProfileContext.Provider>
    );
    const anchor = container.querySelector('#education');
    expect(anchor).toBeInTheDocument();
  });
});
