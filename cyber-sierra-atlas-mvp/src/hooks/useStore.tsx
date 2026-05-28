import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Store, Finding, Asset } from '../lib/schema';
import { mergeDuplicates, confirmUnique } from '../lib/dedup-rules';

type StoreAction =
  | { type: 'ADD_FINDINGS'; payload: Finding[] }
  | { type: 'UPDATE_FINDING'; payload: Finding }
  | { type: 'DELETE_FINDING'; payload: string }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'LOAD_FROM_STORAGE'; payload: Store }
  | { type: 'MERGE_DUPLICATES'; payload: { masterId: string; duplicateIds: string[] } }
  | { type: 'CONFIRM_UNIQUE'; payload: string }
  | { type: 'UNMARK_DUPLICATE'; payload: string };

const StoreContext = createContext<{
  store: Store;
  dispatch: React.Dispatch<StoreAction>;
} | null>(null);

const initialStore: Store = {
  findings: [],
  assets: [],
  controls: [],
  lastSaved: new Date().toISOString(),
};

export function storeReducer(state: Store, action: StoreAction): Store {
  switch (action.type) {
    case 'ADD_FINDINGS':
      return {
        ...state,
        findings: [...state.findings, ...action.payload],
        lastSaved: new Date().toISOString(),
      };
    case 'UPDATE_FINDING':
      return {
        ...state,
        findings: state.findings.map(f => f.id === action.payload.id ? action.payload : f),
        lastSaved: new Date().toISOString(),
      };
    case 'DELETE_FINDING':
      return {
        ...state,
        findings: state.findings.filter(f => f.id !== action.payload),
        lastSaved: new Date().toISOString(),
      };
    case 'ADD_ASSET':
      return {
        ...state,
        assets: [...state.assets, action.payload],
        lastSaved: new Date().toISOString(),
      };
    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map(a => a.id === action.payload.id ? action.payload : a),
        lastSaved: new Date().toISOString(),
      };
    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter(a => a.id !== action.payload),
        lastSaved: new Date().toISOString(),
      };
    case 'LOAD_FROM_STORAGE':
      return action.payload || initialStore;
    case 'MERGE_DUPLICATES': {
      const updatedFindings = mergeDuplicates(
        state.findings,
        action.payload.masterId,
        action.payload.duplicateIds
      );
      return {
        ...state,
        findings: updatedFindings,
        lastSaved: new Date().toISOString(),
      };
    }
    case 'CONFIRM_UNIQUE': {
      const targetFinding = state.findings.find(f => f.id === action.payload);
      if (!targetFinding) return state;
      const updatedFinding = confirmUnique(targetFinding);
      return {
        ...state,
        findings: state.findings.map(f => f.id === action.payload ? updatedFinding : f),
        lastSaved: new Date().toISOString(),
      };
    }
    case 'UNMARK_DUPLICATE': {
      return {
        ...state,
        findings: state.findings.map(f =>
          f.id === action.payload
            ? {
                ...f,
                is_confirmed_unique: undefined,
                duplicate_group_id: undefined,
              }
            : f
        ),
        lastSaved: new Date().toISOString(),
      };
    }
    default:
      return state;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, dispatch] = useReducer(storeReducer, initialStore);

  useEffect(() => {
    const saved = localStorage.getItem('fr.store.v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsed });
      } catch (e) {
        console.error('Failed to load store:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fr.store.v3', JSON.stringify(store));
  }, [store]);

  return (
    <StoreContext.Provider value={{ store, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }

  const mergeDuplicateFinding = (masterId: string, duplicateIds: string[]) => {
    context.dispatch({
      type: 'MERGE_DUPLICATES',
      payload: { masterId, duplicateIds },
    });
  };

  const confirmFindingUnique = (findingId: string) => {
    context.dispatch({
      type: 'CONFIRM_UNIQUE',
      payload: findingId,
    });
  };

  const unmarkDuplicate = (findingId: string) => {
    context.dispatch({
      type: 'UNMARK_DUPLICATE',
      payload: findingId,
    });
  };

  return {
    ...context,
    mergeDuplicateFinding,
    confirmFindingUnique,
    unmarkDuplicate,
  };
}
