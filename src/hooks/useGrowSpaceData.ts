import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ensureUserProfileAndSeed } from '../services/firestoreService';
import {
  getTodayDateKey,
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
  type UnifiedCalendarItem,
  type UserProfile,
  type WeeklyReset,
} from '../types/growth';

export interface SmartAlert {
  id: string;
  title: string;
  message: string;
  module: 'study' | 'daily_life' | 'finance' | 'health' | 'career';
  severity: 'info' | 'warning';
}

export function useGrowSpaceData() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [studyCourses, setStudyCourses] = useState<StudyCourse[]>([]);
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([]);
  const [studyNotes, setStudyNotes] = useState<StudyNote[]>([]);
  const [careerSkills, setCareerSkills] = useState<CareerSkill[]>([]);
  const [careerApps, setCareerApps] = useState<CareerApplication[]>([]);
  const [careerPrep, setCareerPrep] = useState<CareerPrepItem[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [financeTx, setFinanceTx] = useState<FinanceTransaction[]>([]);
  const [financeGoals, setFinanceGoals] = useState<FinanceGoal[]>([]);
  const [growthGoals, setGrowthGoals] = useState<GrowthGoal[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [weeklyResets, setWeeklyResets] = useState<WeeklyReset[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        setDataLoading(true);
        try {
          await ensureUserProfileAndSeed(firebaseUser);
        } catch (err) {
          console.error('Failed ensuring profile:', err);
        }
      } else {
        setProfile(null);
        setDataLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    const uid = user.uid;
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) {
            setProfile({ id: snap.id, ...(snap.data() as Omit<UserProfile, 'id'>) });
          }
          setDataLoading(false);
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
      )
    );

    const bindList = <T extends { id: string }>(
      subcol: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      const path = `users/${uid}/${subcol}`;
      const q = query(collection(db, path), where('userId', '==', uid));
      unsubs.push(
        onSnapshot(
          q,
          (snap) => {
            const list = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<T, 'id'>),
            })) as T[];
            setter(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, path)
        )
      );
    };

    bindList<MoodEntry>('moods', setMoods);
    bindList<StudyCourse>('studyCourses', setStudyCourses);
    bindList<StudyTask>('studyTasks', setStudyTasks);
    bindList<StudyNote>('studyNotes', setStudyNotes);
    bindList<CareerSkill>('careerSkills', setCareerSkills);
    bindList<CareerApplication>('careerApps', setCareerApps);
    bindList<CareerPrepItem>('careerPrep', setCareerPrep);
    bindList<DailyTask>('dailyTasks', setDailyTasks);
    bindList<Habit>('habits', setHabits);
    bindList<HealthLog>('healthLogs', setHealthLogs);
    bindList<FinanceTransaction>('financeTx', setFinanceTx);
    bindList<FinanceGoal>('financeGoals', setFinanceGoals);
    bindList<GrowthGoal>('growthGoals', setGrowthGoals);
    bindList<Opportunity>('opportunities', setOpportunities);
    bindList<WeeklyReset>('weeklyResets', setWeeklyResets);
    bindList<CalendarEvent>('calendarEvents', setCalendarEvents);
    bindList<AppNotification>('notifications', setNotifications);
    bindList<AiInsight>('aiInsights', setAiInsights);

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, user]);

  const todayKey = getTodayDateKey();

  const todayHealthLog = useMemo(
    () => healthLogs.find((h) => h.dateKey === todayKey) || null,
    [healthLogs, todayKey]
  );

  const unifiedCalendarItems = useMemo<UnifiedCalendarItem[]>(() => {
    const items: UnifiedCalendarItem[] = [];

    for (const ev of calendarEvents) {
      items.push({
        id: ev.id,
        title: ev.title,
        dateKey: ev.dateKey,
        timeLabel: `${ev.startTime} - ${ev.endTime}`,
        sourceModule: 'calendar',
        categoryLabel: ev.moduleCategory,
        statusLabel: 'Scheduled',
        isCustomEvent: true,
      });
    }

    for (const st of studyTasks) {
      items.push({
        id: `st_${st.id}`,
        title: st.title,
        dateKey: st.dueDate,
        timeLabel: st.courseName || 'Study',
        sourceModule: 'study',
        categoryLabel: st.taskType === 'exam' ? 'Exam' : st.taskType === 'assignment' ? 'Assignment' : 'Revision',
        statusLabel: st.status.replace('_', ' '),
      });
    }

    for (const dt of dailyTasks) {
      items.push({
        id: `dt_${dt.id}`,
        title: dt.title,
        dateKey: dt.dueDate,
        timeLabel: dt.dueTime || 'All day',
        sourceModule: 'daily_life',
        categoryLabel: dt.category || 'Task',
        statusLabel: dt.completed ? 'Completed' : 'Open',
      });
    }

    for (const app of careerApps) {
      items.push({
        id: `app_${app.id}`,
        title: `${app.company} — ${app.role}`,
        dateKey: app.deadline,
        timeLabel: 'Deadline',
        sourceModule: 'career',
        categoryLabel: 'Career',
        statusLabel: app.status,
      });
    }

    for (const opp of opportunities) {
      items.push({
        id: `opp_${opp.id}`,
        title: opp.title,
        dateKey: opp.deadline,
        timeLabel: opp.organization,
        sourceModule: 'opportunities',
        categoryLabel: opp.oppType,
        statusLabel: opp.status,
      });
    }

    for (const goal of growthGoals) {
      items.push({
        id: `gg_${goal.id}`,
        title: goal.title,
        dateKey: goal.targetDate,
        timeLabel: `${goal.progress}% complete`,
        sourceModule: 'personal_growth',
        categoryLabel: 'Goal Target',
        statusLabel: goal.isAchievement ? 'Achieved' : 'Active',
      });
    }

    return items.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [calendarEvents, studyTasks, dailyTasks, careerApps, opportunities, growthGoals]);

  const smartAlerts = useMemo<SmartAlert[]>(() => {
    const alerts: SmartAlert[] = [];

    for (const course of studyCourses) {
      if (course.totalClasses > 0) {
        const pct = Math.round((course.attendedClasses / course.totalClasses) * 100);
        if (pct < course.targetAttendance) {
          alerts.push({
            id: `alert_att_${course.id}`,
            title: `Attendance below ${course.targetAttendance}% in ${course.courseCode || course.courseName}`,
            message: `Currently at ${pct}% (${course.attendedClasses}/${course.totalClasses} sessions).`,
            module: 'study',
            severity: 'warning',
          });
        }
      }
    }

    const pendingToday = dailyTasks.filter((t) => !t.completed && t.dueDate <= todayKey && t.reminderEnabled);
    if (pendingToday.length > 0) {
      alerts.push({
        id: 'alert_tasks_today',
        title: `${pendingToday.length} reminder${pendingToday.length > 1 ? 's' : ''} due today`,
        message: pendingToday.slice(0, 2).map((t) => t.title).join(', '),
        module: 'daily_life',
        severity: 'info',
      });
    }

    const waterGoal = profile?.dailyWaterGoalMl ?? 2500;
    const currentWater = todayHealthLog?.waterMl ?? 0;
    if (currentWater < waterGoal * 0.6) {
      alerts.push({
        id: 'alert_water',
        title: 'Hydration check-in',
        message: `${currentWater}ml logged today out of your ${waterGoal}ml daily target.`,
        module: 'health',
        severity: 'info',
      });
    }

    const monthlyExpenses = financeTx
      .filter((t) => t.txType === 'expense' && t.dateKey.slice(0, 7) === todayKey.slice(0, 7))
      .reduce((sum, t) => sum + t.amount, 0);
    const budgetLimit = profile?.monthlyBudgetLimit ?? 1200;
    if (budgetLimit > 0 && monthlyExpenses > budgetLimit * 0.85) {
      alerts.push({
        id: 'alert_budget',
        title: 'Monthly budget threshold',
        message: `You have spent ${profile?.currencySymbol || '$'}${monthlyExpenses.toFixed(0)} of your ${profile?.currencySymbol || '$'}${budgetLimit} limit.`,
        module: 'finance',
        severity: 'warning',
      });
    }

    return alerts;
  }, [studyCourses, dailyTasks, todayKey, profile, todayHealthLog, financeTx]);

  const contextSummary = useMemo(() => {
    const openTasks = dailyTasks.filter((t) => !t.completed).slice(0, 6).map((t) => `${t.title} (${t.dueDate})`);
    const upcomingStudy = studyTasks.filter((s) => s.status !== 'completed').slice(0, 5).map((s) => `${s.title} [${s.taskType}] due ${s.dueDate}`);
    const latestMood = [...moods].sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
    const activeApps = careerApps.slice(0, 4).map((a) => `${a.company} - ${a.role} (${a.status})`);
    const topSkills = careerSkills.slice(0, 4).map((s) => `${s.name} ${s.proficiency}%/${s.targetLevel}%`);
    return [
      `Date: ${todayKey}`,
      `User: ${profile?.displayName || 'User'} (${profile?.roleTitle || 'Member'})`,
      `Open Daily Tasks: ${openTasks.join('; ') || 'None'}`,
      `Upcoming Study Items: ${upcomingStudy.join('; ') || 'None'}`,
      `Latest Mood: ${latestMood ? `${latestMood.moodScore}/5 (${latestMood.emotionLabel}), stress ${latestMood.stressLevel}/5` : 'No recent entry'}`,
      `Today Health: ${todayHealthLog ? `${todayHealthLog.sleepHours}h sleep, ${todayHealthLog.waterMl}ml water, ${todayHealthLog.workoutMinutes}m workout` : 'Not logged today'}`,
      `Career Apps: ${activeApps.join('; ') || 'None'}`,
      `Skills: ${topSkills.join('; ') || 'None'}`,
    ].join('\n');
  }, [todayKey, profile, dailyTasks, studyTasks, moods, todayHealthLog, careerApps, careerSkills]);

  return {
    user,
    authReady,
    dataLoading,
    profile,
    moods,
    studyCourses,
    studyTasks,
    studyNotes,
    careerSkills,
    careerApps,
    careerPrep,
    dailyTasks,
    habits,
    healthLogs,
    todayHealthLog,
    financeTx,
    financeGoals,
    growthGoals,
    opportunities,
    weeklyResets,
    calendarEvents,
    notifications,
    aiInsights,
    unifiedCalendarItems,
    smartAlerts,
    contextSummary,
    todayKey,
  };
}
