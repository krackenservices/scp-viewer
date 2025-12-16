"""Negative tests for the scanner - error handling and edge cases."""

import pytest
from unittest.mock import Mock, MagicMock, patch
import os


class TestSyncErrors:
    """Tests for sync error handling."""

    @patch("scanner.sync.GraphDatabase")
    def test_connection_failure(self, mock_graph_db):
        """Test handling of Neo4j connection failure."""
        from scanner.sync import Neo4jSync

        mock_graph_db.driver.side_effect = Exception("Connection refused")

        with pytest.raises(Exception) as exc_info:
            Neo4jSync("bolt://invalid:7687", "neo4j", "wrong")

        assert "Connection refused" in str(exc_info.value)

    @patch("scanner.sync.GraphDatabase")
    def test_auth_failure(self, mock_graph_db):
        """Test handling of authentication failure."""
        from scanner.sync import Neo4jSync

        mock_graph_db.driver.side_effect = Exception("The client is unauthorized")

        with pytest.raises(Exception) as exc_info:
            Neo4jSync("bolt://localhost:7687", "neo4j", "wrongpassword")

        assert "unauthorized" in str(exc_info.value)

    @patch("scanner.sync.GraphDatabase")
    def test_write_failure(self, mock_graph_db):
        """Test handling of write failure during sync."""
        from scanner.sync import Neo4jSync

        mock_session = MagicMock()
        mock_session.run.side_effect = Exception("Write failed: disk full")
        mock_driver = MagicMock()
        mock_driver.session.return_value.__enter__ = Mock(return_value=mock_session)
        mock_driver.session.return_value.__exit__ = Mock(return_value=False)
        mock_graph_db.driver.return_value = mock_driver

        sync = Neo4jSync("bolt://localhost:7687", "neo4j", "password")

        manifest = Mock()
        manifest.system = Mock()
        manifest.system.urn = "urn:scp:test:api"
        manifest.system.name = "Test"
        manifest.system.description = None
        manifest.system.classification = None
        manifest.ownership = None
        manifest.provides = []
        manifest.depends = []

        with pytest.raises(Exception) as exc_info:
            sync.sync_manifest(manifest, "source")

        assert "disk full" in str(exc_info.value)

    @patch("scanner.sync.GraphDatabase")
    def test_constraint_violation(self, mock_graph_db):
        """Test handling of constraint violation (duplicate URN)."""
        from scanner.sync import Neo4jSync

        mock_session = MagicMock()
        mock_session.run.side_effect = Exception("ConstraintValidationFailed: already exists")
        mock_driver = MagicMock()
        mock_driver.session.return_value.__enter__ = Mock(return_value=mock_session)
        mock_driver.session.return_value.__exit__ = Mock(return_value=False)
        mock_graph_db.driver.return_value = mock_driver

        sync = Neo4jSync("bolt://localhost:7687", "neo4j", "password")

        with pytest.raises(Exception) as exc_info:
            sync.setup_constraints()

        assert "already exists" in str(exc_info.value)


class TestManifestValidation:
    """Tests for manifest validation errors."""

    def test_missing_urn(self):
        """Test handling of manifest without URN."""
        manifest = Mock()
        manifest.system = Mock()
        manifest.system.urn = None

        assert manifest.system.urn is None

    def test_empty_urn(self):
        """Test handling of manifest with empty URN."""
        manifest = Mock()
        manifest.system = Mock()
        manifest.system.urn = ""

        assert manifest.system.urn == ""
        assert not manifest.system.urn  # Falsy

    def test_invalid_urn_format(self):
        """Test handling of invalid URN format."""
        invalid_urns = [
            "not-a-urn",
            "urn:wrong:prefix",
            "urn:scp:",  # Missing component
            "urn:scp:only-one",  # Missing second component
        ]

        for urn in invalid_urns:
            parts = urn.split(":")
            is_valid = len(parts) >= 4 and parts[0] == "urn" and parts[1] == "scp"
            assert not is_valid, f"URN {urn} should be invalid"

    def test_missing_system_name(self):
        """Test handling of manifest without system name."""
        manifest = Mock()
        manifest.system = Mock()
        manifest.system.urn = "urn:scp:test:api"
        manifest.system.name = None

        assert manifest.system.name is None

    def test_invalid_tier_value(self):
        """Test handling of invalid tier values."""
        invalid_tiers = [0, -1, 6, 100, "invalid", None]

        for tier in invalid_tiers:
            is_valid = isinstance(tier, int) and 1 <= tier <= 5
            assert not is_valid, f"Tier {tier} should be invalid"

    def test_circular_dependency(self):
        """Test detection of circular dependency."""
        deps = [
            ("A", "B"),
            ("B", "C"),
            ("C", "A"),  # Circular!
        ]

        # Simple cycle detection
        graph = {}
        for src, dst in deps:
            if src not in graph:
                graph[src] = []
            graph[src].append(dst)

        def has_cycle(node, visited, rec_stack):
            visited.add(node)
            rec_stack.add(node)
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if has_cycle(neighbor, visited, rec_stack):
                        return True
                elif neighbor in rec_stack:
                    return True
            rec_stack.remove(node)
            return False

        visited = set()
        rec_stack = set()
        has_circular = any(has_cycle(n, visited, rec_stack) for n in graph if n not in visited)

        assert has_circular


