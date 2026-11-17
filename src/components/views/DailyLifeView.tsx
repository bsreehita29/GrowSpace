import { useMemo, useState } from 'react';
import { Bell, Check, CheckCircle2, Circle, Flame, Trash2 } from 'lucide-react';
import {
  createDailyTask,
  createHabit,
  deleteSubdoc,
  toggleDailyTask,
  updateHabitDates,
} from '../../services/firestoreService';
import { getOffsetDateKey, type DailyTask, type Habit } from '../../types/growth';

interface DailyLifeViewProps {
  uid: string;
  todayKey: string;
  tasks: DailyTask[];
  habits: Habit[];
}

export function DailyLifeView({ uid, todayKey, tasks, habits }: DailyLifeViewProps) {
  const [filter, setFilter] = useState<'all' | 'today' | 'open' | 'completed'>('all');

  // Task form
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayKey);
  const [dueTime, setDueTime] = useState('09:30');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<DailyTask['priority']>('medium');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  // Habit form
  const [habitTitle, setHabitTitle] = useState('');
  const [habitFreq, setHabitFreq] = useState<Habit['frequency']>('daily');
  const [targetPerWeek, setTargetPerWeek] = useState(6);

  const last7Days = useMemo(
    () => Array.from({ length: 7 }, (_, idx) => getOffsetDateKey(idx - 6)),
    []
  );

  const filteredTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    if (filter === 'today') return sorted.filter((t) => t.dueDate === todayKey);
    if (filter === 'open') return sorted.filter((t) => !t.completed);
    if (filter === 'completed') return sorted.filter((t) => t.completed);
    return sorted;
  }, [tasks, filter, todayKey]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createDailyTask(uid, {
      title,
      dueDate,
      dueTime,
      category,
      priority,
      completed: false,
      reminderEnabled,
    });
    setTitle('');
  }

  async function handleAddHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    await createHabit(uid, {
      title: habitTitle,
      frequency: habitFreq,
      targetPerWeek,
      completedDates: [],
    });
    setHabitTitle('');
  }

  async function toggleHabitDay(habit: Habit, dateKey: string) {
    const exists = habit.completedDates.includes(dateKey);
    const updated = exists
      ? habit.completedDates.filter((d) => d !== dateKey)
      : [...habit.completedDates, dateKey];
    await updateHabitDates(uid, habit.id, updated);
  }

  return (
    <div className="space-y-8">
      {/* Tasks & Reminders */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleAddTask}
          className="lg:col-span-4 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
        >
          <h3 className="text-base font-semibold text-[#1F2A22]">Add To-Do / Reminder</h3>
          <input
            type="text"
            required
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
            />
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as DailyTask['priority'])}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-[#2F3E33] cursor-pointer">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="accent-[#3E6B4F]"
            />
            <span>Include in daily reminders</span>
          </label>
          <button
            type="submit"
            className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
          >
            Add Task
          </button>
        </form>

        <div className="lg:col-span-8 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[#1F2A22]">Daily Schedule & To-Do List</h3>
            <div className="flex items-center gap-1 p-1 bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg">
              {(['all', 'today', 'open', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                    filter === f ? 'bg-white text-[#1F2A22] shadow-xs' : 'text-[#5A685C]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <p className="text-sm text-[#859286] py-8 text-center">No tasks match this filter.</p>
          ) : (
            <div className="divide-y divide-[#EEF1EA]">
              {filteredTasks.map((task) => (
                <div key={task.id} className="py-3.5 flex items-center justify-between gap-3">
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
                      <p className={`text-sm truncate ${task.completed ? 'line-through text-[#859286]' : 'text-[#1F2A22]'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-[#5A685C]">
                        {task.category} · <span className="font-mono tabular-nums">{task.dueDate} {task.dueTime}</span> · {task.priority}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.reminderEnabled && (
                      <Bell className="w-3.5 h-3.5 text-[#3E6B4F]" aria-label="Reminder active" />
                    )}
                    <button
                      type="button"
                      onClick={() => deleteSubdoc(uid, 'dailyTasks', task.id)}
                      aria-label="Delete task"
                      className="p-1.5 text-[#859286] hover:text-[#B44C44] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7-Day Habit Tracker */}
      <section className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#1F2A22]">7-Day Habit Tracker</h3>
            <p className="text-xs text-[#5A685C]">Click any day cell to check in and build your streak</p>
          </div>
          <form onSubmit={handleAddHabit} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              required
              placeholder="New habit (e.g., Read 15 pages)"
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg w-56"
            />
            <select
              value={habitFreq}
              onChange={(e) => setHabitFreq(e.target.value as Habit['frequency'])}
              className="px-2.5 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            >
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
            </select>
            <input
              type="number"
              min={1}
              max={7}
              value={targetPerWeek}
              onChange={(e) => setTargetPerWeek(Number(e.target.value))}
              className="w-14 px-2 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
              title="Target days per week"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#3E6B4F] text-white text-xs font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
            >
              Add Habit
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E7DF] text-xs text-[#5A685C]">
                <th className="py-2 pr-4 font-medium">Habit</th>
                {last7Days.map((d) => (
                  <th key={d} className="py-2 px-2 text-center font-mono font-normal">
                    {d.slice(5)}
                  </th>
                ))}
                <th className="py-2 pl-4 text-right font-medium">This Week</th>
                <th className="py-2 pl-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1EA]">
              {habits.map((habit) => {
                const weekCount = last7Days.filter((d) => habit.completedDates.includes(d)).length;
                return (
                  <tr key={habit.id} className="hover:bg-[#FAF8F3]/60">
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium text-[#1F2A22]">{habit.title}</p>
                      <p className="text-[11px] text-[#859286]">
                        {habit.frequency} · Target {habit.targetPerWeek}/wk
                      </p>
                    </td>
                    {last7Days.map((d) => {
                      const done = habit.completedDates.includes(d);
                      return (
                        <td key={d} className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleHabitDay(habit, d)}
                            aria-label={`Toggle ${habit.title} on ${d}`}
                            className={`w-7 h-7 rounded-md inline-flex items-center justify-center border transition-colors cursor-pointer ${
                              done
                                ? 'bg-[#3E6B4F] border-[#3E6B4F] text-white'
                                : 'bg-[#FAF8F3] border-[#E4E7DF] text-transparent hover:border-[#3E6B4F]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-3 pl-4 text-right font-mono tabular-nums text-xs text-[#2C523B]">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-[#C09A6B]" />
                        {weekCount}/{habit.targetPerWeek}
                      </span>
                    </td>
                    <td className="py-3 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => deleteSubdoc(uid, 'habits', habit.id)}
                        aria-label="Delete habit"
                        className="p-1 text-[#859286] hover:text-[#B44C44] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
