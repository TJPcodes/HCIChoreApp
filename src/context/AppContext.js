// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AppContext = createContext(null);

// ── Helpers: convert between Supabase snake_case and app camelCase ──────────

function choreFromDb(row) {
  return {
    id:           row.id,
    name:         row.name,
    assigneeId:   row.assignee_id,
    groupId:      row.group_id,
    frequency:    row.frequency,
    autoRotate:   row.auto_rotate,
    dueDateStart: row.due_date_start,
    dueDateEnd:   row.due_date_end,
    status:       row.status,
  };
}

function activityFromDb(row) {
  return {
    id:   row.id,
    type: row.type,
    msg:  row.msg,
    time: timeAgo(row.created_at),
    // icon + color are derived from type in ActivityScreen's TYPE_STYLES
  };
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60)  return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)  return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)    return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)      return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// ── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [session, setSession]         = useState(null);
  const [loaded, setLoaded]           = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);

  const [state, setState] = useState({
    currentUserId: null,
    users:    [],
    groups:   [],
    chores:   [],
    activity: [],
  });

  // ── 1. Auth listener ──────────────────────────────────────────────────────
  // Fires on login, signup, logout, and token refresh.

  useEffect(() => {
    // Check for existing session on app start
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => setSession(s),
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── 2. Fetch data whenever session or active group changes ────────────────

  useEffect(() => {
    if (session?.user) {
      fetchData(session.user.id);
    } else {
      // Logged out — reset everything
      setState({ currentUserId: null, users: [], groups: [], chores: [], activity: [] });
      setActiveGroupId(null);
      setLoaded(true);
    }
  }, [session]);

  // Re-fetch activity when active group changes
  useEffect(() => {
    if (session?.user && activeGroupId) {
      fetchActivity(activeGroupId);
    }
  }, [activeGroupId]);

  // ── 3. Data fetching ─────────────────────────────────────────────────────

  async function fetchData(userId) {
    try {
      // a) Current user's profile (always needed for greeting)
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // b) Groups the user belongs to
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      const groupIds = (memberships || []).map(m => m.group_id);

      // If user has no groups yet (fresh signup)
      if (groupIds.length === 0) {
        setState({
          currentUserId: userId,
          users: [{ id: myProfile.id, name: myProfile.name, color: myProfile.color }],
          groups:   [],
          chores:   [],
          activity: [],
        });
        setLoaded(true);
        return;
      }

      // c) Group details
      const { data: groupRows } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      // d) All memberships for those groups (to know who's in each group)
      const { data: allMemberships } = await supabase
        .from('group_members')
        .select('group_id, user_id')
        .in('group_id', groupIds);

      // e) Profiles for all group members
      const allUserIds = [...new Set((allMemberships || []).map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', allUserIds);

      const users = (profiles || []).map(p => ({
        id:    p.id,
        name:  p.name,
        color: p.color,
      }));

      // f) Build groups with memberIds
      const groups = (groupRows || []).map(g => ({
        id:         g.id,
        name:       g.name,
        inviteCode: g.invite_code,
        memberIds:  (allMemberships || [])
          .filter(m => m.group_id === g.id)
          .map(m => m.user_id),
      }));

      // g) Determine active group
      let newActiveGroupId = activeGroupId;
      if (!newActiveGroupId || !groupIds.includes(newActiveGroupId)) {
        newActiveGroupId = groupIds[0];
      }

      // h) Chores for all user's groups
      const { data: choreRows } = await supabase
        .from('chores')
        .select('*')
        .in('group_id', groupIds);
      const chores = (choreRows || []).map(choreFromDb);

      // i) Activity for active group
      let activity = [];
      if (newActiveGroupId) {
        const { data: activityRows } = await supabase
          .from('activity')
          .select('*')
          .eq('group_id', newActiveGroupId)
          .order('created_at', { ascending: false })
          .limit(50);
        activity = (activityRows || []).map(activityFromDb);
      }

      setState({
        currentUserId: userId,
        users,
        groups,
        chores,
        activity,
      });
      setActiveGroupId(newActiveGroupId);
      setLoaded(true);
    } catch (err) {
      console.error('fetchData error:', err);
      setLoaded(true);
    }
  }

  async function fetchActivity(groupId) {
    try {
      const { data: activityRows } = await supabase
        .from('activity')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(50);
      setState(prev => ({
        ...prev,
        activity: (activityRows || []).map(activityFromDb),
      }));
    } catch (err) {
      console.error('fetchActivity error:', err);
    }
  }

  /** Re-fetch everything from Supabase. Call after any mutation. */
  async function refreshData() {
    if (session?.user) await fetchData(session.user.id);
  }

  // ── 4. Helpers (same interface your screens already use) ──────────────────

  function getUserById(id) {
    return state.users.find(u => u.id === id) || { name: 'Unknown', color: '#888' };
  }

  function getActiveGroup() {
    return state.groups.find(g => g.id === activeGroupId) || null;
  }

  function getChoresForGroup(groupId) {
    return state.chores.filter(c => c.groupId === groupId);
  }

  function getMyChores() {
    return state.chores.filter(c => c.assigneeId === state.currentUserId);
  }

  // ── 5. Actions (write to Supabase, then refresh) ─────────────────────────

  async function addActivity(msg, type = 'info') {
    if (!activeGroupId) return;
    await supabase.from('activity').insert({
      group_id:   activeGroupId,
      type,
      msg,
      created_by: state.currentUserId,
    });
  }

  async function createGroup(name) {
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, created_by: state.currentUserId })
      .select()
      .single();

    if (error) { console.error('createGroup:', error); return null; }

    // Add current user as admin
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id:  state.currentUserId,
      role:     'admin',
    });

    setActiveGroupId(group.id);
    await addActivity(`Group "${name}" created`, 'added');
    await refreshData();
    return group;
  }

  function switchGroup(groupId) {
    setActiveGroupId(groupId);
  }

  async function deleteGroup(groupId) {
    await supabase.from('groups').delete().eq('id', groupId);
    if (activeGroupId === groupId) setActiveGroupId(null);
    await refreshData();
  }

  async function addChore(chore) {
    const { data: newChore, error } = await supabase
      .from('chores')
      .insert({
        name:           chore.name,
        group_id:       activeGroupId,
        assignee_id:    chore.assigneeId || state.currentUserId,
        frequency:      chore.frequency || 'Weekly',
        auto_rotate:    chore.autoRotate ?? true,
        due_date_start: chore.dueDateStart || 'Mon',
        due_date_end:   chore.dueDateEnd || 'Wed',
        status:         'pending',
        created_by:     state.currentUserId,
      })
      .select()
      .single();

    if (error) { console.error('addChore:', error); return null; }

    await addActivity(`New chore "${chore.name}" added`, 'added');
    await refreshData();
    return choreFromDb(newChore);
  }

  async function markComplete(choreId) {
    // Optimistic update for instant UI feedback
    const prevChores = state.chores;
    setState(prev => ({
      ...prev,
      chores: prev.chores.map(c =>
        c.id === choreId ? { ...c, status: 'completed' } : c
      ),
    }));

    const { error } = await supabase
      .from('chores')
      .update({ status: 'completed' })
      .eq('id', choreId);

    if (error) {
      // Rollback on failure
      setState(prev => ({ ...prev, chores: prevChores }));
      console.error('markComplete:', error);
      return;
    }

    const chore = prevChores.find(c => c.id === choreId);
    if (chore) {
      const user = getUserById(chore.assigneeId);
      await addActivity(`${user.name} completed "${chore.name}"`, 'completed');
    }
    await refreshData();
  }

  async function deleteChore(choreId) {
    await supabase.from('chores').delete().eq('id', choreId);
    await refreshData();
  }

  async function sendNudge(chore) {
    await addActivity(`Anonymous nudge sent about "${chore.name}"`, 'nudge');
    await refreshData();
  }

  // ── 6. Auth actions ───────────────────────────────────────────────────────

  async function signOut() {
    await supabase.auth.signOut();
    // onAuthStateChange fires → session becomes null → state resets
  }

  // ── 7. Dev / Demo helpers ─────────────────────────────────────────────────
  // Creates a sample group with chores assigned to the current user.
  // In the real flow, other users sign up and join via invite code.

  const DEMO_GROUP_NAME = 'Demo Apartment';

  const isDemoLoaded = state.groups.some(g => g.name === DEMO_GROUP_NAME);

  async function loadDemoData() {
    // Create demo group
    const { data: group, error: gErr } = await supabase
      .from('groups')
      .insert({ name: DEMO_GROUP_NAME, created_by: state.currentUserId })
      .select()
      .single();

    if (gErr) { console.error('loadDemoData group:', gErr); return; }

    // Add current user to group
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id:  state.currentUserId,
      role:     'admin',
    });

    // Insert sample chores
    const demoChores = [
      { name: 'Dishes',     frequency: 'Weekly',    auto_rotate: true,  due_date_start: 'Mon', due_date_end: 'Wed', status: 'pending'   },
      { name: 'Trash',      frequency: 'Weekly',    auto_rotate: true,  due_date_start: 'Tue', due_date_end: 'Thu', status: 'completed' },
      { name: 'Bathroom',   frequency: 'Weekly',    auto_rotate: true,  due_date_start: 'Wed', due_date_end: 'Fri', status: 'overdue'   },
      { name: 'Vacuum',     frequency: 'Weekly',    auto_rotate: false, due_date_start: 'Fri', due_date_end: 'Sun', status: 'pending'   },
      { name: 'Mop floors', frequency: 'Bi-Weekly', auto_rotate: true,  due_date_start: 'Thu', due_date_end: 'Sat', status: 'overdue'   },
    ].map(c => ({
      ...c,
      group_id:    group.id,
      assignee_id: state.currentUserId,
      created_by:  state.currentUserId,
    }));

    await supabase.from('chores').insert(demoChores);

    // Insert sample activity
    const demoActivity = [
      { type: 'completed', msg: 'Trash was completed' },
      { type: 'added',     msg: 'Chores loaded via demo mode' },
    ].map(a => ({
      ...a,
      group_id:   group.id,
      created_by: state.currentUserId,
    }));

    await supabase.from('activity').insert(demoActivity);

    setActiveGroupId(group.id);
    await refreshData();
  }

  async function clearAll() {
    // Delete demo group (cascades to chores + activity via foreign keys)
    const demoGroup = state.groups.find(g => g.name === DEMO_GROUP_NAME);
    if (demoGroup) {
      await supabase.from('groups').delete().eq('id', demoGroup.id);
    }
    await refreshData();
  }

  // ── 8. Context value ──────────────────────────────────────────────────────

  const value = {
    // Auth
    session,
    signOut,

    // State
    ...state,
    activeGroupId,
    loaded,

    // Helpers
    getUserById,
    getActiveGroup,
    getChoresForGroup,
    getMyChores,

    // Actions
    createGroup,
    switchGroup,
    deleteGroup,
    addChore,
    markComplete,
    deleteChore,
    sendNudge,

    // Dev
    isDemoLoaded,
    loadDemoData,
    clearAll,

    // Refresh
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}