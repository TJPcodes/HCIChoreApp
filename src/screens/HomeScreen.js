// src/screens/HomeScreen.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '../theme';
import { Card, SectionHeader } from '../components/shared';
import { useApp } from '../context/AppContext';
import { ChoreStatus } from '../models/data';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HomeScreen({ navigation }) {
  const {
    currentUserId, getUserById, markComplete,
    getVisibleChores, activeGroupId, groups,
    isDemoLoaded, loadDemoData, clearAll,
  } = useApp();

  const currentUser = getUserById(currentUserId);

  // Active group chores + personal chores
  const visibleChores = getVisibleChores();
  const myChores      = visibleChores.filter(c => c.assigneeId === currentUserId);

  const nextChore    = myChores.find(c => c.status === ChoreStatus.PENDING || c.status === 'pending');
  const overdueCount = visibleChores.filter(c => c.status === ChoreStatus.OVERDUE || c.status === 'overdue').length;
  const dueSoonCount = visibleChores.filter(c => c.status === ChoreStatus.PENDING || c.status === 'pending').length;

  // Build weekly strip from MY chores only
  const dayMap = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
  const choreDays = Array(7).fill(null);
  const doneDays  = Array(7).fill(false);

  myChores.forEach(c => {
    const idx = dayMap[c.dueDateStart];
    if (idx !== undefined) {
      choreDays[idx] = c.name.length > 5 ? c.name.slice(0, 4) : c.name;
      doneDays[idx]  = c.status === ChoreStatus.COMPLETED || c.status === 'completed';
    }
  });

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const inGroup     = !!activeGroup;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Dev Mode Banner ──────────────────────────────────────────── */}
      <View style={styles.devBanner}>
        <View style={styles.devLabelRow}>
          <Ionicons name="construct" size={14} color={Colors.orange} />
          <Text style={styles.devLabel}>DEV MODE</Text>
        </View>
        {isDemoLoaded ? (
          <TouchableOpacity style={styles.devBtnClear} onPress={clearAll} activeOpacity={0.7}>
            <Text style={styles.devBtnClearText}>Clear Demo Data</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.devBtnLoad} onPress={loadDemoData} activeOpacity={0.7}>
            <Text style={styles.devBtnLoadText}>Load Demo Data</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <View style={styles.greeting}>
        <Text style={styles.greetingSub}>Welcome back,</Text>
        <Text style={styles.greetingName}>{currentUser.name} 👋</Text>
        {inGroup && (
          <Text style={styles.groupLabel}>🏠 {activeGroup.name}</Text>
        )}
      </View>

      {/* Status Banner */}
      <Card style={styles.statusBanner}>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>📅 {dueSoonCount} due this week</Text>
          {overdueCount > 0 && (
            <Text style={styles.statusOverdue}>⚠️ {overdueCount} overdue</Text>
          )}
        </View>
      </Card>

      {/* Weekly Strip */}
      <SectionHeader title="This Week" />
      <View style={styles.weekRow}>
        {WEEK_DAYS.map((day, i) => (
          <View key={i} style={styles.dayCol}>
            <Text style={styles.dayLabel}>{day}</Text>
            <View style={[
              styles.dayCell,
              doneDays[i]    && styles.dayCellDone,
              choreDays[i] && !doneDays[i] && styles.dayCellPending,
            ]}>
              <Text style={[
                styles.dayCellText,
                doneDays[i] && { color: Colors.green },
                choreDays[i] && !doneDays[i] && { color: Colors.accent },
              ]}>
                {doneDays[i] ? '✓' : choreDays[i] || ''}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Next Due */}
      {nextChore && (
        <>
          <SectionHeader title="Up Next" style={{ marginTop: 16 }} />
          <Card>
            <View style={styles.nextChoreRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextChoreName}>{nextChore.name}</Text>
                <Text style={styles.nextChoreDate}>
                  {nextChore.dueDateStart} – {nextChore.dueDateEnd}
                  {nextChore.groupId === null && '  ·  Personal'}
                </Text>
              </View>
              <TouchableOpacity style={styles.doneBtn} onPress={() => markComplete(nextChore.id)} activeOpacity={0.8}>
                <Text style={styles.doneBtnText}>Mark Done ✓</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </>
      )}

      {/* No chores state */}
      {!nextChore && visibleChores.length === 0 && (
        <>
          <SectionHeader title="No chores yet" style={{ marginTop: 16 }} />
          <Card>
            <Text style={styles.noChoresText}>
              {inGroup
                ? 'Add a chore to get started.'
                : "You're not in a group yet. Add a personal chore, or join a group from the Group tab."}
            </Text>
          </Card>
        </>
      )}

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" style={{ marginTop: 16 }} />
      <View style={styles.actionsGrid}>
        {[
          { label: '+ Add Chore',  icon: 'add-circle',    color: Colors.accent,  screen: 'AddChore' },
          { label: 'View Group',   icon: 'people',         color: Colors.purple,  screen: 'Group' },
          { label: 'My Chores',    icon: 'checkmark-done', color: Colors.teal,    screen: 'Personal' },
          { label: 'Activity',     icon: 'notifications',  color: Colors.orange,  screen: 'Activity' },
        ].map(({ label, icon, color, screen }) => (
          <TouchableOpacity
            key={label}
            style={[styles.actionBtn, { borderColor: color + '44', backgroundColor: color + '18' }]}
            onPress={() => navigation.navigate(screen)}
            activeOpacity={0.7}
          >
            <Ionicons name={icon} size={20} color={color} />
            <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  content:      { padding: 20, paddingBottom: 40 },

  /* Dev banner */
  devBanner:    {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.orange + '14', borderWidth: 1, borderColor: Colors.orange + '44',
    borderRadius: Radius.sm, padding: 10, marginBottom: 16,
  },
  devLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  devLabel:     { ...Typography.micro, color: Colors.orange },
  devBtnLoad:   {
    backgroundColor: Colors.accent, borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  devBtnLoadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  devBtnClear:  {
    backgroundColor: Colors.red + '22', borderWidth: 1, borderColor: Colors.red + '55',
    borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6,
  },
  devBtnClearText: { color: Colors.red, fontSize: 11, fontWeight: '700' },

  /* Greeting */
  greeting:     { marginBottom: 16 },
  greetingSub:  { ...Typography.subhead, color: Colors.muted },
  greetingName: { ...Typography.largeTitle, color: Colors.text },
  groupLabel:   { ...Typography.subhead, color: Colors.muted, marginTop: 4 },

  /* Status & week */
  statusBanner: { marginBottom: 20 },
  statusRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText:   { ...Typography.subhead, color: Colors.text },
  statusOverdue:{ ...Typography.subhead, color: Colors.red, fontWeight: '700' },
  weekRow:      { flexDirection: 'row', gap: 4, marginBottom: 20 },
  dayCol:       { flex: 1, alignItems: 'center', gap: 4 },
  dayLabel:     { ...Typography.micro, color: Colors.muted },
  dayCell:      {
    width: '100%', height: 40, borderRadius: Radius.sm,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCellDone:    { backgroundColor: Colors.green + '22', borderColor: Colors.green },
  dayCellPending: { backgroundColor: Colors.accent + '22', borderColor: Colors.accent },
  dayCellText:    { fontSize: 9, fontWeight: '700', color: 'transparent' },

  /* Up next */
  nextChoreRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextChoreName:  { ...Typography.headline, color: Colors.text },
  nextChoreDate:  { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  doneBtn:        { backgroundColor: Colors.green, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  doneBtnText:    { color: '#fff', fontWeight: '700', fontSize: 13 },

  /* No chores */
  noChoresText:   { ...Typography.body, color: Colors.muted, textAlign: 'center' },

  /* Quick actions */
  actionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn:      {
    width: '47%', borderRadius: Radius.md, borderWidth: 1,
    padding: 14, gap: 6,
  },
  actionBtnText: { ...Typography.subhead, fontWeight: '600' },
});