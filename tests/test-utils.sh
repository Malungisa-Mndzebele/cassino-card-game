#!/bin/bash

# Test Utilities for Cassino Card Game
# Helper functions for test execution and reporting

source "$(dirname "$0")/test-config.sh"

# Function to print status with colored output
print_status() {
    local exit_code=$1
    local message=$2
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $message${NC}"
    else
        echo -e "${RED}❌ $message${NC}"
    fi
    
    return $exit_code
}

# Function to print section header
print_section() {
    local title=$1
    echo ""
    echo -e "${BLUE}📋 $title${NC}"
    echo "----------------------------------------"
}

# Function to print warning
print_warning() {
    local message=$1
    echo -e "${YELLOW}⚠️  $message${NC}"
}

# Function to check if command exists
check_command() {
    local cmd=$1
    local name=$2
    
    if ! command -v "$cmd" &> /dev/null; then
        echo -e "${RED}❌ $name not found${NC}"
        return 1
    fi
    
    print_status 0 "$name found"
    return 0
}

# Function to check dependencies
check_dependencies() {
    print_section "Checking Dependencies"
    
    local deps_ok=true
    
    if ! check_command "node" "Node.js"; then
        deps_ok=false
    fi
    
    if ! check_command "npm" "npm"; then
        deps_ok=false
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "Dependencies not installed. Installing..."
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to install dependencies${NC}"
            return 1
        fi
    fi
    
    print_status 0 "Dependencies installed"
    
    if [ "$deps_ok" = false ]; then
        return 1
    fi
    
    return 0
}

# Function to run a test and track results
run_test_category() {
    local test_file=$1
    local description=$2
    local test_results_var=$3
    local total_tests_var=$4
    
    echo ""
    echo -e "${BLUE}Testing: $description${NC}"
    
    if [ -f "$test_file" ]; then
        $UNIT_TEST_CMD -- "$test_file" --verbose --silent
        local result=$?
        
        if [ $result -eq 0 ]; then
            print_status 0 "$description tests passed"
        else
            print_status 1 "$description tests failed"
            eval "$test_results_var=$((${!test_results_var} + 1))"
        fi
    else
        print_warning "Test file not found: $test_file"
    fi
    
    eval "$total_tests_var=$((${!total_tests_var} + 1))"
}

# Function to generate test summary
generate_summary() {
    local failed_tests=$1
    local total_tests=$2
    local coverage_result=$3
    local integration_result=$4
    
    print_section "Test Summary"
    
    local passed_tests=$((total_tests - failed_tests))
    
    echo "Unit Tests: $passed_tests/$total_tests passed"
    print_status $integration_result "Integration tests"
    print_status $coverage_result "Coverage report"
    
    if [ $failed_tests -eq 0 ] && [ $integration_result -eq 0 ] && [ $coverage_result -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 All tests passed! Your Cassino card game is ready for deployment.${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
        return 1
    fi
}

# Function to check file patterns
check_pattern() {
    local pattern=$1
    local directory=$2
    local description=$3
    local warning_message=$4
    
    local count=$(grep -r "$pattern" "$directory" --include="*.tsx" | wc -l)
    
    if [ "$count" -gt 0 ]; then
        print_warning "$warning_message"
        return 1
    else
        print_status 0 "$description"
        return 0
    fi
}

# Function to validate project structure
validate_structure() {
    print_section "Project Structure Validation"
    
    local required_files=(
        "package.json"
        "tsconfig.json"
        "App.tsx"
        "components"
        "tests"
    )
    
    local structure_ok=true
    
    for file in "${required_files[@]}"; do
        if [ ! -e "$file" ]; then
            print_status 1 "Required file/directory missing: $file"
            structure_ok=false
        fi
    done
    
    if [ "$structure_ok" = true ]; then
        print_status 0 "Project structure is valid"
        return 0
    else
        return 1
    fi
}

# Export functions for use in other scripts
export -f print_status
export -f print_section
export -f print_warning
export -f check_command
export -f check_dependencies
export -f run_test_category
export -f generate_summary
export -f check_pattern
export -f validate_structure