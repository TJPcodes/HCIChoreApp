// src/screens/GroupScreen.js
import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '../theme';
import { Card, Avatar, StatusBadge, ProgressRing, SectionHeader } from '../components/shared';
import GroupModal from '../components/GroupModal';
import { useApp } from '../context/AppContext';

// Friendly label for a scheduled-future chore
function upcomingLabel(offset) {
  if (offset === 1) return 'Starts next week';
  return `Starts in ${offset} weeks`;
}

export default function GroupScreen({ navigation }) {
  const {
    users, activeGroupId, groups, switchGroup,
    getUserById, getChoresForGroup, markComplete, sendNudge,
  } = useApp();

  const [nudged, setNudged]             = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const hasGroups = groups.length > 0;

  // Defensive: if activeGroupId is stale, fall back to first group
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0] || null;

  // ── Header button (only when in a group) ─────────────────────────────────
  useLayoutEffect(() => {
    navigation.setOptions({
      title: activeGroup ? activeGroup.name : 'Group',
      headerLeft: hasGroups
        ? () => (
            <Pressable
              onPress={() => setModalVisible(true)}
              hitSlop={10}
              style={{ backgroundColor: 'transparent', padding: 4 }}
            >
              <Ionicons name="person-add-outline" size={22} color={Colors.accent} />
            </Pressable>
          )
        : undefined,
      headerLeftContainerStyle: { backgroundColor: 'transparent' },
    });
  }, [navigation, hasGroups, activeGroup]);

  // ── Empty state: no groups ───────────────────────────────────────────────
  if (!hasGroups) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyTitle}>You're not in a group yet</Text>
          <Text style={styles.emptyText}>
            Create a group for your household, or join one with an invite code from a friend.
          </Text>

          <TouchableOpacity
            style={styles.emptyBtnPrimary}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.emptyBtnPrimaryText}>Create or Join a Group</Text>
          </TouchableOpacity>

          <Text style={styles.emptyHint}>
            You can still add personal chores without a group — head to the Home tab.
          </Text>
        </View>

        <GroupModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      </View>
    );
  }

  // ── Normal state ─────────────────────────────────────────────────────────
  const allGroupChores = activeGroup ? getChoresForGroup(activeGroup.id) : [];
  const currentChores  = allGroupChores.filter(c => (c.startWeekOffset ?? 0) === 0);
  const upcomingChores = allGroupChores
    .filter(c => (c.startWeekOffset ?? 0) > 0)
    .sort((a, b) => a.startWeekOffset - b.startWeekOffset);

  const groupMembers = activeGroup
    ? users.filter(u => activeGroup.memberIds?.includes(u.id))
    : [];

  // Progress counts only this-week chores — upcoming ones aren't actionable yet.
  const completed = currentChores.filter(c => c.status === 'completed').length;
  const total     = currentChores.length;
  const progress  = total > 0 ? completed / total : 0;

  function handleNudge(chore) {
    setNudged(prev => ({ ...prev, [chore.id]: true }));
    sendNudge(chore);
    Alert.alert('Nudge sent 👋', `An anonymous reminder was sent about "${chore.name}".`);
  }

  function renderChore({ item: chore }) {
    const user   = getUserById(chore.assigneeId);
    const isOver = chore.status === 'overdue';
    return (
      <Card overdue={isOver} style={styles.choreCard}>
        <View style={styles.choreRow}>
          <View style={[styles.dot, {
            backgroundColor:
              chore.status === 'completed' ? Colors.green :
              chore.status === 'overdue'   ? Colors.red   : Colors.orange,
          }]} />

          <View style={styles.choreInfo}>
            <Text style={styles.choreName}>{chore.name}</Text>
            <View style={styles.choreMetaRow}>
              <Avatar name={user.name} color={user.color} size={18} />
              <Text style={styles.choreMeta}>
                {user.name} · {chore.dueDateStart}–{chore.dueDateEnd}
              </Text>
              {chore.autoRotate && (
                <Text style={styles.rotateTag}>🔄 auto</Text>
              )}
            </View>
          </View>

          {chore.status === 'completed' ? (
            <StatusBadge status="completed" />
          ) : (
            <TouchableOpacity
              style={[styles.nudgeBtn, nudged[chore.id] && styles.nudgeBtnSent]}
              onPress={() => handleNudge(chore)}
              activeOpacity={0.7}
            >
              <Text style={[styles.nudgeBtnText, nudged[chore.id] && { color: Colors.muted }]}>
                {nudged[chore.id] ? 'Sent 👋' : 'Nudge 👋'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  }

  // Upcoming chore: dimmed look, no nudge button, "Starts in X weeks" badge
  function renderUpcomingChore(chore) {
    const user = getUserById(chore.assigneeId);
    return (
      <Card key={chore.id} style={[styles.choreCard, styles.upcomingCard]}>
        <View style={styles.choreRow}>
          <View style={[styles.dot, { backgroundColor: Colors.muted }]} />
          <View style={styles.choreInfo}>
            <Text style={[styles.choreName, { color: Colors.muted }]}>
              {chore.name}
            </Text>
            <View style={styles.choreMetaRow}>
              <Avatar name={user.name} color={user.color} size={18} />
              <Text style={styles.choreMeta}>
                {user.name} · {chore.dueDateStart}–{chore.dueDateEnd}
              </Text>
              {chore.autoRotate && (
                <Text style={styles.rotateTag}>🔄 auto</Text>
              )}
            </View>
          </View>
          <View style={styles.upcomingBadge}>
            <Text style={styles.upcomingBadgeText}>
              {upcomingLabel(chore.startWeekOffset)}
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Group Switcher Pills (only if 2+ groups) ────────────── */}
      {groups.length > 1 && (
        <View style={styles.switcherWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.switcherContent}
          >
            {groups.map(g => {
              const isActive = g.id === activeGroup?.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => switchGroup(g.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    🏠 {g.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      {activeGroup && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupName}>🏠 {activeGroup.name}</Text>
            <Text style={styles.headerSub}>{completed}/{total} tasks completed this week</Text>
          </View>
          <ProgressRing progress={progress} size={52} />
        </View>
      )}

      {/* ── Members ─────────────────────────────────────────────── */}
      {groupMembers.length > 0 && (
        <View style={styles.membersRow}>
          {groupMembers.map(m => (
            <View key={m.id} style={styles.memberItem}>
              <Avatar name={m.name} color={m.color} size={36} />
              <Text style={styles.memberName}>{m.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Chores ──────────────────────────────────────────────── */}
      <FlatList
        data={currentChores}
        keyExtractor={c => c.id}
        renderItem={renderChore}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          upcomingChores.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyListText}>No chores yet — add one below!</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyListText}>Nothing due this week 🎉</Text>
            </View>
          )
        }
        ListFooterComponent={
          <>
            {upcomingChores.length > 0 && (
              <View style={styles.upcomingSection}>
                <SectionHeader title="Upcoming" color={Colors.muted} />
                {upcomingChores.map(renderUpcomingChore)}
              </View>
            )}

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddChore')}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add Chore</Text>
            </TouchableOpacity>
          </>
        }
      />

      <GroupModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },

  /* Empty state */
  emptyContainer:  { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center' },
  emptyContent:    { padding: 32, alignItems: 'center' },
  emptyIcon:       { fontSize: 56, marginBottom: 16 },
  emptyTitle:      { ...Typography.title, color: Colors.text, textAlign: 'center', marginBottom: 8 },
  emptyText:       { ...Typography.body, color: Colors.muted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  emptyBtnPrimary: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyHint:           {
    ...Typography.caption, color: Colors.muted,
    textAlign: 'center', marginTop: 24, lineHeight: 18,
  },

  /* Switcher */
  switcherWrap: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  switcherContent: {
    padding: 12,
    gap: 8,
  },
  pill: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  pillText: { ...Typography.subhead, color: Colors.muted, fontWeight: '600' },
  pillTextActive: { color: Colors.accent },

  /* Normal state */
  header:      {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, padding: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  groupName:   { ...Typography.title, color: Colors.text },
  headerSub:   { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  membersRow:  {
    flexDirection: 'row', gap: 16, padding: 14,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  memberItem:  { alignItems: 'center', gap: 4 },
  memberName:  { ...Typography.micro, color: Colors.muted },
  list:        { padding: 16, paddingBottom: 40 },
  choreCard:   { marginBottom: 8 },
  choreRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:         { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  choreInfo:   { flex: 1 },
  choreName:   { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  choreMetaRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  choreMeta:   { ...Typography.caption, color: Colors.muted },
  rotateTag:   { fontSize: 10, color: Colors.accent },
  nudgeBtn:    {
    backgroundColor: Colors.accent + '22', borderRadius: Radius.sm,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  nudgeBtnSent:  { backgroundColor: Colors.muted + '22' },
  nudgeBtnText:  { fontSize: 11, color: Colors.accent, fontWeight: '600' },

  /* Upcoming section */
  upcomingSection: {
    marginTop: 16,
    marginBottom: 4,
  },
  upcomingCard: {
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
  },
  upcomingBadge: {
    backgroundColor: Colors.muted + '22',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  upcomingBadgeText: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: '700',
  },

  addBtn:      {
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.accent + '66',
    borderRadius: Radius.md, padding: 14, alignItems: 'center', marginTop: 16,
  },
  addBtnText:  { color: Colors.accent, fontWeight: '600', fontSize: 14 },
  emptyWrap:   { padding: 32, alignItems: 'center' },
  emptyListText: { ...Typography.body, color: Colors.muted, textAlign: 'center' },
});