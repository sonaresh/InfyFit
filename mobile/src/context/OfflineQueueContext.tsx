import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { syncApi } from '../services/api';

type QueueAction =
  | { type: 'enqueue'; payload: OfflineEntry }
  | { type: 'dequeue'; id: string }
  | { type: 'clear' }
  | { type: 'syncing'; value: boolean };

export interface OfflineEntry {
  id: string;
  type: 'meal' | 'product' | 'workout';
  payload: Record<string, unknown>;
  createdAt: string;
}

interface OfflineQueueState {
  entries: OfflineEntry[];
  syncing: boolean;
}

interface OfflineQueueContextValue extends OfflineQueueState {
  enqueue(entry: OfflineEntry): void;
  flush(): Promise<void>;
  remove(id: string): void;
}

const initialState: OfflineQueueState = {
  entries: [],
  syncing: false
};

function reducer(state: OfflineQueueState, action: QueueAction): OfflineQueueState {
  switch (action.type) {
    case 'enqueue':
      return { ...state, entries: [...state.entries, action.payload] };
    case 'dequeue':
      return { ...state, entries: state.entries.filter(entry => entry.id !== action.id) };
    case 'clear':
      return { ...state, entries: [] };
    case 'syncing':
      return { ...state, syncing: action.value };
    default:
      return state;
  }
}

const OfflineQueueContext = createContext<OfflineQueueContextValue | undefined>(undefined);

export const OfflineQueueProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const enqueue = useCallback((entry: OfflineEntry) => {
    dispatch({ type: 'enqueue', payload: entry });
  }, []);

  const remove = useCallback((id: string) => {
    dispatch({ type: 'dequeue', id });
  }, []);

  const flush = useCallback(async () => {
    if (state.entries.length === 0) {
      return;
    }

    dispatch({ type: 'syncing', value: true });
    try {
      await syncApi.push(state.entries.length);
      dispatch({ type: 'clear' });
    } catch (error) {
      console.warn('Failed to push offline data', error);
      throw error;
    } finally {
      dispatch({ type: 'syncing', value: false });
    }
  }, [state.entries.length]);

  const value = useMemo<OfflineQueueContextValue>(
    () => ({
      entries: state.entries,
      syncing: state.syncing,
      enqueue,
      flush,
      remove
    }),
    [state.entries, state.syncing, enqueue, flush, remove]
  );

  return <OfflineQueueContext.Provider value={value}>{children}</OfflineQueueContext.Provider>;
};

export const useOfflineQueue = () => {
  const context = useContext(OfflineQueueContext);
  if (!context) {
    throw new Error('useOfflineQueue must be used within OfflineQueueProvider');
  }
  return context;
};
