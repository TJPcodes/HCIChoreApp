// Central data models and shared mock data for the app

// ── Chore Status / Frequency ────────────────────────────────────────────────

export const ChoreStatus = {
  PENDING:   'pending',
  COMPLETED: 'completed',
  OVERDUE:   'overdue',
};

export const ChoreFrequency = {
  ONE_TIME: 'One-Time',
  DAILY:    'Daily',
  WEEKLY:   'Weekly',
  BIWEEKLY: 'Bi-Weekly',
  MONTHLY:  'Monthly',
};

// ── Mock Users ───────────────────────────────────────────────────────────────

export const MOCK_USERS = [
  { id: 'u1', name: 'Tyler',  initials: 'TP', color: '#4F8EF7' },
  { id: 'u2', name: 'Zach',   initials: 'ZP', color: '#34C78A' },
  { id: 'u3', name: 'Wilson', initials: 'WG', color: '#F5A623' },
];

export const CURRENT_USER = MOCK_USERS[0]; // Tyler

// ── Mock Chores ──────────────────────────────────────────────────────────────

export const MOCK_CHORES = [
  {
    id:          'c1',
    name:        'Dishes',
    assigneeId:  'u1',
    groupId:     'g1',
    frequency:   ChoreFrequency.WEEKLY,
    autoRotate:  true,
    dueDateStart:'Mon',
    dueDateEnd:  'Wed',
    status:      ChoreStatus.PENDING,
  },
  {
    id:          'c2',
    name:        'Trash',
    assigneeId:  'u2',
    groupId:     'g1',
    frequency:   ChoreFrequency.WEEKLY,
    autoRotate:  true,
    dueDateStart:'Tue',
    dueDateEnd:  'Thu',
    status:      ChoreStatus.COMPLETED,
  },
  {
    id:          'c3',
    name:        'Bathroom',
    assigneeId:  'u3',
    groupId:     'g1',
    frequency:   ChoreFrequency.WEEKLY,
    autoRotate:  true,
    dueDateStart:'Wed',
    dueDateEnd:  'Fri',
    status:      ChoreStatus.OVERDUE,
  },
  {
    id:          'c4',
    name:        'Vacuum',
    assigneeId:  'u1',
    groupId:     'g1',
    frequency:   ChoreFrequency.WEEKLY,
    autoRotate:  false,
    dueDateStart:'Fri',
    dueDateEnd:  'Sun',
    status:      ChoreStatus.PENDING,
  },
  {
    id:          'c5',
    name:        'Mop floors',
    assigneeId:  'u1',
    groupId:     'g1',
    frequency:   ChoreFrequency.BIWEEKLY,
    autoRotate:  true,
    dueDateStart:'Thu',
    dueDateEnd:  'Sat',
    status:      ChoreStatus.OVERDUE,
  },
];

// ── Mock Activity Feed ───────────────────────────────────────────────────────

export const MOCK_ACTIVITY = [
  { id: 'a1', type: 'completed', icon: '✅', color: '#34C78A', msg: 'Zach completed Trash',               time: '2h ago' },
  { id: 'a2', type: 'rotated',   icon: '🔄', color: '#4F8EF7', msg: 'Bathroom rotated to Wilson',         time: '3h ago' },
  { id: 'a3', type: 'due_soon',  icon: '⚠️', color: '#F5A623', msg: 'Dishes due tomorrow!',              time: '5h ago' },
  { id: 'a4', type: 'added',     icon: '➕', color: '#2DD4BF', msg: 'Wilson added "Walk dog" to Apt',    time: '1d ago' },
  { id: 'a5', type: 'nudge',     icon: '👋', color: '#FBBF24', msg: 'Anonymous nudge sent to Tyler',     time: '1d ago' },
  { id: 'a6', type: 'completed', icon: '✅', color: '#34C78A', msg: 'Tyler completed Vacuum',             time: '2d ago' },
];

// ── Mock Group ───────────────────────────────────────────────────────────────

export const MOCK_GROUP = {
  id:      'g1',
  name:    'Apartment',
  members: MOCK_USERS,
  chores:  MOCK_CHORES,
};

// ── Helper: get user by id ───────────────────────────────────────────────────

export function getUserById(id) {
  return MOCK_USERS.find(u => u.id === id) || { name: 'Unknown', initials: '?', color: '#888' };
}
