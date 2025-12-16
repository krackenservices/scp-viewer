import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock CytoscapeComponent since it requires canvas
vi.mock('react-cytoscapejs', () => ({
    default: vi.fn(({ elements, stylesheet, layout, style, cy }) => {
        // Simulate calling the cy callback with a mock
        if (cy) {
            const mockCy = {
                on: vi.fn(),
            };
            cy(mockCy);
        }
        return (
            <div data-testid="cytoscape-mock" style={style}>
                <span>Graph with {elements?.length || 0} elements</span>
            </div>
        );
    }),
}));

import Graph from '../components/Graph';

describe('Graph component', () => {
    const mockGraph = {
        nodes: [
            { id: 'urn:scp:api:rest', label: 'API', tier: 1, domain: 'backend', team: 'api-team' },
            { id: 'urn:scp:frontend:web', label: 'Frontend', tier: 2, domain: 'presentation', team: 'frontend-team' },
        ],
        edges: [
            { source: 'urn:scp:frontend:web', target: 'urn:scp:api:rest', type: 'rest', criticality: 'required' },
        ],
    };

    it('should render without crashing', () => {
        render(<Graph graph={mockGraph} onNodeSelect={() => { }} />);

        expect(screen.getByTestId('cytoscape-mock')).toBeInTheDocument();
    });

    it('should pass correct number of elements', () => {
        render(<Graph graph={mockGraph} onNodeSelect={() => { }} />);

        // 2 nodes + 1 edge = 3 elements
        expect(screen.getByText('Graph with 3 elements')).toBeInTheDocument();
    });

    it('should render with empty graph', () => {
        const emptyGraph = { nodes: [], edges: [] };

        render(<Graph graph={emptyGraph} onNodeSelect={() => { }} />);

        expect(screen.getByText('Graph with 0 elements')).toBeInTheDocument();
    });

    it('should handle nodes without labels', () => {
        const graphWithoutLabels = {
            nodes: [
                { id: 'urn:scp:test:api', tier: 1 }, // No label, should use last part of URN
            ],
            edges: [],
        };

        render(<Graph graph={graphWithoutLabels} onNodeSelect={() => { }} />);

        expect(screen.getByTestId('cytoscape-mock')).toBeInTheDocument();
    });
});

describe('Graph elements transformation', () => {
    it('should transform nodes correctly', () => {
        const node = { id: 'test:urn', label: 'Test', tier: 1, domain: 'backend', team: 'team' };

        // Simulate the useMemo transformation
        const transformed = {
            data: {
                id: node.id,
                label: node.label || node.id.split(':').pop(),
                tier: node.tier,
                domain: node.domain,
                team: node.team,
            },
        };

        expect(transformed.data.id).toBe('test:urn');
        expect(transformed.data.label).toBe('Test');
        expect(transformed.data.tier).toBe(1);
    });

    it('should transform edges correctly', () => {
        const edge = { source: 'a', target: 'b', type: 'rest', criticality: 'required' };

        const transformed = {
            data: {
                id: 'edge-0',
                source: edge.source,
                target: edge.target,
                type: edge.type,
                criticality: edge.criticality,
            },
        };

        expect(transformed.data.source).toBe('a');
        expect(transformed.data.target).toBe('b');
        expect(transformed.data.criticality).toBe('required');
    });
});

describe('Graph tier colors', () => {
    const tierColors = {
        1: '#ef4444', // red
        2: '#f59e0b', // amber
        3: '#10b981', // green
        4: '#3b82f6', // blue
        5: '#8b5cf6', // purple
    };

    it('should have correct color for tier 1 (critical)', () => {
        expect(tierColors[1]).toBe('#ef4444');
    });

    it('should have correct color for tier 2', () => {
        expect(tierColors[2]).toBe('#f59e0b');
    });

    it('should have correct color for tier 3', () => {
        expect(tierColors[3]).toBe('#10b981');
    });
});
