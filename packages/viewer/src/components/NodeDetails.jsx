import { useSystem } from '../hooks/useGraph'

export default function NodeDetails({ urn, onClose }) {
    const { system, loading } = useSystem(urn)

    if (!urn) return null

    return (
        <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 overflow-auto shadow-lg">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">System Details</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>

            {loading ? (
                <div className="p-4 text-gray-500">Loading...</div>
            ) : system ? (
                <div className="p-4 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{system.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{system.urn}</p>
                    </div>

                    {system.description && (
                        <p className="text-sm text-gray-600">{system.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-500">Tier</span>
                            <p className="font-medium">{system.tier || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-500">Domain</span>
                            <p className="font-medium">{system.domain || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-500">Team</span>
                            <p className="font-medium">{system.team || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-500">OTel Service</span>
                            <p className="font-medium text-xs">{system.otelServiceName || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Dependencies</span>
                            <span className="font-medium">{system.dependencyCount || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Dependents</span>
                            <span className="font-medium">{system.dependentCount || 0}</span>
                        </div>
                    </div>

                    {system.capabilities?.length > 0 && (
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Capabilities</h4>
                            <div className="flex flex-wrap gap-1">
                                {system.capabilities.map(cap => (
                                    <span
                                        key={cap}
                                        className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded"
                                    >
                                        {cap}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 text-gray-500">System not found</div>
            )}
        </div>
    )
}
