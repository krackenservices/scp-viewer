"""Tests for the Neo4j sync service."""

import pytest
from unittest.mock import Mock, MagicMock, patch


class MockManifest:
    """Mock SCP manifest for testing."""
    
    def __init__(self, urn="urn:scp:test:api", name="Test API"):
        self.system = Mock()
        self.system.urn = urn
        self.system.name = name
        self.system.description = "Test description"
        self.system.classification = Mock()
        self.system.classification.tier = 1
        self.system.classification.domain = "backend"
        self.ownership = Mock()
        self.ownership.team = "test-team"
        self.provides = []
        self.depends = []


class TestNeo4jSync:
    """Tests for Neo4jSync class."""

    @patch("scanner.sync.GraphDatabase")
    def test_init_creates_driver(self, mock_graph_db):
        """Test that __init__ creates a Neo4j driver."""
        from scanner.sync import Neo4jSync
        
        sync = Neo4jSync("bolt://localhost:7687", "neo4j", "password")
        
        mock_graph_db.driver.assert_called_once_with(
            "bolt://localhost:7687",
            auth=("neo4j", "password")
        )

    @patch("scanner.sync.GraphDatabase")
    def test_close_closes_driver(self, mock_graph_db):
        """Test that close() closes the driver."""
        from scanner.sync import Neo4jSync
        
        mock_driver = MagicMock()
        mock_graph_db.driver.return_value = mock_driver
        
        sync = Neo4jSync("bolt://localhost:7687", "neo4j", "password")
        sync.close()
        
        mock_driver.close.assert_called_once()

    @patch("scanner.sync.GraphDatabase")
    def test_context_manager(self, mock_graph_db):
        """Test that context manager works correctly."""
        from scanner.sync import Neo4jSync
        
        mock_driver = MagicMock()
        mock_graph_db.driver.return_value = mock_driver
        
        with Neo4jSync("bolt://localhost:7687", "neo4j", "password") as sync:
            pass
        
        mock_driver.close.assert_called_once()

    @patch("scanner.sync.GraphDatabase")
    def test_setup_constraints(self, mock_graph_db):
        """Test that setup_constraints creates indexes."""
        from scanner.sync import Neo4jSync
        
        mock_session = MagicMock()
        mock_driver = MagicMock()
        mock_driver.session.return_value.__enter__ = Mock(return_value=mock_session)
        mock_driver.session.return_value.__exit__ = Mock(return_value=False)
        mock_graph_db.driver.return_value = mock_driver
        
        sync = Neo4jSync("bolt://localhost:7687", "neo4j", "password")
        sync.setup_constraints()
        
        # Should run multiple constraint/index commands
        assert mock_session.run.call_count >= 3

    @patch("scanner.sync.GraphDatabase")
    def test_sync_manifest_creates_system(self, mock_graph_db):
        """Test that sync_manifest creates a system node."""
        from scanner.sync import Neo4jSync
        
        mock_session = MagicMock()
        mock_driver = MagicMock()
        mock_driver.session.return_value.__enter__ = Mock(return_value=mock_session)
        mock_driver.session.return_value.__exit__ = Mock(return_value=False)
        mock_graph_db.driver.return_value = mock_driver
        
        sync = Neo4jSync("bolt://localhost:7687", "neo4j", "password")
        manifest = MockManifest()
        
        sync.sync_manifest(manifest, "test-source")
        
        # Should call session.run to create the system
        mock_session.run.assert_called()
        call_args = mock_session.run.call_args_list[0]
        assert "MERGE (s:System {urn: $urn})" in call_args[0][0]

    @patch("scanner.sync.GraphDatabase")
    def test_sync_manifest_with_capabilities(self, mock_graph_db):
        """Test that sync_manifest creates capability nodes."""
        from scanner.sync import Neo4jSync
        
        mock_session = MagicMock()
        mock_driver = MagicMock()
        mock_driver.session.return_value.__enter__ = Mock(return_value=mock_session)
        mock_driver.session.return_value.__exit__ = Mock(return_value=False)
        mock_graph_db.driver.return_value = mock_driver
        
        sync = Neo4jSync("bolt://localhost:7687", "neo4j", "password")
        manifest = MockManifest()
        
        # Add a capability
        cap = Mock()
        cap.capability = "rest-api"
        cap.type = "rest"
        manifest.provides = [cap]
        
        sync.sync_manifest(manifest, "test-source")
        
        # Should call session.run multiple times (system + capability)
        assert mock_session.run.call_count >= 2

    @patch("scanner.sync.GraphDatabase")
    def test_sync_manifest_with_dependencies(self, mock_graph_db):
        """Test that sync_manifest creates dependency edges."""
        from scanner.sync import Neo4jSync
        
        mock_session = MagicMock()
        mock_driver = MagicMock()
        mock_driver.session.return_value.__enter__ = Mock(return_value=mock_session)
        mock_driver.session.return_value.__exit__ = Mock(return_value=False)
        mock_graph_db.driver.return_value = mock_driver
        
        sync = Neo4jSync("bolt://localhost:7687", "neo4j", "password")
        manifest = MockManifest()
        
        # Add a dependency
        dep = Mock()
        dep.system = "urn:scp:other:api"
        dep.type = "rest"
        dep.criticality = "required"
        dep.failure_mode = "fail-fast"
        manifest.depends = [dep]
        
        sync.sync_manifest(manifest, "test-source")
        
        # Should create dependency edge
        assert mock_session.run.call_count >= 2

    @patch("scanner.sync.GraphDatabase")
    def test_sync_manifests_multiple(self, mock_graph_db):
        """Test syncing multiple manifests."""
        from scanner.sync import Neo4jSync
        
        mock_session = MagicMock()
        mock_driver = MagicMock()
        mock_driver.session.return_value.__enter__ = Mock(return_value=mock_session)
        mock_driver.session.return_value.__exit__ = Mock(return_value=False)
        mock_graph_db.driver.return_value = mock_driver
        
        sync = Neo4jSync("bolt://localhost:7687", "neo4j", "password")
        
        manifests = [
            (MockManifest("urn:scp:test1:api", "Test 1"), "source1"),
            (MockManifest("urn:scp:test2:api", "Test 2"), "source2"),
        ]
        
        sync.sync_manifests(manifests)
        
        # Should call session.run for each manifest
        assert mock_session.run.call_count >= 2
