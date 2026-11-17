import { useRef, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, Leaf, Lock, ShieldCheck, User } from 'lucide-react';
import { registerWithUsername, signInWithUsername } from '../lib/firebase';

const PILLARS = [
  'Mental Wellness & Guided Breathing',
  'Academic Timetable, Exams & Focus Timer',
  'Career Pipeline, Skills & Interview Prep',
  'Daily Tasks, Habits & Health Analytics',
  'Personal Finance, Budgets & Savings Goals',
  'Vision Boards, Opportunities & Weekly Reset',
];

export function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);

  function switchMode(nextMode: 'signin' | 'signup') {
    setMode(nextMode);
    setErrorMsg(null);
  }

  function focusLoginForm() {
    setMode('signin');
    setErrorMsg(null);
    usernameInputRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithUsername(username, password);
      } else {
        await registerWithUsername(username, password, displayName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in right now.';
      setErrorMsg(msg);
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
          onClick={focusLoginForm}
          className="px-4 py-2 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Login
        </button>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-7">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#3E6B4F]">
              <Leaf className="w-4 h-4" />
              <span>Personal Growth Sanctuary</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#1F2A22] leading-[1.15] [text-wrap:balance]">
              One calm space for your mind, studies, career, and daily rhythm.
            </h1>
            <p className="text-sm text-[#5A685C] leading-relaxed max-w-xl">
              Set a username and password to create your private workspace or sign in to continue
              where you left off.
            </p>
          </div>

          <div className="bg-white border border-[#E4E7DF] rounded-2xl p-6 sm:p-7 space-y-5 max-w-md">
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#F4F2EC] rounded-lg border border-[#E4E7DF]">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-[#1F2A22] border border-[#E4E7DF]'
                    : 'text-[#5A685C] hover:text-[#1F2A22]'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-[#1F2A22] border border-[#E4E7DF]'
                    : 'text-[#5A685C] hover:text-[#1F2A22]'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-medium text-[#5A685C] mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7B877C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={usernameInputRef}
                    id="login-username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex_river"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg text-[#1F2A22] placeholder:text-[#8E9A8F] focus:outline-none focus:border-[#3E6B4F]"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#7B877C]">
                  3–32 characters: letters, numbers, dots, underscores, or hyphens.
                </p>
              </div>

              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="login-display-name"
                    className="block text-xs font-medium text-[#5A685C] mb-1.5"
                  >
                    Display Name (optional)
                  </label>
                  <input
                    id="login-display-name"
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex River"
                    className="w-full px-3 py-2.5 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg text-[#1F2A22] placeholder:text-[#8E9A8F] focus:outline-none focus:border-[#3E6B4F]"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-[#5A685C] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7B877C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg text-[#1F2A22] placeholder:text-[#8E9A8F] focus:outline-none focus:border-[#3E6B4F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#7B877C] hover:text-[#1F2A22] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="login-confirm-password"
                    className="block text-xs font-medium text-[#5A685C] mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7B877C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg text-[#1F2A22] placeholder:text-[#8E9A8F] focus:outline-none focus:border-[#3E6B4F]"
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-[#F5E2E0] border border-[#E2B9B5] text-[#7B2E28] text-xs rounded-lg leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 bg-[#3E6B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#335A42] transition-colors disabled:opacity-60 cursor-pointer"
              >
                <span>
                  {loading
                    ? mode === 'signin'
                      ? 'Logging In...'
                      : 'Creating Account...'
                    : mode === 'signin'
                      ? 'Login to Workspace'
                      : 'Create Account & Enter'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center gap-2 text-xs text-[#5A685C] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#3E6B4F] shrink-0" />
              <span>Your password is salted and hashed before saving your workspace.</span>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#2F3E33] max-w-xl">
            {PILLARS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#3E6B4F] mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6">
          <div className="relative h-full min-h-[360px] lg:min-h-[580px] rounded-2xl overflow-hidden border border-[#E4E7DF] bg-[#EEF3EC]">
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
