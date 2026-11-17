import { useEffect, useState } from 'react';
import { Activity, Check, Droplets, Moon, Sparkles, Utensils } from 'lucide-react';
import { HealthTrendsChart } from '../charts/GrowthCharts';
import { upsertHealthLog } from '../../services/firestoreService';
import type { HealthLog, UserProfile } from '../../types/growth';

interface HealthViewProps {
  uid: string;
  todayKey: string;
  profile: UserProfile | null;
  healthLogs: HealthLog[];
  todayLog: HealthLog | null;
}

const SELF_CARE_OPTIONS = [
  'Sunlight walk',
  'Skincare ritual',
  '10m Stretching',
  'Screen break',
  'Vitamins & minerals',
  'Early wind-down',
];

export function HealthView({ uid, todayKey, profile, healthLogs, todayLog }: HealthViewProps) {
  const [sleepHours, setSleepHours] = useState(todayLog?.sleepHours ?? 7.5);
  const [waterMl, setWaterMl] = useState(todayLog?.waterMl ?? 1250);
  const [workoutMinutes, setWorkoutMinutes] = useState(todayLog?.workoutMinutes ?? 30);
  const [workoutType, setWorkoutType] = useState(todayLog?.workoutType ?? 'Morning Yoga');
  const [nutritionNote, setNutritionNote] = useState(todayLog?.nutritionNote ?? '');
  const [calories, setCalories] = useState(todayLog?.calories ?? 1900);
  const [selfCare, setSelfCare] = useState<string[]>(todayLog?.selfCareChecklist ?? []);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (todayLog) {
      setSleepHours(todayLog.sleepHours);
      setWaterMl(todayLog.waterMl);
      setWorkoutMinutes(todayLog.workoutMinutes);
      setWorkoutType(todayLog.workoutType);
      setNutritionNote(todayLog.nutritionNote);
      setCalories(todayLog.calories);
      setSelfCare(todayLog.selfCareChecklist);
    }
  }, [todayLog]);

  const waterGoal = profile?.dailyWaterGoalMl ?? 2500;
  const sleepGoal = profile?.dailySleepGoalHours ?? 8;

  function toggleSelfCare(item: string) {
    setSelfCare((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(null);
    try {
      await upsertHealthLog(uid, todayLog?.id ?? null, {
        dateKey: todayKey,
        sleepHours,
        waterMl,
        workoutMinutes,
        workoutType,
        nutritionNote,
        calories,
        selfCareChecklist: selfCare,
      });
      setSavedNotice('Today’s health metrics updated.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* KPI Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5A685C]">
            <span>Hydration</span>
            <Droplets className="w-4 h-4 text-[#5A8D9A]" />
          </div>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {waterMl} <span className="text-xs font-normal text-[#859286]">/ {waterGoal} ml</span>
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setWaterMl((w) => w + 250)}
              className="px-2.5 py-1 text-xs bg-[#EEF3EC] text-[#2C523B] rounded-md cursor-pointer"
            >
              +250ml
            </button>
            <button
              type="button"
              onClick={() => setWaterMl((w) => w + 500)}
              className="px-2.5 py-1 text-xs bg-[#EEF3EC] text-[#2C523B] rounded-md cursor-pointer"
            >
              +500ml
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5A685C]">
            <span>Sleep Duration</span>
            <Moon className="w-4 h-4 text-[#6B7E93]" />
          </div>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {sleepHours} <span className="text-xs font-normal text-[#859286]">/ {sleepGoal} hrs</span>
          </p>
          <p className="text-xs text-[#5A685C]">
            {sleepHours >= sleepGoal ? 'Rest target achieved' : 'Prioritize early wind-down'}
          </p>
        </div>

        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5A685C]">
            <span>Movement</span>
            <Activity className="w-4 h-4 text-[#3E6B4F]" />
          </div>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {workoutMinutes} <span className="text-xs font-normal text-[#859286]">mins</span>
          </p>
          <p className="text-xs text-[#5A685C] truncate">{workoutType || 'No activity logged'}</p>
        </div>

        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5A685C]">
            <span>Nutrition</span>
            <Utensils className="w-4 h-4 text-[#9B7E52]" />
          </div>
          <p className="text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {calories} <span className="text-xs font-normal text-[#859286]">kcal</span>
          </p>
          <p className="text-xs text-[#5A685C]">{selfCare.length}/6 self-care rituals done</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSave}
          className="lg:col-span-6 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-5"
        >
          <h3 className="text-base font-semibold text-[#1F2A22]">Daily Health & Self-Care Log ({todayKey})</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Sleep (hours)</label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={24}
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Water (ml)</label>
              <input
                type="number"
                step={50}
                min={0}
                max={12000}
                value={waterMl}
                onChange={(e) => setWaterMl(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Calories (kcal)</label>
              <input
                type="number"
                step={50}
                min={0}
                max={15000}
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Workout / Movement Type</label>
              <input
                type="text"
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value)}
                placeholder="Strength, Run, Yoga, Walk..."
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Workout Duration (mins)</label>
              <input
                type="number"
                min={0}
                max={600}
                value={workoutMinutes}
                onChange={(e) => setWorkoutMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A685C] mb-1">Meals & Nutrition Notes</label>
            <textarea
              rows={2}
              value={nutritionNote}
              onChange={(e) => setNutritionNote(e.target.value)}
              placeholder="Whole foods, protein intake, energy notes..."
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#5A685C]">
              <Sparkles className="w-3.5 h-3.5 text-[#3E6B4F]" />
              <span>Self-Care Rituals</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SELF_CARE_OPTIONS.map((item) => {
                const active = selfCare.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleSelfCare(item)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#EEF3EC] border-[#3E6B4F] text-[#1F2A22] font-medium'
                        : 'bg-[#FAF8F3] border-[#E4E7DF] text-[#5A685C]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        active ? 'bg-[#3E6B4F] border-[#3E6B4F] text-white' : 'border-[#B9C4B8]'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                    </span>
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {savedNotice && <p className="text-xs text-[#3E6B4F] font-medium">{savedNotice}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving Log...' : 'Save Today’s Health Log'}
          </button>
        </form>

        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1F2A22]">7-Day Sleep & Hydration Analytics</h3>
            <HealthTrendsChart logs={healthLogs} />
          </div>

          <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-3">
            <h3 className="text-base font-semibold text-[#1F2A22]">Recent Daily Records</h3>
            <div className="divide-y divide-[#EEF1EA]">
              {[...healthLogs]
                .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
                .slice(0, 5)
                .map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-mono tabular-nums font-medium text-[#1F2A22]">{log.dateKey}</p>
                      <p className="text-[#5A685C]">{log.workoutType} · {log.workoutMinutes}m</p>
                    </div>
                    <p className="font-mono tabular-nums text-[#2F3E33]">
                      {log.sleepHours}h sleep · {(log.waterMl / 1000).toFixed(1)}L water
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
