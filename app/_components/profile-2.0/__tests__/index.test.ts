import {
  Profile2,
  Avatar,
  Card,
  CardHeader,
  CardContent,
  Button,
  ContactInfo,
  SkillBadge,
  SimpleSkillTag,
  HeroSection,
  AboutSection,
  SkillsSection,
  ExperienceSection,
  EducationSection,
  OpenSourceSection,
} from '../index';

describe('Profile 2.0 index exports', () => {
  it('should export Profile2 component', () => {
    expect(Profile2).toBeDefined();
  });

  it('should export Avatar component', () => {
    expect(Avatar).toBeDefined();
  });

  it('should export Card components', () => {
    expect(Card).toBeDefined();
    expect(CardHeader).toBeDefined();
    expect(CardContent).toBeDefined();
  });

  it('should export Button component', () => {
    expect(Button).toBeDefined();
  });

  it('should export ContactInfo component', () => {
    expect(ContactInfo).toBeDefined();
  });

  it('should export SkillBadge components', () => {
    expect(SkillBadge).toBeDefined();
    expect(SimpleSkillTag).toBeDefined();
  });

  it('should export section components', () => {
    expect(HeroSection).toBeDefined();
    expect(AboutSection).toBeDefined();
    expect(SkillsSection).toBeDefined();
    expect(ExperienceSection).toBeDefined();
    expect(EducationSection).toBeDefined();
    expect(OpenSourceSection).toBeDefined();
  });
});
