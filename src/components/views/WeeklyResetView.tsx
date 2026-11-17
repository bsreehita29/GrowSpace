import { useState } from 'react';
import { RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { createWeeklyReset, deleteSubdoc } from '../../services/firestoreService';
import type { WeeklyReset } from '../../types/growth';

interface WeeklyResetViewProps {
  uid: string;
  contextSummary: string;
  resets: WeeklyReset[];
}

export function WeeklyResetView({ uid, contextSummary, resets }: WeeklyResetViewProps) {
  const [weekLabel, setWeekLabel] = useState('Week of Nov 16 – Nov 22');
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [focusTheme, setFocusTheme] = useState('');
  const [prioritiesText, setPrioritiesText] = useState('');
  const [wellnessRating, setWellnessRating] = useState(4);
  const [productivityRating, setProductivityRating] = useState(4);
  const [saving, setSaving] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  async function handleAiDraft() {
    setAiDrafting(true);
    setAiMessage(null);
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'weekly',
          prompt:
            'Based on my workspace snapshot, suggest a concise weekly theme and 3 concrete priorities for next week.',
          contextSummary,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Could not generate weekly synthesis.');
      }
      setAiMessage(data.text);
    } catch (err: unknown) {
      setAiMessage(err instanceof Error ? err.message : 'Unable to draft weekly synthesis.');
    } finally {
      setAiDrafting(false);
    }
  }

  async function handleSaveReset(e: React.FormEvent) {
    e.preventDefault();
    if (!weekLabel.trim()) return;
    setSaving(true);
    try {
      const nextWeekPriorities = prioritiesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 6);

      await createWeeklyReset(uid, {
        weekLabel,
        wins,
        challenges,
        focusTheme: focusTheme || 'Steady Balance',
        nextWeekPriorities,
        wellnessRating,
        productivityRating,
      });

      setWins('');
      setChallenges('');
      setFocusTheme('');
      setPrioritiesText('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveReset}
          className="lg:col-span-6 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#3E6B4F]" />
              <h3 className="text-base font-semibold text-[#1F2A22]">Weekly Review & Next Plan</h3>
            </div>
            <button
              type="button"
              onClick={handleAiDraft}
              disabled={aiDrafting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF3EC] text-[#2C523B] text-xs font-medium rounded-lg hover:bg-[#DCE8DC] cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiDrafting ? 'Synthesizing...' : 'AI Synthesis'}</span>
            </button>
          </div>

          {aiMessage && (
            <div className="p-4 bg-[#EEF3EC] border border-[#D4E2D2] rounded-lg text-xs text-[#1F2A22] whitespace-pre-line leading-relaxed">
              {aiMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Week Label</label>
              <input
                type="text"
                required
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">Next Week Theme</label>
              <input
                type="text"
                placeholder="e.g., Calm Deep Work"
                value={focusTheme}
                onChange={(e) => setFocusTheme(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">
                Wellness Rating ({wellnessRating}/5)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={wellnessRating}
                onChange={(e) => setWellnessRating(Number(e.target.value))}
                className="w-full accent-[#3E6B4F]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A685C] mb-1">
                Productivity Rating ({productivityRating}/5)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={productivityRating}
                onChange={(e) => setProductivityRating(Number(e.target.value))}
                className="w-full accent-[#3E6B4F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A685C] mb-1">Key Wins This Week</label>
            <textarea
              rows={2}
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="What went well across study, career, or wellness?"
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A685C] mb-1">Challenges & Adjustments</label>
            <textarea
              rows={2}
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Where did energy drop or plans slip?"
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A685C] mb-1">
              Upcoming Priorities (one per line, max 6)
            </label>
            <textarea
              rows={3}
              value={prioritiesText}
              onChange={(e) => setPrioritiesText(e.target.value)}
              placeholder={'Finish algorithms assignment\nSubmit 2 internship applications\nSleep 7.5+ hrs nightly'}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving Weekly Reset...' : 'Complete Weekly Reset'}
          </button>
        </form>

        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-base font-semibold text-[#1F2A22]">Past Weekly Resets</h3>
          {resets.length === 0 ? (
            <div className="bg-white border border-[#E4E7DF] rounded-xl p-8 text-center text-sm text-[#859286]">
              Complete your first weekly reset to track your rhythm week over week.
            </div>
          ) : (
            resets.map((reset) => (
              <article key={reset.id} className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-[#3E6B4F]">{reset.weekLabel}</p>
                    <h4 className="text-base font-semibold text-[#1F2A22]">{reset.focusTheme}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono tabular-nums text-[#5A685C]">
                      Wellness {reset.wellnessRating}/5 · Focus {reset.productivityRating}/5
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteSubdoc(uid, 'weeklyResets', reset.id)}
                      aria-label="Delete weekly reset"
                      className="text-[#859286] hover:text-[#B44C44] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {reset.wins && (
                  <p className="text-xs text-[#2F3E33]">
                    <span className="font-semibold">Wins:</span> {reset.wins}
                  </p>
                )}
                {reset.challenges && (
                  <p className="text-xs text-[#5A685C]">
                    <span className="font-semibold">Adjustments:</span> {reset.challenges}
                  </p>
                )}
                {reset.nextWeekPriorities.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-[#1F2A22] space-y-1 pt-1">
                    {reset.nextWeekPriorities.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
