import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://hmrgohgbrpicibmqyckn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtcmdvaGdicnBpY2libXF5Y2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODAxMjksImV4cCI6MjA5MTg1NjEyOX0.FyksT5AsPTmtDlJFYcW8k8o3ldLBKu7XwmcJu5Z5_aM';  

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,        // persists session token to device storage
    autoRefreshToken: true,       // silently refreshes expired tokens
    persistSession: true,         // keeps user logged in across app restarts
    detectSessionInUrl: false,    // not needed for React Native
  },
});
