import { useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Droplets,
  Sparkles,
  Timer,
} from 'lucide-react';
import { LifeBalanceRadar, type PillarScore } from '../charts/GrowthCharts';
import { toggleDailyTask, upsertHealthLog } from '../../services/firestoreService';
import type {
  AiInsight,
  CareerApplication,
  DailyTask,
  FinanceTransaction,
  GrowthGoal,
  Habit,
  HealthLog,
  ModuleId,
  MoodEntry,
  StudyCourse,
  StudyNote,
  StudyTask,
  UnifiedCalendarItem,
  UserProfile,
} from '../../types/growth';

interface DashboardViewProps {
  uid: string;
  todayKey: string;
  profile: UserProfile | null;
  moods: MoodEntry[];
  studyCourses: StudyCourse[];
  studyTasks: StudyTask[];
  studyNotes: StudyNote[];
  careerApps: CareerApplication[];
  dailyTasks: DailyTask[];
  habits: Habit[];
  todayHealthLog: HealthLog | null;
  financeTx: FinanceTransaction[];
  growthGoals: GrowthGoal[];
  aiInsights: AiInsight[];
  unifiedCalendarItems: UnifiedCalendarItem[];
  onNavigate: (module: ModuleId) => void;
}

export function DashboardView({
  uid,
  todayKey,
  profile,
  moods,
  studyCourses,
  studyTasks,
  studyNotes,
  careerApps,
  dailyTasks,
  habits,
  todayHealthLog,
  financeTx,
  growthGoals,
  aiInsights,
  unifiedCalendarItems,
  onNavigate,
}: DashboardViewProps) {
  const [waterSaving, setWaterSaving] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = (profile?.displayName || 'Friend').split(' ')[0];

  const openTasksCount = dailyTasks.filter((t) => !t.completed).length;
  const focusMinutesTotal = studyNotes.reduce((sum, n) => sum + n.focusMinutes, 0);
  const waterCurrent = todayHealthLog?.waterMl ?? 0;
  const waterGoal = profile?.dailyWaterGoalMl ?? 2500;
  const currency = profile?.currencySymbol || '$';

  const currentMonth = todayKey.slice(0, 7);
  const monthSpent = financeTx
    .filter((t) => t.txType === 'expense' && t.dateKey.slice(0, 7) === currentMonth)
    .reduce((sum, t) => sum + t.amount, 0);
  const budgetLimit = profile?.monthlyBudgetLimit ?? 1200;
  const budgetLeft = Math.max(0, budgetLimit - monthSpent);

  const latestMood = [...moods].sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];

  // Compute live pillar balance scores (0-100) from real user data
  const habitTodayDone = habits.filter((h) => h.completedDates.includes(todayKey)).length;
  const habitScore = habits.length > 0 ? Math.round((habitTodayDone / habits.length) * 100) : 40;

  const avgAttendance =
    studyCourses.length > 0
      ? Math.round(
          studyCourses.reduce(
            (s, c) => s + (c.totalClasses > 0 ? (c.attendedClasses / c.totalClasses) * 100 : 80),
            0
          ) / studyCourses.length
        )
      : 50;

  const moodScorePct = latestMood ? Math.round((latestMood.moodScore / 5) * 100) : 60;
  const healthScorePct = todayHealthLog
    ? Math.min(
        100,
        Math.round(
          ((todayHealthLog.waterMl / Math.max(1, waterGoal)) * 50 +
            (todayHealthLog.sleepHours / Math.max(1, profile?.dailySleepGoalHours ?? 8)) * 50)
        )
      )
    : 45;
  const careerScorePct = Math.min(100, 40 + careerApps.length * 15);
  const financeScorePct =
    budgetLimit > 0 ? Math.max(15, Math.min(100, Math.round((budgetLeft / budgetLimit) * 100))) : 70;

  const pillars: PillarScore[] = [
    { label: 'Wellness', score: moodScorePct },
    { label: 'Study', score: Math.min(100, avgAttendance) },
    { label: 'Career', score: careerScorePct },
    { label: 'Habits', score: habitScore },
    { label: 'Health', score: healthScorePct },
    { label: 'Finance', score: financeScorePct },
  ];

  const todayAgenda = dailyTasks
    .filter((t) => t.dueDate === todayKey || !t.completed)
    .slice(0, 5);

  const upcomingDeadlines = unifiedCalendarItems
    .filter((i) => i.dateKey >= todayKey)
    .slice(0, 5);

  const latestAi = [...aiInsights].sort((a, b) =>
    (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
  )[0];

  async function handleQuickAddWater(ml: number) {
    setWaterSaving(true);
    try {
      await upsertHealthLog(uid, todayHealthLog?.id ?? null, {
        dateKey: todayKey,
        sleepHours: todayHealthLog?.sleepHours ?? 7.5,
        waterMl: (todayHealthLog?.waterMl ?? 0) + ml,
        workoutMinutes: todayHealthLog?.workoutMinutes ?? 0,
        workoutType: todayHealthLog?.workoutType ?? 'Walk',
        nutritionNote: todayHealthLog?.nutritionNote ?? '',
        calories: todayHealthLog?.calories ?? 0,
        selfCareChecklist: todayHealthLog?.selfCareChecklist ?? [],
      });
    } finally {
      setWaterSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Calm Welcome Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white border border-[#E4E7DF] rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#5A685C]">
              {todayKey} · {profile?.roleTitle || 'Personal Growth Workspace'}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#1F2A22] tracking-tight [text-wrap:balance]">
              {greeting}, {firstName}.
            </h2>
            <p className="text-sm text-[#5A685C] max-w-2xl leading-relaxed">
              You have{' '}
              <span className="font-semibold text-[#1F2A22] tabular-nums">{openTasksCount}</span> open
              daily tasks,{' '}
              <span className="font-semibold text-[#1F2A22] tabular-nums">
                {studyTasks.filter((s) => s.status !== 'completed').length}
              </span>{' '}
              upcoming study milestones, and{' '}
              <span className="font-semibold text-[#1F2A22] tabular-nums">
                {growthGoals.filter((g) => !g.isAchievement).length}
              </span>{' '}
              active growth goals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('ai_assistant')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3E6B4F] text-white text-xs font-medium rounded-lg hover:bg-[#335A42] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plan Day with AI</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('weekly_reset')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF3EC] text-[#2C523B] text-xs font-medium rounded-lg hover:bg-[#E1EAE0] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Open Weekly Reset</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddWater(250)}
              disabled={waterSaving}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#E4E7DF] text-[#2F3E33] text-xs font-medium rounded-lg hover:bg-[#FAF8F3] transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Droplets className="w-3.5 h-3.5 text-[#5A8D9A]" />
              <span>+250ml Water</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-xl overflow-hidden border border-[#E4E7DF] bg-[#EEF3EC] min-h-[190px] relative">
          <img
            src="/src/assets/images/hero_botanical_sanctuary_1794844759781.jpg"
            alt="Botanical study sanctuary"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#1F2A22]/80 via-[#1F2A22]/40 to-transparent text-white">
            <p className="text-[11px] text-[#DCE8DC]">Current Focus</p>
            <p className="text-sm font-medium truncate">
              {growthGoals[0]?.title || 'Steady daily progress across all pillars'}
            </p>
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('health')}
          className="text-left bg-white border border-[#E4E7DF] rounded-xl p-5 hover:border-[#C7D2C5] transition-colors cursor-pointer"
        >
          <p className="text-xs text-[#5A685C]">Hydration Today</p>
          <p className="mt-2 text-2xl font-semibold text-[#1F2A22] font-mono tabular-nums">
            {waterCurrent} <span className="text-sm font-normal text-[#859286]">/ {waterGoal} ml</span>
          </p>
          <div className="mt-3 h-1.5 bg-[#EEF1EA] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7CA6B2] rounded-full"
              style={{ width: `${Math.min(100, Math.round((waterCurrent / Math.max(1, waterGoal)) * 100))}%` }}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('study')}
          className="text-left bg-white border border-[#E4E7DF] rounded-xl p-5 hover:border-[#C7D2C5] transition-colors cursor-pointer"
        >
          <p className="text-xs text-[#5A685C]">Logged Focus Time</p>
          <p className="mt-2 text-2xl font-semibold text-[#1F2A22] font-mono tabular-nums">
            {focusMinutesTotal} <span className="text-sm font-normal text-[#859286]">mins</span>
          </p>
          <p className="mt-2 text-xs text-[#5A685C]">
            {studyCourses.length} courses · Avg attendance {avgAttendance}%
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('finance')}
          className="text-left bg-white border border-[#E4E7DF] rounded-xl p-5 hover:border-[#C7D2C5] transition-colors cursor-pointer"
        >
          <p className="text-xs text-[#5A685C]">Monthly Budget Left</p>
          <p className="mt-2 text-2xl font-semibold text-[#1F2A22] font-mono tabular-nums">
            {currency}
            {budgetLeft.toFixed(0)}{' '}
            <span className="text-sm font-normal text-[#859286]">/ {currency}{budgetLimit}</span>
          </p>
          <p className="mt-2 text-xs text-[#5A685C]">
            {currency}{monthSpent.toFixed(0)} spent this month
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('mental_wellness')}
          className="text-left bg-white border border-[#E4E7DF] rounded-xl p-5 hover:border-[#C7D2C5] transition-colors cursor-pointer"
        >
          <p className="text-xs text-[#5A685C]">Latest Mood Check-In</p>
          <p className="mt-2 text-2xl font-semibold text-[#1F2A22] font-mono tabular-nums">
            {latestMood ? `${latestMood.moodScore}/5` : '—'}{' '}
            <span className="text-sm font-sans font-normal text-[#5A685C]">
              {latestMood?.emotionLabel || 'No log yet'}
            </span>
          </p>
          <p className="mt-2 text-xs text-[#5A685C]">
            {latestMood ? `${latestMood.meditationMinutes}m mindfulness logged` : 'Tap to record mood'}
          </p>
        </button>
      </section>

      {/* Main Workspace Grid: Life Balance + Today's Agenda */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#1F2A22]">Life Balance Analytics</h3>
              <p className="text-xs text-[#5A685C]">Live synthesis across your six core growth domains</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="text-xs font-medium text-[#3E6B4F] hover:underline cursor-pointer"
            >
              Full Report
            </button>
          </div>
          <LifeBalanceRadar pillars={pillars} />
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#1F2A22]">Today&apos;s Priority Tasks</h3>
              <p className="text-xs text-[#5A685C]">Click to check off items directly</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('daily_life')}
              className="text-xs font-medium text-[#3E6B4F] hover:underline cursor-pointer"
            >
              Manage All
            </button>
          </div>

          {todayAgenda.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm text-[#5A685C]">Your task list is clear for today.</p>
              <button
                type="button"
                onClick={() => onNavigate('daily_life')}
                className="text-xs font-medium text-[#3E6B4F] hover:underline cursor-pointer"
              >
                Add a daily task
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#EEF1EA]">
              {todayAgenda.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDailyTask(uid, task.id, !task.completed)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#3E6B4F] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#9AA89B] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-sm truncate ${
                          task.completed ? 'line-through text-[#859286]' : 'text-[#1F2A22]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-[#859286]">
                        {task.category} · {task.dueTime} · {task.priority} priority
                      </p>
                    </div>
                  </button>
                  <span className="text-xs font-mono tabular-nums text-[#859286] shrink-0">
                    {task.dueDate.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Row: Unified Upcoming Calendar + Latest AI Guidance */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#3E6B4F]" />
              <h3 className="text-base font-semibold text-[#1F2A22]">Upcoming Unified Timeline</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="text-xs font-medium text-[#3E6B4F] hover:underline cursor-pointer"
            >
              Open Calendar
            </button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-[#859286] py-6">No upcoming dated milestones yet.</p>
          ) : (
            <div className="divide-y divide-[#EEF1EA]">
              {upcomingDeadlines.map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#1F2A22] truncate">{item.title}</p>
                    <p className="text-xs text-[#5A685C]">
                      {item.categoryLabel} · {item.timeLabel} · {item.statusLabel}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-[#3E6B4F] shrink-0">
                    {item.dateKey}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-[#EEF3EC] border border-[#DCE5DA] rounded-xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#2C523B]">
              <Timer className="w-4 h-4" />
              <span>AI Growth Coach</span>
            </div>
            <h3 className="text-base font-semibold text-[#1F2A22]">
              {latestAi ? latestAi.prompt : 'Personalized Guidance Ready'}
            </h3>
            <p className="text-xs text-[#435447] leading-relaxed line-clamp-5 whitespace-pre-line">
              {latestAi
                ? latestAi.response
                : 'Ask your GROW SPACE assistant for a balanced daily schedule, exam prep plan, career resume feedback, or stress reset tailored to your live logs.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('ai_assistant')}
            className="self-start px-4 py-2 bg-[#3E6B4F] text-white text-xs font-medium rounded-lg hover:bg-[#335A42] transition-colors cursor-pointer"
          >
            {latestAi ? 'Ask Follow-up' : 'Open AI Assistant'}
          </button>
        </div>
      </section>
    </div>
  );
}
