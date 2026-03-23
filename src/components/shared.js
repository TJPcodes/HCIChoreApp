// src/components/shared.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '../theme';

// ── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ name, color, size = 36 }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '33', borderColor: color + '66' }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }) {
  const map = {
    completed: { label: '✓ Done',    bg: Colors.green + '22', color: Colors.green },
    overdue:   { label: '⚠ Overdue', bg: Colors.red   + '22', color: Colors.red },
    pending:   { label: 'Pending',   bg: Colors.orange + '22', color: Colors.orange },
  };
  const s = map[status] || map.pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, style, overdue }) {
  return (
    <View style={[
      styles.card,
      overdue && { borderColor: Colors.red + '55', backgroundColor: Colors.red + '08' },
      style,
    ]}>
      {children}
    </View>
  );
}

// ── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({ title, color = Colors.muted }) {
  return (
    <Text style={[styles.sectionHeader, { color }]}>{title.toUpperCase()}</Text>
  );
}

// ── Primary Button ───────────────────────────────────────────────────────────

export function PrimaryButton({ title, onPress, color = Colors.accent, style }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.primaryBtn, { backgroundColor: color }, style]} activeOpacity={0.8}>
      <Text style={styles.primaryBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

// ── Ghost Button ─────────────────────────────────────────────────────────────

export function GhostButton({ title, onPress, color = Colors.accent, style }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.ghostBtn, { borderColor: color + '55', backgroundColor: color + '18' }, style]} activeOpacity={0.7}>
      <Text style={[styles.ghostBtnText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

// ── Circular Progress ─────────────────────────────────────────────────────────
// segmented ring using absolute-positioned views

export function ProgressRing({ progress, size = 64, strokeWidth = 6, color = Colors.accent }) {
  const pct = Math.round(progress * 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: Colors.border,
      }} />
      {/* We fake the progress using a colored border on half the circle */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderTopColor: pct > 0   ? color : 'transparent',
        borderRightColor: pct > 25  ? color : 'transparent',
        borderBottomColor: pct > 50  ? color : 'transparent',
        borderLeftColor: pct > 75  ? color : 'transparent',
        transform: [{ rotate: '-45deg' }],
      }} />
      <Text style={{ color: Colors.text, fontSize: size * 0.22, fontWeight: '800' }}>{pct}%</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  avatarText: { fontWeight: '700' },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  sectionHeader: {
    ...Typography.micro,
    marginBottom: 10,
    marginTop: 4,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ghostBtn: {
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  ghostBtnText: { fontWeight: '600', fontSize: 13 },
});
