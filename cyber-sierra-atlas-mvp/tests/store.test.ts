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

  it('should merge duplicates', () => {
    const stateWithFindings = {
      ...initialState,
      findings: [
        { id: 'F1', title: 'Master', is_confirmed_unique: false },
        { id: 'F2', title: 'Duplicate', is_confirmed_unique: false },
        { id: 'F3', title: 'Other', is_confirmed_unique: false },
      ],
    };
    const action = {
      type: 'MERGE_DUPLICATES',
      payload: { masterId: 'F1', duplicateIds: ['F2'] },
    };
    const state = storeReducer(stateWithFindings, action);
    expect(state.findings[0].is_confirmed_unique).toBe(true);
    expect(state.findings[0].duplicate_group_id).toBeUndefined();
    expect(state.findings[1].duplicate_group_id).toBe('F1');
    expect(state.findings[1].is_confirmed_unique).toBe(false);
    expect(state.lastSaved).not.toBe(initialState.lastSaved);
  });

  it('should confirm a finding as unique', () => {
    const stateWithFinding = {
      ...initialState,
      findings: [
        { id: 'F1', title: 'Test', is_confirmed_unique: false, duplicate_group_id: 'F2' },
      ],
    };
    const action = { type: 'CONFIRM_UNIQUE', payload: 'F1' };
    const state = storeReducer(stateWithFinding, action);
    expect(state.findings[0].is_confirmed_unique).toBe(true);
    expect(state.findings[0].duplicate_group_id).toBeUndefined();
    expect(state.lastSaved).not.toBe(initialState.lastSaved);
  });

  it('should unmark a duplicate', () => {
    const stateWithFinding = {
      ...initialState,
      findings: [
        { id: 'F1', title: 'Test', is_confirmed_unique: true, duplicate_group_id: 'F2' },
      ],
    };
    const action = { type: 'UNMARK_DUPLICATE', payload: 'F1' };
    const state = storeReducer(stateWithFinding, action);
    expect(state.findings[0].is_confirmed_unique).toBeUndefined();
    expect(state.findings[0].duplicate_group_id).toBeUndefined();
    expect(state.lastSaved).not.toBe(initialState.lastSaved);
  });
});
