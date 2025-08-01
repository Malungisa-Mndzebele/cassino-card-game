#!/bin/bash

# Main Test Runner for Cassino Card Game
# Orchestrates comprehensive testing suite

set -e  # Exit on any error

echo "🧪 Cassino Card Game - Comprehensive Test Suite"
echo "=============================================="

# Source utilities
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/tests/test-config.sh"
source "$SCRIPT_DIR/tests/test-utils.sh"

# Function to cleanup temporary files
cleanup() {
    rm -f /tmp/*_results 2>/dev/null || true
}

# Set up cleanup trap
trap cleanup EXIT

main() {
    # Initial setup
    check_dependencies || exit 1
    validate_structure || exit 1
    
    echo ""
    echo -e "${BLUE}🚀 Starting comprehensive test suite...${NC}"
    
    # Run test categories
    echo ""
    bash "$SCRIPT_DIR/tests/test-categories.sh"
    local test_exit_code=$?
    
    # Run performance checks
    echo ""
    bash "$SCRIPT_DIR/tests/test-performance.sh"
    
    # Run security checks
    echo ""
    bash "$SCRIPT_DIR/tests/test-security.sh"
    
    # Read all results
    source /tmp/unit_results 2>/dev/null || { UNIT_FAILED=0; UNIT_TOTAL=0; }
    source /tmp/integration_results 2>/dev/null || INTEGRATION_RESULT=0
    source /tmp/coverage_results 2>/dev/null || COVERAGE_RESULT=0
    source /tmp/performance_results 2>/dev/null || PERFORMANCE_ISSUES=0
    source /tmp/security_results 2>/dev/null || SECURITY_ISSUES=0
    
    # Generate final summary
    print_section "Final Summary"
    
    echo "📊 Test Results:"
    echo "  • Unit Tests: $((UNIT_TOTAL - UNIT_FAILED))/$UNIT_TOTAL passed"
    print_status $INTEGRATION_RESULT "  • Integration Tests"
    print_status $COVERAGE_RESULT "  • Coverage Report"
    
    echo ""
    echo "🔍 Quality Checks:"
    if [ $PERFORMANCE_ISSUES -eq 0 ]; then
        print_status 0 "  • Performance Analysis"
    else
        print_status 1 "  • Performance Analysis ($PERFORMANCE_ISSUES issues)"
    fi
    
    if [ $SECURITY_ISSUES -eq 0 ]; then
        print_status 0 "  • Security Analysis"
    else
        print_status 1 "  • Security Analysis ($SECURITY_ISSUES issues)"
    fi
    
    # Overall result
    local total_issues=$((UNIT_FAILED + INTEGRATION_RESULT + COVERAGE_RESULT + PERFORMANCE_ISSUES + SECURITY_ISSUES))
    
    echo ""
    if [ $total_issues -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Your Cassino card game is ready for deployment.${NC}"
        echo ""
        echo -e "${BLUE}📋 Next steps:${NC}"
        echo "  1. Update your Supabase configuration in /utils/supabase/info.tsx"
        echo "  2. Deploy your edge function: supabase functions deploy server"
        echo "  3. Run: ./deploy-khasinogaming.sh"
        echo "  4. Upload the generated files to your hosting service"
        echo ""
        echo -e "${GREEN}🎮 Happy gaming!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Found $total_issues total issues. Please review the output above.${NC}"
        echo ""
        echo -e "${YELLOW}💡 Common fixes:${NC}"
        echo "  • For test failures: Check component logic and update tests"
        echo "  • For performance issues: Consider React.memo and useCallback"
        echo "  • For security issues: Review console.log and error handling"
        exit 1
    fi
}

# Help function
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --unit-only       Run only unit tests"
    echo "  --integration-only Run only integration tests"
    echo "  --performance     Run only performance checks"
    echo "  --security        Run only security checks"
    echo "  --coverage        Run tests with coverage only"
    echo "  --help, -h        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                Run full test suite"
    echo "  $0 --unit-only    Run only unit tests"
    echo "  $0 --coverage     Generate coverage report"
}

# Handle command line arguments
case "${1:-}" in
    --unit-only)
        source "$SCRIPT_DIR/tests/test-utils.sh"
        check_dependencies || exit 1
        bash "$SCRIPT_DIR/tests/test-categories.sh"
        ;;
    --integration-only)
        source "$SCRIPT_DIR/tests/test-utils.sh"
        check_dependencies || exit 1
        npm test -- tests/integration --verbose
        ;;
    --performance)
        bash "$SCRIPT_DIR/tests/test-performance.sh"
        ;;
    --security)
        bash "$SCRIPT_DIR/tests/test-security.sh"
        ;;
    --coverage)
        source "$SCRIPT_DIR/tests/test-utils.sh"
        check_dependencies || exit 1
        npm run test:coverage
        ;;
    --help|-h)
        show_help
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac