// src/screens/AddChoreScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '../theme';
import { PrimaryButton, Avatar } from '../components/shared';
import { useApp } from '../context/AppContext';
import { ChoreFrequency } from '../models/data';

const FREQUENCIES = Object.values(ChoreFrequency);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const START_OPTIONS = [
  { value: 0, label: 'This Week' },
  { value: 1, label: 'Next Week' },
  { value: 2, label: 'In 2 Weeks' },
  { value: 3, label: 'In 3 Weeks' },
];

export default function AddChoreScreen({ navigation }) {
  const { users, currentUserId, activeGroupId, groups, addChore } = useApp();

  // Build scope options: Personal + every group the user is in
  const scopeOptions = [
    { value: 'personal', label: '👤 Personal', groupId: null },
    ...groups.map(g => ({ value: g.id, label: `${g.emoji || '🏠'} ${g.name}`, groupId: g.id })),
  ];

  // Default to active group if one is set, else personal
  const defaultScope = activeGroupId || 'personal';

  const [scope,           setScope]           = useState(defaultScope);
  const [scopeOpen,       setScopeOpen]       = useState(false);
  const [name,            setName]            = useState('');
  const [frequency,       setFrequency]       = useState(ChoreFrequency.WEEKLY);
  const [autoRotate,      setAutoRotate]      = useState(true);
  const [selectedUser,    setSelectedUser]    = useState(currentUserId);
  const [reminderOn,      setReminderOn]      = useState(true);
  const [dueDateStart,    setDueDateStart]    = useState('Mon');
  const [dueDateEnd,      setDueDateEnd]      = useState('Wed');
  const [startWeekOffset, setStartWeekOffset] = useState(0);
  const [saving,          setSaving]          = useState(false);

  // Current scope info
  const currentScope = scopeOptions.find(o => o.value === scope) || scopeOptions[0];
  const isPersonal   = currentScope.groupId === null;
  const targetGroup  = isPersonal ? null : groups.find(g => g.id === currentScope.groupId);

  // Members for the selected group (for assignment)
  const groupMembers = targetGroup
    ? users.filter(u => targetGroup.memberIds?.includes(u.id))
    : [];

  // If the chosen start day gets pushed past the end day, drag the end along
  function handleStartDay(day) {
    setDueDateStart(day);
    if (DAYS.indexOf(day) > DAYS.indexOf(dueDateEnd)) {
      setDueDateEnd(day);
    }
  }

  // End day can't be earlier than start day
  function handleEndDay(day) {
    if (DAYS.indexOf(day) >= DAYS.indexOf(dueDateStart)) {
      setDueDateEnd(day);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a chore name.');
      return;
    }

    setSaving(true);
    try {
      await addChore({
        name:            name.trim(),
        frequency,
        autoRotate:      isPersonal ? false : autoRotate,
        // Always honor the picked assignee — auto-rotate just controls what happens
        // on the NEXT cycle, not the initial assignment.
        assigneeId:      isPersonal ? currentUserId : selectedUser,
        groupId:         currentScope.groupId,
        dueDateStart,
        dueDateEnd,
        startWeekOffset,
      });

      Alert.alert('Chore saved!', `"${name}" was added.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Could not save the chore. Please try again.');
      console.error('handleSave:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Scope dropdown ─────────────────────────────────────── */}
      <Text style={styles.label}>Chore Scope</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setScopeOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownText}>{currentScope.label}</Text>
        <Ionicons name="chevron-down" size={18} color={Colors.muted} />
      </TouchableOpacity>

      {/* Name */}
      <Text style={styles.label}>Chore Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Dishes, Take out trash…"
        placeholderTextColor={Colors.muted}
        value={name}
        onChangeText={setName}
      />

      {/* Frequency */}
      <Text style={styles.label}>Frequency</Text>
      <View style={styles.chipRow}>
        {FREQUENCIES.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, frequency === f && styles.chipActive]}
            onPress={() => setFrequency(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Starts (week offset) ───────────────────────────────── */}
      <Text style={styles.label}>Starts</Text>
      <View style={styles.chipRow}>
        {START_OPTIONS.map(opt => {
          const active = startWeekOffset === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setStartWeekOffset(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Due Window — day pickers ───────────────────────────── */}
      <Text style={styles.label}>Due Window</Text>

      <Text style={styles.inputLabel}>Starts on</Text>
      <View style={styles.dayRow}>
        {DAYS.map(d => {
          const active = dueDateStart === d;
          return (
            <TouchableOpacity
              key={d}
              style={[styles.dayChip, active && styles.dayChipActive]}
              onPress={() => handleStartDay(d)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.inputLabel, { marginTop: 10 }]}>Ends on</Text>
      <View style={styles.dayRow}>
        {DAYS.map(d => {
          const active   = dueDateEnd === d;
          const disabled = DAYS.indexOf(d) < DAYS.indexOf(dueDateStart);
          return (
            <TouchableOpacity
              key={d}
              disabled={disabled}
              style={[
                styles.dayChip,
                active && styles.dayChipActive,
                disabled && styles.dayChipDisabled,
              ]}
              onPress={() => handleEndDay(d)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayChipText,
                active && styles.dayChipTextActive,
                disabled && styles.dayChipTextDisabled,
              ]}>
                {d}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>The chore can be done any time in this window.</Text>

      {/* ── Assignment (only for group chores) ─────────────────── */}
      {!isPersonal && groupMembers.length > 0 && (
        <>
          <Text style={styles.label}>Assignment</Text>

          <Text style={styles.inputLabel}>Initially assigned to</Text>
          <View style={styles.chipRow}>
            {groupMembers.map(u => {
              const selected = selectedUser === u.id;
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.userChip,
                    selected && {
                      borderColor: u.color,
                      backgroundColor: u.color + '22',
                    },
                  ]}
                  onPress={() => setSelectedUser(u.id)}
                  activeOpacity={0.7}
                >
                  <Avatar name={u.name} color={u.color} size={22} />
                  <Text style={[
                    styles.userChipText,
                    selected && { color: u.color },
                  ]}>
                    {u.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.toggleRow, { marginTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Auto-rotate between members</Text>
              <Text style={styles.toggleHint}>
                After each completion, passes to the next member.
              </Text>
            </View>
            <Switch
              value={autoRotate}
              onValueChange={setAutoRotate}
              trackColor={{ true: Colors.accent }}
              thumbColor="#fff"
            />
          </View>
        </>
      )}

      {/* Reminder */}
      <Text style={styles.label}>Reminder</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Send reminder notification</Text>
        <Switch
          value={reminderOn}
          onValueChange={setReminderOn}
          trackColor={{ true: Colors.accent }}
          thumbColor="#fff"
        />
      </View>

      <PrimaryButton
        title={saving ? 'Saving…' : 'Save Chore ✓'}
        onPress={handleSave}
        style={styles.saveBtn}
      />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

    </ScrollView>

    {/* ── Scope picker modal ─────────────────────────────────────── */}
    <Modal
      visible={scopeOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setScopeOpen(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setScopeOpen(false)}>
        <View style={styles.modalMenu}>
          <Text style={styles.modalTitle}>Choose Scope</Text>
          {scopeOptions.map(opt => {
            const selected = opt.value === scope;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.modalItem, selected && styles.modalItemActive]}
                onPress={() => {
                  setScope(opt.value);
                  setScopeOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalItemText, selected && styles.modalItemTextActive]}>
                  {opt.label}
                </Text>
                {selected && <Ionicons name="checkmark" size={18} color={Colors.accent} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  content:       { padding: 20, paddingBottom: 60 },
  label:         { ...Typography.headline, color: Colors.text, marginTop: 20, marginBottom: 8 },
  inputLabel:    { ...Typography.caption, color: Colors.muted, marginBottom: 6 },
  input:         {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 13, color: Colors.text, fontSize: 15,
  },

  /* Dropdown */
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 14,
  },
  dropdownText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalMenu: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    width: '100%',
    maxWidth: 360,
    gap: 6,
  },
  modalTitle: {
    ...Typography.headline,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalItemActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '18',
  },
  modalItemText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  modalItemTextActive: {
    color: Colors.accent,
  },

  /* Generic chips */
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           {
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card, paddingHorizontal: 12, paddingVertical: 7,
  },
  chipActive:     { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  chipText:       { color: Colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Colors.accent },

  /* Day chips — 7-across, equal width */
  dayRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayChip: {
    flex: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  dayChipDisabled: {
    opacity: 0.35,
  },
  dayChipText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  dayChipTextActive:   { color: Colors.accent },
  dayChipTextDisabled: { color: Colors.muted },

  /* User chips (with avatar) */
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  userChipText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  hint: { ...Typography.caption, color: Colors.muted, marginTop: 6 },

  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
    gap: 10,
  },
  toggleLabel: { ...Typography.subhead, color: Colors.text },
  toggleHint:  { ...Typography.caption, color: Colors.muted, marginTop: 2 },

  saveBtn:    { marginTop: 32 },
  cancelBtn:  { marginTop: 12, alignItems: 'center', padding: 12 },
  cancelText: { color: Colors.muted, fontSize: 14 },
});