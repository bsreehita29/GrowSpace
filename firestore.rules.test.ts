/**
 * Security Rule Verification Suite for GROW SPACE
 * Verifies the "Dirty Dozen" adversarial payloads defined in security_spec.md
 * against firestore.rules expectations.
 */

export interface AdversarialPayloadCase {
  id: string;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; emailVerified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const dirtyDozenPayloads: AdversarialPayloadCase[] = [
  {
    id: 'DD-01',
    name: 'Unauthenticated Read',
    operation: 'get',
    path: 'users/uid_a/moods/m1',
    auth: null,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    name: 'Cross-User Read',
    operation: 'get',
    path: 'users/uid_b/financeTx/tx1',
    auth: { uid: 'uid_a', emailVerified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    name: 'Unverified Email Write',
    operation: 'create',
    path: 'users/uid_a/dailyTasks/t1',
    auth: { uid: 'uid_a', emailVerified: false },
    payload: {
      userId: 'uid_a',
      title: 'Morning review',
      dueDate: '2026-11-16',
      dueTime: '08:30',
      category: 'Personal',
      priority: 'medium',
      completed: false,
      reminderEnabled: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    name: 'User Directory Enumeration',
    operation: 'list',
    path: 'users',
    auth: { uid: 'uid_a', emailVerified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    name: 'Identity Spoofing on Create',
    operation: 'create',
    path: 'users/uid_a/moods/m1',
    auth: { uid: 'uid_a', emailVerified: true },
    payload: {
      userId: 'uid_b',
      dateKey: '2026-11-16',
      moodScore: 4,
      stressLevel: 2,
      emotionLabel: 'Calm',
      meditationMinutes: 10,
      journalText: 'Steady morning.',
      gratitudeNote: 'Warm tea.',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    name: 'Ghost Field Injection',
    operation: 'create',
    path: 'users/uid_a/studyTasks/t1',
    auth: { uid: 'uid_a', emailVerified: true },
    payload: {
      userId: 'uid_a',
      title: 'Algorithms Lab',
      courseName: 'CS301',
      taskType: 'assignment',
      dueDate: '2026-11-20',
      priority: 'high',
      status: 'pending',
      notes: '',
      isAdmin: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    name: 'Forged Client Timestamp on Update',
    operation: 'update',
    path: 'users/uid_a/dailyTasks/t1',
    auth: { uid: 'uid_a', emailVerified: true },
    payload: {
      completed: true,
      updatedAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    name: 'Immutable Field Tampering',
    operation: 'update',
    path: 'users/uid_a/careerApps/a1',
    auth: { uid: 'uid_a', emailVerified: true },
    payload: {
      userId: 'uid_b',
      status: 'interviewing',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    name: 'Document ID Poisoning',
    operation: 'create',
    path: `users/uid_a/studyNotes/${'x'.repeat(200)}`,
    auth: { uid: 'uid_a', emailVerified: true },
    payload: {
      userId: 'uid_a',
      title: 'Notes',
      courseName: 'CS301',
      content: 'Summary',
      focusMinutes: 25,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    name: 'String Size Bloat',
    operation: 'create',
    path: 'users/uid_a/studyNotes/n1',
    auth: { uid: 'uid_a', emailVerified: true },
    payload: {
      userId: 'uid_a',
      title: 'Notes',
      courseName: 'CS301',
      content: 'a'.repeat(5500),
      focusMinutes: 25,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    name: 'Unbounded Array Injection',
    operation: 'create',
    path: 'users/uid_a/habits/h1',
    auth: { uid: 'uid_a', emailVerified: true },
    payload: {
      userId: 'uid_a',
      title: 'Hydration',
      frequency: 'daily',
      targetPerWeek: 7,
      completedDates: Array.from({ length: 95 }, (_, i) => `2026-01-${String((i % 28) + 1).padStart(2, '0')}`),
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    name: 'Invalid Enum Injection',
    operation: 'update',
    path: 'users/uid_a/careerApps/a1',
    auth: { uid: 'uid_a', emailVerified: true },
    payload: {
      status: 'ceo',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
