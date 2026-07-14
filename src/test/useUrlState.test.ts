import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUrlState } from '../hooks/useUrlState';

describe('useUrlState Hook', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location and pushState to isolate tests
    const mockLocation = {
      ...originalLocation,
      pathname: '/',
      search: '',
    } as unknown as Location;

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });
    
    vi.spyOn(window.history, 'pushState').mockImplementation((_state, _title, url) => {
      const urlStr = url ? url.toString() : '';
      const searchIndex = urlStr.indexOf('?');
      mockLocation.search = searchIndex !== -1 ? urlStr.slice(searchIndex) : '';
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('reads initial values from the URL search parameters', () => {
    window.location.search = '?gebiet1=901&gebiet2=902';
    const { result } = renderHook(() => useUrlState());
    
    expect(result.current.gebiet1Id).toBe('901');
    expect(result.current.gebiet2Id).toBe('902');
  });

  it('updates state and URL when setGebiet1Id is called', () => {
    const { result } = renderHook(() => useUrlState());
    
    act(() => {
      result.current.setGebiet1Id('123');
    });

    expect(result.current.gebiet1Id).toBe('123');
    expect(window.location.search).toContain('gebiet1=123');
  });

  it('updates state and URL when setGebiet2Id is called', () => {
    const { result } = renderHook(() => useUrlState());
    
    act(() => {
      result.current.setGebiet2Id('456');
    });

    expect(result.current.gebiet2Id).toBe('456');
    expect(window.location.search).toContain('gebiet2=456');
  });

  it('clears both IDs and removes search params when clearSelection is called', () => {
    window.location.search = '?gebiet1=123&gebiet2=456';
    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.gebiet1Id).toBeNull();
    expect(result.current.gebiet2Id).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('updates state in response to custom urlstate-change events', () => {
    const { result } = renderHook(() => useUrlState());
    
    expect(result.current.gebiet1Id).toBeNull();

    act(() => {
      window.location.search = '?gebiet1=789';
      window.dispatchEvent(new Event('urlstate-change'));
    });

    expect(result.current.gebiet1Id).toBe('789');
  });

  it('swaps positions of gebiet1 and gebiet2 when swapPositions is called', () => {
    window.location.search = '?gebiet1=901&gebiet2=902';
    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current.swapPositions();
    });

    expect(result.current.gebiet1Id).toBe('902');
    expect(result.current.gebiet2Id).toBe('901');
    expect(window.location.search).toContain('gebiet1=902');
    expect(window.location.search).toContain('gebiet2=901');
  });
});
