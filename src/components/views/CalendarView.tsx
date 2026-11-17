import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { createCalendarEvent, deleteSubdoc } from '../../services/firestoreService';
import type { ModuleId, UnifiedCalendarItem } from '../../types/growth';

interface CalendarViewProps {
  uid: string;
  todayKey: string;
  items: UnifiedCalendarItem[];
  onNavigate: (module: ModuleId) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ uid, todayKey, items, onNavigate }: CalendarViewProps) {
  const todayDate = new Date(todayKey + 'T12:00:00');
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey);

  // Add event form
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [moduleCategory, setModuleCategory] = useState('Study');
  const [notes, setNotes] = useState('');

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const m = String(viewMonth + 1).padStart(2, '0');
      const day = String(d).padStart(2, '0');
      cells.push(`${viewYear}-${m}-${day}`);
    }
    return cells;
  }, [viewYear, viewMonth]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, UnifiedCalendarItem[]> = {};
    for (const item of items) {
      if (!map[item.dateKey]) map[item.dateKey] = [];
      map[item.dateKey].push(item);
    }
    return map;
  }, [items]);

  const selectedItems = itemsByDate[selectedDate] || [];

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createCalendarEvent(uid, {
      title,
      dateKey: selectedDate,
      startTime,
      endTime,
      moduleCategory,
      notes,
    });
    setTitle('');
    setNotes('');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Month Grid */}
      <div className="lg:col-span-8 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-[#1F2A22]">{monthLabel}</h3>
            <p className="text-xs text-[#5A685C]">
              Unified view across Study, Career, Tasks, Goals, Opportunities & Events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-2 border border-[#E4E7DF] rounded-lg hover:bg-[#FAF8F3] cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewYear(todayDate.getFullYear());
                setViewMonth(todayDate.getMonth());
                setSelectedDate(todayKey);
              }}
              className="px-3 py-1.5 text-xs font-medium border border-[#E4E7DF] rounded-lg hover:bg-[#FAF8F3] cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-2 border border-[#E4E7DF] rounded-lg hover:bg-[#FAF8F3] cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-[#5A685C]">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1.5">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((dateKey, idx) => {
            if (!dateKey) {
              return <div key={`empty_${idx}`} className="min-h-[84px] rounded-lg bg-[#FAF8F3]/40" />;
            }
            const dayItems = itemsByDate[dateKey] || [];
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === todayKey;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`min-h-[84px] p-2 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#EEF3EC] border-[#3E6B4F]'
                    : 'bg-white border-[#E4E7DF] hover:bg-[#FAF8F3]'
                }`}
              >
                <span
                  className={`text-xs font-mono tabular-nums font-medium ${
                    isToday
                      ? 'px-1.5 py-0.5 bg-[#3E6B4F] text-white rounded'
                      : 'text-[#1F2A22]'
                  }`}
                >
                  {Number(dateKey.slice(8))}
                </span>

                <div className="space-y-1 w-full">
                  {dayItems.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="text-[10px] truncate px-1.5 py-0.5 rounded bg-[#FAF8F3] border border-[#E4E7DF] text-[#2F3E33]"
                    >
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <p className="text-[10px] font-mono text-[#3E6B4F]">+{dayItems.length - 2} more</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda & Add Event */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
          <div>
            <p className="text-xs text-[#5A685C]">Selected Date</p>
            <h3 className="font-mono tabular-nums text-lg font-semibold text-[#1F2A22]">{selectedDate}</h3>
          </div>

          {selectedItems.length === 0 ? (
            <p className="text-xs text-[#859286] py-4">No milestones or events on this date.</p>
          ) : (
            <div className="divide-y divide-[#EEF1EA]">
              {selectedItems.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onNavigate(item.sourceModule)}
                      className="text-sm font-medium text-[#1F2A22] hover:text-[#3E6B4F] text-left cursor-pointer"
                    >
                      {item.title}
                    </button>
                    <p className="text-xs text-[#5A685C]">
                      {item.categoryLabel} · {item.timeLabel} · {item.statusLabel}
                    </p>
                  </div>
                  {item.isCustomEvent && (
                    <button
                      type="button"
                      onClick={() => deleteSubdoc(uid, 'calendarEvents', item.id)}
                      aria-label="Delete calendar event"
                      className="p-1 text-[#859286] hover:text-[#B44C44] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleAddEvent}
          className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-3"
        >
          <h4 className="text-sm font-semibold text-[#1F2A22]">Schedule Event on {selectedDate}</h4>
          <input
            type="text"
            required
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
            />
          </div>
          <select
            value={moduleCategory}
            onChange={(e) => setModuleCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          >
            <option value="Study">Study</option>
            <option value="Career">Career</option>
            <option value="Wellness">Wellness</option>
            <option value="Personal">Personal</option>
          </select>
          <input
            type="text"
            placeholder="Notes or location"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#3E6B4F] text-white text-xs font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Calendar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
