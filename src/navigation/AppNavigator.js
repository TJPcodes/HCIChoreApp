// src/navigation/AppNavigator.js
import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { useApp } from '../context/AppContext';

import LoginScreen    from '../screens/LoginScreen';
import HomeScreen     from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import AddChoreScreen from '../screens/AddChoreScreen';
import GroupScreen    from '../screens/GroupScreen';
import PersonalScreen from '../screens/PersonalScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Stack wrappers ──────────────────────────────────────────────────────────

function HomeStack() {
  const { signOut } = useApp();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          title: 'ChoreSync',
          headerLeft: () => (
            <TouchableOpacity onPress={signOut} style={styles.logoutBtn} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={Colors.muted} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="AddChore" component={AddChoreScreen} options={{ title: 'Add Chore' }} />
    </Stack.Navigator>
  );
}

function PersonalStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="PersonalMain" component={PersonalScreen} options={{ title: 'My Chores' }} />
    </Stack.Navigator>
  );
}

function ActivityStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ActivityMain" component={ActivityScreen} options={{ title: 'Activity' }} />
      <Stack.Screen name="AddChore"     component={AddChoreScreen} options={{ title: 'Add Chore' }} />
    </Stack.Navigator>
  );
}

function GroupStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="GroupMain" component={GroupScreen}    options={{ title: 'Group' }} />
      <Stack.Screen name="AddChore"  component={AddChoreScreen} options={{ title: 'Add Chore' }} />
    </Stack.Navigator>
  );
}

// ── Auth stack (shown when logged out) ──────────────────────────────────────

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// ── Main Tab Navigator ──────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor:  Colors.border,
          borderTopWidth:  1,
          paddingBottom:   6,
          height:          60,
        },
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Activity: focused ? 'notifications'       : 'notifications-outline',
            Home:     focused ? 'home'                 : 'home-outline',
            Group:    focused ? 'people'               : 'people-outline',
            Personal: focused ? 'checkmark-done-circle': 'checkmark-done-circle-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeStack}     />
      <Tab.Screen name="Group"    component={GroupStack}     />
      <Tab.Screen name="Personal" component={PersonalStack} />
      <Tab.Screen name="Activity" component={ActivityStack} />
    </Tab.Navigator>
  );
}

// ── Root Navigator ──────────────────────────────────────────────────────────
// Shows a loading spinner while checking for a stored session,
// then switches between the auth flow and main app.

export default function AppNavigator() {
  const { session, loaded } = useApp();

  if (!loaded) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return session ? <MainTabs /> : <AuthStack />;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const stackOptions = {
  headerStyle:         { backgroundColor: Colors.surface },
  headerTintColor:     Colors.text,
  headerTitleStyle:    { fontWeight: '700', fontSize: 17 },
  headerShadowVisible: false,
  contentStyle:        { backgroundColor: Colors.bg },
};

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
  logoutBtn: {
    marginRight: 12,
    padding: 4,
  },
});
