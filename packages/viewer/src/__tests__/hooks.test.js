import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGraph, useSystem } from '../hooks/useGraph';

describe('useGraph hook', () => {
    it('should start with loading state', () => {
        global.fetch.mockImplementationOnce(() =>
            new Promise(() => { }) // Never resolves
        );

        const { result } = renderHook(() => useGraph());

        expect(result.current.loading).toBe(true);
        expect(result.current.graph).toEqual({ nodes: [], edges: [] });
        expect(result.current.error).toBeNull();
    });

    it('should return graph data on success', async () => {
        const mockGraph = {
            nodes: [{ id: 'test', label: 'Test' }],
            edges: []
        };

        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(mockGraph)
        });

        const { result } = renderHook(() => useGraph());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.graph).toEqual(mockGraph);
        expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useGraph());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Network error');
    });
});

describe('useSystem hook', () => {
    it('should not fetch when urn is null', async () => {
        const { result } = renderHook(() => useSystem(null));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.system).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch system when urn provided', async () => {
        const mockSystem = {
            urn: 'urn:scp:demo:test',
            name: 'Demo System'
        };

        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(mockSystem)
        });

        const { result } = renderHook(() => useSystem('urn:scp:demo:test'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.system).toEqual(mockSystem);
        expect(global.fetch).toHaveBeenCalledWith('/api/systems/urn%3Ascp%3Ademo%3Atest');
    });
});
