import CytoscapeComponent from 'react-cytoscapejs'
import { useMemo } from 'react'

const tierColors = {
    1: '#ef4444', // red
    2: '#f59e0b', // amber
    3: '#10b981', // green
    4: '#3b82f6', // blue
    5: '#8b5cf6'  // purple
}

export default function Graph({ graph, onNodeSelect, selectedNode }) {
    const elements = useMemo(() => {
        const nodes = graph.nodes.map(node => ({
            data: {
                id: node.id,
                label: node.label || node.id.split(':').pop(),
                tier: node.tier,
                domain: node.domain,
                team: node.team
            }
        }))

        const edges = graph.edges.map((edge, i) => ({
            data: {
                id: `edge-${i}`,
                source: edge.source,
                target: edge.target,
                type: edge.type,
                criticality: edge.criticality
            }
        }))

        return [...nodes, ...edges]
    }, [graph])

    const stylesheet = [
        {
            selector: 'node',
            style: {
                'label': 'data(label)',
                'text-valign': 'bottom',
                'text-halign': 'center',
                'font-size': '12px',
                'font-family': 'Inter, sans-serif',
                'background-color': (ele) => tierColors[ele.data('tier')] || '#6b7280',
                'color': '#374151',
                'width': 40,
                'height': 40,
                'border-width': 2,
                'border-color': '#fff'
            }
        },
        {
            selector: 'node:selected',
            style: {
                'border-width': 4,
                'border-color': '#4f46e5'
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#d1d5db',
                'target-arrow-color': '#d1d5db',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'arrow-scale': 1.2
            }
        },
        {
            selector: 'edge[criticality = "required"]',
            style: {
                'line-color': '#ef4444',
                'target-arrow-color': '#ef4444'
            }
        }
    ]

    const layout = {
        name: 'cose',
        animate: false,
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        gravity: 0.3
    }

    return (
        <CytoscapeComponent
            elements={elements}
            stylesheet={stylesheet}
            layout={layout}
            style={{ width: '100%', height: '100%' }}
            cy={(cy) => {
                cy.on('tap', 'node', (evt) => {
                    onNodeSelect?.(evt.target.id())
                })
                cy.on('tap', (evt) => {
                    if (evt.target === cy) {
                        onNodeSelect?.(null)
                    }
                })
            }}
        />
    )
}
