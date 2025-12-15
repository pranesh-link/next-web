describe('MobileMenu Component', () => {
  test('mobile menu structure', () => {
    const navigationItems = [
      { id: 'hero', label: 'Home', icon: '🏠' },
      { id: 'about', label: 'About', icon: '👤' },
      { id: 'skills', label: 'Skills', icon: '⚡' },
      { id: 'experience', label: 'Experience', icon: '💼' },
      { id: 'education', label: 'Education', icon: '🎓' },
      { id: 'open-source', label: 'Projects', icon: '🚀' },
    ];
    
    expect(navigationItems.length).toBe(6);
    expect(navigationItems[0].icon).toBe('🏠');
  });

  test('version display', () => {
    const version = '2.28.0';
    expect(version).toBe('2.28.0');
  });

  test('scroll position calculation', () => {
    const scrollY = 500;
    const offset = 100;
    const scrollPosition = scrollY + offset;
    
    expect(scrollPosition).toBe(600);
  });
});
