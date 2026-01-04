import React from 'react';
import { render, screen } from '@testing-library/react';
import SkillBadge, { SimpleSkillTag } from '../SkillBadge';

describe('SkillBadge', () => {
  it('should render skill label', () => {
    render(<SkillBadge label="React" rating={5} />);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('should render with different skill ratings', () => {
    const { rerender } = render(<SkillBadge label="JavaScript" rating={1} />);
    expect(screen.getByText('JavaScript')).toBeInTheDocument();

    rerender(<SkillBadge label="JavaScript" rating={3} />);
    expect(screen.getByText('JavaScript')).toBeInTheDocument();

    rerender(<SkillBadge label="JavaScript" rating={5} />);
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('should handle rating 1 (beginner)', () => {
    render(<SkillBadge label="Python" rating={1} />);
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('should handle rating 3 (intermediate)', () => {
    render(<SkillBadge label="TypeScript" rating={3} />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('should handle rating 5 (expert)', () => {
    render(<SkillBadge label="Node.js" rating={5} />);
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('should render multiple skill badges', () => {
    render(
      <>
        <SkillBadge label="React" rating={5} />
        <SkillBadge label="Vue" rating={4} />
        <SkillBadge label="Angular" rating={3} />
      </>
    );
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
    expect(screen.getByText('Angular')).toBeInTheDocument();
  });

  it('should apply custom className if provided', () => {
    const { container } = render(
      <SkillBadge label="Docker" rating={4} className="custom-badge" />
    );
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(container.querySelector('.custom-badge')).toBeInTheDocument();
  });

  it('should render without rating', () => {
    render(<SkillBadge label="AWS" />);
    expect(screen.getByText('AWS')).toBeInTheDocument();
  });

  it('should render with rating 0', () => {
    render(<SkillBadge label="Beginner" rating={0} />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  it('should render with rating 2', () => {
    render(<SkillBadge label="Learning" rating={2} />);
    expect(screen.getByText('Learning')).toBeInTheDocument();
  });

  it('should render with rating 4', () => {
    render(<SkillBadge label="Advanced" rating={4} />);
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('should render multiple badges with same rating', () => {
    render(
      <>
        <SkillBadge label="Skill A" rating={5} />
        <SkillBadge label="Skill B" rating={5} />
        <SkillBadge label="Skill C" rating={5} />
      </>
    );
    expect(screen.getByText('Skill A')).toBeInTheDocument();
    expect(screen.getByText('Skill B')).toBeInTheDocument();
    expect(screen.getByText('Skill C')).toBeInTheDocument();
  });

  it('should render with className and rating', () => {
    const { container } = render(
      <SkillBadge label="Styled" rating={3} className="test-class" />
    );
    expect(screen.getByText('Styled')).toBeInTheDocument();
    expect(container.querySelector('.test-class')).toBeInTheDocument();
  });

  it('should render with className but no rating', () => {
    const { container } = render(
      <SkillBadge label="NoRating" className="no-rating-class" />
    );
    expect(screen.getByText('NoRating')).toBeInTheDocument();
    expect(container.querySelector('.no-rating-class')).toBeInTheDocument();
  });

  it('should handle all possible rating values (0-5)', () => {
    [0, 1, 2, 3, 4, 5].forEach(rating => {
      const { unmount } = render(<SkillBadge label={`Rating-${rating}`} rating={rating} />);
      expect(screen.getByText(`Rating-${rating}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('should render badge without any optional props', () => {
    render(<SkillBadge label="Minimal" />);
    expect(screen.getByText('Minimal')).toBeInTheDocument();
  });
});

describe('SimpleSkillTag', () => {
  it('should render simple skill tag', () => {
    render(<SimpleSkillTag label="Docker" />);
    expect(screen.getByText('Docker')).toBeInTheDocument();
  });

  it('should render simple skill tag with className', () => {
    const { container } = render(<SimpleSkillTag label="Kubernetes" className="custom" />);
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    expect(container.querySelector('.custom')).toBeInTheDocument();
  });
});
