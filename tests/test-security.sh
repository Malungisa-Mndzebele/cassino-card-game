#!/bin/bash

# Security Validation Script
# Checks for common security issues and vulnerabilities

source "$(dirname "$0")/test-config.sh"
source "$(dirname "$0")/test-utils.sh"

run_security_checks() {
    print_section "Security Validation"
    echo "Checking for common security issues..."
    
    local security_issues=0
    
    # Check for console.log in production code
    echo "Checking for console.log statements..."
    if check_pattern "$CONSOLE_LOG_PATTERN" "$COMPONENTS_DIR" "No console.log statements in production code" "Found console.log statements in production code"; then
        :
    else
        ((security_issues++))
    fi
    
    # Check for localStorage usage without error handling
    echo "Checking localStorage usage..."
    local localStorage_usage=$(grep -r "$LOCALSTORAGE_PATTERN" $COMPONENTS_DIR --include="*.tsx" | grep -v "try\|catch" | wc -l)
    
    if [ "$localStorage_usage" -gt 0 ]; then
        print_warning "Found localStorage usage without error handling"
        ((security_issues++))
    else
        print_status 0 "localStorage usage is properly handled"
    fi
    
    # Check for hardcoded sensitive data
    echo "Checking for hardcoded credentials..."
    local sensitive_patterns=("password" "secret" "key" "token")
    local found_sensitive=false
    
    for pattern in "${sensitive_patterns[@]}"; do
        local count=$(grep -ri "$pattern.*=" $COMPONENTS_DIR --include="*.tsx" | grep -v "test\|mock\|example" | wc -l)
        if [ "$count" -gt 0 ]; then
            print_warning "Found potential hardcoded sensitive data: $pattern"
            found_sensitive=true
            ((security_issues++))
        fi
    done
    
    if [ "$found_sensitive" = false ]; then
        print_status 0 "No hardcoded sensitive data found"
    fi
    
    # Check for eval usage
    echo "Checking for eval usage..."
    if check_pattern "eval(" "$COMPONENTS_DIR" "No eval usage found" "Found eval usage (security risk)"; then
        :
    else
        ((security_issues++))
    fi
    
    # Check for dangerouslySetInnerHTML
    echo "Checking for dangerouslySetInnerHTML..."
    if check_pattern "dangerouslySetInnerHTML" "$COMPONENTS_DIR" "No dangerouslySetInnerHTML usage found" "Found dangerouslySetInnerHTML usage"; then
        :
    else
        ((security_issues++))
    fi
    
    # Summary
    if [ $security_issues -eq 0 ]; then
        print_status 0 "No security issues found"
    else
        print_status 1 "Found $security_issues potential security issues"
    fi
    
    echo "SECURITY_ISSUES=$security_issues" > /tmp/security_results
    return $security_issues
}

check_dependencies_security() {
    print_section "Dependency Security"
    echo "Checking for known vulnerabilities..."
    
    # Check if npm audit is available
    if npm audit --version &> /dev/null; then
        npm audit --audit-level moderate
        local audit_result=$?
        
        if [ $audit_result -eq 0 ]; then
            print_status 0 "No known vulnerabilities found"
        else
            print_status 1 "Found potential vulnerabilities (check npm audit output)"
        fi
        
        return $audit_result
    else
        print_warning "npm audit not available, skipping dependency security check"
        return 0
    fi
}

# Main execution if script is run directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    run_security_checks
    check_dependencies_security
fi