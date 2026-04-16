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
    groupId:      row.group_id,      // null = personal chore
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
  const [session, setSession]             = useState(null);
  const [loaded, setLoaded]               = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);

  const [state, setState] = useState({
    currentUserId: null,
    users:    [],
    groups:   [],
    chores:   [],
    activity: [],
  });

  // ── 1. Auth listener ────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => setSession(s),
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── 2. Fetch data whenever session changes ──────────────────────────────

  useEffect(() => {
    if (session?.user) {
      fetchData(session.user.id);
    } else {
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
      // a) Current user's profile
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

      // c) Group details + members (if any groups exist)
      let groups = [];
      let users  = [{ id: myProfile.id, name: myProfile.name, color: myProfile.color }];

      if (groupIds.length > 0) {
        const { data: groupRows } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds);

        const { data: allMemberships } = await supabase
          .from('group_members')
          .select('group_id, user_id')
          .in('group_id', groupIds);

        const allUserIds = [...new Set((allMemberships || []).map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', allUserIds);

        users = (profiles || []).map(p => ({ id: p.id, name: p.name, color: p.color }));

        groups = (groupRows || []).map(g => ({
          id:         g.id,
          name:       g.name,
          inviteCode: g.invite_code,
          memberIds:  (allMemberships || [])
            .filter(m => m.group_id === g.id)
            .map(m => m.user_id),
        }));
      }

      // d) Determine active group (first group, or null if none)
      let newActiveGroupId = activeGroupId;
      if (!newActiveGroupId || !groupIds.includes(newActiveGroupId)) {
        newActiveGroupId = groupIds[0] || null;
      }

      // e) Chores — fetch both group chores and personal chores
      let chores = [];

      if (groupIds.length > 0) {
        const { data: groupChoreRows } = await supabase
          .from('chores')
          .select('*')
          .in('group_id', groupIds);
        chores = [...(groupChoreRows || [])];
      }

      const { data: personalChoreRows } = await supabase
        .from('chores')
        .select('*')
        .is('group_id', null)
        .eq('assignee_id', userId);

      chores = [...chores, ...(personalChoreRows || [])].map(choreFromDb);

      // f) Activity for active group
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

  async function refreshData() {
    if (session?.user) await fetchData(session.user.id);
  }

  // ── 4. Helpers ───────────────────────────────────────────────────────────

  function getUserById(id) {
    return state.users.find(u => u.id === id) || { name: 'Unknown', color: '#888' };
  }

  function getActiveGroup() {
    return state.groups.find(g => g.id === activeGroupId) || null;
  }

  function getChoresForGroup(groupId) {
    return state.chores.filter(c => c.groupId === groupId);
  }

  /** Personal chores = no group, assigned to current user */
  function getPersonalChores() {
    return state.chores.filter(
      c => c.groupId === null && c.assigneeId === state.currentUserId
    );
  }

  /** Everything relevant to Home screen: active group chores + personal chores */
  function getVisibleChores() {
    return state.chores.filter(
      c => c.groupId === activeGroupId || (c.groupId === null && c.assigneeId === state.currentUserId)
    );
  }

  /** All chores assigned to me, from any group or personal */
  function getMyChores() {
    return state.chores.filter(c => c.assigneeId === state.currentUserId);
  }

  // ── 5. Activity helper ──────────────────────────────────────────────────

  async function addActivity(msg, type = 'info', groupId = null) {
    const targetGroupId = groupId || activeGroupId;
    if (!targetGroupId) return; // no group, no activity (personal chores don't log)
    await supabase.from('activity').insert({
      group_id:   targetGroupId,
      type,
      msg,
      created_by: state.currentUserId,
    });
  }

  // ── 6. Group actions ─────────────────────────────────────────────────────

  async function createGroup(name) {
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, created_by: state.currentUserId })
      .select()
      .single();

    if (error) { console.error('createGroup:', error); throw error; }

    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id:  state.currentUserId,
      role:     'admin',
    });

    setActiveGroupId(group.id);
    await addActivity(`Group "${name}" created`, 'added', group.id);
    await refreshData();
    return group;
  }

  async function joinGroup(inviteCode) {
    const code = inviteCode.trim().toLowerCase();
    if (!code) throw new Error('Please enter an invite code.');

    // Look up group by invite code
    const { data: group, error: lookupErr } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', code)
      .maybeSingle();

    if (lookupErr) throw lookupErr;
    if (!group)    throw new Error('No group found with that code.');

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', state.currentUserId)
      .maybeSingle();

    if (existing) {
      setActiveGroupId(group.id);
      await refreshData();
      return { group, alreadyMember: true };
    }

    // Insert membership
    const { error: joinErr } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: state.currentUserId, role: 'member' });

    if (joinErr) throw joinErr;

    setActiveGroupId(group.id);
    const user = getUserById(state.currentUserId);
    await addActivity(`${user.name} joined the group`, 'added', group.id);
    await refreshData();
    return { group, alreadyMember: false };
  }

  function switchGroup(groupId) {
    setActiveGroupId(groupId);
  }

  async function deleteGroup(groupId) {
    await supabase.from('groups').delete().eq('id', groupId);
    if (activeGroupId === groupId) setActiveGroupId(null);
    await refreshData();
  }

  // ── 7. Chore actions ─────────────────────────────────────────────────────

  async function addChore(chore) {
    // chore.groupId can be null for personal chores
    const groupId = chore.groupId === undefined ? activeGroupId : chore.groupId;

    const { data: newChore, error } = await supabase
      .from('chores')
      .insert({
        name:           chore.name,
        group_id:       groupId,
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

    if (error) { console.error('addChore:', error); throw error; }

    if (groupId) {
      await addActivity(`New chore "${chore.name}" added`, 'added', groupId);
    }
    await refreshData();
    return choreFromDb(newChore);
  }

  async function markComplete(choreId) {
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
      setState(prev => ({ ...prev, chores: prevChores }));
      console.error('markComplete:', error);
      return;
    }

    const chore = prevChores.find(c => c.id === choreId);
    if (chore && chore.groupId) {
      const user = getUserById(chore.assigneeId);
      await addActivity(`${user.name} completed "${chore.name}"`, 'completed', chore.groupId);
    }
    await refreshData();
  }

  async function deleteChore(choreId) {
    await supabase.from('chores').delete().eq('id', choreId);
    await refreshData();
  }

  async function sendNudge(chore) {
    if (!chore.groupId) return; // can't nudge personal chores
    await addActivity(`Anonymous nudge sent about "${chore.name}"`, 'nudge', chore.groupId);
    await refreshData();
  }

  // ── 8. Auth ──────────────────────────────────────────────────────────────

  async function signOut() {
    await supabase.auth.signOut();
  }

  // ── 9. Dev / Demo helpers ────────────────────────────────────────────────

  const DEMO_GROUP_NAME = 'Demo Apartment';
  const isDemoLoaded = state.groups.some(g => g.name === DEMO_GROUP_NAME);

  async function loadDemoData() {
    const { data: group, error: gErr } = await supabase
      .from('groups')
      .insert({ name: DEMO_GROUP_NAME, created_by: state.currentUserId })
      .select()
      .single();

    if (gErr) { console.error('loadDemoData group:', gErr); return; }

    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id:  state.currentUserId,
      role:     'admin',
    });

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

    await supabase.from('activity').insert([
      { type: 'added', msg: 'Demo data loaded', group_id: group.id, created_by: state.currentUserId },
    ]);

    setActiveGroupId(group.id);
    await refreshData();
  }

  async function clearAll() {
    const demoGroup = state.groups.find(g => g.name === DEMO_GROUP_NAME);
    if (demoGroup) {
      await supabase.from('groups').delete().eq('id', demoGroup.id);
    }
    // Also delete personal chores
    await supabase
      .from('chores')
      .delete()
      .is('group_id', null)
      .eq('assignee_id', state.currentUserId);
    await refreshData();
  }

  // ── 10. Context value ────────────────────────────────────────────────────

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
    getPersonalChores,
    getVisibleChores,
    getMyChores,

    // Group actions
    createGroup,
    joinGroup,
    switchGroup,
    deleteGroup,

    // Chore actions
    addChore,
    markComplete,
    deleteChore,
    sendNudge,

    // Dev
    isDemoLoaded,
    loadDemoData,
    clearAll,

    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}