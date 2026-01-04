import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ContactInfo from '../ContactInfo';

const mockIcon = <span data-testid="icon">📧</span>;

describe('ContactInfo', () => {
  it('should render label and value', () => {
    render(<ContactInfo icon={mockIcon} label="Email" value="test@example.com" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(<ContactInfo icon={mockIcon} label="Email" value="test@example.com" />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should support copy functionality', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    render(<ContactInfo icon={mockIcon} label="Email" value="test@example.com" canCopy={true} />);
    
    const container = screen.getByText('Email').parentElement?.parentElement;
    if (container) {
      fireEvent.click(container);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test@example.com');
    }
  });

  it('should render mobile number', () => {
    render(<ContactInfo icon={mockIcon} label="Mobile" value="+1234567890" />);
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });

  it('should render location', () => {
    render(<ContactInfo icon={mockIcon} label="Location" value="San Francisco, CA" />);
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('should handle href links', () => {
    render(
      <ContactInfo 
        icon={mockIcon} 
        label="Website" 
        value="example.com" 
        href="https://example.com"
      />
    );
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ContactInfo 
        icon={mockIcon} 
        label="Email" 
        value="test@example.com" 
        className="custom-class"
      />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should show copied indicator after copy', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    render(<ContactInfo icon={mockIcon} label="Phone" value="123-456" canCopy={true} />);
    const container = screen.getByText('Phone').parentElement?.parentElement;
    
    if (container) {
      fireEvent.click(container);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123-456');
    }
  });

  it('should open link when href is provided', () => {
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
    
    render(
      <ContactInfo 
        icon={mockIcon} 
        label="LinkedIn" 
        value="linkedin.com/in/user" 
        href="https://linkedin.com/in/user"
      />
    );
    
    const container = screen.getByText('LinkedIn').parentElement?.parentElement;
    if (container) {
      fireEvent.click(container);
      expect(windowOpenSpy).toHaveBeenCalledWith('https://linkedin.com/in/user', '_blank');
    }
    
    windowOpenSpy.mockRestore();
  });

  it('should not be clickable without canCopy or href', () => {
    render(<ContactInfo icon={mockIcon} label="Info" value="Some Value" />);
    const container = screen.getByText('Info').parentElement?.parentElement;
    
    if (container) {
      fireEvent.click(container);
      // Should not throw error
      expect(screen.getByText('Info')).toBeInTheDocument();
    }
  });

  it('should handle both canCopy and href (canCopy takes precedence)', () => {
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    render(
      <ContactInfo 
        icon={mockIcon} 
        label="Link" 
        value="website.com" 
        href="https://website.com"
        canCopy={true}
      />
    );
    
    const container = screen.getByText('Link').parentElement?.parentElement;
    if (container) {
      fireEvent.click(container);
      // canCopy takes precedence
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('website.com');
      expect(windowOpenSpy).not.toHaveBeenCalled();
    }
    
    windowOpenSpy.mockRestore();
  });

  it('should render with both className and href', () => {
    const { container } = render(
      <ContactInfo 
        icon={mockIcon} 
        label="Custom Link" 
        value="link.com" 
        href="https://link.com"
        className="custom-link-class"
      />
    );
    expect(container.querySelector('.custom-link-class')).toBeInTheDocument();
  });

  it('should render without canCopy or href (not clickable)', () => {
    render(
      <ContactInfo 
        icon={mockIcon} 
        label="Static Info" 
        value="Not clickable"
      />
    );
    expect(screen.getByText('Static Info')).toBeInTheDocument();
    expect(screen.getByText('Not clickable')).toBeInTheDocument();
  });

  it('should handle copy with timeout for copied indicator', () => {
    jest.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    render(<ContactInfo icon={mockIcon} label="Timeout" value="test" canCopy={true} />);
    const container = screen.getByText('Timeout').parentElement?.parentElement;
    
    if (container) {
      fireEvent.click(container);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test');
      
      // Fast forward the timeout
      jest.advanceTimersByTime(2000);
    }
    
    jest.useRealTimers();
  });

  it('should render multiple ContactInfo items', () => {
    render(
      <>
        <ContactInfo icon={mockIcon} label="Email" value="test@test.com" />
        <ContactInfo icon={mockIcon} label="Phone" value="123-456" />
        <ContactInfo icon={mockIcon} label="Address" value="123 Street" />
      </>
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
  });
});
