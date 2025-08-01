#!/bin/bash

# Test Configuration for Cassino Card Game
# Constants and settings for the test suite

# Color codes for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export NC='\033[0m' # No Color

# Test categories and descriptions
declare -A TEST_CATEGORIES=(
    ["App.test.tsx"]="Main application logic"
    ["components/RoomManager.test.tsx"]="Room management"
    ["components/Card.test.tsx"]="Card component"
    ["components/GameActions.test.tsx"]="Game actions"
    ["components/SoundSystem.test.tsx"]="Sound system"
    ["components/GameSettings.test.tsx"]="Settings and preferences"
)

# Export the array for use in other scripts
export TEST_CATEGORIES

# Test thresholds
export COVERAGE_THRESHOLD=80
export PERFORMANCE_THRESHOLD=5
export MAX_BUNDLE_SIZE="1000kb"

# Paths
export PROJECT_ROOT="."
export COMPONENTS_DIR="./components"
export TESTS_DIR="./tests"
export INTEGRATION_DIR="./tests/integration"

# Test commands
export UNIT_TEST_CMD="npm test"
export INTEGRATION_TEST_CMD="npm test -- tests/integration"
export COVERAGE_CMD="npm run test:coverage"
export TYPE_CHECK_CMD="npm run type-check"

# File patterns for security checks
export CONSOLE_LOG_PATTERN="console\.log"
export LOCALSTORAGE_PATTERN="localStorage\."
export INLINE_FUNCTION_PATTERN="onClick={() =>"

# Performance patterns
export MEMO_PATTERN="React.memo"
export COMPONENT_EXPORT_PATTERN="export.*function.*Component"