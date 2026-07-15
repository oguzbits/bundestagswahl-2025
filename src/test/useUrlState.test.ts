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
    window.location.search = '?gebiet1=bayern&gebiet2=hamburg';
    const { result } = renderHook(() => useUrlState());

    expect(result.current.gebiet1Name).toBe('bayern');
    expect(result.current.gebiet2Name).toBe('hamburg');
  });

  it('updates state and URL when setGebiet1Name is called', () => {
    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current.setGebiet1Name('bayern');
    });

    expect(result.current.gebiet1Name).toBe('bayern');
    expect(window.location.search).toContain('gebiet1=bayern');
  });

  it('updates state and URL when setGebiet2Name is called', () => {
    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current.setGebiet2Name('hamburg');
    });

    expect(result.current.gebiet2Name).toBe('hamburg');
    expect(window.location.search).toContain('gebiet2=hamburg');
  });

  it('clears both IDs and removes search params when clearSelection is called', () => {
    window.location.search = '?gebiet1=bayern&gebiet2=hamburg';
    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.gebiet1Name).toBeNull();
    expect(result.current.gebiet2Name).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('updates state in response to custom urlstate-change events', () => {
    const { result } = renderHook(() => useUrlState());

    expect(result.current.gebiet1Name).toBeNull();

    act(() => {
      window.location.search = '?gebiet1=berlin';
      window.dispatchEvent(new Event('urlstate-change'));
    });

    expect(result.current.gebiet1Name).toBe('berlin');
  });

  it('swaps positions of gebiet1 and gebiet2 when swapPositions is called', () => {
    window.location.search = '?gebiet1=bayern&gebiet2=hamburg';
    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current.swapPositions();
    });

    expect(result.current.gebiet1Name).toBe('hamburg');
    expect(result.current.gebiet2Name).toBe('bayern');
    expect(window.location.search).toContain('gebiet1=hamburg');
    expect(window.location.search).toContain('gebiet2=bayern');
  });

  it('deletes gebiet2 from URL when setGebiet1Name is called with null (cleared)', () => {
    window.location.search = '?gebiet1=bayern&gebiet2=hamburg';
    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current.setGebiet1Name(null);
    });

    expect(result.current.gebiet1Name).toBeNull();
    expect(result.current.gebiet2Name).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('deletes gebiet2 when setGebiet1Name is set to the same value as the existing gebiet2', () => {
    window.location.search = '?gebiet1=bayern&gebiet2=hamburg';
    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current.setGebiet1Name('hamburg');
    });

    expect(result.current.gebiet1Name).toBe('hamburg');
    expect(result.current.gebiet2Name).toBeNull();
    expect(window.location.search).toBe('?gebiet1=hamburg');
  });

  it('ignores setting gebiet2 to the same value as gebiet1', () => {
    window.location.search = '?gebiet1=bayern';
    const { result } = renderHook(() => useUrlState());

    act(() => {
      result.current.setGebiet2Name('bayern');
    });

    expect(result.current.gebiet1Name).toBe('bayern');
    expect(result.current.gebiet2Name).toBeNull();
    expect(window.location.search).toBe('?gebiet1=bayern');
  });

  it('resolves duplicate initial URL parameters by setting gebiet2 to null', () => {
    window.location.search = '?gebiet1=bayern&gebiet2=bayern';
    const { result } = renderHook(() => useUrlState());

    expect(result.current.gebiet1Name).toBe('bayern');
    expect(result.current.gebiet2Name).toBeNull();
  });
});
