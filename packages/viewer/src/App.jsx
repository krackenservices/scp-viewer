import { useState } from 'react'
import Graph from './components/Graph'
import NodeDetails from './components/NodeDetails'
import { useGraph } from './hooks/useGraph'

export default function App() {
    const { graph, loading, error } = useGraph()
    const [selectedNode, setSelectedNode] = useState(null)

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">SCP Viewer</h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{graph.nodes.length} systems</span>
                    <span>{graph.edges.length} dependencies</span>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 relative">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Loading graph...
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-500">
                        Error: {error}
                    </div>
                ) : graph.nodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p className="text-xl mb-2">No systems found</p>
                        <p className="text-sm">Run the scanner to populate the graph</p>
                    </div>
                ) : (
                    <Graph
                        graph={graph}
                        selectedNode={selectedNode}
                        onNodeSelect={setSelectedNode}
                    />
                )}

                <NodeDetails
                    urn={selectedNode}
                    onClose={() => setSelectedNode(null)}
                />

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Tier Legend</h3>
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>Tier 1 (Critical)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span>Tier 2</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>Tier 3</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
