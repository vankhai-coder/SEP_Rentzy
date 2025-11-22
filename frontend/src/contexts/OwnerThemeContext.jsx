import React, { createContext, useContext } from 'react';

const OwnerThemeContext = createContext(null);

export const useOwnerTheme = () => {
  const context = useContext(OwnerThemeContext);
  return context;
};

export const OwnerThemeProvider = ({ children, theme }) => {
  return (
    <OwnerThemeContext.Provider value={theme}>
      {children}
    </OwnerThemeContext.Provider>
  );
};

