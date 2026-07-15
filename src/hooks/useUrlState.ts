import { useState, useEffect } from 'react';

const URL_CHANGE_EVENT = 'urlstate-change';

function getUrlParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export function useUrlState() {
  const [gebiet1Name, setGebiet1NameState] = useState<string | null>(() => getUrlParam('gebiet1'));
  const [gebiet2Name, setGebiet2NameState] = useState<string | null>(() => {
    const g1 = getUrlParam('gebiet1');
    const g2 = getUrlParam('gebiet2');
    return g1 && g1 === g2 ? null : g2;
  });

  const handleUrlChange = () => {
    const g1 = getUrlParam('gebiet1');
    let g2 = getUrlParam('gebiet2');
    if (g1 && g1 === g2) {
      g2 = null;
    }
    setGebiet1NameState(g1);
    setGebiet2NameState(g2);
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

  const setGebiet1Name = (name: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (name === null) {
      params.delete('gebiet1');
      params.delete('gebiet2');
    } else {
      params.set('gebiet1', name);
      const currentG2 = params.get('gebiet2');
      if (currentG2 === name) {
        params.delete('gebiet2');
      }
    }
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;

    window.history.pushState(null, '', newUrl);
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
  };

  const setGebiet2Name = (name: string | null) => {
    const currentG1 = getUrlParam('gebiet1');
    if (name !== null && currentG1 === name) {
      return;
    }
    updateParam('gebiet2', name);
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
    gebiet1Name,
    gebiet2Name,
    setGebiet1Name,
    setGebiet2Name,
    clearSelection,
    swapPositions,
  };
}
