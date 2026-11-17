import { useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckSquare,
  Compass,
  Heart,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AiAssistantView } from './components/views/AiAssistantView';
import { CalendarView } from './components/views/CalendarView';
import { CareerView } from './components/views/CareerView';
import { DailyLifeView } from './components/views/DailyLifeView';
import { DashboardView } from './components/views/DashboardView';
import { FinanceView } from './components/views/FinanceView';
import { HealthView } from './components/views/HealthView';
import { MentalWellnessView } from './components/views/MentalWellnessView';
import { NotificationsView } from './components/views/NotificationsView';
import { OpportunitiesView } from './components/views/OpportunitiesView';
import { PersonalGrowthView } from './components/views/PersonalGrowthView';
import { ProfileAnalyticsView } from './components/views/ProfileAnalyticsView';
import { StudyView } from './components/views/StudyView';
import { WeeklyResetView } from './components/views/WeeklyResetView';
import { useGrowSpaceData } from './hooks/useGrowSpaceData';
import {
  createDailyTask,
  createFinanceTransaction,
  createMoodEntry,
} from './services/firestoreService';
import type { ModuleId } from './types/growth';

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'calendar', label: 'Calendar', icon: CalendarDays },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Life Pillars',
    items: [
      { id: 'mental_wellness', label: 'Mental Wellness', icon: Heart },
      { id: 'study', label: 'Study', icon: BookOpen },
      { id: 'career', label: 'Career', icon: Briefcase },
      { id: 'daily_life', label: 'Daily Life', icon: CheckSquare },
      { id: 'health', label: 'Health', icon: Activity },
      { id: 'finance', label: 'Finance', icon: Wallet },
      { id: 'personal_growth', label: 'Personal Growth', icon: Target },
      { id: 'opportunities', label: 'Opportunities', icon: Compass },
    ],
  },
  {
    title: 'Reflection & Guidance',
    items: [
      { id: 'ai_assistant', label: 'AI Assistant', icon: Sparkles },
      { id: 'weekly_reset', label: 'Weekly Reset', icon: RefreshCw },
      { id: 'profile', label: 'Profile & Analytics', icon: User },
    ],
  },
];

const MODULE_TITLES: Record<ModuleId, string> = {
  dashboard: 'Unified Dashboard',
  calendar: 'Unified Calendar',
  notifications: 'Notifications',
  mental_wellness: 'Mental Wellness',
  study: 'Study Hub',
  career: 'Career Development',
  daily_life: 'Daily Life & Habits',
  health: 'Health & Self-Care',
  finance: 'Personal Finance',
  personal_growth: 'Personal Growth',
  opportunities: 'Opportunities',
  ai_assistant: 'AI Growth Assistant',
  weekly_reset: 'Weekly Reset',
  profile: 'Profile & Analytics',
};

