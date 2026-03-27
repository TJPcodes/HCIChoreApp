// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

const STORAGE_KEY = 'choresync_data';

const EMPTY_STATE = {
  currentUserId: 'u1',
  users: [
    { id: 'u1', name: 'Tyler',  color: '#4F8EF7' },
    { id: 'u2', name: 'Zach',   color: '#34C78A' },
    { id: 'u3', name: 'Wilson', color: '#F5A623' },
  ],
  groups: [],           // { id, name, memberIds }
  chores: [],           // { id, name, groupId, assigneeId, frequency, autoRotate, dueDateStart, dueDateEnd, status }
  activity: [],         // { id, type, msg, time }
  activeGroupId: null,
};

export function AppProvider({ children }) {
  const [state, setState] = useState(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setState(JSON.parse(raw)); } catch (_) {}
      }
      setLoaded(true);
    });
  }, []);

  // Save to storage whenever state changes
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  // Helpers

  function getUserById(id) {
    return state.users.find(u => u.id === id) || { name: 'Unknown', color: '#888' };
  }

  function getActiveGroup() {
    return state.groups.find(g => g.id === state.activeGroupId) || null;
  }

  function getChoresForGroup(groupId) {
    return state.chores.filter(c => c.groupId === groupId);
  }

  function getMyChores() {
    return state.chores.filter(c => c.assigneeId === state.currentUserId);
  }

  function addActivity(msg, type = 'info') {
    const event = {
      id:   Date.now().toString(),
      type,
      msg,
      time: 'Just now',
    };
    setState(prev => ({ ...prev, activity: [event, ...prev.activity] }));
  }

  // Actions 
  function createGroup(name) {
    const group = {
      id:        Date.now().toString(),
      name,
      memberIds: [state.currentUserId],
    };
    setState(prev => ({
      ...prev,
      groups:        [...prev.groups, group],
      activeGroupId: group.id,
    }));
    addActivity(`You created group "${name}"`, 'added');
    return group;
  }

  function switchGroup(groupId) {
    setState(prev => ({ ...prev, activeGroupId: groupId }));
  }

  function deleteGroup(groupId) {
    setState(prev => ({
      ...prev,
      groups:        prev.groups.filter(g => g.id !== groupId),
      chores:        prev.chores.filter(c => c.groupId !== groupId),
      activeGroupId: prev.activeGroupId === groupId ? null : prev.activeGroupId,
    }));
  }

  function addChore(chore) {
    const newChore = {
      id:        Date.now().toString(),
      status:    'pending',
      groupId:   state.activeGroupId,
      ...chore,
    };
    setState(prev => ({ ...prev, chores: [...prev.chores, newChore] }));
    addActivity(`New chore "${chore.name}" added`, 'added');
    return newChore;
  }

  function markComplete(choreId) {
    const chore = state.chores.find(c => c.id === choreId);
    if (!chore) return;
    setState(prev => ({
      ...prev,
      chores: prev.chores.map(c =>
        c.id === choreId ? { ...c, status: 'completed' } : c
      ),
    }));
    addActivity(`${getUserById(chore.assigneeId).name} completed "${chore.name}"`, 'completed');
  }

  function deleteChore(choreId) {
    setState(prev => ({
      ...prev,
      chores: prev.chores.filter(c => c.id !== choreId),
    }));
  }

  function sendNudge(chore) {
    addActivity(`Anonymous nudge sent about "${chore.name}"`, 'nudge');
  }

  function clearAll() {
    setState(EMPTY_STATE);
  }

  // Context Value

  const value = {
    ...state,
    loaded,
    getUserById,
    getActiveGroup,
    getChoresForGroup,
    getMyChores,
    createGroup,
    switchGroup,
    deleteGroup,
    addChore,
    markComplete,
    deleteChore,
    sendNudge,
    clearAll,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}