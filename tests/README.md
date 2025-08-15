# Test Suite Documentation

## Overview

The Cassino Card Game test suite is modular and comprehensive, covering unit tests, integration tests, performance validation, and security checks.

## Structure

```
tests/
├── test-config.sh      # Configuration and constants
├── test-utils.sh       # Utility functions
├── test-categories.sh  # Unit test runner
├── test-performance.sh # Performance validation
├── test-security.sh    # Security validation
├── setup.ts           # Jest setup
└── integration/       # Integration tests
    └── GameFlow.test.tsx
```

## Running Tests

### Full Test Suite
```bash
./test-runner.sh
```

### Specific Test Categories
```bash
# Unit tests only
./test-runner.sh --unit-only

# Integration tests only
./test-runner.sh --integration-only

# Performance checks
./test-runner.sh --performance

# Security checks
./test-runner.sh --security

# Coverage report
./test-runner.sh --coverage
```

### Individual Components
```bash
# Test specific component
npm test -- App.test.tsx
npm test -- components/Card.test.tsx

# Watch mode
npm run test:watch

# Coverage for specific files
npm test -- --coverage --collectCoverageFrom="components/Card.tsx"
```

## Test Categories

### Unit Tests
- **App.test.tsx**: Main application logic, room management, game state
- **Card.test.tsx**: Card rendering, interactions, accessibility
- **GameActions.test.tsx**: Player actions, turn management, validation
- **RoomManager.test.tsx**: Room creation, joining, error handling
- **SoundSystem.test.tsx**: Audio management, volume control
- **GameSettings.test.tsx**: Preferences, statistics, localStorage

### Integration Tests
- **GameFlow.test.tsx**: Complete game flows from creation to completion
- Real-time updates and state synchronization
- Error handling across components

### Performance Tests
- React.memo usage validation
- Bundle size checks
- Inline function detection
- TypeScript compilation performance

### Security Tests
- Console.log statement detection
- localStorage error handling
- Hardcoded credential scanning
- Dangerous HTML usage

## Coverage Thresholds

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Adding New Tests

### 1. Unit Tests
Create test file alongside component:
```bash
# For new component
touch components/NewComponent.test.tsx
```

Add to test-categories.sh:
```bash
"components/NewComponent.test.tsx"="New component description"
```

### 2. Integration Tests
Add to `tests/integration/`:
```bash
touch tests/integration/NewFlow.test.tsx
```

### 3. Performance Checks
Add patterns to `test-performance.sh`:
```bash
check_pattern "new-pattern" "$COMPONENTS_DIR" "Description" "Warning message"
```

### 4. Security Checks
Add to `test-security.sh`:
```bash
sensitive_patterns+=("new-sensitive-word")
```

## Mocking Guidelines

```

### Fetch API
```typescript
global.testUtils.mockFetch({
  success: true,
  data: mockData
})
```

### Audio/Sound
Audio mocking is configured in `tests/setup.ts`.

### localStorage
```typescript
window.localStorage.setItem('key', 'value')
expect(window.localStorage.getItem('key')).toBe('value')
```

## Continuous Integration

The test suite is designed to work in CI environments:

```yaml
# Example GitHub Actions
- name: Run tests
  run: ./test-runner.sh

- name: Check coverage
  run: ./test-runner.sh --coverage
```

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in jest.config.js
   - Check for infinite loops in components

2. **Audio tests failing**
   - Verify Audio mock setup in tests/setup.ts
   - Check browser compatibility mocks

3. **Async tests flaky**
   - Use `waitFor` for async operations
   - Mock timers when testing intervals

4. **Coverage too low**
   - Add tests for missed branches
   - Test error conditions and edge cases

### Debug Commands

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="specific test" --verbose

# Check what files are being tested
npm test -- --listTests
```

## Best Practices

1. **Test Naming**: Use descriptive test names
2. **Arrange-Act-Assert**: Clear test structure
3. **Mock External Dependencies**: Keep tests isolated
4. **Test User Interactions**: Use user-event library
5. **Accessibility**: Test with screen readers in mind
6. **Performance**: Don't over-mock, test real behavior
7. **Coverage**: Aim for meaningful tests, not just coverage numbers

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Update relevant test categories
3. Run full test suite before submitting
4. Update documentation if needed

## Performance Notes

- Tests run in parallel (maxWorkers: 4)
- Use `jest.useFakeTimers()` for timer testing
- Mock heavy dependencies to keep tests fast
- Consider snapshot testing for UI components