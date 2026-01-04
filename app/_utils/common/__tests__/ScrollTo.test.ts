import { scrollTo } from '../ScrollTo';

describe('ScrollTo Utility', () => {
  let requestAnimationFrameSpy: jest.SpyInstance;
  let scrollToSpy: jest.SpyInstance;
  let querySelectorSpy: jest.SpyInstance;

  beforeEach(() => {
    let frameTime = 0;
    let callCount = 0;
    // Mock requestAnimationFrame with time progression and call limit
    requestAnimationFrameSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        // Limit calls to prevent infinite loops
        if (callCount++ < 100) {
          frameTime += 100; // Progress by 100ms each frame
          callback(frameTime);
        }
        return callCount;
      });

    // Mock window.scrollTo
    scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

    // Mock querySelector
    querySelectorSpy = jest.spyOn(document, 'querySelector');

    // Mock window properties
    Object.defineProperty(window, 'pageYOffset', {
      writable: true,
      value: 0,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 800,
    });

    Object.defineProperty(document.body, 'scrollHeight', {
      writable: true,
      value: 2000,
    });
  });

  afterEach(() => {
    requestAnimationFrameSpy.mockRestore();
    scrollToSpy.mockRestore();
    querySelectorSpy.mockRestore();
  });

  it('should scroll to element when found', () => {
    const mockElement = {
      getBoundingClientRect: () => ({ top: 500 }),
    };
    querySelectorSpy.mockReturnValue(mockElement);

    scrollTo('#test-section');

    expect(querySelectorSpy).toHaveBeenCalledWith('#test-section');
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('should try to scroll even when element is not found', () => {
    querySelectorSpy.mockReturnValue(null);

    scrollTo('#nonexistent');

    expect(querySelectorSpy).toHaveBeenCalledWith('#nonexistent');
    // When element is not found, getElementY returns 0
    // diff = targetY - startingY - offset = 0 - 0 - 80 = -80
    // Since diff !== 0, scrollTo will be called
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('should not scroll when already at target position', () => {
    const mockElement = {
      getBoundingClientRect: () => ({ top: 80 }), // offset is 80, so diff would be 0
    };
    querySelectorSpy.mockReturnValue(mockElement);

    scrollTo('.section');

    // diff = 0, so function returns early without scrolling
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('should scroll with custom offset when provided', () => {
    const mockElement = {
      getBoundingClientRect: () => ({ top: 200 }),
    };
    querySelectorSpy.mockReturnValue(mockElement);

    scrollTo('.section', 120);

    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('should scroll with custom duration when provided', () => {
    const mockElement = {
      getBoundingClientRect: () => ({ top: 200 }),
    };
    querySelectorSpy.mockReturnValue(mockElement);

    scrollTo('.section', 80, 1000);

    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('should handle scrolling to bottom of page', () => {
    const mockElement = {
      getBoundingClientRect: () => ({ top: 1800 }),
    };
    querySelectorSpy.mockReturnValue(mockElement);

    scrollTo('.bottom-section');

    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('should handle different query selectors', () => {
    const mockElement = {
      getBoundingClientRect: () => ({ top: 200 }),
    };
    querySelectorSpy.mockReturnValue(mockElement);

    // Test with ID
    scrollTo('#header');
    expect(querySelectorSpy).toHaveBeenCalledWith('#header');

    // Test with class
    scrollTo('.section');
    expect(querySelectorSpy).toHaveBeenCalledWith('.section');

    // Test with data attribute
    scrollTo('[data-section="about"]');
    expect(querySelectorSpy).toHaveBeenCalledWith('[data-section="about"]');
  });
});
