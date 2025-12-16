import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NodeDetails from '../components/NodeDetails';

// Mock the useSystem hook
vi.mock('../hooks/useGraph', () => ({
    useSystem: vi.fn(),
}));

import { useSystem } from '../hooks/useGraph';

describe('NodeDetails component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when urn is null', () => {
        useSystem.mockReturnValue({ system: null, loading: false });

        const { container } = render(<NodeDetails urn={null} onClose={() => { }} />);

        expect(container.firstChild).toBeNull();
    });

    it('should show loading state', () => {
        useSystem.mockReturnValue({ system: null, loading: true });

        render(<NodeDetails urn="urn:scp:test:api" onClose={() => { }} />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display system details when loaded', () => {
        const mockSystem = {
            urn: 'urn:scp:test:api',
            name: 'Test API',
            tier: 1,
            domain: 'backend',
            team: 'api-team',
            description: 'A test API service',
            dependencyCount: 3,
            dependentCount: 2,
            capabilities: ['rest-api', 'graphql'],
        };

        useSystem.mockReturnValue({ system: mockSystem, loading: false });

        render(<NodeDetails urn="urn:scp:test:api" onClose={() => { }} />);

        expect(screen.getByText('Test API')).toBeInTheDocument();
        expect(screen.getByText('urn:scp:test:api')).toBeInTheDocument();
        expect(screen.getByText('A test API service')).toBeInTheDocument();
        expect(screen.getByText('backend')).toBeInTheDocument();
        expect(screen.getByText('api-team')).toBeInTheDocument();
    });

    it('should display capabilities as badges', () => {
        const mockSystem = {
            urn: 'urn:scp:test:api',
            name: 'Test API',
            capabilities: ['rest-api', 'graphql'],
        };

        useSystem.mockReturnValue({ system: mockSystem, loading: false });

        render(<NodeDetails urn="urn:scp:test:api" onClose={() => { }} />);

        expect(screen.getByText('rest-api')).toBeInTheDocument();
        expect(screen.getByText('graphql')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', () => {
        const onClose = vi.fn();
        const mockSystem = {
            urn: 'urn:scp:test:api',
            name: 'Test API',
        };

        useSystem.mockReturnValue({ system: mockSystem, loading: false });

        render(<NodeDetails urn="urn:scp:test:api" onClose={onClose} />);

        const closeButton = screen.getByRole('button', { name: '✕' });
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should show system not found when system is null after loading', () => {
        useSystem.mockReturnValue({ system: null, loading: false });

        render(<NodeDetails urn="urn:scp:nonexistent:api" onClose={() => { }} />);

        expect(screen.getByText('System not found')).toBeInTheDocument();
    });

    it('should display dependency and dependent counts', () => {
        const mockSystem = {
            urn: 'urn:scp:test:api',
            name: 'Test API',
            dependencyCount: 5,
            dependentCount: 10,
        };

        useSystem.mockReturnValue({ system: mockSystem, loading: false });

        render(<NodeDetails urn="urn:scp:test:api" onClose={() => { }} />);

        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
    });
});
