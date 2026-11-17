import { useState } from 'react';
import { BookmarkCheck, Send, Sparkles, Trash2 } from 'lucide-react';
import { deleteSubdoc, saveAiInsight } from '../../services/firestoreService';
import type { AiInsight } from '../../types/growth';

interface AiAssistantViewProps {
  uid: string;
  contextSummary: string;
  insights: AiInsight[];
}

const MODES: { id: AiInsight['category']; label: string; samplePrompt: string }[] = [
  {
    id: 'schedule',
    label: 'Daily Schedule',
    samplePrompt: 'Build me a balanced time-blocked schedule for today around my open tasks, study deadlines, and wellness needs.',
  },
  {
    id: 'study',
    label: 'Study Plan',
    samplePrompt: 'Create a 5-day study and exam revision strategy based on my upcoming assignments and focus time.',
  },
  {
    id: 'career',
    label: 'Career Guidance',
    samplePrompt: 'Review my current skills and application pipeline, and suggest 3 high-impact actions for this week.',
  },
  {
    id: 'wellness',
    label: 'Wellness & Stress',
    samplePrompt: 'Suggest a calming evening reset routine based on my recent mood, stress level, and sleep.',
  },
];

export function AiAssistantView({ uid, contextSummary, insights }: AiAssistantViewProps) {
  const [mode, setMode] = useState<AiInsight['category']>('schedule');
  const [prompt, setPrompt] = useState(MODES[0].samplePrompt);
  const [includeContext, setIncludeContext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latestReply, setLatestReply] = useState<{
    category: AiInsight['category'];
    prompt: string;
    response: string;
    saved: boolean;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          prompt: prompt.trim(),
          contextSummary: includeContext ? contextSummary : '',
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Unable to generate guidance.');
      }
      setLatestReply({
        category: mode,
        prompt: prompt.trim(),
        response: data.text,
        saved: false,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach AI Assistant.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveReply() {
    if (!latestReply || latestReply.saved) return;
    await saveAiInsight(uid, {
      category: latestReply.category,
      prompt: latestReply.prompt,
      response: latestReply.response,
    });
    setLatestReply({ ...latestReply, saved: true });
  }

  const sortedHistory = [...insights].sort(
    (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
  );

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-[#3E6B4F]">
              <Sparkles className="w-4 h-4" />
              <span>Personal Growth Advisor</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1F2A22]">
              Tailored Schedules, Study & Career Guidance
            </h3>
            <p className="text-xs text-[#5A685C]">
              Ask for concrete plans grounded in your real tasks, coursework, mood logs, and goals.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  setPrompt(m.samplePrompt);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  mode === m.id
                    ? 'bg-[#3E6B4F] text-white border-[#3E6B4F]'
                    : 'bg-[#FAF8F3] text-[#5A685C] border-[#E4E7DF] hover:text-[#1F2A22]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              rows={4}
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask for a study schedule, career feedback, or stress management plan..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg focus:outline-none focus:border-[#3E6B4F]"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-[#5A685C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeContext}
                  onChange={(e) => setIncludeContext(e.target.checked)}
                  className="accent-[#3E6B4F]"
                />
                <span>Include my live workspace context (tasks, courses, mood, skills)</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3E6B4F] text-white text-xs font-medium rounded-lg hover:bg-[#335A42] disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Thinking...' : 'Generate Guidance'}</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="p-3 bg-[#F5E2E0] border border-[#E2B9B5] text-[#7B2E28] text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {latestReply && (
            <div className="p-5 bg-[#EEF3EC] border border-[#D4E2D2] rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#2C523B] capitalize">
                  {latestReply.category} Recommendation
                </span>
                <button
                  type="button"
                  disabled={latestReply.saved}
                  onClick={handleSaveReply}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-white border border-[#C7D8C5] text-[#2C523B] rounded-md hover:bg-[#FAF8F3] disabled:opacity-60 cursor-pointer"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>{latestReply.saved ? 'Saved to History' : 'Save Insight'}</span>
                </button>
              </div>
              <div className="text-sm text-[#1F2A22] whitespace-pre-line leading-relaxed">
                {latestReply.response}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-[#1F2A22]">Workspace Context Shared</h3>
            <pre className="text-xs text-[#5A685C] bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed">
              {contextSummary}
            </pre>
          </div>

          <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1F2A22]">Saved Guidance Archive</h3>
            {sortedHistory.length === 0 ? (
              <p className="text-xs text-[#859286]">
                Save helpful schedules or advice to keep them pinned here.
              </p>
            ) : (
              <div className="divide-y divide-[#EEF1EA]">
                {sortedHistory.map((item) => (
                  <div key={item.id} className="py-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-[#3E6B4F] capitalize">{item.category}</p>
                        <p className="text-xs font-semibold text-[#1F2A22]">{item.prompt}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteSubdoc(uid, 'aiInsights', item.id)}
                        aria-label="Delete saved insight"
                        className="p-1 text-[#859286] hover:text-[#B44C44] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-[#435447] whitespace-pre-line leading-relaxed">
                      {item.response}
                    </p>
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
