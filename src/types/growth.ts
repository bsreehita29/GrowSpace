import type { Timestamp } from 'firebase/firestore';

export type ModuleId =
  | 'dashboard'
  | 'calendar'
  | 'notifications'
  | 'mental_wellness'
  | 'study'
  | 'career'
  | 'daily_life'
  | 'health'
  | 'finance'
  | 'personal_growth'
  | 'opportunities'
  | 'ai_assistant'
  | 'weekly_reset'
  | 'profile';

export const DATE_KEY_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const VALID_ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;

export function getTodayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getOffsetDateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return getTodayDateKey(d);
}

export function normalizeDateKey(input: string): string {
  const trimmed = (input || '').trim();
  if (DATE_KEY_PATTERN.test(trimmed)) return trimmed;
  return getTodayDateKey();
}

export function clampStr(val: string | undefined | null, maxLen: number): string {
  return (val ?? '').trim().slice(0, maxLen);
}

export function clampInt(val: number, min: number, max: number): number {
  const n = Math.round(Number.isFinite(val) ? val : min);
  return Math.max(min, Math.min(max, n));
}

export function clampNum(val: number, min: number, max: number): number {
  const n = Number.isFinite(val) ? val : min;
  return Math.max(min, Math.min(max, n));
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  roleTitle: string;
  bio: string;
  dailyWaterGoalMl: number;
  dailySleepGoalHours: number;
  monthlyBudgetLimit: number;
  dailyFocusGoalMinutes: number;
  currencySymbol: string;
  seededStarterData: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface MoodEntry {
  id: string;
  userId: string;
  dateKey: string;
  moodScore: number;
  stressLevel: number;
  emotionLabel: string;
  meditationMinutes: number;
  journalText: string;
  gratitudeNote: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface StudyCourse {
  id: string;
  userId: string;
  courseName: string;
  courseCode: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
  attendedClasses: number;
  totalClasses: number;
  targetAttendance: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface StudyTask {
  id: string;
  userId: string;
  title: string;
  courseName: string;
  taskType: 'assignment' | 'exam' | 'revision';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface StudyNote {
  id: string;
  userId: string;
  title: string;
  courseName: string;
  content: string;
  focusMinutes: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CareerSkill {
  id: string;
  userId: string;
  name: string;
  category: string;
  proficiency: number;
  targetLevel: number;
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CareerApplication {
  id: string;
  userId: string;
  company: string;
  role: string;
  appType: 'internship' | 'full_time' | 'part_time' | 'research';
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  deadline: string;
  resumeVersion: string;
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CareerPrepItem {
  id: string;
  userId: string;
  title: string;
  category: 'resume' | 'behavioral' | 'technical';
  answerNotes: string;
  completed: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface DailyTask {
  id: string;
  userId: string;
  title: string;
  dueDate: string;
  dueTime: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  reminderEnabled: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: 'daily' | 'weekdays' | 'weekly';
  targetPerWeek: number;
  completedDates: string[];
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface HealthLog {
  id: string;
  userId: string;
  dateKey: string;
  sleepHours: number;
  waterMl: number;
  workoutMinutes: number;
  workoutType: string;
  nutritionNote: string;
  calories: number;
  selfCareChecklist: string[];
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface FinanceTransaction {
  id: string;
  userId: string;
  title: string;
  amount: number;
  txType: 'expense' | 'income' | 'savings';
  category: string;
  dateKey: string;
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface FinanceGoal {
  id: string;
  userId: string;
  title: string;
  goalType: 'budget' | 'savings';
  targetAmount: number;
  currentAmount: number;
  category: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface GrowthGoal {
  id: string;
  userId: string;
  title: string;
  category: string;
  targetDate: string;
  progress: number;
  visionQuote: string;
  milestoneNote: string;
  isAchievement: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Opportunity {
  id: string;
  userId: string;
  title: string;
  organization: string;
  oppType: 'internship' | 'scholarship' | 'hackathon' | 'course';
  deadline: string;
  linkUrl: string;
  status: 'exploring' | 'shortlisted' | 'applied' | 'enrolled';
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface WeeklyReset {
  id: string;
  userId: string;
  weekLabel: string;
  wins: string;
  challenges: string;
  focusTheme: string;
  nextWeekPriorities: string[];
  wellnessRating: number;
  productivityRating: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  dateKey: string;
  startTime: string;
  endTime: string;
  moduleCategory: string;
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  module: string;
  read: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AiInsight {
  id: string;
  userId: string;
  category: 'schedule' | 'study' | 'career' | 'wellness' | 'weekly';
  prompt: string;
  response: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface UnifiedCalendarItem {
  id: string;
  title: string;
  dateKey: string;
  timeLabel: string;
  sourceModule: ModuleId;
  categoryLabel: string;
  statusLabel: string;
  isCustomEvent?: boolean;
}
