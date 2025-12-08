# Profile 2.0 - Component Architecture

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Profile 2.0 Page                        │
│                      (app/profile-2.0/page.tsx)                 │
│                                                                 │
│  - Fetches data from ProfileLayoutContext                      │
│  - Manages device detection                                    │
│  - Configures profileContext                                   │
│  - Dynamically imports Profile2 component                      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Profile2 Component                        │
│            (app/_components/profile-2.0/Profile2.tsx)           │
│                                                                 │
│  - Main container with ProfileProvider                         │
│  - Manages scroll-to-top state                                 │
│  - Renders all sections in order                               │
│  - Provides floating background shapes                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Section Layer                           │
│                                                                 │
│  ┌───────────────────┐  ┌───────────────────┐                 │
│  │   HeroSection     │  │   AboutSection    │                 │
│  │                   │  │                   │                 │
│  │ • Avatar          │  │ • Card            │                 │
│  │ • Name/Role       │  │ • ContactInfo     │                 │
│  │ • Description     │  │ • Grid Layout     │                 │
│  │ • Scroll Indicator│  │                   │                 │
│  └───────────────────┘  └───────────────────┘                 │
│                                                                 │
│  ┌───────────────────┐  ┌───────────────────┐                 │
│  │  SkillsSection    │  │ ExperienceSection │                 │
│  │                   │  │                   │                 │
│  │ • Card            │  │ • Timeline        │                 │
│  │ • SkillBadge      │  │ • Card            │                 │
│  │ • Categories      │  │ • SimpleSkillTag  │                 │
│  │ • Grid Layout     │  │                   │                 │
│  └───────────────────┘  └───────────────────┘                 │
│                                                                 │
│  ┌───────────────────┐  ┌───────────────────┐                 │
│  │ EducationSection  │  │ OpenSourceSection │                 │
│  │                   │  │                   │                 │
│  │ • Card            │  │ • Card            │                 │
│  │ • CardHeader      │  │ • Button          │                 │
│  │ • CardContent     │  │ • Grid Layout     │                 │
│  └───────────────────┘  └───────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Shared Components Layer                    │
│              (app/_components/profile-2.0/shared)               │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Avatar  │  │   Card   │  │  Button  │  │ Contact  │      │
│  │          │  │          │  │          │  │   Info   │      │
│  │ • Border │  │ • Header │  │ • Ripple │  │ • Copy   │      │
│  │ • Status │  │ • Content│  │ • Variant│  │ • Icons  │      │
│  │ • Hover  │  │ • Hover  │  │ • Sizes  │  │ • Links  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  ┌──────────┐                                                  │
│  │  Skill   │                                                  │
│  │  Badge   │                                                  │
│  │          │                                                  │
│  │ • Stars  │                                                  │
│  │ • Simple │                                                  │
│  │ • Hover  │                                                  │
│  └──────────┘                                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                              │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              ProfileLayoutContext                       │   │
│  │         (app/_store/profile/layout/context.ts)         │   │
│  │                                                         │   │
│  │  • profileData (IProfileData)                          │   │
│  │  • preloadedAssets                                     │   │
│  │  • hasError                                            │   │
│  └────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   CMS Data Files                        │   │
│  │                    (cms/*.json)                         │   │
│  │                                                         │   │
│  │  • profile-sections.json                               │   │
│  │  • skills.json                                         │   │
│  │  • brillio-experience.json                             │   │
│  │  • lilly-experience.json                               │   │
│  │  • scgbs-experience.json                               │   │
│  │  • links.json                                          │   │
│  │  • config.json                                         │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

```
CMS Files → ProfileLayoutContext → Profile2 Page → Profile2 Component → Section Components → Shared Components
```

1. **CMS Files**: JSON data stored in `/cms` folder
2. **ProfileLayoutContext**: Provides data to all profile pages
3. **Profile2 Page**: Route handler, fetches and prepares data
4. **Profile2 Component**: Main container with ProfileProvider
5. **Section Components**: Feature-specific sections (Hero, About, Skills, etc.)
6. **Shared Components**: Reusable UI elements (Cards, Buttons, Badges, etc.)

## 📦 Component Dependencies

### Profile2.tsx
```typescript
Dependencies:
├── ProfileProvider (from @/_store/profile/page/context)
├── IProfileContext (from @/_store/profile/types)
├── HeroSection
├── AboutSection
├── SkillsSection
├── ExperienceSection
├── EducationSection
└── OpenSourceSection
```

### Section Components
```typescript
HeroSection:
├── ProfileContext
├── Avatar
└── DisplayPic (asset)

AboutSection:
├── ProfileContext
├── Card (with CardHeader, CardContent)
└── ContactInfo

SkillsSection:
├── ProfileContext
├── Card
└── SkillBadge

ExperienceSection:
├── ProfileContext
├── Card
└── SimpleSkillTag

EducationSection:
├── ProfileContext
└── Card (with CardHeader, CardContent)

OpenSourceSection:
├── ProfileContext
├── Card
└── Button
```

### Shared Components
```typescript
Avatar:
└── styled-components

Card:
├── CardHeader (sub-component)
├── CardContent (sub-component)
└── styled-components

Button:
└── styled-components

ContactInfo:
└── styled-components

SkillBadge:
├── SimpleSkillTag (variant)
└── styled-components
```

## 🎯 Component Responsibilities

### Profile2 Component
**Purpose**: Main orchestrator and layout manager

**Responsibilities**:
- Wrap sections with ProfileProvider
- Manage scroll-to-top functionality
- Provide page-level styling and background
- Render sections in correct order

**State**: `showScrollTop` (boolean)

### HeroSection
**Purpose**: First impression and introduction

**Responsibilities**:
- Display avatar with animations
- Show name, role, and description
- Animated gradient background
- Scroll indicator for navigation

**Data Used**: `header` (name, currentJobRole, shortDesc)

### AboutSection
**Purpose**: Personal information and contact details

**Responsibilities**:
- Display about me text
- Show contact information in grid
- Enable copy-to-clipboard for contact info
- Responsive layout switching

**Data Used**: `sections.aboutMe`, `sections.details`

### SkillsSection
**Purpose**: Showcase technical skills with proficiency

**Responsibilities**:
- Categorize skills by rating level
- Display skill badges with star ratings
- Sort skills by proficiency
- Responsive wrapping layout

**Data Used**: `sections.skills`

### ExperienceSection
**Purpose**: Professional experience timeline

**Responsibilities**:
- Render vertical timeline
- Display experience cards with projects
- Show tech stack for each project
- Staggered animations

**Data Used**: `sections.experiences`

### EducationSection
**Purpose**: Academic background

**Responsibilities**:
- Display education information
- Clean card presentation
- Support multi-line content

**Data Used**: `sections.education`

### OpenSourceSection
**Purpose**: Project showcase

**Responsibilities**:
- Grid layout of project cards
- Link to GitHub and NPM
- Display tech stack
- Interactive hover states

**Data Used**: `sections.openSourceProjects`

## 🎨 Styling Architecture

### Theme Consistency
All components follow a unified design system:

```typescript
// Color System
Primary Gradient: #667eea → #764ba2
Secondary Gradient: #f093fb → #f5576c
Text Dark: #1f2937
Text Medium: #4b5563
Text Light: #6b7280

// Spacing Scale
Gap Sizes: 8px, 12px, 16px, 24px, 32px, 48px
Card Padding: 32px (desktop) → 20px (mobile)
Section Padding: 80px vertical (desktop) → 40px (mobile)

// Border Radius
Small: 8px-12px
Medium: 16px-20px
Large: 24px
Full: 50% (circles)

// Shadows
Light: 0 2px 8px rgba(0, 0, 0, 0.08)
Medium: 0 4px 15px rgba(102, 126, 234, 0.3)
Strong: 0 10px 40px rgba(0, 0, 0, 0.12)

// Transitions
Quick: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Medium: 0.6s ease-out
Slow: 1s ease-out
```

### Responsive Strategy

```typescript
// Mobile First Approach
Base styles → Mobile (< 480px)
  ↓
Medium breakpoint → Tablet (480px - 768px)
  ↓
Large breakpoint → Desktop (> 768px)
```

## 🔧 State Management

```typescript
// Page Level (profile-2.0/page.tsx)
- Device detection (isMobile)
- Client-side rendering check (isClient)
- Profile data fetching status

// Component Level (Profile2.tsx)
- Scroll position (showScrollTop)
- Modal states (inherited, not actively used)

// Section Level
- Local animation states
- Hover states (CSS-based)

// Shared Components
- Copy feedback (ContactInfo)
- Button ripple effects (CSS-based)
```

## 📱 Responsive Behavior

```typescript
// Container Widths
max-width: 1200px (all sections)
padding: 20px (horizontal, all breakpoints)

// Grid Layouts
Desktop: multi-column grids
Tablet: reduced columns or single column
Mobile: single column, stacked layout

// Typography
Desktop: Larger font sizes
Tablet: Medium font sizes
Mobile: Smallest font sizes with good readability

// Spacing
Desktop: Generous spacing (80px, 48px, 32px)
Tablet: Medium spacing (60px, 36px, 24px)
Mobile: Compact spacing (40px, 28px, 20px)
```

## 🧩 Component Composition Patterns

### Container-Presentational Pattern
```typescript
// Container (Profile2.tsx)
- Manages state and logic
- Provides context
- Handles data flow

// Presentational (Section Components)
- Receive data via context
- Focus on rendering
- Minimal logic
```

### Composition Pattern
```typescript
// Card Component
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Flexible and reusable
// Each part can be styled independently
```

### Render Props Pattern
```typescript
// Not heavily used, but available for complex scenarios
// Example: Custom rendering of skill categories
```

## 🚀 Performance Optimizations

```typescript
// Code Splitting
- Dynamic import of Profile2 component
- Lazy loading on route navigation

// React Optimization
- useMemo for sorted/filtered data
- useCallback for event handlers (where needed)
- Context optimization (single provider)

// CSS Optimization
- GPU-accelerated transforms
- Will-change hints for animations
- Efficient selectors
```

## 🔒 Type Safety

```typescript
// All components fully typed
interface ComponentProps {
  // Strict prop definitions
}

// Context typed
const ProfileContext = React.createContext<IProfileContext>()

// Styled components typed
const StyledComponent = styled.div<{ $prop: string }>`
  // Type-safe props with $ prefix
`
```

## 📋 Testing Recommendations

```typescript
// Unit Tests
- Test shared components in isolation
- Mock ProfileContext
- Test responsive behavior

// Integration Tests
- Test section components with real context
- Verify data flows correctly
- Test animations and transitions

// E2E Tests
- Full page rendering
- User interactions (clicks, scrolls)
- Responsive layouts
- Cross-browser compatibility
```

---

This architecture provides a solid foundation for a maintainable, scalable, and performant profile page. The modular design allows easy updates and additions without affecting other components.
