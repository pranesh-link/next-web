const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  collectCoverageFrom: [
    'app/_components/profile-2.0/**/*.{ts,tsx}',
    '!app/_components/profile-2.0/**/*.d.ts',
    '!app/_components/profile-2.0/**/*.test.{ts,tsx}',
    '!app/_components/profile-2.0/**/__tests__/**',
    '!app/_components/profile-2.0/**/types.ts',
    '!app/_components/profile-2.0/index.ts',
    '!app/_components/profile-2.0/**/*.stories.{ts,tsx}',
    '!app/_components/profile-2.0/**/*Elements.tsx',
    '!app/_components/profile-2.0/ARCHITECTURE.md',
    '!app/_components/profile-2.0/README.md',
    '!app/_components/profile-2.0/QUICK_START.md',
    '!app/_components/profile-2.0/VISUAL_REFERENCE.md',
    // Exclude Profile2.tsx from threshold checking due to intentional mock handlers
    '!app/_components/profile-2.0/Profile2.tsx',
  ],
  coverageThreshold: {
    'app/_components/profile-2.0/**/*.{ts,tsx}': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
