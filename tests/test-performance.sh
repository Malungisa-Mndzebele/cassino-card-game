#!/bin/bash

# Performance Validation Script
# Checks for common performance issues and anti-patterns

source "$(dirname "$0")/test-config.sh"
source "$(dirname "$0")/test-utils.sh"

run_performance_checks() {
    print_section "Performance Validation"
    echo "Checking for potential performance issues..."
    
    local performance_issues=0
    
    # Check for missing React.memo where appropriate
    echo "Scanning for React.memo usage..."
    local unmemoized_components=$(grep -r "$COMPONENT_EXPORT_PATTERN" $COMPONENTS_DIR --include="*.tsx" | grep -v "$MEMO_PATTERN" | wc -l)
    
    if [ "$unmemoized_components" -gt 3 ]; then
        print_warning "Found $unmemoized_components components that might benefit from React.memo"
        ((performance_issues++))
    else
        print_status 0 "React.memo usage is appropriate"
    fi
    
    # Check for inline function definitions in JSX
    echo "Checking for inline arrow functions..."
    if check_pattern "$INLINE_FUNCTION_PATTERN" "$COMPONENTS_DIR" "No inline arrow functions found" "Found inline arrow functions in JSX (consider useCallback)"; then
        :
    else
        ((performance_issues++))
    fi
    
    # Check bundle size (if dist exists)
    if [ -d "dist" ]; then
        echo "Checking bundle size..."
        local bundle_size=$(du -sh dist/ | cut -f1)
        echo "Current bundle size: $bundle_size"
        
        # Convert to KB for comparison (simplified check)
        local size_kb=$(du -sk dist/ | cut -f1)
        if [ "$size_kb" -gt 1000 ]; then
            print_warning "Bundle size ($bundle_size) might be large for a card game"
            ((performance_issues++))
        else
            print_status 0 "Bundle size is reasonable"
        fi
    fi
    
    # Check for excessive re-renders (useState in render)
    echo "Checking for potential re-render issues..."
    local useState_in_render=$(grep -r "useState.*(" $COMPONENTS_DIR --include="*.tsx" | grep -v "const \[" | wc -l)
    
    if [ "$useState_in_render" -gt 0 ]; then
        print_warning "Found potential useState usage issues"
        ((performance_issues++))
    else
        print_status 0 "No useState issues detected"
    fi
    
    # Summary
    if [ $performance_issues -eq 0 ]; then
        print_status 0 "No obvious performance issues found"
    else
        print_status 1 "Found $performance_issues potential performance issues"
    fi
    
    echo "PERFORMANCE_ISSUES=$performance_issues" > /tmp/performance_results
    return $performance_issues
}

run_typescript_performance() {
    print_section "TypeScript Performance"
    echo "Checking TypeScript compilation performance..."
    
    local start_time=$(date +%s)
    $TYPE_CHECK_CMD
    local type_result=$?
    local end_time=$(date +%s)
    
    local duration=$((end_time - start_time))
    
    if [ $duration -gt $PERFORMANCE_THRESHOLD ]; then
        print_warning "TypeScript compilation took ${duration}s (threshold: ${PERFORMANCE_THRESHOLD}s)"
    else
        print_status $type_result "TypeScript compilation (${duration}s)"
    fi
    
    return $type_result
}

# Main execution if script is run directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    run_performance_checks
    run_typescript_performance
fi