import { describe, it, expect } from 'vitest';
import { storeReducer } from '../src/hooks/useStore'; // I need to export storeReducer from useStore.ts first

describe('Store Reducer', () => {
  const initialState = {
    findings: [],
    assets: [],
    controls: [],
    lastSaved: '2026-01-01T00:00:00Z',
  };

  it('should add findings', () => {
    const newFinding = { id: 'F1', title: 'Test Finding' };
    const action = { type: 'ADD_FINDINGS', payload: [newFinding] };
    const state = storeReducer(initialState, action);
    expect(state.findings).toHaveLength(1);
    expect(state.findings[0].id).toBe('F1');
  });

  it('should update a finding', () => {
    const stateWithFinding = {
      ...initialState,
      findings: [{ id: 'F1', title: 'Old Title' }],
    };
    const updatedFinding = { id: 'F1', title: 'New Title' };
    const action = { type: 'UPDATE_FINDING', payload: updatedFinding };
    const state = storeReducer(stateWithFinding, action);
    expect(state.findings[0].title).toBe('New Title');
  });

  it('should delete a finding', () => {
    const stateWithFinding = {
      ...initialState,
      findings: [{ id: 'F1', title: 'Test' }],
    };
    const action = { type: 'DELETE_FINDING', payload: 'F1' };
    const state = storeReducer(stateWithFinding, action);
    expect(state.findings).toHaveLength(0);
  });
});
