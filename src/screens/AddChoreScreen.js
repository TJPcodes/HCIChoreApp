// src/screens/AddChoreScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert,
} from 'react-native';
import { Colors, Typography, Radius } from '../theme';
import { PrimaryButton } from '../components/shared';
import { useApp } from '../context/AppContext';
import { ChoreFrequency } from '../models/data';

const FREQUENCIES = Object.values(ChoreFrequency);

export default function AddChoreScreen({ navigation }) {
  const { users, currentUserId, activeGroupId, addChore } = useApp();

  const [name,         setName]         = useState('');
  const [frequency,    setFrequency]    = useState(ChoreFrequency.WEEKLY);
  const [autoRotate,   setAutoRotate]   = useState(true);
  const [selectedUser, setSelectedUser] = useState(currentUserId);
  const [reminderOn,   setReminderOn]   = useState(true);
  const [dueDateStart, setDueDateStart] = useState('Mon');
  const [dueDateEnd,   setDueDateEnd]   = useState('Wed');
  const [saving,       setSaving]       = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a chore name.');
      return;
    }
    if (!activeGroupId) {
      Alert.alert('No group', 'Create or join a group first before adding chores.');
      return;
    }

    setSaving(true);
    try {
      await addChore({
        name:         name.trim(),
        frequency,
        autoRotate,
        assigneeId:   autoRotate ? currentUserId : selectedUser,
        dueDateStart,
        dueDateEnd,
      });

      Alert.alert('Chore saved!', `"${name}" was added to the group.`, [
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

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

      {/* Due Window */}
      <Text style={styles.label}>Due Window</Text>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>Starts</Text>
          <TextInput
            style={styles.input}
            value={dueDateStart}
            onChangeText={setDueDateStart}
            placeholder="Mon"
            placeholderTextColor={Colors.muted}
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>Ends</Text>
          <TextInput
            style={styles.input}
            value={dueDateEnd}
            onChangeText={setDueDateEnd}
            placeholder="Wed"
            placeholderTextColor={Colors.muted}
          />
        </View>
      </View>
      <Text style={styles.hint}>The chore can be done any time in this window.</Text>

      {/* Assignment */}
      <Text style={styles.label}>Assignment</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Auto-rotate between members</Text>
        <Switch
          value={autoRotate}
          onValueChange={setAutoRotate}
          trackColor={{ true: Colors.accent }}
          thumbColor="#fff"
        />
      </View>

      {!autoRotate && (
        <>
          <Text style={styles.inputLabel}>Assign to</Text>
          <View style={styles.chipRow}>
            {users.map(u => (
              <TouchableOpacity
                key={u.id}
                style={[
                  styles.chip,
                  selectedUser === u.id && {
                    ...styles.chipActive,
                    borderColor: u.color,
                    backgroundColor: u.color + '22',
                  },
                ]}
                onPress={() => setSelectedUser(u.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedUser === u.id && { color: u.color }]}>
                  {u.name}
                </Text>
              </TouchableOpacity>
            ))}
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

      {/* Save */}
      <PrimaryButton
        title={saving ? 'Saving…' : 'Save Chore ✓'}
        onPress={handleSave}
        style={styles.saveBtn}
      />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  content:       { padding: 20, paddingBottom: 60 },
  label:         { ...Typography.headline, color: Colors.text, marginTop: 20, marginBottom: 8 },
  inputLabel:    { ...Typography.caption, color: Colors.muted, marginBottom: 4 },
  input:         {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 13, color: Colors.text, fontSize: 15,
  },
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          {
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card, paddingHorizontal: 12, paddingVertical: 7,
  },
  chipActive:    { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  chipText:      { color: Colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive:{ color: Colors.accent },
  row:           { flexDirection: 'row', gap: 12 },
  halfInput:     { flex: 1 },
  hint:          { ...Typography.caption, color: Colors.muted, marginTop: 6 },
  toggleRow:     {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  toggleLabel:   { ...Typography.subhead, color: Colors.text, flex: 1 },
  saveBtn:       { marginTop: 32 },
  cancelBtn:     { marginTop: 12, alignItems: 'center', padding: 12 },
  cancelText:    { color: Colors.muted, fontSize: 14 },
});