function GrowSpaceWorkspace() {
  const data = useGrowSpaceData();
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Quick Log Modal
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickKind, setQuickKind] = useState<'task' | 'mood' | 'expense'>('task');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickMoodScore, setQuickMoodScore] = useState(4);
  const [quickSaving, setQuickSaving] = useState(false);

  const uid = data.uid;
  const unreadCount =
    data.notifications.filter((n) => !n.read).length + data.smartAlerts.length;

  function navigateTo(module: ModuleId) {
    setActiveModule(module);
    setMobileNavOpen(false);
  }

  async function handleQuickSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQuickSaving(true);
    try {
      if (quickKind === 'task' && quickTitle.trim()) {
        await createDailyTask(uid, {
          title: quickTitle,
          dueDate: data.todayKey,
          dueTime: '18:00',
          category: 'Personal',
          priority: 'medium',
          completed: false,
          reminderEnabled: true,
        });
      } else if (quickKind === 'mood') {
        await createMoodEntry(uid, {
          dateKey: data.todayKey,
          moodScore: quickMoodScore,
          stressLevel: 2,
          emotionLabel: quickMoodScore >= 4 ? 'Grounded' : 'Reflective',
          meditationMinutes: 5,
          journalText: quickTitle || 'Quick wellness check-in.',
          gratitudeNote: '',
        });
      } else if (quickKind === 'expense' && quickTitle.trim()) {
        const amt = parseFloat(quickAmount);
        if (Number.isFinite(amt) && amt > 0) {
          await createFinanceTransaction(uid, {
            title: quickTitle,
            amount: amt,
            txType: 'expense',
            category: 'General',
            dateKey: data.todayKey,
            notes: '',
          });
        }
      }
      setQuickTitle('');
      setQuickAmount('');
      setQuickOpen(false);
    } finally {
      setQuickSaving(false);
    }
  }

  const SidebarContent = (
    <div className="h-full flex flex-col justify-between p-5 bg-[#F4F2EC] border-r border-[#E4E7DF]">
      <div className="space-y-6 overflow-y-auto pr-1">
        <div className="px-2 pt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="font-display text-xl font-semibold tracking-tight text-[#1F2A22] whitespace-nowrap cursor-pointer"
          >
            GROW SPACE
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1 text-[#5A685C]"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-2.5 text-[11px] font-medium text-[#7B877C]">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#E3ECE2] text-[#224530]'
                          : 'text-[#435447] hover:bg-[#EAE7DF] hover:text-[#1F2A22]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.id === 'notifications' && unreadCount > 0 && (
                        <span className="font-mono tabular-nums text-[11px] text-[#3E6B4F]">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#E4E7DF]">
        <button
          type="button"
          onClick={() => navigateTo('profile')}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#EAE7DF] text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#3E6B4F] text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {(data.profile?.displayName || 'G').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#1F2A22] truncate">
              {data.profile?.displayName || 'Grower'}
            </p>
            <p className="text-[11px] text-[#5A685C] truncate">
              {data.profile?.roleTitle || 'Personal Sanctuary'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1F2A22] flex">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-68 max-w-[82vw] h-full">{SidebarContent}</div>
          <button
            type="button"
            aria-label="Close drawer backdrop"
            onClick={() => setMobileNavOpen(false)}
            className="flex-1 bg-black/30"
          />
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean 3-Zone Top Header */}
        <header className="sticky top-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-xs border-b border-[#E4E7DF] px-4 sm:px-8 py-4 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#E4E7DF] bg-white text-[#1F2A22]"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-[#859286] whitespace-nowrap">GROW SPACE</span>
              <span className="hidden sm:inline text-[#C6CEC5]">/</span>
              <h1 className="font-display text-lg font-semibold text-[#1F2A22] truncate">
                {MODULE_TITLES[activeModule]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('notifications')}
              aria-label="View notifications"
              className="relative p-2 bg-white border border-[#E4E7DF] rounded-lg text-[#435447] hover:bg-[#EEF3EC] transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="ml-1 text-[11px] font-mono tabular-nums text-[#3E6B4F] font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3E6B4F] text-white text-xs font-medium rounded-lg hover:bg-[#335A42] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Log</span>
            </button>
          </div>
        </header>

        {/* Active Module Viewport */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-8 py-8">
          {data.dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-xl bg-white border border-[#E4E7DF] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {activeModule === 'dashboard' && (
                <DashboardView
                  uid={uid}
                  todayKey={data.todayKey}
                  profile={data.profile}
                  moods={data.moods}
                  studyCourses={data.studyCourses}
                  studyTasks={data.studyTasks}
                  studyNotes={data.studyNotes}
                  careerApps={data.careerApps}
                  dailyTasks={data.dailyTasks}
                  habits={data.habits}
                  todayHealthLog={data.todayHealthLog}
                  financeTx={data.financeTx}
                  growthGoals={data.growthGoals}
                  aiInsights={data.aiInsights}
                  unifiedCalendarItems={data.unifiedCalendarItems}
                  onNavigate={navigateTo}
                />
              )}
              {activeModule === 'mental_wellness' && (
                <MentalWellnessView uid={uid} todayKey={data.todayKey} moods={data.moods} />
              )}
              {activeModule === 'study' && (
                <StudyView
                  uid={uid}
                  todayKey={data.todayKey}
                  courses={data.studyCourses}
                  tasks={data.studyTasks}
                  notes={data.studyNotes}
                />
              )}
              {activeModule === 'career' && (
                <CareerView
                  uid={uid}
                  todayKey={data.todayKey}
                  skills={data.careerSkills}
                  applications={data.careerApps}
                  prepItems={data.careerPrep}
                />
              )}
              {activeModule === 'daily_life' && (
                <DailyLifeView
                  uid={uid}
                  todayKey={data.todayKey}
                  tasks={data.dailyTasks}
                  habits={data.habits}
                />
              )}
              {activeModule === 'health' && (
                <HealthView
                  uid={uid}
                  todayKey={data.todayKey}
                  profile={data.profile}
                  healthLogs={data.healthLogs}
                  todayLog={data.todayHealthLog}
                />
              )}
              {activeModule === 'finance' && (
                <FinanceView
                  uid={uid}
                  todayKey={data.todayKey}
                  profile={data.profile}
                  transactions={data.financeTx}
                  goals={data.financeGoals}
                />
              )}
              {activeModule === 'personal_growth' && (
                <PersonalGrowthView
                  uid={uid}
                  todayKey={data.todayKey}
                  goals={data.growthGoals}
                  habits={data.habits}
                  moods={data.moods}
                  studyNotes={data.studyNotes}
                />
              )}
              {activeModule === 'opportunities' && (
                <OpportunitiesView
                  uid={uid}
                  todayKey={data.todayKey}
                  opportunities={data.opportunities}
                />
              )}
              {activeModule === 'ai_assistant' && (
                <AiAssistantView
                  uid={uid}
                  contextSummary={data.contextSummary}
                  insights={data.aiInsights}
                />
              )}
              {activeModule === 'weekly_reset' && (
                <WeeklyResetView
                  uid={uid}
                  contextSummary={data.contextSummary}
                  resets={data.weeklyResets}
                />
              )}
              {activeModule === 'calendar' && (
                <CalendarView
                  uid={uid}
                  todayKey={data.todayKey}
                  items={data.unifiedCalendarItems}
                  onNavigate={navigateTo}
                />
              )}
              {activeModule === 'notifications' && (
                <NotificationsView
                  uid={uid}
                  notifications={data.notifications}
                  smartAlerts={data.smartAlerts}
                  onNavigate={navigateTo}
                />
              )}
              {activeModule === 'profile' && (
                <ProfileAnalyticsView
                  uid={uid}
                  profile={data.profile}
                  moods={data.moods}
                  studyNotes={data.studyNotes}
                  careerApps={data.careerApps}
                  dailyTasks={data.dailyTasks}
                  habits={data.habits}
                  healthLogs={data.healthLogs}
                  financeTx={data.financeTx}
                  growthGoals={data.growthGoals}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Quick Log Modal */}
      {quickOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[#1F2A22]">Quick Log</h3>
              <button
                type="button"
                onClick={() => setQuickOpen(false)}
                className="p-1 text-[#5A685C] hover:text-[#1F2A22] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-1 p-1 bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg">
              {(['task', 'mood', 'expense'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setQuickKind(k)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize cursor-pointer ${
                    quickKind === k ? 'bg-white text-[#1F2A22] shadow-xs' : 'text-[#5A685C]'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4">
              {quickKind === 'mood' && (
                <div>
                  <label className="block text-xs font-medium text-[#5A685C] mb-1.5">
                    Mood Score ({quickMoodScore}/5)
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuickMoodScore(n)}
                        className={`flex-1 py-1.5 text-xs font-mono rounded-md border cursor-pointer ${
                          quickMoodScore === n
                            ? 'bg-[#3E6B4F] text-white border-[#3E6B4F]'
                            : 'bg-[#FAF8F3] text-[#5A685C] border-[#E4E7DF]'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input
                type="text"
                required
                placeholder={
                  quickKind === 'task'
                    ? 'Task title...'
                    : quickKind === 'mood'
                    ? 'Brief reflection...'
                    : 'Expense description...'
                }
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              />

              {quickKind === 'expense' && (
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder={`Amount (${data.profile?.currencySymbol || '$'})`}
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
                />
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5A685C] hover:text-[#1F2A22] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickSaving}
                  className="px-4 py-2 bg-[#3E6B4F] text-white text-xs font-medium rounded-lg hover:bg-[#335A42] disabled:opacity-60 cursor-pointer"
                >
                  {quickSaving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GrowSpaceWorkspace />
    </ErrorBoundary>
  );
}
