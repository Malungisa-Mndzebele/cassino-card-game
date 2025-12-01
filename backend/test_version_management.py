"""
Tests for Version Management

This module tests the version management functionality including:
- Version increment on state updates
- Version validation
- Version conflict handling

Requirements: 1.1, 1.2, 1.3, 1.4
"""

import pytest
from version_validator import (
    validate_version,
    get_missing_versions,
    should_reject_update,
    is_version_stale
)


class TestVersionValidation:
    """Test version validation functions"""
    
    def test_validate_version_in_sync(self):
        """Test validation when versions match"""
        result = validate_version(5, 5)
        assert result.valid is True
        assert result.has_gap is False
        assert result.gap_size == 0
        assert result.requires_sync is False
        assert "in sync" in result.message.lower()
    
    def test_validate_version_client_behind(self):
        """Test validation when client is behind server"""
        result = validate_version(3, 7)
        assert result.valid is False
        assert result.has_gap is True
        assert result.gap_size == 4
        assert result.requires_sync is True
        assert "gap" in result.message.lower()
    
    def test_validate_version_client_ahead(self):
        """Test validation when client is ahead of server (invalid state)"""
        result = validate_version(10, 5)
        assert result.valid is False
        assert result.has_gap is False
        assert result.requires_sync is True
        assert "ahead" in result.message.lower()
    
    def test_validate_version_one_behind(self):
        """Test validation when client is one version behind"""
        result = validate_version(4, 5)
        assert result.valid is False
        assert result.has_gap is True
        assert result.gap_size == 1
        assert result.requires_sync is True


class TestMissingVersions:
    """Test missing version detection"""
    
    def test_get_missing_versions_no_gap(self):
        """Test when there's no gap"""
        missing = get_missing_versions(5, 5)
        assert missing == []
    
    def test_get_missing_versions_with_gap(self):
        """Test when there's a gap"""
        missing = get_missing_versions(3, 7)
        assert missing == [4, 5, 6, 7]
    
    def test_get_missing_versions_client_ahead(self):
        """Test when client is ahead (should return empty)"""
        missing = get_missing_versions(10, 5)
        assert missing == []
    
    def test_get_missing_versions_one_behind(self):
        """Test when client is one version behind"""
        missing = get_missing_versions(4, 5)
        assert missing == [5]


class TestUpdateRejection:
    """Test update rejection logic"""
    
    def test_should_reject_update_older(self):
        """Test rejecting older updates"""
        assert should_reject_update(5, 4) is True
    
    def test_should_reject_update_same(self):
        """Test not rejecting same version"""
        assert should_reject_update(5, 5) is False
    
    def test_should_reject_update_newer(self):
        """Test not rejecting newer updates"""
        assert should_reject_update(5, 6) is False
    
    def test_should_reject_update_much_older(self):
        """Test rejecting much older updates"""
        assert should_reject_update(10, 1) is True


class TestVersionStaleness:
    """Test version staleness detection"""
    
    def test_is_version_stale_not_stale(self):
        """Test when version is not stale"""
        assert is_version_stale(5, 7) is False
    
    def test_is_version_stale_is_stale(self):
        """Test when version is stale"""
        assert is_version_stale(1, 15) is True
    
    def test_is_version_stale_custom_threshold(self):
        """Test with custom staleness threshold"""
        assert is_version_stale(1, 15, max_gap=20) is False
        assert is_version_stale(1, 25, max_gap=20) is True
    
    def test_is_version_stale_client_ahead(self):
        """Test when client is ahead (not stale)"""
        assert is_version_stale(10, 5) is False
    
    def test_is_version_stale_at_threshold(self):
        """Test when gap equals threshold"""
        assert is_version_stale(0, 10, max_gap=10) is False
        assert is_version_stale(0, 11, max_gap=10) is True


class TestVersionValidationEdgeCases:
    """Test edge cases in version validation"""
    
    def test_validate_version_zero_versions(self):
        """Test with zero versions"""
        result = validate_version(0, 0)
        assert result.valid is True
        assert result.has_gap is False
    
    def test_validate_version_from_zero(self):
        """Test starting from version 0"""
        result = validate_version(0, 5)
        assert result.valid is False
        assert result.has_gap is True
        assert result.gap_size == 5
    
    def test_get_missing_versions_from_zero(self):
        """Test getting missing versions from 0"""
        missing = get_missing_versions(0, 3)
        assert missing == [1, 2, 3]
    
    def test_large_version_numbers(self):
        """Test with large version numbers"""
        result = validate_version(1000, 1005)
        assert result.valid is False
        assert result.gap_size == 5
        
        missing = get_missing_versions(1000, 1005)
        assert len(missing) == 5
        assert missing == [1001, 1002, 1003, 1004, 1005]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
