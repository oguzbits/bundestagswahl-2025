import { useState, useEffect } from 'react';

const URL_CHANGE_EVENT = 'urlstate-change';

function getUrlParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export function useUrlState() {
  const [gebiet1Id, setGebiet1IdState] = useState<string | null>(() => getUrlParam('gebiet1'));
  const [gebiet2Id, setGebiet2IdState] = useState<string | null>(() => {
    const g1 = getUrlParam('gebiet1');
    const g2 = getUrlParam('gebiet2');
    return (g1 && g1 === g2) ? null : g2;
  });

  const handleUrlChange = () => {
    const g1 = getUrlParam('gebiet1');
    let g2 = getUrlParam('gebiet2');
    if (g1 && g1 === g2) {
      g2 = null;
    }
    setGebiet1IdState(g1);
    setGebiet2IdState(g2);
  };

  useEffect(() => {
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener(URL_CHANGE_EVENT, handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener(URL_CHANGE_EVENT, handleUrlChange);
    };
  }, []);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    
    window.history.pushState(null, '', newUrl);
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
  };

  const setGebiet1Id = (id: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (id === null) {
      params.delete('gebiet1');
      params.delete('gebiet2');
    } else {
      params.set('gebiet1', id);
      const currentG2 = params.get('gebiet2');
      if (currentG2 === id) {
        params.delete('gebiet2');
      }
    }
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    
    window.history.pushState(null, '', newUrl);
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
  };

  const setGebiet2Id = (id: string | null) => {
    const currentG1 = getUrlParam('gebiet1');
    if (id !== null && currentG1 === id) {
      return;
    }
    updateParam('gebiet2', id);
  };

  const clearSelection = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('gebiet1');
    params.delete('gebiet2');
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    window.history.pushState(null, '', newUrl);
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
  };

  const swapPositions = () => {
    const params = new URLSearchParams(window.location.search);
    const g1 = params.get('gebiet1');
    const g2 = params.get('gebiet2');
    
    if (g1) {
      params.set('gebiet2', g1);
    } else {
      params.delete('gebiet2');
    }
    
    if (g2) {
      params.set('gebiet1', g2);
    } else {
      params.delete('gebiet1');
    }

    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    window.history.pushState(null, '', newUrl);
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
  };

  return {
    gebiet1Id,
    gebiet2Id,
    setGebiet1Id,
    setGebiet2Id,
    clearSelection,
    swapPositions,
  };
}
