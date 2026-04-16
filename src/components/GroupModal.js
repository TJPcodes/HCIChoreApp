// src/components/GroupModal.js
import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Share, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '../theme';
import { useApp } from '../context/AppContext';

/**
 * One modal that handles:
 *   - Showing current group's invite code (when in a group)
 *   - Creating a new group
 *   - Joining a group via invite code
 */
export default function GroupModal({ visible, onClose }) {
  const { activeGroupId, groups, createGroup, joinGroup } = useApp();

  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode,     setJoinCode]     = useState('');
  const [busy,         setBusy]         = useState(false);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  function closeAndReset() {
    setNewGroupName('');
    setJoinCode('');
    setBusy(false);
    onClose();
  }

  async function handleShare() {
    if (!activeGroup) return;
    try {
      await Share.share({
        message: `Join my ChoreSync group "${activeGroup.name}"! Enter code: ${activeGroup.inviteCode}`,
      });
    } catch (err) {
      console.error('share:', err);
    }
  }

  async function handleCreate() {
    if (!newGroupName.trim()) {
      Alert.alert('Missing name', 'Please enter a group name.');
      return;
    }
    setBusy(true);
    try {
      await createGroup(newGroupName.trim());
      setNewGroupName('');
      Alert.alert('Group created! 🎉', `"${newGroupName.trim()}" is now your active group.`);
      closeAndReset();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not create group.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) {
      Alert.alert('Missing code', 'Please enter an invite code.');
      return;
    }
    setBusy(true);
    try {
      const { group, alreadyMember } = await joinGroup(joinCode);
      if (alreadyMember) {
        Alert.alert("You're already in this group", `Switched to "${group.name}".`);
      } else {
        Alert.alert('Joined! 🎉', `Welcome to "${group.name}".`);
      }
      setJoinCode('');
      closeAndReset();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not join group.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={closeAndReset}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Groups</Text>
            <TouchableOpacity onPress={closeAndReset} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            {/* ── Current group invite code ─────────────────────────── */}
            {activeGroup && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Invite to "{activeGroup.name}"</Text>
                <Text style={styles.sectionHint}>Share this code so others can join:</Text>
                <View style={styles.codeBox}>
                  <Text selectable style={styles.codeText}>
                    {activeGroup.inviteCode?.toUpperCase() || '—'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
                  <Ionicons name="share-outline" size={18} color="#fff" />
                  <Text style={styles.shareBtnText}>Share Invite</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeGroup && <View style={styles.divider} />}

            {/* ── Create new group ──────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create New Group</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Apartment, Dorm, Family"
                placeholderTextColor={Colors.muted}
                value={newGroupName}
                onChangeText={setNewGroupName}
                autoCapitalize="words"
                editable={!busy}
              />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.accent }, busy && styles.disabled]}
                onPress={handleCreate}
                disabled={busy}
                activeOpacity={0.8}
              >
                {busy
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.actionBtnText}>+ Create Group</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* ── Join existing group ───────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Join a Group</Text>
              <Text style={styles.sectionHint}>Got an invite code from a friend?</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter invite code"
                placeholderTextColor={Colors.muted}
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!busy}
              />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.teal }, busy && styles.disabled]}
                onPress={handleJoin}
                disabled={busy}
                activeOpacity={0.8}
              >
                {busy
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.actionBtnText}>Join Group</Text>}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.title,
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
    gap: 8,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  sectionHint: {
    ...Typography.caption,
    color: Colors.muted,
    marginTop: -4,
  },
  codeBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent + '55',
    borderRadius: Radius.md,
    padding: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  codeText: {
    color: Colors.accent,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: 'Courier',
  },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 13,
    color: Colors.text,
    fontSize: 15,
  },
  actionBtn: {
    borderRadius: Radius.md,
    padding: 13,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.6,
  },
});