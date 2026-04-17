// src/screens/PersonalScreen.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors, Typography, Radius } from '../theme';
import { Card, SectionHeader, ProgressRing } from '../components/shared';
import { useApp } from '../context/AppContext';

// Friendly label for a scheduled-future chore
function upcomingLabel(offset) {
  if (offset === 1) return 'Starts next week';
  return `Starts in ${offset} weeks`;
}

export default function PersonalScreen() {
  const { getMyChores, groups, markComplete } = useApp();

  // All chores assigned to me from any group OR personal
  const myChores = getMyChores();

  // Separate out upcoming chores (scheduled for a future week)
  const isUpcoming = c => (c.startWeekOffset ?? 0) > 0;
  const isThisWeek = c => (c.startWeekOffset ?? 0) === 0;

  const dueThisWeek = myChores.filter(c => isThisWeek(c) && c.status === 'pending');
  const overdue     = myChores.filter(c => isThisWeek(c) && c.status === 'overdue');
  const done        = myChores.filter(c => c.status === 'completed');
  const upcoming    = myChores
    .filter(c => isUpcoming(c) && c.status !== 'completed')
    .sort((a, b) => a.startWeekOffset - b.startWeekOffset);

  // Progress reflects only this-week work, not scheduled-future chores
  const thisWeekChores = myChores.filter(c => isThisWeek(c));
  const progress = thisWeekChores.length > 0
    ? done.filter(isThisWeek).length / thisWeekChores.length
    : 0;

  function groupLabel(chore) {
    if (chore.groupId === null) return '👤 Personal';
    const g = groups.find(gr => gr.id === chore.groupId);
    return g ? `${g.emoji || '🏠'} ${g.name}` : '🏠 Unknown group';
  }

  function renderChore(chore) {
    const isComplete = chore.status === 'completed';
    return (
      <Card key={chore.id} overdue={chore.status === 'overdue'}>
        <View style={styles.choreRow}>
          <View style={styles.choreInfo}>
            <Text style={[styles.choreName, isComplete && styles.strikethrough]}>
              {chore.name}
            </Text>
            <Text style={styles.choreDue}>
              {chore.dueDateStart} – {chore.dueDateEnd}
              {chore.autoRotate ? '  🔄 auto-rotate' : ''}
            </Text>
            <Text style={styles.choreSource}>
              {groupLabel(chore)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => markComplete(chore.id)} activeOpacity={0.7}>
            <Text style={{ fontSize: 26 }}>
              {isComplete ? '✅' : '⭕'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  // Upcoming chores: dimmed, no "complete" control (not actionable yet)
  function renderUpcomingChore(chore) {
    return (
      <Card key={chore.id} style={styles.upcomingCard}>
        <View style={styles.choreRow}>
          <View style={styles.choreInfo}>
            <Text style={[styles.choreName, { color: Colors.muted }]}>
              {chore.name}
            </Text>
            <Text style={styles.choreDue}>
              📅 {upcomingLabel(chore.startWeekOffset)} · {chore.dueDateStart}–{chore.dueDateEnd}
            </Text>
            <Text style={styles.choreSource}>
              {groupLabel(chore)}
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.progressRow}>
        <ProgressRing progress={progress} size={72} />
        <View style={styles.progressText}>
          <Text style={styles.progressTitle}>My Chores</Text>
          <Text style={styles.progressSub}>
            {done.filter(isThisWeek).length} of {thisWeekChores.length} complete this week
          </Text>
        </View>
      </View>

      <SectionHeader title="☀️  Due This Week" color={Colors.orange} />
      {dueThisWeek.length > 0
        ? dueThisWeek.map(renderChore)
        : <Text style={styles.emptyText}>Nothing pending 🎉</Text>
      }

      <SectionHeader title="⚠️  Overdue" color={Colors.red} style={{ marginTop: 16 }} />
      {overdue.length > 0
        ? overdue.map(renderChore)
        : <Text style={styles.emptyText}>Nothing overdue 🎉</Text>
      }

      <SectionHeader title="📅  Upcoming" color={Colors.accent} style={{ marginTop: 16 }} />
      {upcoming.length > 0
        ? upcoming.map(renderUpcomingChore)
        : <Text style={styles.emptyText}>Nothing scheduled for later</Text>
      }

      <SectionHeader title="✅  Completed" color={Colors.green} style={{ marginTop: 16 }} />
      {done.length > 0
        ? done.map(renderChore)
        : <Text style={styles.emptyText}>Nothing done yet</Text>
      }

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.bg },
  content:        { padding: 20, paddingBottom: 40 },
  progressRow:    {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 24, padding: 16,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  progressText:   { flex: 1 },
  progressTitle:  { ...Typography.title, color: Colors.text },
  progressSub:    { ...Typography.caption, color: Colors.muted, marginTop: 4 },
  choreRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  choreInfo:      { flex: 1 },
  choreName:      { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  strikethrough:  { textDecorationLine: 'line-through', color: Colors.muted },
  choreDue:       { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  choreSource:    { ...Typography.caption, color: Colors.accent, marginTop: 2 },
  upcomingCard:   {
    backgroundColor: Colors.surface,
    borderStyle: 'dashed',
  },
  emptyText:      { ...Typography.subhead, color: Colors.muted, marginBottom: 12, marginLeft: 4 },
});