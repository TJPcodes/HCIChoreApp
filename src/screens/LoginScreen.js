// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { Colors, Typography, Radius } from '../theme';
import { supabase } from '../services/supabase';

// Random color for new user profiles
const PROFILE_COLORS = ['#4F8EF7', '#34C78A', '#F5A623', '#2DD4BF', '#818CF8', '#FF5C5C'];
function randomColor() {
  return PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)];
}

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit() {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (isSignUp && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // ── Sign Up ────────────────────────────────────────────────
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { name: name.trim() } },   // passed to the profile trigger
        });
        if (signUpErr) throw signUpErr;

        // Give the trigger a moment to create the profile, then set a random color
        if (data?.user) {
          setTimeout(async () => {
            await supabase
              .from('profiles')
              .update({ color: randomColor() })
              .eq('id', data.user.id);
          }, 500);
        }
      } else {
        // ── Log In ─────────────────────────────────────────────────
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInErr) throw signInErr;
      }
      // On success, onAuthStateChange in AppContext picks up the new session
      // and switches the navigator to the main app automatically.
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsSignUp(prev => !prev);
    setError('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Branding ──────────────────────────────────────────────── */}
        <View style={styles.brandWrap}>
          <Text style={styles.logo}>🏠</Text>
          <Text style={styles.title}>ChoreSync</Text>
          <Text style={styles.subtitle}>Keep your household in sync</Text>
        </View>

        {/* ── Mode Toggle ───────────────────────────────────────────── */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, !isSignUp && styles.toggleBtnActive]}
            onPress={() => switchMode()}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>
              Log In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, isSignUp && styles.toggleBtnActive]}
            onPress={() => switchMode()}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Form ──────────────────────────────────────────────────── */}
        <View style={styles.form}>

          {isSignUp && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="What should we call you?"
                placeholderTextColor={Colors.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor={Colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {/* ── Error ─────────────────────────────────────────────── */}
          {error !== '' && (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* ── Submit ────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>
                {isSignUp ? 'Create Account' : 'Log In'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Footer toggle ─────────────────────────────────────────── */}
        <TouchableOpacity onPress={switchMode} style={styles.footerBtn}>
          <Text style={styles.footerText}>
            {isSignUp
              ? 'Already have an account? Log in'
              : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
  },

  /* Branding */
  brandWrap: { alignItems: 'center', marginBottom: 32 },
  logo:      { fontSize: 48, marginBottom: 8 },
  title:     { ...Typography.largeTitle, color: Colors.text, marginBottom: 4 },
  subtitle:  { ...Typography.subhead, color: Colors.muted },

  /* Toggle */
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.accent,
  },
  toggleText: {
    ...Typography.subhead,
    color: Colors.muted,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },

  /* Form */
  form: { gap: 4 },
  label: {
    ...Typography.caption,
    color: Colors.muted,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
  },

  /* Error */
  errorWrap: {
    backgroundColor: Colors.red + '18',
    borderWidth: 1,
    borderColor: Colors.red + '44',
    borderRadius: Radius.sm,
    padding: 10,
    marginTop: 12,
  },
  errorText: {
    ...Typography.subhead,
    color: Colors.red,
  },

  /* Submit */
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  /* Footer */
  footerBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 8,
  },
  footerText: {
    ...Typography.subhead,
    color: Colors.accent,
  },
});