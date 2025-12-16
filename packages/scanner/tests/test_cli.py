"""Tests for the scanner CLI."""

import pytest
from unittest.mock import Mock, patch, MagicMock
import os


class TestCLI:
    """Tests for the CLI main function."""

    @patch.dict(os.environ, {
        "NEO4J_URI": "bolt://test:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "testpass",
    }, clear=True)
    @patch("scanner.cli.Neo4jSync")
    def test_main_no_sources_exits(self, mock_sync_class, capsys):
        """Test that main exits when no scan sources configured."""
        from scanner.cli import main
        
        mock_sync = MagicMock()
        mock_sync_class.return_value.__enter__ = Mock(return_value=mock_sync)
        mock_sync_class.return_value.__exit__ = Mock(return_value=False)
        
        with pytest.raises(SystemExit) as exc_info:
            main()
        
        assert exc_info.value.code == 1
        captured = capsys.readouterr()
        assert "No manifests found" in captured.out

    @patch.dict(os.environ, {
        "NEO4J_URI": "bolt://test:7687",
        "NEO4J_USER": "neo4j", 
        "NEO4J_PASSWORD": "testpass",
        "SCAN_PATH": "/test/path",
    }, clear=True)
    @patch("scanner.cli.Neo4jSync")
    @patch("scanner.cli.scan_directory")
    @patch("scanner.cli.load_scp")
    def test_main_scans_local_path(self, mock_load_scp, mock_scan_dir, mock_sync_class, capsys):
        """Test that main scans local path when SCAN_PATH is set."""
        from scanner.cli import main
        
        mock_sync = MagicMock()
        mock_sync_class.return_value.__enter__ = Mock(return_value=mock_sync)
        mock_sync_class.return_value.__exit__ = Mock(return_value=False)
        
        # Mock scan_directory to return some files
        mock_scan_dir.return_value = ["/test/path/scp.yaml"]
        
        # Mock load_scp to return a manifest
        mock_manifest = Mock()
        mock_manifest.system.name = "Test System"
        mock_load_scp.return_value = mock_manifest
        
        main()
        
        mock_scan_dir.assert_called_once_with("/test/path")
        mock_load_scp.assert_called_once()
        mock_sync.sync_manifests.assert_called_once()

    @patch.dict(os.environ, {
        "NEO4J_URI": "bolt://test:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "testpass",
        "SCAN_PATH": "/test/path",
    }, clear=True)
    @patch("scanner.cli.Neo4jSync")
    @patch("scanner.cli.scan_directory")
    @patch("scanner.cli.load_scp")
    def test_main_handles_parse_error(self, mock_load_scp, mock_scan_dir, mock_sync_class, capsys):
        """Test that main handles parse errors gracefully."""
        from scanner.cli import main
        
        mock_sync = MagicMock()
        mock_sync_class.return_value.__enter__ = Mock(return_value=mock_sync)
        mock_sync_class.return_value.__exit__ = Mock(return_value=False)
        
        mock_scan_dir.return_value = ["/test/path/scp.yaml"]
        mock_load_scp.side_effect = Exception("Parse error")
        
        with pytest.raises(SystemExit):
            main()
        
        captured = capsys.readouterr()
        assert "Parse error" in captured.out

    @patch.dict(os.environ, {
        "NEO4J_URI": "bolt://test:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "testpass",
        "GITHUB_ORG": "testorg",
        "GITHUB_TOKEN": "ghp_test",
    }, clear=True)
    @patch("scanner.cli.Neo4jSync")
    @patch("scanner.cli.scan_github_org")
    def test_main_scans_github_org(self, mock_scan_github, mock_sync_class, capsys):
        """Test that main scans GitHub org when configured."""
        from scanner.cli import main
        
        mock_sync = MagicMock()
        mock_sync_class.return_value.__enter__ = Mock(return_value=mock_sync)
        mock_sync_class.return_value.__exit__ = Mock(return_value=False)
        
        # Mock GitHub scan result
        mock_file = Mock()
        mock_file.manifest = Mock()
        mock_file.manifest.system.name = "GitHub System"
        mock_file.repo = "testorg/testrepo"
        mock_scan_github.return_value = [mock_file]
        
        main()
        
        mock_scan_github.assert_called_once_with("testorg", "ghp_test")
        mock_sync.sync_manifests.assert_called_once()

    @patch.dict(os.environ, {
        "NEO4J_URI": "bolt://test:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "testpass",
        "GITHUB_ORG": "testorg",
        "GITHUB_TOKEN": "ghp_test",
    }, clear=True)
    @patch("scanner.cli.Neo4jSync")
    @patch("scanner.cli.scan_github_org")
    def test_main_handles_github_error(self, mock_scan_github, mock_sync_class, capsys):
        """Test that main handles GitHub API errors."""
        from scanner.cli import main
        
        mock_sync = MagicMock()
        mock_sync_class.return_value.__enter__ = Mock(return_value=mock_sync)
        mock_sync_class.return_value.__exit__ = Mock(return_value=False)
        
        mock_scan_github.side_effect = Exception("API rate limit exceeded")
        
        with pytest.raises(SystemExit):
            main()
        
        captured = capsys.readouterr()
        assert "GitHub scan failed" in captured.out
