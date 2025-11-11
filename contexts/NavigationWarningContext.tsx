import React, { createContext, useContext, useState, useCallback } from 'react';

interface NavigationWarningContextType {
  shouldWarnBeforeNavigation: boolean;
  setShouldWarnBeforeNavigation: (shouldWarn: boolean) => void;
  requestNavigation: (navigateFn: () => void) => void;
  showWarningModal: boolean;
  setShowWarningModal: (show: boolean) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  setPendingNavigationFn: (navigateFn: () => void) => void;
}

const NavigationWarningContext = createContext<NavigationWarningContextType | undefined>(undefined);

export const NavigationWarningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shouldWarnBeforeNavigation, setShouldWarnBeforeNavigation] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const requestNavigation = useCallback((navigateFn: () => void) => {
    if (shouldWarnBeforeNavigation) {
      setPendingNavigation(() => navigateFn);
      setShowWarningModal(true);
    } else {
      navigateFn();
    }
  }, [shouldWarnBeforeNavigation]);

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      pendingNavigation();
    }
    setShowWarningModal(false);
    setPendingNavigation(null);
  }, [pendingNavigation]);

  const cancelNavigation = useCallback(() => {
    setShowWarningModal(false);
    setPendingNavigation(null);
  }, []);

  const setPendingNavigationFn = useCallback((navigateFn: () => void) => {
    setPendingNavigation(() => navigateFn);
    setShowWarningModal(true);
  }, []);

  return (
    <NavigationWarningContext.Provider
      value={{
        shouldWarnBeforeNavigation,
        setShouldWarnBeforeNavigation,
        requestNavigation,
        showWarningModal,
        setShowWarningModal,
        confirmNavigation,
        cancelNavigation,
        setPendingNavigationFn,
      }}
    >
      {children}
    </NavigationWarningContext.Provider>
  );
};

export const useNavigationWarning = () => {
  const context = useContext(NavigationWarningContext);
  if (context === undefined) {
    throw new Error('useNavigationWarning must be used within a NavigationWarningProvider');
  }
  return context;
};
