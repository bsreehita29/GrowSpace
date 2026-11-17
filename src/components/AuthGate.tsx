import { useState } from 'react';
import { ArrowRight, Check, Leaf, ShieldCheck } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

const PILLARS = [
  'Mental Wellness & Guided Breathing',
  'Academic Timetable, Exams & Focus Timer',
  'Career Pipeline, Skills & Interview Prep',
  'Daily Tasks, Habits & Health Analytics',
  'Personal Finance, Budgets & Savings Goals',
  'Vision Boards, Opportunities & Weekly Reset',
];

export function AuthGate() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to sign in right now.';
      setErrorMsg(message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1F2A22] flex flex-col">
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 flex items-center justify-between gap-8 border-b border-[#E4E7DF]">
        <span className="font-display text-xl font-semibold tracking-tight text-[#1F2A22] whitespace-nowrap shrink-0">
          GROW SPACE
        </span>
        <span className="hidden sm:inline-block text-xs text-[#5A685C] whitespace-nowrap shrink-0">
          Your Life · Your Goals · Your Growth
        </span>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="px-4 py-2 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          {loading ? 'Connecting...' : 'Sign In'}
        </button>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[#3E6B4F]">
              <Leaf className="w-4 h-4" />
              <span>Personal Growth Sanctuary</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#1F2A22] leading-[1.12] [text-wrap:balance]">
              One calm space for your mind, studies, career, and daily rhythm.
            </h1>
            <p className="text-base text-[#5A685C] leading-relaxed max-w-xl">
              GROW SPACE brings ten interconnected life modules together with live progress analytics,
              a unified calendar, and a context-aware AI advisor backed by your private cloud workspace.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#2F3E33]">
            {PILLARS.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#3E6B4F] mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-[#3E6B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#335A42] transition-colors disabled:opacity-60 cursor-pointer"
            >
              <span>{loading ? 'Opening Google Sign-In...' : 'Continue with Google'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs text-[#5A685C]">
              <ShieldCheck className="w-4 h-4 text-[#3E6B4F] shrink-0" />
              <span>Private Firestore sync with verified Google account isolation.</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#F5E2E0] border border-[#E2B9B5] text-[#7B2E28] text-xs rounded-lg">
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="relative h-full min-h-[360px] lg:min-h-[540px] rounded-2xl overflow-hidden border border-[#E4E7DF] bg-[#EEF3EC]">
            <img
              src="/src/assets/images/hero_botanical_sanctuary_1794844759781.jpg"
              alt="Sunlit minimalist botanical workspace in sage and warm cream tones"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 bg-gradient-to-t from-[#1F2A22]/85 via-[#1F2A22]/45 to-transparent text-white">
              <p className="text-xs text-[#DCE8DC] mb-1">Unified Workspace</p>
              <p className="font-display text-xl font-medium leading-snug max-w-md">
                Track habits, courses, applications, mood reflections, and weekly resets in one place.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
