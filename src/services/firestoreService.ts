import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  clampInt,
  clampNum,
  clampStr,
  getOffsetDateKey,
  getTodayDateKey,
  normalizeDateKey,
  type AiInsight,
  type AppNotification,
  type CalendarEvent,
  type CareerApplication,
  type CareerPrepItem,
  type CareerSkill,
  type DailyTask,
  type FinanceGoal,
  type FinanceTransaction,
  type GrowthGoal,
  type Habit,
  type HealthLog,
  type MoodEntry,
  type Opportunity,
  type StudyCourse,
  type StudyNote,
  type StudyTask,
  type UserProfile,
  type WeeklyReset,
} from '../types/growth';

function generateDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
}

const seedLocks = new Map<string, Promise<void>>();

export async function ensureUserProfileAndSeed(uid: string): Promise<void> {
  const existingLock = seedLocks.get(uid);
  if (existingLock) {
    return existingLock;
  }

  const task = (async () => {
    const userRef = doc(db, 'users', uid);
    let snap;
    try {
      snap = await getDoc(userRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }

    if (!snap.exists()) {
      const initialProfile = {
        userId: uid,
        displayName: 'Grower',
        email: 'workspace@growspace.local',
        roleTitle: 'Student & Builder',
        bio: 'Building calm momentum across academics, career, and daily wellbeing.',
        dailyWaterGoalMl: 2500,
        dailySleepGoalHours: 8,
        monthlyBudgetLimit: 1200,
        dailyFocusGoalMinutes: 120,
        currencySymbol: '$',
        seededStarterData: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(userRef, initialProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
      }

      await seedStarterWorkspace(uid);
      return;
    }

    const data = snap.data() as Partial<UserProfile>;
    if (!data.seededStarterData) {
      await seedStarterWorkspace(uid);
    }
  })().finally(() => {
    seedLocks.delete(uid);
  });

  seedLocks.set(uid, task);
  return task;
}

async function seedStarterWorkspace(uid: string): Promise<void> {
  const today = getTodayDateKey();
  const yesterday = getOffsetDateKey(-1);
  const twoDaysAgo = getOffsetDateKey(-2);
  const inTwoDays = getOffsetDateKey(2);
  const inFiveDays = getOffsetDateKey(5);
  const inTenDays = getOffsetDateKey(10);

  const batch1 = writeBatch(db);
  const ts1 = serverTimestamp();

  // Mood entries (last 3 days)
  const moodSeeds = [
    {
      id: 'mood_seed_1',
      dateKey: twoDaysAgo,
      moodScore: 3,
      stressLevel: 3,
      emotionLabel: 'Reflective',
      meditationMinutes: 10,
      journalText: 'Steady pace through lectures. Needed an afternoon walk to reset focus.',
      gratitudeNote: 'Quiet evening tea and clear notes.',
    },
    {
      id: 'mood_seed_2',
      dateKey: yesterday,
      moodScore: 4,
      stressLevel: 2,
      emotionLabel: 'Grounded',
      meditationMinutes: 15,
      journalText: 'Completed problem set early and slept on schedule.',
      gratitudeNote: 'Helpful peer review session.',
    },
    {
      id: 'mood_seed_3',
      dateKey: today,
      moodScore: 4,
      stressLevel: 2,
      emotionLabel: 'Focused',
      meditationMinutes: 12,
      journalText: 'Starting the morning with clear priorities and calm breathing.',
      gratitudeNote: 'Morning sunlight at my desk.',
    },
  ];
  for (const { id, ...fields } of moodSeeds) {
    batch1.set(doc(db, `users/${uid}/moods`, id), { ...fields, userId: uid, createdAt: ts1, updatedAt: ts1 });
  }

  // Study courses
  const courseSeeds = [
    {
      id: 'course_seed_1',
      courseName: 'Data Structures & Algorithms',
      courseCode: 'CS 301',
      dayOfWeek: 'Mon',
      startTime: '09:30',
      endTime: '11:00',
      room: 'Hall B-204',
      attendedClasses: 18,
      totalClasses: 20,
      targetAttendance: 80,
    },
    {
      id: 'course_seed_2',
      courseName: 'Human-Centered Design',
      courseCode: 'DES 210',
      dayOfWeek: 'Wed',
      startTime: '13:00',
      endTime: '14:30',
      room: 'Studio 4',
      attendedClasses: 14,
      totalClasses: 16,
      targetAttendance: 80,
    },
    {
      id: 'course_seed_3',
      courseName: 'Applied Statistics',
      courseCode: 'STAT 204',
      dayOfWeek: 'Fri',
      startTime: '10:30',
      endTime: '12:00',
      room: 'Room 108',
      attendedClasses: 11,
      totalClasses: 15,
      targetAttendance: 75,
    },
  ];
  for (const { id, ...fields } of courseSeeds) {
    batch1.set(doc(db, `users/${uid}/studyCourses`, id), { ...fields, userId: uid, createdAt: ts1, updatedAt: ts1 });
  }

  // Study tasks
  const studyTaskSeeds = [
    {
      id: 'stask_seed_1',
      title: 'Graph Traversal Lab Report',
      courseName: 'CS 301',
      taskType: 'assignment',
      dueDate: inTwoDays,
      priority: 'high',
      status: 'in_progress',
      notes: 'Include Dijkstra benchmark table and edge-case tests.',
    },
    {
      id: 'stask_seed_2',
      title: 'Midterm Review: Hypothesis Testing',
      courseName: 'STAT 204',
      taskType: 'exam',
      dueDate: inFiveDays,
      priority: 'high',
      status: 'pending',
      notes: 'Revise chapters 4-6 and timed practice problems.',
    },
  ];
  for (const { id, ...fields } of studyTaskSeeds) {
    batch1.set(doc(db, `users/${uid}/studyTasks`, id), { ...fields, userId: uid, createdAt: ts1, updatedAt: ts1 });
  }

  // Study note
  batch1.set(doc(db, `users/${uid}/studyNotes`, 'snote_seed_1'), {
    userId: uid,
    title: 'Dynamic Programming Patterns',
    courseName: 'CS 301',
    content: '1. Define subproblem state clearly.\n2. Identify recurrence transition.\n3. Check base cases and memoization bounds.',
    focusMinutes: 50,
    createdAt: ts1,
    updatedAt: ts1,
  });

  // Career skills, applications & prep
  const skillSeeds = [
    { id: 'skill_seed_1', name: 'TypeScript & React', category: 'Engineering', proficiency: 78, targetLevel: 90, notes: 'Building full-stack projects with clean state architecture.' },
    { id: 'skill_seed_2', name: 'SQL & Data Modeling', category: 'Data', proficiency: 68, targetLevel: 85, notes: 'Practicing window functions and schema normalization.' },
    { id: 'skill_seed_3', name: 'Product Storytelling', category: 'Communication', proficiency: 72, targetLevel: 85, notes: 'Structuring STAR case studies for interviews.' },
  ];
  for (const { id, ...fields } of skillSeeds) {
    batch1.set(doc(db, `users/${uid}/careerSkills`, id), { ...fields, userId: uid, createdAt: ts1, updatedAt: ts1 });
  }

  batch1.set(doc(db, `users/${uid}/careerApps`, 'app_seed_1'), {
    userId: uid,
    company: 'Northstar Labs',
    role: 'Product Engineering Intern',
    appType: 'internship',
    status: 'interviewing',
    deadline: inFiveDays,
    resumeVersion: 'v2.4-ProductEng',
    notes: 'Technical screen scheduled; review portfolio case study.',
    createdAt: ts1,
    updatedAt: ts1,
  });

  batch1.set(doc(db, `users/${uid}/careerPrep`, 'prep_seed_1'), {
    userId: uid,
    title: 'Quantify impact on top 3 resume bullets',
    category: 'resume',
    answerNotes: 'Use metric-driven phrasing: Action + Context + Measurable Result.',
    completed: false,
    createdAt: ts1,
    updatedAt: ts1,
  });

  try {
    await batch1.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/starterSeedBatch1`);
  }

  const batch2 = writeBatch(db);
  const ts2 = serverTimestamp();

  // Daily tasks & habits
  const dailyTaskSeeds = [
    {
      id: 'dtask_seed_1',
      title: 'Review lecture notes & plan top 3 priorities',
      dueDate: today,
      dueTime: '09:00',
      category: 'Study',
      priority: 'high',
      completed: true,
      reminderEnabled: true,
    },
    {
      id: 'dtask_seed_2',
      title: 'Evening 25-minute brisk walk',
      dueDate: today,
      dueTime: '17:30',
      category: 'Wellness',
      priority: 'medium',
      completed: false,
      reminderEnabled: true,
    },
  ];
  for (const { id, ...fields } of dailyTaskSeeds) {
    batch2.set(doc(db, `users/${uid}/dailyTasks`, id), { ...fields, userId: uid, createdAt: ts2, updatedAt: ts2 });
  }

  const habitSeeds = [
    {
      id: 'habit_seed_1',
      title: 'Morning hydration (500ml)',
      frequency: 'daily',
      targetPerWeek: 7,
      completedDates: [twoDaysAgo, yesterday, today],
    },
    {
      id: 'habit_seed_2',
      title: '30m Focused deep study',
      frequency: 'daily',
      targetPerWeek: 6,
      completedDates: [twoDaysAgo, yesterday],
    },
    {
      id: 'habit_seed_3',
      title: 'Screen-free wind down before sleep',
      frequency: 'daily',
      targetPerWeek: 5,
      completedDates: [yesterday],
    },
  ];
  for (const { id, ...fields } of habitSeeds) {
    batch2.set(doc(db, `users/${uid}/habits`, id), { ...fields, userId: uid, createdAt: ts2, updatedAt: ts2 });
  }

  // Health logs (last 3 days)
  const healthSeeds = [
    {
      id: `health_${twoDaysAgo}`,
      dateKey: twoDaysAgo,
      sleepHours: 7.2,
      waterMl: 2000,
      workoutMinutes: 30,
      workoutType: 'Mobility & Walk',
      nutritionNote: 'Oatmeal, greens bowl, salmon rice',
      calories: 2050,
      selfCareChecklist: ['Sunlight walk', 'Stretch'],
    },
    {
      id: `health_${yesterday}`,
      dateKey: yesterday,
      sleepHours: 7.8,
      waterMl: 2250,
      workoutMinutes: 45,
      workoutType: 'Strength Training',
      nutritionNote: 'Greek yogurt, lentil soup, roasted veggies',
      calories: 2150,
      selfCareChecklist: ['Skincare', 'Stretch', 'Early wind-down'],
    },
    {
      id: `health_${today}`,
      dateKey: today,
      sleepHours: 8.0,
      waterMl: 1250,
      workoutMinutes: 25,
      workoutType: 'Morning Yoga',
      nutritionNote: 'Matcha, avocado toast, quinoa salad',
      calories: 1650,
      selfCareChecklist: ['Sunlight walk'],
    },
  ];
  for (const { id, ...fields } of healthSeeds) {
    batch2.set(doc(db, `users/${uid}/healthLogs`, id), { ...fields, userId: uid, createdAt: ts2, updatedAt: ts2 });
  }

  // Finance transactions & goals
  const txSeeds = [
    { id: 'tx_seed_1', title: 'Monthly Stipend / Allowance', amount: 1400, txType: 'income', category: 'Income', dateKey: twoDaysAgo, notes: 'November monthly budget base' },
    { id: 'tx_seed_2', title: 'Fresh Market Groceries', amount: 64.5, txType: 'expense', category: 'Food', dateKey: yesterday, notes: 'Weekly meal prep ingredients' },
    { id: 'tx_seed_3', title: 'Emergency Reserve Transfer', amount: 200, txType: 'savings', category: 'Savings', dateKey: today, notes: 'Automated monthly cushion' },
    { id: 'tx_seed_4', title: 'Transit Pass Renewal', amount: 38, txType: 'expense', category: 'Transport', dateKey: today, notes: 'Monthly commuter pass' },
  ];
  for (const { id, ...fields } of txSeeds) {
    batch2.set(doc(db, `users/${uid}/financeTx`, id), { ...fields, userId: uid, createdAt: ts2, updatedAt: ts2 });
  }

  batch2.set(doc(db, `users/${uid}/financeGoals`, 'fgoal_seed_1'), {
    userId: uid,
    title: '6-Month Calm Cushion',
    goalType: 'savings',
    targetAmount: 2400,
    currentAmount: 950,
    category: 'Emergency Fund',
    createdAt: ts2,
    updatedAt: ts2,
  });

  // Personal growth goals
  batch2.set(doc(db, `users/${uid}/growthGoals`, 'ggoal_seed_1'), {
    userId: uid,
    title: 'Ship Personal Portfolio & 2 Case Studies',
    category: 'Career',
    targetDate: inTenDays,
    progress: 65,
    visionQuote: 'Small, honest daily craft compounds into unmistakable confidence.',
    milestoneNote: 'Case study #1 drafted; polishing live demos.',
    isAchievement: false,
    createdAt: ts2,
    updatedAt: ts2,
  });

  // Tracked opportunity
  batch2.set(doc(db, `users/${uid}/opportunities`, 'opp_seed_1'), {
    userId: uid,
    title: 'Sustainable Tech Fellowship 2026',
    organization: 'Climate Builders Collective',
    oppType: 'scholarship',
    deadline: inTenDays,
    linkUrl: 'https://example.org/fellowship',
    status: 'shortlisted',
    notes: 'Prepare 500-word impact essay before next Friday.',
    createdAt: ts2,
    updatedAt: ts2,
  });

  // Weekly reset
  batch2.set(doc(db, `users/${uid}/weeklyResets`, 'wreset_seed_1'), {
    userId: uid,
    weekLabel: 'Week of Nov 9 – Nov 15',
    wins: 'Maintained 85%+ class attendance and logged consistent sleep above 7.5 hours.',
    challenges: 'Mid-week afternoon focus dip; need tighter phone boundaries during study blocks.',
    focusTheme: 'Steady Focus & Early Starts',
    nextWeekPriorities: [
      'Finish CS 301 Graph Lab two days ahead of deadline',
      'Complete Northstar Labs interview prep notes',
      'Hit 2.5L water goal 5 days this week',
    ],
    wellnessRating: 4,
    productivityRating: 4,
    createdAt: ts2,
    updatedAt: ts2,
  });

  // Welcome notification
  batch2.set(doc(db, `users/${uid}/notifications`, 'notif_seed_1'), {
    userId: uid,
    title: 'Welcome to GROW SPACE',
    message: 'Your personal sanctuary is ready. Explore your dashboard or ask the AI Assistant for a tailored schedule.',
    module: 'dashboard',
    read: false,
    createdAt: ts2,
    updatedAt: ts2,
  });

  batch2.update(doc(db, 'users', uid), {
    seededStarterData: true,
    updatedAt: ts2,
  });

  try {
    await batch2.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/starterSeedBatch2`);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Pick<
    UserProfile,
    | 'displayName'
    | 'roleTitle'
    | 'bio'
    | 'dailyWaterGoalMl'
    | 'dailySleepGoalHours'
    | 'monthlyBudgetLimit'
    | 'dailyFocusGoalMinutes'
    | 'currencySymbol'
  >
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: clampStr(updates.displayName, 80) || 'Grower',
      roleTitle: clampStr(updates.roleTitle, 80),
      bio: clampStr(updates.bio, 300),
      dailyWaterGoalMl: clampNum(updates.dailyWaterGoalMl, 500, 8000),
      dailySleepGoalHours: clampNum(updates.dailySleepGoalHours, 3, 14),
      monthlyBudgetLimit: clampNum(updates.monthlyBudgetLimit, 0, 10000000),
      dailyFocusGoalMinutes: clampNum(updates.dailyFocusGoalMinutes, 10, 720),
      currencySymbol: clampStr(updates.currencySymbol, 8) || '$',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Mood Entries
export async function createMoodEntry(
  uid: string,
  input: Omit<MoodEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('mood');
  const path = `users/${uid}/moods/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/moods`, id), {
      userId: uid,
      dateKey: normalizeDateKey(input.dateKey),
      moodScore: clampInt(input.moodScore, 1, 5),
      stressLevel: clampInt(input.stressLevel, 1, 5),
      emotionLabel: clampStr(input.emotionLabel, 40) || 'Calm',
      meditationMinutes: clampInt(input.meditationMinutes, 0, 480),
      journalText: clampStr(input.journalText, 2500),
      gratitudeNote: clampStr(input.gratitudeNote, 400),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateMoodEntry(
  uid: string,
  id: string,
  input: Pick<MoodEntry, 'moodScore' | 'stressLevel' | 'emotionLabel' | 'meditationMinutes' | 'journalText' | 'gratitudeNote'>
): Promise<void> {
  const path = `users/${uid}/moods/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/moods`, id), {
      moodScore: clampInt(input.moodScore, 1, 5),
      stressLevel: clampInt(input.stressLevel, 1, 5),
      emotionLabel: clampStr(input.emotionLabel, 40) || 'Calm',
      meditationMinutes: clampInt(input.meditationMinutes, 0, 480),
      journalText: clampStr(input.journalText, 2500),
      gratitudeNote: clampStr(input.gratitudeNote, 400),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteSubdoc(uid: string, subcollection: string, id: string): Promise<void> {
  const path = `users/${uid}/${subcollection}/${id}`;
  try {
    await deleteDoc(doc(db, `users/${uid}/${subcollection}`, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Study Courses
export async function createStudyCourse(
  uid: string,
  input: Omit<StudyCourse, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('course');
  const path = `users/${uid}/studyCourses/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/studyCourses`, id), {
      userId: uid,
      courseName: clampStr(input.courseName, 100) || 'Untitled Course',
      courseCode: clampStr(input.courseCode, 24),
      dayOfWeek: input.dayOfWeek,
      startTime: clampStr(input.startTime, 10) || '09:00',
      endTime: clampStr(input.endTime, 10) || '10:00',
      room: clampStr(input.room, 60),
      attendedClasses: clampInt(input.attendedClasses, 0, 500),
      totalClasses: clampInt(input.totalClasses, 0, 500),
      targetAttendance: clampInt(input.targetAttendance, 1, 100),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateCourseAttendance(
  uid: string,
  id: string,
  attendedClasses: number,
  totalClasses: number
): Promise<void> {
  const path = `users/${uid}/studyCourses/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/studyCourses`, id), {
      attendedClasses: clampInt(attendedClasses, 0, 500),
      totalClasses: clampInt(totalClasses, 0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Study Tasks
export async function createStudyTask(
  uid: string,
  input: Omit<StudyTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('stask');
  const path = `users/${uid}/studyTasks/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/studyTasks`, id), {
      userId: uid,
      title: clampStr(input.title, 140) || 'Untitled Task',
      courseName: clampStr(input.courseName, 100),
      taskType: input.taskType,
      dueDate: normalizeDateKey(input.dueDate),
      priority: input.priority,
      status: input.status,
      notes: clampStr(input.notes, 600),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateStudyTaskStatus(
  uid: string,
  id: string,
  status: StudyTask['status']
): Promise<void> {
  const path = `users/${uid}/studyTasks/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/studyTasks`, id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Study Notes & Focus
export async function createStudyNote(
  uid: string,
  input: Omit<StudyNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('snote');
  const path = `users/${uid}/studyNotes/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/studyNotes`, id), {
      userId: uid,
      title: clampStr(input.title, 140) || 'Study Note',
      courseName: clampStr(input.courseName, 100),
      content: clampStr(input.content, 5000),
      focusMinutes: clampInt(input.focusMinutes, 0, 1440),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateStudyNoteContent(
  uid: string,
  id: string,
  input: Pick<StudyNote, 'title' | 'courseName' | 'content'>
): Promise<void> {
  const path = `users/${uid}/studyNotes/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/studyNotes`, id), {
      title: clampStr(input.title, 140) || 'Study Note',
      courseName: clampStr(input.courseName, 100),
      content: clampStr(input.content, 5000),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Career Skills
export async function createCareerSkill(
  uid: string,
  input: Omit<CareerSkill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('skill');
  const path = `users/${uid}/careerSkills/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/careerSkills`, id), {
      userId: uid,
      name: clampStr(input.name, 80) || 'Skill',
      category: clampStr(input.category, 40) || 'General',
      proficiency: clampInt(input.proficiency, 0, 100),
      targetLevel: clampInt(input.targetLevel, 0, 100),
      notes: clampStr(input.notes, 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateCareerSkillProficiency(
  uid: string,
  id: string,
  proficiency: number
): Promise<void> {
  const path = `users/${uid}/careerSkills/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/careerSkills`, id), {
      proficiency: clampInt(proficiency, 0, 100),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Career Applications
export async function createCareerApplication(
  uid: string,
  input: Omit<CareerApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('app');
  const path = `users/${uid}/careerApps/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/careerApps`, id), {
      userId: uid,
      company: clampStr(input.company, 100) || 'Company',
      role: clampStr(input.role, 120) || 'Role',
      appType: input.appType,
      status: input.status,
      deadline: normalizeDateKey(input.deadline),
      resumeVersion: clampStr(input.resumeVersion, 60),
      notes: clampStr(input.notes, 800),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateCareerApplicationStatus(
  uid: string,
  id: string,
  status: CareerApplication['status']
): Promise<void> {
  const path = `users/${uid}/careerApps/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/careerApps`, id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Career Prep
export async function createCareerPrepItem(
  uid: string,
  input: Omit<CareerPrepItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('prep');
  const path = `users/${uid}/careerPrep/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/careerPrep`, id), {
      userId: uid,
      title: clampStr(input.title, 140) || 'Prep Question',
      category: input.category,
      answerNotes: clampStr(input.answerNotes, 2000),
      completed: Boolean(input.completed),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function toggleCareerPrepItem(
  uid: string,
  id: string,
  completed: boolean
): Promise<void> {
  const path = `users/${uid}/careerPrep/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/careerPrep`, id), {
      completed,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateCareerPrepNotes(
  uid: string,
  id: string,
  input: Pick<CareerPrepItem, 'title' | 'category' | 'answerNotes'>
): Promise<void> {
  const path = `users/${uid}/careerPrep/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/careerPrep`, id), {
      title: clampStr(input.title, 140) || 'Prep Question',
      category: input.category,
      answerNotes: clampStr(input.answerNotes, 2000),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Daily Tasks
export async function createDailyTask(
  uid: string,
  input: Omit<DailyTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('dtask');
  const path = `users/${uid}/dailyTasks/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/dailyTasks`, id), {
      userId: uid,
      title: clampStr(input.title, 160) || 'New Task',
      dueDate: normalizeDateKey(input.dueDate),
      dueTime: clampStr(input.dueTime, 10) || '09:00',
      category: clampStr(input.category, 40) || 'Personal',
      priority: input.priority,
      completed: Boolean(input.completed),
      reminderEnabled: Boolean(input.reminderEnabled),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function toggleDailyTask(uid: string, id: string, completed: boolean): Promise<void> {
  const path = `users/${uid}/dailyTasks/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/dailyTasks`, id), {
      completed,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Habits
export async function createHabit(
  uid: string,
  input: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('habit');
  const path = `users/${uid}/habits/${id}`;
  const dates = (input.completedDates || []).map(normalizeDateKey).slice(0, 90);
  try {
    await setDoc(doc(db, `users/${uid}/habits`, id), {
      userId: uid,
      title: clampStr(input.title, 100) || 'Daily Habit',
      frequency: input.frequency,
      targetPerWeek: clampInt(input.targetPerWeek, 1, 7),
      completedDates: dates,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateHabitDates(
  uid: string,
  id: string,
  completedDates: string[]
): Promise<void> {
  const path = `users/${uid}/habits/${id}`;
  const sanitized = Array.from(new Set(completedDates.map(normalizeDateKey))).slice(-90);
  try {
    await updateDoc(doc(db, `users/${uid}/habits`, id), {
      completedDates: sanitized,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Health Logs
export async function upsertHealthLog(
  uid: string,
  existingId: string | null,
  input: Omit<HealthLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const dateKey = normalizeDateKey(input.dateKey);
  const id = existingId || `health_${dateKey}`;
  const path = `users/${uid}/healthLogs/${id}`;
  const checklist = (input.selfCareChecklist || [])
    .map((s) => clampStr(s, 60))
    .filter(Boolean)
    .slice(0, 10);

  if (existingId) {
    try {
      await updateDoc(doc(db, `users/${uid}/healthLogs`, id), {
        sleepHours: clampNum(input.sleepHours, 0, 24),
        waterMl: clampInt(input.waterMl, 0, 12000),
        workoutMinutes: clampInt(input.workoutMinutes, 0, 600),
        workoutType: clampStr(input.workoutType, 60),
        nutritionNote: clampStr(input.nutritionNote, 400),
        calories: clampInt(input.calories, 0, 15000),
        selfCareChecklist: checklist,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  } else {
    try {
      await setDoc(doc(db, `users/${uid}/healthLogs`, id), {
        userId: uid,
        dateKey,
        sleepHours: clampNum(input.sleepHours, 0, 24),
        waterMl: clampInt(input.waterMl, 0, 12000),
        workoutMinutes: clampInt(input.workoutMinutes, 0, 600),
        workoutType: clampStr(input.workoutType, 60),
        nutritionNote: clampStr(input.nutritionNote, 400),
        calories: clampInt(input.calories, 0, 15000),
        selfCareChecklist: checklist,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }
}

// Finance
export async function createFinanceTransaction(
  uid: string,
  input: Omit<FinanceTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('tx');
  const path = `users/${uid}/financeTx/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/financeTx`, id), {
      userId: uid,
      title: clampStr(input.title, 120) || 'Transaction',
      amount: clampNum(input.amount, 0, 100000000),
      txType: input.txType,
      category: clampStr(input.category, 40) || 'General',
      dateKey: normalizeDateKey(input.dateKey),
      notes: clampStr(input.notes, 300),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function createFinanceGoal(
  uid: string,
  input: Omit<FinanceGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('fgoal');
  const path = `users/${uid}/financeGoals/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/financeGoals`, id), {
      userId: uid,
      title: clampStr(input.title, 100) || 'Savings Goal',
      goalType: input.goalType,
      targetAmount: clampNum(input.targetAmount, 0, 100000000),
      currentAmount: clampNum(input.currentAmount, 0, 100000000),
      category: clampStr(input.category, 40) || 'Savings',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateFinanceGoalAmount(
  uid: string,
  id: string,
  currentAmount: number
): Promise<void> {
  const path = `users/${uid}/financeGoals/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/financeGoals`, id), {
      currentAmount: clampNum(currentAmount, 0, 100000000),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Personal Growth Goals
export async function createGrowthGoal(
  uid: string,
  input: Omit<GrowthGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('ggoal');
  const path = `users/${uid}/growthGoals/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/growthGoals`, id), {
      userId: uid,
      title: clampStr(input.title, 140) || 'Personal Goal',
      category: clampStr(input.category, 40) || 'Personal',
      targetDate: normalizeDateKey(input.targetDate),
      progress: clampInt(input.progress, 0, 100),
      visionQuote: clampStr(input.visionQuote, 300),
      milestoneNote: clampStr(input.milestoneNote, 500),
      isAchievement: Boolean(input.isAchievement || input.progress >= 100),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateGrowthGoalProgress(
  uid: string,
  id: string,
  progress: number
): Promise<void> {
  const path = `users/${uid}/growthGoals/${id}`;
  const clamped = clampInt(progress, 0, 100);
  try {
    await updateDoc(doc(db, `users/${uid}/growthGoals`, id), {
      progress: clamped,
      isAchievement: clamped >= 100,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Opportunities
export async function createOpportunity(
  uid: string,
  input: Omit<Opportunity, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('opp');
  const path = `users/${uid}/opportunities/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/opportunities`, id), {
      userId: uid,
      title: clampStr(input.title, 140) || 'Opportunity',
      organization: clampStr(input.organization, 100) || 'Organization',
      oppType: input.oppType,
      deadline: normalizeDateKey(input.deadline),
      linkUrl: clampStr(input.linkUrl, 300),
      status: input.status,
      notes: clampStr(input.notes, 600),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateOpportunityStatus(
  uid: string,
  id: string,
  status: Opportunity['status']
): Promise<void> {
  const path = `users/${uid}/opportunities/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/opportunities`, id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Weekly Reset
export async function createWeeklyReset(
  uid: string,
  input: Omit<WeeklyReset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('wreset');
  const path = `users/${uid}/weeklyResets/${id}`;
  const priorities = (input.nextWeekPriorities || [])
    .map((p) => clampStr(p, 160))
    .filter(Boolean)
    .slice(0, 6);

  try {
    await setDoc(doc(db, `users/${uid}/weeklyResets`, id), {
      userId: uid,
      weekLabel: clampStr(input.weekLabel, 60) || 'Weekly Review',
      wins: clampStr(input.wins, 1500),
      challenges: clampStr(input.challenges, 1500),
      focusTheme: clampStr(input.focusTheme, 120),
      nextWeekPriorities: priorities,
      wellnessRating: clampInt(input.wellnessRating, 1, 5),
      productivityRating: clampInt(input.productivityRating, 1, 5),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Calendar Events
export async function createCalendarEvent(
  uid: string,
  input: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('cal');
  const path = `users/${uid}/calendarEvents/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/calendarEvents`, id), {
      userId: uid,
      title: clampStr(input.title, 140) || 'Scheduled Block',
      dateKey: normalizeDateKey(input.dateKey),
      startTime: clampStr(input.startTime, 10) || '10:00',
      endTime: clampStr(input.endTime, 10) || '11:00',
      moduleCategory: clampStr(input.moduleCategory, 40) || 'Personal',
      notes: clampStr(input.notes, 400),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Notifications
export async function createNotification(
  uid: string,
  input: Omit<AppNotification, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('notif');
  const path = `users/${uid}/notifications/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/notifications`, id), {
      userId: uid,
      title: clampStr(input.title, 120) || 'Notification',
      message: clampStr(input.message, 320) || 'New update in your workspace.',
      module: clampStr(input.module, 40) || 'dashboard',
      read: Boolean(input.read),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(uid: string, id: string, read: boolean): Promise<void> {
  const path = `users/${uid}/notifications/${id}`;
  try {
    await updateDoc(doc(db, `users/${uid}/notifications`, id), {
      read,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// AI Insights
export async function saveAiInsight(
  uid: string,
  input: Omit<AiInsight, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const id = generateDocId('ai');
  const path = `users/${uid}/aiInsights/${id}`;
  try {
    await setDoc(doc(db, `users/${uid}/aiInsights`, id), {
      userId: uid,
      category: input.category,
      prompt: clampStr(input.prompt, 1000) || 'Growth question',
      response: clampStr(input.response, 8000) || 'Guidance',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}
