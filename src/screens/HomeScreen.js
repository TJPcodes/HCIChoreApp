import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '../theme';
import { Card, SectionHeader, GhostButton } from '../components/shared';
import { MOCK_CHORES, MOCK_GROUP, CURRENT_USER, ChoreStatus, getUserById } from '../models/data';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CHORE_DAYS = [null, null, 'Dishes', null, 'Trash', null, 'Bath'];
const DONE_DAYS  = [true, true, false, false, false, false, false];

export default function HomeScreen({ navigation }) {
  const [chores, setChores] = useState(MOCK_CHORES);
  const myChores   = chores.filter(c => c.assigneeId === CURRENT_USER.id);
  const nextChore  = myChores.find(c => c.status === ChoreStatus.PENDING);
  const overdueCount = chores.filter(c => c.status === ChoreStatus.OVERDUE).length;
  const dueSoonCount = chores.filter(c => c.status === ChoreStatus.PENDING).length;

  function markDone(chore) {
    setChores(prev => prev.map(c => c.id === chore.id ? { ...c, status: ChoreStatus.COMPLETED } : c));
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingSub}>Welcome back,</Text>
        <Text style={styles.greetingName}>{CURRENT_USER.name} 👋</Text>
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
              DONE_DAYS[i]    && styles.dayCellDone,
              CHORE_DAYS[i] && !DONE_DAYS[i] && styles.dayCellPending,
            ]}>
              <Text style={[
                styles.dayCellText,
                DONE_DAYS[i] && { color: Colors.green },
                CHORE_DAYS[i] && !DONE_DAYS[i] && { color: Colors.accent },
              ]}>
                {DONE_DAYS[i] ? '✓' : CHORE_DAYS[i] || ''}
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
              <View>
                <Text style={styles.nextChoreName}>{nextChore.name}</Text>
                <Text style={styles.nextChoreDate}>
                  {nextChore.dueDateStart} – {nextChore.dueDateEnd}
                </Text>
              </View>
              <TouchableOpacity style={styles.doneBtn} onPress={() => markDone(nextChore)} activeOpacity={0.8}>
                <Text style={styles.doneBtnText}>Mark Done ✓</Text>
              </TouchableOpacity>
            </View>
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
  greeting:     { marginBottom: 16 },
  greetingSub:  { ...Typography.subhead, color: Colors.muted },
  greetingName: { ...Typography.largeTitle, color: Colors.text },
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
  nextChoreRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextChoreName:  { ...Typography.headline, color: Colors.text },
  nextChoreDate:  { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  doneBtn:        { backgroundColor: Colors.green, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  doneBtnText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn:      {
    width: '47%', borderRadius: Radius.md, borderWidth: 1,
    padding: 14, gap: 6,
  },
  actionBtnText: { ...Typography.subhead, fontWeight: '600' },
});
