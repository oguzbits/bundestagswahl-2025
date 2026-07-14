import { useState, useEffect } from 'react';

const URL_CHANGE_EVENT = 'urlstate-change';

function getUrlParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export function useUrlState() {
  const [gebiet1Id, setGebiet1IdState] = useState<string | null>(() => getUrlParam('gebiet1'));
  const [gebiet2Id, setGebiet2IdState] = useState<string | null>(() => getUrlParam('gebiet2'));

  const handleUrlChange = () => {
    setGebiet1IdState(getUrlParam('gebiet1'));
    setGebiet2IdState(getUrlParam('gebiet2'));
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
    updateParam('gebiet1', id);
  };

  const setGebiet2Id = (id: string | null) => {
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

  return {
    gebiet1Id,
    gebiet2Id,
    setGebiet1Id,
    setGebiet2Id,
    clearSelection,
  };
}
