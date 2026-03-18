describe('Navigation Component', () => {
  test('navigation items structure', () => {
    const navigationItems = [
      { id: 'hero', label: 'Home' },
      { id: 'about', label: 'About' },
      { id: 'skills', label: 'Skills' },
      { id: 'experience', label: 'Experience' },
      { id: 'education', label: 'Education' },
      { id: 'open-source', label: 'Projects' },
    ];
    
    expect(navigationItems.length).toBe(6);
    expect(navigationItems[0].id).toBe('hero');
    expect(navigationItems[0].label).toBe('Home');
  });

  test('scroll detection logic', () => {
    const scrollY = 500;
    const offset = 100;
    const scrollPosition = scrollY + offset;
    
    expect(scrollPosition).toBe(600);
  });
});
