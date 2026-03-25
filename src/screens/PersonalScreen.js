import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors, Typography, Radius } from '../theme';
import { Card, SectionHeader, ProgressRing } from '../components/shared';
import { MOCK_CHORES, CURRENT_USER, ChoreStatus } from '../models/data';

export default function PersonalScreen() {
  const [chores, setChores] = useState(
    MOCK_CHORES.filter(c => c.assigneeId === CURRENT_USER.id)
  );

  const dueToday = chores.filter(c => c.status === ChoreStatus.PENDING);
  const overdue = chores.filter(c => c.status === ChoreStatus.OVERDUE);
  const done = chores.filter(c => c.status === ChoreStatus.COMPLETED);
  const total = chores.length;
  const progress = total > 0 ? done.length / total : 0;

  function markComplete(chore) {
    setChores(prev =>
      prev.map(c => c.id === chore.id ? { ...c, status: ChoreStatus.COMPLETED } : c)
    );
  }

  function renderChore(chore) {
    const isComplete = chore.status === ChoreStatus.COMPLETED;
    return (
      <Card key={chore.id} overdue={chore.status === ChoreStatus.OVERDUE}>
        <View style={styles.choreRow}>
          <View style={styles.choreInfo}>
            <Text style={[styles.choreName, isComplete && styles.strikethrough]}>
              {chore.name}
            </Text>
            <Text style={styles.choreDue}>
              {chore.dueDateStart} – {chore.dueDateEnd}
              {chore.autoRotate ? '  🔄 auto-rotate' : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => markComplete(chore)} activeOpacity={0.7}>
            <Text style={{ fontSize: 26 }}>
              {isComplete ? '✅' : '⭕'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Personal chore progress ring. */}
      <View style={styles.progressRow}>
        <ProgressRing progress={progress} size={72} />
        <View style={styles.progressText}>
          <Text style={styles.progressTitle}>My Chores</Text>
          <Text style={styles.progressSub}>{done.length} of {total} complete this week</Text>
        </View>
      </View>

      {/* Pending chores due today. */}
      <SectionHeader title="☀️  Due / Upcoming" color={Colors.orange} />
      {dueToday.length > 0
        ? dueToday.map(renderChore)
        : <Text style={styles.emptyText}>Nothing pending 🎉</Text>
      }

      {/* Overdue chores. */}
      <SectionHeader title="⚠️  Overdue" color={Colors.red} style={{ marginTop: 16 }} />
      {overdue.length > 0
        ? overdue.map(renderChore)
        : <Text style={styles.emptyText}>Nothing overdue 🎉</Text>
      }

      {/* Completed chores. */}
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
  emptyText:      { ...Typography.subhead, color: Colors.muted, marginBottom: 12, marginLeft: 4 },
});