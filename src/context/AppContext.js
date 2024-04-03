import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export const AppProvider = ({ children }) => {
  const [sharedState, setSharedState] = useState({
    origPDF: null,
    foldedPDF: null,
    pageNumberFolded: 1,
    previewWidth: undefined,
    loaded: false,
    numPagesFolded: null
  }); // Initial state

  // The value that will be passed to all child components
  const value = { sharedState, setSharedState };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
