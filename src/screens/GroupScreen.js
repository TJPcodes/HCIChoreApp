import React, { useLayoutEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { Colors, Typography, Radius } from '../theme';
import { Card, Avatar, StatusBadge, ProgressRing } from '../components/shared';
import { useApp } from '../context/AppContext';

export default function GroupScreen({ navigation }) {
  const {
    chores, users, activeGroupId, groups,
    getUserById, getChoresForGroup, sendNudge,
  } = useApp();

  const [nudged, setNudged] = useState({});

  const activeGroup  = groups.find(g => g.id === activeGroupId);
  const groupChores  = activeGroupId ? getChoresForGroup(activeGroupId) : chores;
  const groupMembers = activeGroup
    ? users.filter(u => activeGroup.memberIds.includes(u.id))
    : users;

  const completed = groupChores.filter(c => c.status === 'completed').length;
  const total     = groupChores.length;
  const progress  = total > 0 ? completed / total : 0;
  const groupName = activeGroup ? activeGroup.name : 'Group';

  useLayoutEffect(() => {
    navigation.setOptions({ title: groupName });
  }, [navigation, groupName]);

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
          {/* Chore status dot. */}
          <View style={[styles.dot, {
            backgroundColor:
              chore.status === 'completed' ? Colors.green :
              chore.status === 'overdue'   ? Colors.red   : Colors.orange,
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

  return (
    <View style={styles.container}>
      {/* Group header. */}
      <View style={styles.header}>
        <View>
          <Text style={styles.groupName}>🏠 {groupName}</Text>
          <Text style={styles.headerSub}>{completed}/{total} tasks completed this week</Text>
        </View>
        <ProgressRing progress={progress} size={52} />
      </View>

      {/* Avatars for members. */}
      <View style={styles.membersRow}>
        {groupMembers.map(m => (
          <View key={m.id} style={styles.memberItem}>
            <Avatar name={m.name} color={m.color} size={36} />
            <Text style={styles.memberName}>{m.name}</Text>
          </View>
        ))}
      </View>

      {/* List of chores. */}
      <FlatList
        data={groupChores}
        keyExtractor={c => c.id}
        renderItem={renderChore}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No chores yet — add one below!</Text>
          </View>
        }
        ListFooterComponent={
          <>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddChore')}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add Chore</Text>
            </TouchableOpacity>

            <View style={styles.footerGap} />

            <TouchableOpacity
              style={styles.switchGroupBtn}
              onPress={() => navigation.navigate('SwitchGroup')}
              activeOpacity={0.8}
            >
              <Text style={styles.switchGroupBtnText}>🔄 Switch Group</Text>
            </TouchableOpacity>
          </>
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
  footerGap:   { height: 46 },
  switchGroupBtn: {
    borderWidth: 1, borderColor: Colors.text + '66',
    borderRadius: Radius.md, padding: 14, alignItems: 'center',
    backgroundColor: Colors.card,
  },
  switchGroupBtnText: { color: Colors.text, fontWeight: '600', fontSize: 14 },
  emptyWrap:   { padding: 32, alignItems: 'center' },
  emptyText:   { ...Typography.body, color: Colors.muted, textAlign: 'center' },
});