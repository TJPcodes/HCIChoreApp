import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Typography } from '../theme';
import { PrimaryButton } from '../components/shared';
import { useApp } from '../context/AppContext';
import { MOCK_GROUP, MOCK_USERS } from '../models/data';

const STARTUP_GROUP = {
  id: MOCK_GROUP.id,
  name: MOCK_GROUP.name,
  memberIds: MOCK_USERS.map(u => u.id),
};

export default function SwitchGroupScreen({ navigation }) {
  const {
    groups,
    currentUserId,
    activeGroupId,
    switchGroup,
    createGroup,
  } = useApp();

  const [newGroupName, setNewGroupName] = useState('');

  const userGroups = useMemo(() => {
    const withStartup = groups.some(g => g.id === STARTUP_GROUP.id)
      ? groups
      : [STARTUP_GROUP, ...groups];

    const byId = new Map();
    withStartup.forEach(group => byId.set(group.id, group));

    return [...byId.values()].filter(g => g.memberIds?.includes(currentUserId));
  }, [groups, currentUserId]);

  const canSaveGroup = newGroupName.trim().length > 0;

  function handleInvite() {
    Alert.alert('Invite to Group', 'Invite link copied to clipboard!');
  }

  function handleSwitchGroup(groupId) {
    if (groupId !== activeGroupId) {
      switchGroup(groupId);
    }
    navigation.goBack();
  }

  function handleCreateGroup() {
    if (!canSaveGroup) return;
    createGroup(newGroupName.trim());
    setNewGroupName('');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Invite to Group</Text>
      <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite} activeOpacity={0.8}>
        <View style={styles.inviteContent}>
          <Ionicons name="mail" size={18} color={Colors.teal} />
          <Text style={styles.inviteText}>Invite to Group</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.label}>Switch Group</Text>
      {userGroups.length > 0 ? (
        userGroups.map(group => (
          <TouchableOpacity
            key={group.id}
            style={styles.groupBtn}
            onPress={() => handleSwitchGroup(group.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.groupBtnText}>{group.name}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>You are not in any groups yet.</Text>
      )}

      <Text style={styles.label}>Create Group</Text>
      <TextInput
        style={styles.input}
        placeholder="Group Name"
        placeholderTextColor={Colors.muted}
        value={newGroupName}
        onChangeText={setNewGroupName}
      />

      <PrimaryButton
        title="Save Group ✓"
        color={canSaveGroup ? Colors.accent : Colors.muted}
        onPress={handleCreateGroup}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  label: {
    ...Typography.headline,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  inviteBtn: {
    backgroundColor: Colors.teal + '18',
    borderWidth: 1,
    borderColor: Colors.teal + '44',
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 8,
  },
  inviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteText: {
    ...Typography.subhead,
    color: Colors.teal,
    fontWeight: '600',
  },
  groupBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  groupBtnText: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '600',
  },
  emptyText: {
    ...Typography.subhead,
    color: Colors.muted,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 13,
    color: Colors.text,
    fontSize: 15,
  },
  saveBtn: {
    marginTop: 20,
  },
});
