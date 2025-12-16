import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the hooks
vi.mock('../hooks/useGraph', () => ({
    useGraph: vi.fn(),
}));

// Mock components
vi.mock('../components/Graph', () => ({
    default: vi.fn(() => <div data-testid="graph">Graph Component</div>),
}));

vi.mock('../components/NodeDetails', () => ({
    default: vi.fn(({ urn }) => urn ? <div data-testid="node-details">Details for {urn}</div> : null),
}));

import { useGraph } from '../hooks/useGraph';
import App from '../App';

describe('App component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display header with app name', () => {
        useGraph.mockReturnValue({
            graph: { nodes: [], edges: [] },
            loading: false,
            error: null,
        });

        render(<App />);

        expect(screen.getByText('SCP Viewer')).toBeInTheDocument();
    });

    it('should show loading state', () => {
        useGraph.mockReturnValue({
            graph: { nodes: [], edges: [] },
            loading: true,
            error: null,
        });

        render(<App />);

        expect(screen.getByText('Loading graph...')).toBeInTheDocument();
    });

    it('should show error state', () => {
        useGraph.mockReturnValue({
            graph: { nodes: [], edges: [] },
            loading: false,
            error: 'Connection failed',
        });

        render(<App />);

        expect(screen.getByText(/Error: Connection failed/)).toBeInTheDocument();
    });

    it('should show empty state when no systems', () => {
        useGraph.mockReturnValue({
            graph: { nodes: [], edges: [] },
            loading: false,
            error: null,
        });

        render(<App />);

        expect(screen.getByText('No systems found')).toBeInTheDocument();
        expect(screen.getByText('Run the scanner to populate the graph')).toBeInTheDocument();
    });

    it('should display system and dependency counts', () => {
        useGraph.mockReturnValue({
            graph: {
                nodes: [{ id: '1' }, { id: '2' }, { id: '3' }],
                edges: [{ source: '1', target: '2' }],
            },
            loading: false,
            error: null,
        });

        render(<App />);

        expect(screen.getByText('3 systems')).toBeInTheDocument();
        expect(screen.getByText('1 dependencies')).toBeInTheDocument();
    });

    it('should render tier legend', () => {
        useGraph.mockReturnValue({
            graph: { nodes: [{ id: '1' }], edges: [] },
            loading: false,
            error: null,
        });

        render(<App />);

        expect(screen.getByText('Tier Legend')).toBeInTheDocument();
        expect(screen.getByText('Tier 1 (Critical)')).toBeInTheDocument();
        expect(screen.getByText('Tier 2')).toBeInTheDocument();
        expect(screen.getByText('Tier 3')).toBeInTheDocument();
    });

    it('should render Graph component when data is loaded', () => {
        useGraph.mockReturnValue({
            graph: { nodes: [{ id: '1' }], edges: [] },
            loading: false,
            error: null,
        });

        render(<App />);

        expect(screen.getByTestId('graph')).toBeInTheDocument();
    });
});
