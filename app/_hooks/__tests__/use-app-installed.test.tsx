import { renderHook, act } from '@testing-library/react';
import useAppInstalled from '../use-app-installed';
import * as clientUtils from '@/_utils/profile/client';

// Mock the client utils
jest.mock('@/_utils/profile/client', () => ({
  getLocalStorage: jest.fn(),
}));

describe('useAppInstalled', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    (clientUtils.getLocalStorage as jest.Mock).mockReturnValue(false);
    
    // Spy on window event listeners
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should return true when app is installed in localStorage', () => {
    (clientUtils.getLocalStorage as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useAppInstalled());
    expect(result.current).toBe(true);
  });

  it('should return false when app is not installed', () => {
    (clientUtils.getLocalStorage as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useAppInstalled());
    expect(result.current).toBe(false);
  });

  it('should attach event listener on mount', () => {
    renderHook(() => useAppInstalled());
    expect(addEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));
  });

  it('should update state when appinstalled event fires', () => {
    const { result } = renderHook(() => useAppInstalled());
    expect(result.current).toBe(false);

    // Simulate appinstalled event
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current).toBe(true);
  });

  it('should cleanup event listener on unmount', () => {
    const { unmount } = renderHook(() => useAppInstalled());
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));
  });
});
