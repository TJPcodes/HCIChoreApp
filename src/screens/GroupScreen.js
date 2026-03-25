import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { Colors, Typography, Radius } from '../theme';
import { Card, Avatar, StatusBadge, ProgressRing, SectionHeader } from '../components/shared';
import { MOCK_CHORES, MOCK_GROUP, ChoreStatus, getUserById } from '../models/data';

export default function GroupScreen({ navigation }) {
  const [chores, setChores] = useState(MOCK_CHORES);
  const [nudged, setNudged] = useState({});

  const completed = chores.filter(c => c.status === ChoreStatus.COMPLETED).length;
  const total     = chores.length;
  const progress  = total > 0 ? completed / total : 0;

  function sendNudge(chore) {
    setNudged(prev => ({ ...prev, [chore.id]: true }));
    Alert.alert('Nudge sent 👋', `An anonymous reminder was sent about "${chore.name}".`);
  }

  function renderChore({ item: chore }) {
    const user   = getUserById(chore.assigneeId);
    const isOver = chore.status === ChoreStatus.OVERDUE;
    return (
      <Card overdue={isOver} style={styles.choreCard}>
        <View style={styles.choreRow}>
          {/* Chore status dot. */}
          <View style={[styles.dot, {
            backgroundColor:
              chore.status === ChoreStatus.COMPLETED ? Colors.green :
              chore.status === ChoreStatus.OVERDUE   ? Colors.red   : Colors.orange,
          }]} />

          {/* Info about the chore. */}
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

          {/* Right side. */}
          {chore.status === ChoreStatus.COMPLETED ? (
            <StatusBadge status="completed" />
          ) : (
            <TouchableOpacity
              style={[styles.nudgeBtn, nudged[chore.id] && styles.nudgeBtnSent]}
              onPress={() => sendNudge(chore)}
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

  return (
    <View style={styles.container}>
      {/* Group header. */}
      <View style={styles.header}>
        <View>
          <Text style={styles.groupName}>🏠 {MOCK_GROUP.name}</Text>
          <Text style={styles.headerSub}>{completed}/{total} tasks completed this week</Text>
        </View>
        <ProgressRing progress={progress} size={52} />
      </View>

      {/* Avatars for members. */}
      <View style={styles.membersRow}>
        {MOCK_GROUP.members.map(m => (
          <View key={m.id} style={styles.memberItem}>
            <Avatar name={m.name} color={m.color} size={36} />
            <Text style={styles.memberName}>{m.name}</Text>
          </View>
        ))}
      </View>

      {/* List of chores. */}
      <FlatList
        data={chores}
        keyExtractor={c => c.id}
        renderItem={renderChore}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddChore')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Add Chore</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
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
  addBtn:      {
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.accent + '66',
    borderRadius: Radius.md, padding: 14, alignItems: 'center', marginTop: 4,
  },
  addBtnText:  { color: Colors.accent, fontWeight: '600', fontSize: 14 },
});