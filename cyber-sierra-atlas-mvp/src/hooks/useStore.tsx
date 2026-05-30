import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Store, Finding, Asset } from '../lib/schema';
import { mergeDuplicates, confirmUnique, unmarkDuplicate, detectDuplicates } from '../lib/dedup-rules';

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
  | { type: 'UNMARK_DUPLICATE'; payload: string }
  | { type: 'DETECT_DUPLICATES'; payload?: void }
  | { type: 'UPDATE_REMEDIATION_STATUS'; findingId: string; status: 'open' | 'in_progress' | 'scheduled' | 'closed' };

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
      const targetFinding = state.findings.find(f => f.id === action.payload);
      if (!targetFinding) return state;
      const updatedFinding = unmarkDuplicate(targetFinding);
      return {
        ...state,
        findings: state.findings.map(f => f.id === action.payload ? updatedFinding : f),
        lastSaved: new Date().toISOString(),
      };
    }
    case 'DETECT_DUPLICATES': {
      const duplicateGroups = detectDuplicates(state.findings);

      // Mark findings as potential duplicates (not confirmed unique yet)
      const updatedFindings = state.findings.map(finding => {
        // Skip if already marked as confirmed unique
        if (finding.is_confirmed_unique === true) return finding;

        // Find which group this finding belongs to
        const groupIndex = duplicateGroups.findIndex(group => group.includes(finding.id));

        if (groupIndex >= 0 && duplicateGroups[groupIndex].length > 1) {
          // This is a potential duplicate (but not yet confirmed/merged)
          return {
            ...finding,
            is_confirmed_unique: finding.is_confirmed_unique === false ? false : undefined,
            flags: {
              ...finding.flags,
              duplicate: true,
            },
          };
        }

        return finding;
      });

      return {
        ...state,
        findings: updatedFindings,
        lastSaved: new Date().toISOString(),
      };
    }
    case 'UPDATE_REMEDIATION_STATUS': {
      const newFindings = state.findings.map(f =>
        f.id === action.findingId
          ? { ...f, remediation_status: action.status }
          : f
      );
      return {
        ...state,
        findings: newFindings,
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

  const unmarkDuplicateFinding = (findingId: string) => {
    context.dispatch({
      type: 'UNMARK_DUPLICATE',
      payload: findingId,
    });
  };

  const detectDuplicatesAction = () => {
    context.dispatch({
      type: 'DETECT_DUPLICATES',
    });
  };

  const updateRemediationStatus = (findingId: string, status: 'open' | 'in_progress' | 'scheduled' | 'closed') => {
    context.dispatch({
      type: 'UPDATE_REMEDIATION_STATUS',
      findingId,
      status,
    });
  };

  return {
    ...context,
    mergeDuplicateFinding,
    confirmFindingUnique,
    unmarkDuplicateFinding,
    detectDuplicatesAction,
    updateRemediationStatus,
  };
}
