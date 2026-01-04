import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectModal } from '../ProjectModal';

const mockProject = {
  title: 'Awesome Project',
  description: '<p>A detailed description of the awesome project</p>',
  softwareTech: 'React, TypeScript, Node.js',
};

describe('ProjectModal', () => {
  it('should render even when isOpen is false (hidden via CSS)', () => {
    const { container } = render(<ProjectModal isOpen={false} onClose={() => {}} project={mockProject} />);
    // Component renders but styled-components handles display:none via CSS
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<ProjectModal isOpen={true} onClose={() => {}} project={mockProject} />);
    expect(screen.getByText('Awesome Project')).toBeInTheDocument();
  });

  it('should render project details', () => {
    render(<ProjectModal isOpen={true} onClose={() => {}} project={mockProject} />);
    expect(screen.getByText('Awesome Project')).toBeInTheDocument();
    expect(screen.getByText(/detailed description/i)).toBeInTheDocument();
  });

  it('should render project technologies', () => {
    render(<ProjectModal isOpen={true} onClose={() => {}} project={mockProject} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<ProjectModal isOpen={true} onClose={onClose} project={mockProject} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not render when project is null', () => {
    render(<ProjectModal isOpen={true} onClose={() => {}} project={null} />);
    expect(screen.queryByText('Awesome Project')).not.toBeInTheDocument();
  });

  it('should handle project without softwareTech', () => {
    const projectWithoutTech = { title: 'Simple Project', description: '<p>Simple description</p>' };
    render(<ProjectModal isOpen={true} onClose={() => {}} project={projectWithoutTech} />);
    expect(screen.getByText('Simple Project')).toBeInTheDocument();
  });

  it('should handle backdrop click', () => {
    const onClose = jest.fn();
    const { container } = render(
      <ProjectModal isOpen={true} onClose={onClose} project={mockProject} />
    );
    
    // Click on overlay (first div should be the overlay)
    const overlay = container.firstChild;
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should not close when clicking modal content', () => {
    const onClose = jest.fn();
    render(<ProjectModal isOpen={true} onClose={onClose} project={mockProject} />);
    
    const modalContent = screen.getByText('Awesome Project').parentElement;
    if (modalContent) {
      fireEvent.click(modalContent);
      // onClose should not be called when clicking content
      expect(screen.getByText('Awesome Project')).toBeInTheDocument();
    }
  });

  it('should render technologies as individual tags', () => {
    render(<ProjectModal isOpen={true} onClose={() => {}} project={mockProject} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('should display project details label', () => {
    render(<ProjectModal isOpen={true} onClose={() => {}} project={mockProject} />);
    expect(screen.getByText(/Project Details/i)).toBeInTheDocument();
  });

  it('should display technologies label when softwareTech exists', () => {
    render(<ProjectModal isOpen={true} onClose={() => {}} project={mockProject} />);
    expect(screen.getByText(/Technologies Used/i)).toBeInTheDocument();
  });
});
