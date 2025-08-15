export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1'
  },
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/**/*.(test|spec).(ts|tsx)'
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.*',
    '!**/main.tsx',
    '!**/vite-env.d.ts',
    '!**/tests/setup.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true
      }
    ]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testTimeout: 10000,
  maxWorkers: 4,
  verbose: true,
  bail: false,
  errorOnDeprecated: true,
  clearMocks: true,
  restoreMocks: true
}