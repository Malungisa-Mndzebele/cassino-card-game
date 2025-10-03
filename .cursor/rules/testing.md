---
description: Always create tests for new implementations
globs:
alwaysApply: true
---

# Testing Rules

- Always create tests and follow TypeScript guidelines and typechecks
- After an implementation, run frontend tests and type checks to make sure everything passes
- If anything failed, investigate and fix one test/file at a time and repeat
- Use Python pytest for backend tests
- Use TypeScript vitest for frontend tests
- Use Cypress for E2E tests
