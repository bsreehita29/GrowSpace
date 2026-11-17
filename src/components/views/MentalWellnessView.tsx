import { useEffect, useState } from 'react';
import { HeartHandshake, Pause, Play, RotateCcw, Trash2, Wind } from 'lucide-react';
import { MoodStressChart } from '../charts/GrowthCharts';
import { createMoodEntry, deleteSubdoc } from '../../services/firestoreService';
import type { MoodEntry } from '../../types/growth';

interface MentalWellnessViewProps {
  uid: string;
  todayKey: string;
  moods: MoodEntry[];
}

const EMOTIONS = ['Calm', 'Focused', 'Grateful', 'Energized', 'Reflective', 'Stressed', 'Tired'];

export function MentalWellnessView({ uid, todayKey, moods }: MentalWellnessViewProps) {
  const [moodScore, setMoodScore] = useState(4);
  const [stressLevel, setStressLevel] = useState(2);
  const [emotionLabel, setEmotionLabel] = useState('Calm');
  const [meditationMinutes, setMeditationMinutes] = useState(10);
  const [journalText, setJournalText] = useState('');
  const [gratitudeNote, setGratitudeNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Guided breathing timer (4-4-4-4 Box Breathing)
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathSeconds, setBreathSeconds] = useState(0);
  const cycleSec = breathSeconds % 16;
  const breathPhase =
    cycleSec < 4 ? 'Inhale gently' : cycleSec < 8 ? 'Hold softly' : cycleSec < 12 ? 'Exhale slowly' : 'Rest';

  useEffect(() => {
    if (!breathRunning) return;
    const id = window.setInterval(() => {
      setBreathSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [breathRunning]);

  const sortedMoods = [...moods].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  const avgMood =
    moods.length > 0 ? (moods.reduce((s, m) => s + m.moodScore, 0) / moods.length).toFixed(1) : '—';
  const totalMeditation = moods.reduce((s, m) => s + m.meditationMinutes, 0);

  async function handleSaveEntry(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await createMoodEntry(uid, {
        dateKey: todayKey,
        moodScore,
        stressLevel,
        emotionLabel,
        meditationMinutes,
        journalText,
        gratitudeNote,
      });
      setJournalText('');
      setGratitudeNote('');
      setStatusMsg('Check-in saved to your wellness journal.');
    } finally {
      setSaving(false);
    }
  }

  function applyBreathingMinutes() {
    const mins = Math.max(1, Math.round(breathSeconds / 60));
    setMeditationMinutes((prev) => prev + mins);
    setBreathRunning(false);
    setBreathSeconds(0);
    setStatusMsg(`Added ${mins} minute(s) from breathing session to your check-in.`);
  }

  return (
    <div className="space-y-8">
      {/* Calm Header + Guided Breathing Widget */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 rounded-xl overflow-hidden border border-[#E4E7DF] bg-[#EEF3EC] relative min-h-[240px]">
          <img
            src="/src/assets/images/wellness_calm_stones_1794844760860.jpg"
            alt="Minimalist mindfulness cushion and smooth sage river stones"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#1F2A22]/85 via-[#1F2A22]/40 to-transparent text-white">
            <p className="text-xs text-[#DCE8DC]">Mental Wellness</p>
            <p className="font-display text-xl font-medium">
              Average Mood {avgMood}/5 · {totalMeditation} mins meditated
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E4E7DF] rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#3E6B4F]">
                <Wind className="w-4 h-4" />
                <span>Guided Box Breathing (4-4-4-4)</span>
              </div>
              <h3 className="mt-1 text-lg font-semibold text-[#1F2A22]">
                {breathRunning ? breathPhase : 'Stress Management Reset'}
              </h3>
              <p className="text-xs text-[#5A685C]">
                Follow a steady 4-second rhythm to lower cortisol before study or sleep.
              </p>
            </div>
            <span className="font-mono tabular-nums text-2xl font-semibold text-[#1F2A22]">
              {String(Math.floor(breathSeconds / 60)).padStart(2, '0')}:
              {String(breathSeconds % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#EEF3EC] border border-[#C7D8C5] flex items-center justify-center shrink-0">
              <div
                className={`rounded-full bg-[#3E6B4F]/20 border border-[#3E6B4F] transition-transform duration-1000 ${
                  breathRunning && cycleSec < 8 ? 'w-14 h-14 scale-105' : 'w-9 h-9 scale-90'
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setBreathRunning((r) => !r)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3E6B4F] text-white text-xs font-medium rounded-lg hover:bg-[#335A42] transition-colors cursor-pointer"
              >
                {breathRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{breathRunning ? 'Pause' : 'Start Session'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBreathRunning(false);
                  setBreathSeconds(0);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E4E7DF] text-[#5A685C] text-xs font-medium rounded-lg hover:bg-[#FAF8F3] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              {breathSeconds > 0 && (
                <button
                  type="button"
                  onClick={applyBreathingMinutes}
                  className="px-3 py-2 bg-[#EEF3EC] text-[#2C523B] text-xs font-medium rounded-lg hover:bg-[#DFE9DC] cursor-pointer"
                >
                  Log to Check-In
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mood Check-in Form + Mood/Stress Analytics */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveEntry}
          className="lg:col-span-5 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-[#3E6B4F]" />
            <h3 className="text-base font-semibold text-[#1F2A22]">Mood & Emotional Journal</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1.5">
                Mood Score ({moodScore}/5)
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMoodScore(n)}
                    className={`flex-1 py-1.5 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                      moodScore === n
                        ? 'bg-[#3E6B4F] text-white border-[#3E6B4F]'
                        : 'bg-[#FAF8F3] text-[#5A685C] border-[#E4E7DF]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1.5">
                Stress Level ({stressLevel}/5)
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStressLevel(n)}
                    className={`flex-1 py-1.5 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                      stressLevel === n
                        ? 'bg-[#C07A72] text-white border-[#C07A72]'
                        : 'bg-[#FAF8F3] text-[#5A685C] border-[#E4E7DF]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A685C] mb-1.5">Primary Emotion</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmotionLabel(em)}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                    emotionLabel === em
                      ? 'bg-[#EEF3EC] text-[#2C523B] border-[#3E6B4F] font-medium'
                      : 'bg-white text-[#5A685C] border-[#E4E7DF] hover:bg-[#FAF8F3]'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A685C] mb-1.5">
              Meditation / Mindfulness (minutes)
            </label>
            <input
              type="number"
              min={0}
              max={480}
              value={meditationMinutes}
              onChange={(e) => setMeditationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg focus:outline-none focus:border-[#3E6B4F] font-mono tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A685C] mb-1.5">
              Emotional Journal Entry
            </label>
            <textarea
              rows={3}
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="What is on your mind today? Note any triggers, reflections, or gentle wins..."
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg focus:outline-none focus:border-[#3E6B4F]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A685C] mb-1.5">
              One Thing I&apos;m Grateful For
            </label>
            <input
              type="text"
              value={gratitudeNote}
              onChange={(e) => setGratitudeNote(e.target.value)}
              placeholder="e.g., Afternoon sunlight and a supportive conversation"
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg focus:outline-none focus:border-[#3E6B4F]"
            />
          </div>

          {statusMsg && <p className="text-xs text-[#3E6B4F] font-medium">{statusMsg}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving Check-In...' : 'Save Wellness Entry'}
          </button>
        </form>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#1F2A22]">Mood & Stress Trajectory</h3>
              <p className="text-xs text-[#5A685C]">Hover data points to inspect daily metrics</p>
            </div>
            <MoodStressChart entries={moods} />
          </div>

          <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1F2A22]">Recent Journal Reflections</h3>
            {sortedMoods.length === 0 ? (
              <p className="text-xs text-[#859286]">No entries yet.</p>
            ) : (
              <div className="divide-y divide-[#EEF1EA]">
                {sortedMoods.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="py-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[#5A685C] font-mono tabular-nums">
                        {entry.dateKey} · Mood {entry.moodScore}/5 · Stress {entry.stressLevel}/5 ·{' '}
                        <span className="font-sans font-medium text-[#2C523B]">{entry.emotionLabel}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => deleteSubdoc(uid, 'moods', entry.id)}
                        aria-label="Delete journal entry"
                        className="text-[#859286] hover:text-[#B44C44] p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {entry.journalText && (
                      <p className="text-sm text-[#1F2A22] leading-relaxed">{entry.journalText}</p>
                    )}
                    {entry.gratitudeNote && (
                      <p className="text-xs text-[#5A685C]">Gratitude: {entry.gratitudeNote}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
