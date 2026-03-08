import React, { createContext, useContext, useState, useCallback } from 'react';

interface ScrapContextType {
  newSaveCount: number;
  incrementNewSaves: () => void;
  decrementNewSaves: () => void;
  clearNewSaves: () => void;
}

const ScrapContext = createContext<ScrapContextType | undefined>(undefined);

export function ScrapProvider({ children }: { children: React.ReactNode }) {
  const [newSaveCount, setNewSaveCount] = useState(0);

  const incrementNewSaves = useCallback(() => setNewSaveCount((c) => c + 1), []);
  const decrementNewSaves = useCallback(() => setNewSaveCount((c) => Math.max(0, c - 1)), []);
  const clearNewSaves = useCallback(() => setNewSaveCount(0), []);

  return (
    <ScrapContext.Provider
      value={{ newSaveCount, incrementNewSaves, decrementNewSaves, clearNewSaves }}
    >
      {children}
    </ScrapContext.Provider>
  );
}

export function useScrap() {
  const context = useContext(ScrapContext);
  if (!context) {
    throw new Error('useScrap must be used within ScrapProvider');
  }
  return context;
}
