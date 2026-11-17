import { useEffect, useState } from 'react';
import { Download, LogOut, UserCheck } from 'lucide-react';
import { getCurrentSession, signOutSession } from '../../lib/firebase';
import { updateUserProfile } from '../../services/firestoreService';
import type {
  CareerApplication,
  DailyTask,
  FinanceTransaction,
  GrowthGoal,
  Habit,
  HealthLog,
  MoodEntry,
  StudyNote,
  UserProfile,
} from '../../types/growth';

interface ProfileAnalyticsViewProps {
  uid: string;
  profile: UserProfile | null;
  moods: MoodEntry[];
  studyNotes: StudyNote[];
  careerApps: CareerApplication[];
  dailyTasks: DailyTask[];
  habits: Habit[];
  healthLogs: HealthLog[];
  financeTx: FinanceTransaction[];
  growthGoals: GrowthGoal[];
}

export function ProfileAnalyticsView({
  uid,
  profile,
  moods,
  studyNotes,
  careerApps,
  dailyTasks,
  habits,
  healthLogs,
  financeTx,
  growthGoals,
}: ProfileAnalyticsViewProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [roleTitle, setRoleTitle] = useState(profile?.roleTitle || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [waterGoal, setWaterGoal] = useState(profile?.dailyWaterGoalMl ?? 2500);
  const [sleepGoal, setSleepGoal] = useState(profile?.dailySleepGoalHours ?? 8);
  const [budgetLimit, setBudgetLimit] = useState(profile?.monthlyBudgetLimit ?? 1200);
  const [focusGoal, setFocusGoal] = useState(profile?.dailyFocusGoalMinutes ?? 120);
  const [currencySymbol, setCurrencySymbol] = useState(profile?.currencySymbol || '$');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setRoleTitle(profile.roleTitle);
      setBio(profile.bio);
      setWaterGoal(profile.dailyWaterGoalMl);
      setSleepGoal(profile.dailySleepGoalHours);
      setBudgetLimit(profile.monthlyBudgetLimit);
      setFocusGoal(profile.dailyFocusGoalMinutes);
      setCurrencySymbol(profile.currencySymbol);
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      await updateUserProfile(uid, {
        displayName,
        roleTitle,
        bio,
        dailyWaterGoalMl: waterGoal,
        dailySleepGoalHours: sleepGoal,
        monthlyBudgetLimit: budgetLimit,
        dailyFocusGoalMinutes: focusGoal,
        currencySymbol,
      });
      setSavedMsg('Profile and personal targets updated.');
    } finally {
      setSaving(false);
    }
  }

  function handleExportJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      moods,
      studyNotes,
      careerApps,
      dailyTasks,
      habits,
      healthLogs,
      financeTx,
      growthGoals,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grow-space-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const completedTasks = dailyTasks.filter((t) => t.completed).length;
  const totalFocusMins = studyNotes.reduce((s, n) => s + n.focusMinutes, 0);
  const avgSleep =
    healthLogs.length > 0
      ? (healthLogs.reduce((s, l) => s + l.sleepHours, 0) / healthLogs.length).toFixed(1)
      : '—';
  const avgMood =
    moods.length > 0
      ? (moods.reduce((s, m) => s + m.moodScore, 0) / moods.length).toFixed(1)
      : '—';

  return (
    <div className="space-y-8">
      {/* Cross-Platform Analytics Summary */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Tasks Completed</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {completedTasks}/{dailyTasks.length}
          </p>
        </div>
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Deep Focus Logged</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#3E6B4F]">
            {totalFocusMins}m
          </p>
        </div>
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Average Sleep</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {avgSleep} hrs
          </p>
        </div>
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Average Mood</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {avgMood}/5
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#3E6B4F]" />
            <h3 className="text-base font-semibold text-[#1F2A22]">Profile & Personal Targets</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Role / Focus</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A685C] mb-1">Personal Growth Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Water Goal (ml)</label>
              <input
                type="number"
                min={500}
                max={8000}
                step={100}
                value={waterGoal}
                onChange={(e) => setWaterGoal(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Sleep Goal (hrs)</label>
              <input
                type="number"
                min={3}
                max={14}
                step={0.5}
                value={sleepGoal}
                onChange={(e) => setSleepGoal(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Focus Goal (min)</label>
              <input
                type="number"
                min={10}
                max={720}
                step={10}
                value={focusGoal}
                onChange={(e) => setFocusGoal(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Monthly Budget</label>
              <input
                type="number"
                min={0}
                step={50}
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Currency Symbol</label>
              <input
                type="text"
                maxLength={4}
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
              />
            </div>
          </div>

          {savedMsg && <p className="text-xs text-[#3E6B4F] font-medium">{savedMsg}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>

        <div className="lg:col-span-5 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-5 h-fit">
          <div>
            <h3 className="text-base font-semibold text-[#1F2A22]">Account & Portability</h3>
            <p className="text-xs text-[#5A685C] mt-1">
              Logged in as{' '}
              <span className="font-medium text-[#1F2A22]">
                @{getCurrentSession()?.username || profile?.displayName || 'member'}
              </span>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EEF3EC] text-[#2C523B] text-xs font-medium rounded-lg hover:bg-[#DCE8DC] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Workspace Data (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => signOutSession()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E4E7DF] text-[#7B2E28] text-xs font-medium rounded-lg hover:bg-[#FDF5F3] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
