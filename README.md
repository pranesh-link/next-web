# Profile - Modern Portfolio Platform

A modern, responsive portfolio application built with Next.js 15, featuring a comprehensive profile component system with glassmorphism design and rich interactions.

## ✨ Features

### Profile Component Architecture

- **🎨 Modern Design System**: Glassmorphism aesthetics with smooth gradients and animations
- **📱 Fully Responsive**: Mobile-first design with adaptive layouts for all screen sizes
- **♿ Accessibility Focused**: ARIA labels, semantic HTML, and keyboard navigation support
- **🎭 Rich Interactions**: Smooth scrolling, animated transitions, and interactive project modals
- **📊 Test Coverage**: 95%+ coverage with 200 passing tests across all components

### Key Components

#### Navigation
- **Desktop Navigation**: Smooth scrolling with active section detection using IntersectionObserver
- **Mobile Menu**: Slide-in hamburger menu with overlay for mobile devices
- **Scroll Behavior**: Dynamic navigation styling based on scroll position

#### Content Sections
- **Hero Section**: Animated introduction with gradient background and scroll indicator
- **About Section**: Personal information with icon-based contact details
- **Skills Section**: Star-rated skill badges with category filtering (Expert, Proficient, Learning)
- **Experience Section**: Timeline-based experience visualization with interactive project cards
- **Education Section**: Academic background with institution details
- **Open Source Section**: GitHub projects showcase with technology tags
- **Contact Section**: Sticky footer with social links and contact information

#### Shared Components
- **Avatar**: Size-variant avatar with glassmorphism effects and hover animations
- **Button**: Multi-variant button system (Primary, Secondary, Outline, Ghost) with ripple effects
- **Card**: Glassmorphism card container with optional hover effects
- **ProjectModal**: Full-screen modal for project details with tech stack visualization
- **SkillBadge**: Visual skill representation with star ratings
- **ContactInfo**: Copy-to-clipboard contact information display

### Architecture Highlights

- **Elements Pattern**: Styled-components separated into `*Elements.tsx` files for clean separation of concerns
- **Context API**: ProfileProvider for state management across components
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Performance**: Optimized with lazy loading, memoization, and efficient re-renders

## Test Coverage

<!-- COVERAGE-BADGES:START -->
![Coverage: Statements](https://img.shields.io/badge/Statements-95.18%25-brightgreen)
![Coverage: Branches](https://img.shields.io/badge/Branches-100%25-brightgreen)
![Coverage: Functions](https://img.shields.io/badge/Functions-95.52%25-brightgreen)
![Coverage: Lines](https://img.shields.io/badge/Lines-98.23%25-brightgreen)
<!-- COVERAGE-BADGES:END -->

**Total Tests:** 200 passing tests across 18 test suites

### Coverage Details
- **95.18% Statements** - Nearly all code paths executed in tests
- **100% Branches** - Perfect branch coverage across all conditional logic
- **95.52% Functions** - Comprehensive function testing
- **98.23% Lines** - Excellent line coverage

Coverage is automatically updated on version releases via GitHub Actions.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run Profile tests specifically
npm test -- --testPathPattern=profile-2.0
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm, yarn, pnpm, or bun

### Development

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Open the application:**
   Navigate to [http://localhost:3737](http://localhost:3737)

### Available Scripts

```bash
npm run dev          # Start development server on port 3737
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run test suite
npm run test:coverage # Run tests with coverage report
npm run lint         # Run ESLint
```

## 📁 Project Structure

```
app/_components/profile-2.0/
├── Profile2.tsx              # Main profile component
├── navigation/               # Navigation components
│   ├── Navigation.tsx        # Desktop navigation
│   ├── NavigationElements.tsx
│   ├── MobileMenu.tsx        # Mobile hamburger menu
│   └── MobileMenuElements.tsx
├── sections/                 # Content sections
│   ├── HeroSection.tsx       # Hero/intro section
│   ├── AboutSection.tsx      # About me section
│   ├── SkillsSection.tsx     # Skills with ratings
│   ├── ExperienceSection.tsx # Work experience timeline
│   ├── EducationSection.tsx  # Education background
│   ├── OpenSourceSection.tsx # GitHub projects
│   └── ContactSection.tsx    # Contact information
└── shared/                   # Reusable components
    ├── Avatar.tsx            # Avatar component
    ├── AvatarElements.tsx
    ├── Button.tsx            # Button component
    ├── ButtonElements.tsx
    ├── Card.tsx              # Card container
    ├── CardElements.tsx
    ├── ContactInfo.tsx       # Contact info display
    ├── ContactInfoElements.tsx
    ├── ProjectModal.tsx      # Project details modal
    ├── ProjectModalElements.tsx
    ├── SkillBadge.tsx        # Skill badge with stars
    └── SkillBadgeElements.tsx
```

## 🎨 Design Philosophy

### Glassmorphism & Modern Aesthetics
- Semi-transparent backgrounds with backdrop blur effects
- Gradient overlays and smooth color transitions
- Floating animated shapes for visual depth
- Card-based modular content architecture

### Responsive Design
- **Mobile First**: Optimized for mobile devices (320px+)
- **Breakpoints**: 
  - Mobile: < 768px (hamburger menu, single column)
  - Tablet: 768px - 1024px (adjusted spacing)
  - Desktop: > 1024px (full navigation, multi-column layouts)

### Accessibility
- Semantic HTML5 elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliant

### Performance
- Styled-components with CSS-in-JS
- Optimized animations using CSS transforms
- Efficient re-renders with React.memo where applicable
- IntersectionObserver for scroll-based interactions

## 🧪 Testing Strategy

### Test Coverage by Component

| Component | Statements | Branches | Functions | Lines |
|-----------|-----------|----------|-----------|-------|
| Navigation | 100% | 100% | 100% | 100% |
| Avatar | 100% | 100% | 100% | 100% |
| Button | 100% | 100% | 100% | 100% |
| ContactInfo | 100% | 100% | 100% | 100% |
| SkillBadge | 100% | 100% | 100% | 100% |
| MobileMenu | 94.44% | 100% | 86.66% | 94.11% |
| ExperienceSection | 95.45% | 100% | 100% | 100% |
| HeroSection | 92.3% | 100% | 100% | 100% |
| OpenSourceSection | 93.33% | 100% | 100% | 100% |
| ContactSection | 94.11% | 100% | 100% | 100% |

### Testing Frameworks
- **Jest**: Test runner with jsdom environment
- **React Testing Library**: Component testing with user-centric approach
- **@testing-library/user-event**: User interaction simulation

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.8 with App Router
- **Language**: TypeScript 5.x
- **Styling**: Styled-components 6.1.8
- **State Management**: React Context API with custom providers
- **Testing**: Jest 29.7.0 + React Testing Library 16.0.1
- **CI/CD**: GitHub Actions for automated testing and coverage reporting

## 📊 Continuous Integration

### GitHub Actions Workflows

1. **Test Coverage** (`.github/workflows/test-coverage.yml`)
   - Triggers on version tags and pull requests
   - Runs full test suite with coverage
   - Updates README badges on version releases
   - Posts coverage reports on PRs

2. **Build** (`.github/workflows/build.yml`)
   - Validates build on master branch pushes
   - Ensures production build succeeds

3. **Version Bump** (`.github/workflows/version-bump.yml`)
   - Automated semantic versioning
   - Creates git tags for releases
