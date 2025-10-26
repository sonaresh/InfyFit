import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

interface PreferencesState {
  dietaryPreference: 'omnivore' | 'vegetarian' | 'vegan';
  healthDataConsent: boolean;
  autoDeleteImages: boolean;
}

interface PreferencesContextValue extends PreferencesState {
  setDietaryPreference(value: PreferencesState['dietaryPreference']): void;
  toggleHealthDataConsent(): void;
  toggleAutoDeleteImages(): void;
  hydrated: boolean;
}

const defaultState: PreferencesState = {
  dietaryPreference: 'omnivore',
  healthDataConsent: false,
  autoDeleteImages: false
};

const PREFERENCES_KEY = 'infyfit.preferences';

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export const PreferencesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<PreferencesState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(PREFERENCES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as PreferencesState;
          setState(parsed);
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    SecureStore.setItemAsync(PREFERENCES_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state, hydrated]);

  const setDietaryPreference = useCallback((value: PreferencesState['dietaryPreference']) => {
    setState(prev => ({ ...prev, dietaryPreference: value }));
  }, []);

  const toggleHealthDataConsent = useCallback(() => {
    setState(prev => ({ ...prev, healthDataConsent: !prev.healthDataConsent }));
  }, []);

  const toggleAutoDeleteImages = useCallback(() => {
    setState(prev => ({ ...prev, autoDeleteImages: !prev.autoDeleteImages }));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...state,
      setDietaryPreference,
      toggleHealthDataConsent,
      toggleAutoDeleteImages,
      hydrated
    }),
    [state, setDietaryPreference, toggleHealthDataConsent, toggleAutoDeleteImages, hydrated]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};
