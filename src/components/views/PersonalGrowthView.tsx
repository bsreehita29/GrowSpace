import { useState } from 'react';
import { Award, Compass, Target, Trash2 } from 'lucide-react';
import {
  createGrowthGoal,
  deleteSubdoc,
  updateGrowthGoalProgress,
} from '../../services/firestoreService';
import type { GrowthGoal, Habit, MoodEntry, StudyNote } from '../../types/growth';

interface PersonalGrowthViewProps {
  uid: string;
  todayKey: string;
  goals: GrowthGoal[];
  habits: Habit[];
  moods: MoodEntry[];
  studyNotes: StudyNote[];
}

export function PersonalGrowthView({
  uid,
  todayKey,
  goals,
  habits,
  moods,
  studyNotes,
}: PersonalGrowthViewProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [targetDate, setTargetDate] = useState(todayKey);
  const [visionQuote, setVisionQuote] = useState('');
  const [milestoneNote, setMilestoneNote] = useState('');

  const unlockedAchievements = goals.filter((g) => g.isAchievement || g.progress >= 100);
  const totalHabitCheckins = habits.reduce((s, h) => s + h.completedDates.length, 0);
  const totalStudyMinutes = studyNotes.reduce((s, n) => s + n.focusMinutes, 0);

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createGrowthGoal(uid, {
      title,
      category,
      targetDate,
      progress: 10,
      visionQuote,
      milestoneNote,
      isAchievement: false,
    });
    setTitle('');
    setVisionQuote('');
    setMilestoneNote('');
  }

  return (
    <div className="space-y-8">
      {/* Vision Board Anchor */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 rounded-xl overflow-hidden border border-[#E4E7DF] bg-[#EEF3EC] relative min-h-[240px]">
          <img
            src="/src/assets/images/vision_board_serenity_1794844760441.jpg"
            alt="Personal growth vision board flat-lay with linen journal and botanical leaf"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#1F2A22]/85 via-[#1F2A22]/40 to-transparent text-white">
            <p className="text-xs text-[#DCE8DC]">Vision & Intent</p>
            <p className="font-display text-xl font-medium">
              {goals[0]?.visionQuote || 'Consistent daily craft builds lasting confidence.'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E4E7DF] rounded-xl p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#3E6B4F]">
              <Compass className="w-4 h-4" />
              <span>Progress Report</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1F2A22] mt-1">Milestones & Momentum</h3>
            <p className="text-xs text-[#5A685C]">
              Live summary of your completed goals, habit consistency, and deep work hours.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg">
              <p className="text-[11px] text-[#5A685C]">Active Goals</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[#1F2A22] mt-1">
                {goals.filter((g) => !g.isAchievement).length}
              </p>
            </div>
            <div className="p-3.5 bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg">
              <p className="text-[11px] text-[#5A685C]">Achievements</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[#3E6B4F] mt-1">
                {unlockedAchievements.length}
              </p>
            </div>
            <div className="p-3.5 bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg">
              <p className="text-[11px] text-[#5A685C]">Habit Check-ins</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[#1F2A22] mt-1">
                {totalHabitCheckins}
              </p>
            </div>
            <div className="p-3.5 bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg">
              <p className="text-[11px] text-[#5A685C]">Reflections</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-[#1F2A22] mt-1">
                {moods.length}
              </p>
            </div>
          </div>

          <p className="text-xs text-[#5A685C]">
            Focus investment: <span className="font-mono tabular-nums font-medium text-[#1F2A22]">{totalStudyMinutes}</span> total study minutes logged across your notes.
          </p>
        </div>
      </section>

      {/* Goals + Create Form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleAddGoal}
          className="lg:col-span-4 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#3E6B4F]" />
            <h3 className="text-base font-semibold text-[#1F2A22]">Add Vision & Goal</h3>
          </div>
          <input
            type="text"
            required
            placeholder="Goal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
            />
          </div>
          <input
            type="text"
            placeholder="Vision statement or mantra"
            value={visionQuote}
            onChange={(e) => setVisionQuote(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <textarea
            rows={2}
            placeholder="Next milestone step..."
            value={milestoneNote}
            onChange={(e) => setMilestoneNote(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
          >
            Add to Vision Board
          </button>
        </form>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1F2A22]">Active Goals & Vision Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 bg-[#FAF8F3] border border-[#E4E7DF] rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-[#5A685C]">
                        {goal.category} · Target <span className="font-mono tabular-nums">{goal.targetDate}</span>
                      </p>
                      <h4 className="text-sm font-semibold text-[#1F2A22] mt-0.5">{goal.title}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSubdoc(uid, 'growthGoals', goal.id)}
                      aria-label="Delete goal"
                      className="text-[#859286] hover:text-[#B44C44] p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {goal.visionQuote && (
                    <p className="text-xs italic text-[#435447]">&ldquo;{goal.visionQuote}&rdquo;</p>
                  )}
                  {goal.milestoneNote && (
                    <p className="text-xs text-[#5A685C]">{goal.milestoneNote}</p>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-[#5A685C]">Progress</span>
                      <span className="font-semibold text-[#3E6B4F]">{goal.progress}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={goal.progress}
                      onChange={(e) =>
                        updateGrowthGoalProgress(uid, goal.id, Number(e.target.value))
                      }
                      className="w-full accent-[#3E6B4F]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#3E6B4F]" />
              <h3 className="text-base font-semibold text-[#1F2A22]">Achievements Shelf</h3>
            </div>
            {unlockedAchievements.length === 0 && totalHabitCheckins < 3 ? (
              <p className="text-xs text-[#859286]">
                Reach 100% on any goal or build a 3-day habit check-in streak to unlock milestones here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {totalHabitCheckins >= 3 && (
                  <div className="p-3.5 bg-[#EEF3EC] border border-[#D4E2D2] rounded-lg">
                    <p className="text-xs font-semibold text-[#2C523B]">Consistency Builder</p>
                    <p className="text-xs text-[#435447] mt-0.5">
                      {totalHabitCheckins} total habit completions logged.
                    </p>
                  </div>
                )}
                {unlockedAchievements.map((ach) => (
                  <div key={ach.id} className="p-3.5 bg-[#EEF3EC] border border-[#D4E2D2] rounded-lg">
                    <p className="text-xs font-semibold text-[#2C523B]">{ach.title}</p>
                    <p className="text-xs text-[#435447] mt-0.5">
                      Completed · {ach.category}
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
