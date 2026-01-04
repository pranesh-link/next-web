import { Navigation, MobileMenu, NavigationDefault, MobileMenuDefault } from '../index';

describe('Navigation index exports', () => {
  it('should export Navigation component', () => {
    expect(Navigation).toBeDefined();
  });

  it('should export MobileMenu component', () => {
    expect(MobileMenu).toBeDefined();
  });

  it('should export NavigationDefault', () => {
    expect(NavigationDefault).toBeDefined();
  });

  it('should export MobileMenuDefault', () => {
    expect(MobileMenuDefault).toBeDefined();
  });

  it('should have Navigation and NavigationDefault reference same component', () => {
    expect(Navigation).toBe(NavigationDefault);
  });

  it('should have MobileMenu and MobileMenuDefault reference same component', () => {
    expect(MobileMenu).toBe(MobileMenuDefault);
  });
});
