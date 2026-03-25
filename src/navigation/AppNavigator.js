// src/navigation/AppNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

import HomeScreen     from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import AddChoreScreen from '../screens/AddChoreScreen';
import GroupScreen from '../screens/GroupScreen';


const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack wrapper lets any of the tab navigate to AddChore
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen}  options={{ title: 'ChoreSync' }} />
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
      <Stack.Screen name="GroupMain" component={GroupScreen}  options={{ title: 'Apartment' }} />
      <Stack.Screen name="AddChore"  component={AddChoreScreen} options={{ title: 'Add Chore' }} />
    </Stack.Navigator>
  );
}


// ── Main Tab Navigator ───────────────────────────────────────────────────────

export default function AppNavigator() {
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
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Activity: focused ? 'notifications'       : 'notifications-outline',
            Group:    focused ? 'people'               : 'people-outline',
            Home:     focused ? 'home'                 : 'home-outline',
            Personal: focused ? 'checkmark-done-circle': 'checkmark-done-circle-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Activity" component={ActivityStack} />
      <Tab.Screen name="Home"     component={HomeStack}     />
      <Tab.Screen name="Group" component={GroupStack} />
    </Tab.Navigator>
  );
}

const stackOptions = {
  headerStyle:         { backgroundColor: Colors.surface },
  headerTintColor:     Colors.text,
  headerTitleStyle:    { fontWeight: '700', fontSize: 17 },
  headerShadowVisible: false,
  contentStyle:        { backgroundColor: Colors.bg },
};
