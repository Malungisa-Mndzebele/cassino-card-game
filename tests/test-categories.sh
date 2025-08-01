#!/bin/bash

# Unit Test Categories Runner
# Executes different categories of unit tests

source "$(dirname "$0")/test-config.sh"
source "$(dirname "$0")/test-utils.sh"

run_unit_tests() {
    print_section "Unit Tests"
    echo "Running individual component tests..."
    
    local failed_tests=0
    local total_tests=0
    
    # Convert associative array to regular arrays for iteration
    local test_files=(
        "App.test.tsx"
        "components/RoomManager.test.tsx"
        "components/Card.test.tsx"
        "components/GameActions.test.tsx"
        "components/SoundSystem.test.tsx"
        "components/GameSettings.test.tsx"
    )
    
    local descriptions=(
        "Main application logic"
        "Room management"
        "Card component"
        "Game actions"
        "Sound system"
        "Settings and preferences"
    )
    
    # Run each test category
    for i in "${!test_files[@]}"; do
        run_test_category "${test_files[$i]}" "${descriptions[$i]}" failed_tests total_tests
    done
    
    # Return results
    echo "UNIT_FAILED=$failed_tests" > /tmp/unit_results
    echo "UNIT_TOTAL=$total_tests" >> /tmp/unit_results
    
    return $failed_tests
}

run_integration_tests() {
    print_section "Integration Tests"
    echo "Running full game flow integration tests..."
    
    $INTEGRATION_TEST_CMD --verbose
    local result=$?
    
    print_status $result "Integration tests"
    
    echo "INTEGRATION_RESULT=$result" > /tmp/integration_results
    return $result
}

run_coverage_tests() {
    print_section "Complete Test Suite with Coverage"
    
    $COVERAGE_CMD
    local result=$?
    
    print_status $result "Coverage report generated"
    
    echo "COVERAGE_RESULT=$result" > /tmp/coverage_results
    return $result
}

# Main execution if script is run directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    check_dependencies || exit 1
    validate_structure || exit 1
    
    run_unit_tests
    run_integration_tests
    run_coverage_tests
    
    # Read results
    source /tmp/unit_results
    source /tmp/integration_results
    source /tmp/coverage_results
    
    generate_summary $UNIT_FAILED $UNIT_TOTAL $COVERAGE_RESULT $INTEGRATION_RESULT
fi