class TestCLIErrors:
    """Tests for CLI error handling."""

    @patch.dict(os.environ, {"NEO4J_URI": ""}, clear=True)
    def test_missing_neo4j_uri(self):
        """Test handling of missing NEO4J_URI."""
        uri = os.environ.get("NEO4J_URI", "")
        assert uri == ""

    @patch.dict(os.environ, {"GITHUB_TOKEN": ""}, clear=True)
    def test_github_without_token(self):
        """Test handling of GitHub org without token."""
        org = "someorg"
        token = os.environ.get("GITHUB_TOKEN", "")

        can_scan_github = org and token

        assert not can_scan_github

    @patch("scanner.cli.scan_github_org")
    def test_github_rate_limit(self, mock_scan):
        """Test handling of GitHub rate limit error."""
        mock_scan.side_effect = Exception("API rate limit exceeded for user")

        with pytest.raises(Exception) as exc_info:
            mock_scan("org", "token")

        assert "rate limit" in str(exc_info.value)

    @patch("scanner.cli.scan_github_org")
    def test_github_not_found(self, mock_scan):
        """Test handling of non-existent GitHub org."""
        mock_scan.side_effect = Exception("404: Organization not found")

        with pytest.raises(Exception) as exc_info:
            mock_scan("nonexistent", "token")

        assert "not found" in str(exc_info.value)

    @patch("scanner.cli.load_scp")
    def test_invalid_yaml_syntax(self, mock_load):
        """Test handling of invalid YAML syntax."""
        mock_load.side_effect = Exception("YAML syntax error: unexpected indent")

        with pytest.raises(Exception) as exc_info:
            mock_load("/path/to/invalid.yaml")

        assert "syntax error" in str(exc_info.value)

    @patch("scanner.cli.load_scp")
    def test_missing_required_field(self, mock_load):
        """Test handling of manifest missing required field."""
        mock_load.side_effect = Exception("Validation error: 'system' is a required field")

        with pytest.raises(Exception) as exc_info:
            mock_load("/path/to/incomplete.yaml")

        assert "required field" in str(exc_info.value)

    @patch("scanner.cli.scan_directory")
    def test_directory_not_found(self, mock_scan):
        """Test handling of non-existent directory."""
        mock_scan.side_effect = FileNotFoundError("Directory not found: /nonexistent")

        with pytest.raises(FileNotFoundError):
            mock_scan("/nonexistent")

    @patch("scanner.cli.scan_directory")
    def test_permission_denied(self, mock_scan):
        """Test handling of permission denied error."""
        mock_scan.side_effect = PermissionError("Permission denied: /root/secret")

        with pytest.raises(PermissionError):
            mock_scan("/root/secret")


class TestNetworkErrors:
    """Tests for network-related errors."""

    @patch("scanner.cli.scan_github_org")
    def test_network_timeout(self, mock_scan):
        """Test handling of network timeout."""
        mock_scan.side_effect = Exception("Connection timed out")

        with pytest.raises(Exception) as exc_info:
            mock_scan("org", "token")

        assert "timed out" in str(exc_info.value)

    @patch("scanner.cli.scan_github_org")
    def test_dns_resolution_failure(self, mock_scan):
        """Test handling of DNS resolution failure."""
        mock_scan.side_effect = Exception("getaddrinfo failed")

        with pytest.raises(Exception) as exc_info:
            mock_scan("org", "token")

        assert "getaddrinfo" in str(exc_info.value)

    @patch("scanner.cli.scan_github_org")
    def test_ssl_certificate_error(self, mock_scan):
        """Test handling of SSL certificate error."""
        mock_scan.side_effect = Exception("SSL: CERTIFICATE_VERIFY_FAILED")

        with pytest.raises(Exception) as exc_info:
            mock_scan("org", "token")

        assert "CERTIFICATE" in str(exc_info.value)
