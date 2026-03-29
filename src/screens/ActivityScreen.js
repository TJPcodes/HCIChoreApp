import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Colors, Typography, Radius } from '../theme';
import { useApp } from '../context/AppContext';

// Map activity types to icons and colors
const TYPE_STYLES = {
  completed: { icon: '✅', color: '#34C78A' },
  rotated:   { icon: '🔄', color: '#4F8EF7' },
  due_soon:  { icon: '⚠️', color: '#F5A623' },
  added:     { icon: '➕', color: '#2DD4BF' },
  nudge:     { icon: '👋', color: '#FBBF24' },
  info:      { icon: 'ℹ️', color: '#818CF8' },
};

export default function ActivityScreen({ navigation }) {
  const { activity } = useApp();

  function renderItem({ item }) {
    const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;
    return (
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: style.color + '22' }]}>
          <Text style={styles.icon}>{item.icon || style.icon}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.msg}>{item.msg}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activity}
        keyExtractor={a => a.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No activity yet — add a group and some chores to get started!</Text>
          </View>
        }
        ListFooterComponent={
          activity.length > 0 ? (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[styles.footerBtn, { borderColor: Colors.accent + '55', backgroundColor: Colors.accent + '18' }]}
                onPress={() => navigation.navigate('AddChore')}
                activeOpacity={0.8}
              >
                <Text style={[styles.footerBtnText, { color: Colors.accent }]}>+ Add Chore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerBtn, { borderColor: Colors.orange + '55', backgroundColor: Colors.orange + '18' }]}
                onPress={() => Alert.alert('Set Reminder', 'Reminder scheduling coming soon!')}
                activeOpacity={0.8}
              >
                <Text style={[styles.footerBtnText, { color: Colors.orange }]}>🔔 Set Reminder</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  list:         { padding: 16, paddingBottom: 40 },
  row:          {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  iconWrap:     {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  icon:         { fontSize: 16 },
  textWrap:     { flex: 1 },
  msg:          { ...Typography.subhead, color: Colors.text },
  time:         { ...Typography.caption, color: Colors.muted, marginTop: 3 },
  separator:    { height: 8 },
  emptyWrap:    { padding: 32, alignItems: 'center' },
  emptyText:    { ...Typography.body, color: Colors.muted, textAlign: 'center' },
  footerRow:    { flexDirection: 'row', gap: 10, marginTop: 16 },
  footerBtn:    {
    flex: 1, borderWidth: 1, borderRadius: Radius.md,
    padding: 12, alignItems: 'center',
  },
  footerBtnText:{ fontWeight: '700', fontSize: 13 },
});
