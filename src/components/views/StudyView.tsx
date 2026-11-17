import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Pause, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  createStudyCourse,
  createStudyNote,
  createStudyTask,
  deleteSubdoc,
  updateCourseAttendance,
  updateStudyTaskStatus,
} from '../../services/firestoreService';
import type { DayOfWeek, StudyCourse, StudyNote, StudyTask } from '../../types/growth';

interface StudyViewProps {
  uid: string;
  todayKey: string;
  courses: StudyCourse[];
  tasks: StudyTask[];
  notes: StudyNote[];
}

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StudyView({ uid, todayKey, courses, tasks, notes }: StudyViewProps) {
  const [activeTab, setActiveTab] = useState<'timetable' | 'tasks' | 'notes'>('timetable');

  // Pomodoro Timer State
  const [timerPresetMins, setTimerPresetMins] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerCourse, setTimerCourse] = useState('General Study');

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  // Add Course Form
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Mon');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [room, setRoom] = useState('');
  const [targetAttendance, setTargetAttendance] = useState(75);

  // Add Study Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourse, setTaskCourse] = useState('');
  const [taskType, setTaskType] = useState<StudyTask['taskType']>('assignment');
  const [taskDue, setTaskDue] = useState(todayKey);
  const [taskPriority, setTaskPriority] = useState<StudyTask['priority']>('medium');
  const [taskNotes, setTaskNotes] = useState('');

  // Add Note Form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCourse, setNoteCourse] = useState('');
  const [noteContent, setNoteContent] = useState('');

  async function handleLogFocusSession() {
    const elapsedMins = Math.max(5, Math.round((timerPresetMins * 60 - secondsLeft) / 60) || timerPresetMins);
    await createStudyNote(uid, {
      title: `Focus Session (${elapsedMins}m)`,
      courseName: timerCourse,
      content: `Completed ${elapsedMins} minutes of uninterrupted deep study on ${todayKey}.`,
      focusMinutes: elapsedMins,
    });
    setTimerRunning(false);
    setSecondsLeft(timerPresetMins * 60);
  }

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!courseName.trim()) return;
    await createStudyCourse(uid, {
      courseName,
      courseCode,
      dayOfWeek,
      startTime,
      endTime,
      room,
      attendedClasses: 1,
      totalClasses: 1,
      targetAttendance,
    });
    setCourseName('');
    setCourseCode('');
    setRoom('');
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await createStudyTask(uid, {
      title: taskTitle,
      courseName: taskCourse || 'General',
      taskType,
      dueDate: taskDue,
      priority: taskPriority,
      status: 'pending',
      notes: taskNotes,
    });
    setTaskTitle('');
    setTaskNotes('');
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    await createStudyNote(uid, {
      title: noteTitle,
      courseName: noteCourse || 'General',
      content: noteContent,
      focusMinutes: 0,
    });
    setNoteTitle('');
    setNoteContent('');
  }

  return (
    <div className="space-y-8">
      {/* Top Study Focus Strip */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 rounded-xl overflow-hidden border border-[#E4E7DF] bg-[#EEF3EC] relative min-h-[210px]">
          <img
            src="/src/assets/images/study_focus_desk_1794844761167.jpg"
            alt="Minimalist oak study desk with dotted notebook and sage ceramic cup"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#1F2A22]/85 via-[#1F2A22]/40 to-transparent text-white">
            <p className="text-xs text-[#DCE8DC]">Study Sanctuary</p>
            <p className="font-display text-xl font-medium">
              {courses.length} Courses · {tasks.filter((t) => t.status !== 'completed').length} Pending Deadlines
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E4E7DF] rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#3E6B4F]">
                <Clock className="w-4 h-4" />
                <span>Pomodoro Study Timer</span>
              </div>
              <h3 className="text-lg font-semibold text-[#1F2A22] mt-1">Deep Work Session</h3>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg">
              {[25, 45, 5].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerPresetMins(mins);
                    setSecondsLeft(mins * 60);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                    timerPresetMins === mins
                      ? 'bg-white text-[#1F2A22] shadow-xs border border-[#E4E7DF]'
                      : 'text-[#5A685C]'
                  }`}
                >
                  {mins === 5 ? '5m Break' : `${mins}m Focus`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <span className="font-mono tabular-nums text-4xl font-semibold text-[#1F2A22]">
              {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
              {String(secondsLeft % 60).padStart(2, '0')}
            </span>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={timerCourse}
                onChange={(e) => setTimerCourse(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg text-[#1F2A22]"
              >
                <option value="General Study">General Study</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.courseCode || c.courseName}>
                    {c.courseCode || c.courseName}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3E6B4F] text-white text-xs font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{timerRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(timerPresetMins * 60);
                }}
                className="p-2 border border-[#E4E7DF] rounded-lg text-[#5A685C] hover:bg-[#FAF8F3] cursor-pointer"
                aria-label="Reset study timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleLogFocusSession}
                className="px-3 py-2 bg-[#EEF3EC] text-[#2C523B] text-xs font-medium rounded-lg hover:bg-[#E1EAE0] cursor-pointer"
              >
                Log Session
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-module Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#EEF3EC] rounded-lg w-fit">
        {[
          { id: 'timetable', label: 'Timetable & Attendance' },
          { id: 'tasks', label: 'Assignments & Exam Planner' },
          { id: 'notes', label: 'Notes & Focus Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-[#1F2A22] shadow-xs' : 'text-[#5A685C] hover:text-[#1F2A22]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Timetable & Attendance */}
      {activeTab === 'timetable' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddCourse}
            className="lg:col-span-4 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
          >
            <h3 className="text-base font-semibold text-[#1F2A22]">Add Course Slot</h3>
            <input
              type="text"
              required
              placeholder="Course name (e.g., Operating Systems)"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Code (CS 401)"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              />
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Room / Hall"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              />
              <input
                type="number"
                min={50}
                max={100}
                value={targetAttendance}
                onChange={(e) => setTargetAttendance(Number(e.target.value))}
                placeholder="Target %"
                className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
            >
              Add to Timetable
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1F2A22]">Weekly Timetable & Attendance</h3>
            {courses.length === 0 ? (
              <p className="text-sm text-[#859286] py-8 text-center">Add your first course to track attendance.</p>
            ) : (
              <div className="divide-y divide-[#EEF1EA]">
                {courses.map((course) => {
                  const pct =
                    course.totalClasses > 0
                      ? Math.round((course.attendedClasses / course.totalClasses) * 100)
                      : 100;
                  const low = pct < course.targetAttendance;
                  return (
                    <div
                      key={course.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#1F2A22]">
                          {course.courseCode ? `${course.courseCode} · ` : ''}
                          {course.courseName}
                        </p>
                        <p className="text-xs text-[#5A685C] font-mono tabular-nums">
                          {course.dayOfWeek} · {course.startTime}-{course.endTime} · {course.room || 'Room TBD'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p
                            className={`text-sm font-mono tabular-nums font-semibold ${
                              low ? 'text-[#B44C44]' : 'text-[#3E6B4F]'
                            }`}
                          >
                            {pct}% {low ? '(Below target)' : '(On track)'}
                          </p>
                          <p className="text-[11px] font-mono tabular-nums text-[#859286]">
                            {course.attendedClasses}/{course.totalClasses} attended
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateCourseAttendance(
                              uid,
                              course.id,
                              course.attendedClasses + 1,
                              course.totalClasses + 1
                            )
                          }
                          className="px-2.5 py-1.5 text-xs font-medium bg-[#EEF3EC] text-[#2C523B] rounded-md hover:bg-[#DCE8DC] cursor-pointer"
                        >
                          + Present
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateCourseAttendance(
                              uid,
                              course.id,
                              course.attendedClasses,
                              course.totalClasses + 1
                            )
                          }
                          className="px-2.5 py-1.5 text-xs font-medium bg-[#F5E2E0] text-[#7B2E28] rounded-md hover:bg-[#EED2CF] cursor-pointer"
                        >
                          + Missed
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSubdoc(uid, 'studyCourses', course.id)}
                          aria-label="Delete course"
                          className="p-1.5 text-[#859286] hover:text-[#B44C44] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 2: Assignments & Exams */}
      {activeTab === 'tasks' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddTask}
            className="lg:col-span-4 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
          >
            <h3 className="text-base font-semibold text-[#1F2A22]">Add Assignment / Exam</h3>
            <input
              type="text"
              required
              placeholder="Title (e.g., Midterm Exam)"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <input
              type="text"
              placeholder="Course (e.g., CS 301)"
              value={taskCourse}
              onChange={(e) => setTaskCourse(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as StudyTask['taskType'])}
                className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              >
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="revision">Revision</option>
              </select>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as StudyTask['priority'])}
                className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
            </div>
            <input
              type="date"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
            />
            <textarea
              rows={2}
              placeholder="Syllabus scope or deliverables..."
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
            >
              Add Study Item
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1F2A22]">Assignments & Exam Planner</h3>
            {tasks.length === 0 ? (
              <p className="text-sm text-[#859286] py-8 text-center">No assignments or exams logged yet.</p>
            ) : (
              <div className="divide-y divide-[#EEF1EA]">
                {[...tasks]
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .map((task) => (
                    <div key={task.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-[#859286]' : 'text-[#1F2A22]'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-[#5A685C]">
                          {task.courseName} · {task.taskType} · {task.priority} priority · Due{' '}
                          <span className="font-mono tabular-nums">{task.dueDate}</span>
                        </p>
                        {task.notes && <p className="text-xs text-[#859286]">{task.notes}</p>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateStudyTaskStatus(uid, task.id, e.target.value as StudyTask['status'])
                          }
                          className="px-2.5 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => deleteSubdoc(uid, 'studyTasks', task.id)}
                          aria-label="Delete study task"
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
      )}

      {/* Tab 3: Study Notes */}
      {activeTab === 'notes' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddNote}
            className="lg:col-span-5 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#3E6B4F]" />
              <h3 className="text-base font-semibold text-[#1F2A22]">Create Study Note</h3>
            </div>
            <input
              type="text"
              required
              placeholder="Note title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <input
              type="text"
              placeholder="Course name or subject"
              value={noteCourse}
              onChange={(e) => setNoteCourse(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <textarea
              rows={5}
              required
              placeholder="Key concepts, formulas, active recall questions..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Study Note</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-4">
            {notes.length === 0 ? (
              <div className="bg-white border border-[#E4E7DF] rounded-xl p-8 text-center text-sm text-[#859286]">
                No notes saved yet. Capture concepts or log a Pomodoro session above.
              </div>
            ) : (
              notes.map((note) => (
                <article key={note.id} className="bg-white border border-[#E4E7DF] rounded-xl p-5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-[#1F2A22]">{note.title}</h4>
                      <p className="text-xs text-[#5A685C]">
                        {note.courseName || 'General'}
                        {note.focusMinutes > 0 && ` · ${note.focusMinutes}m focused`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSubdoc(uid, 'studyNotes', note.id)}
                      aria-label="Delete note"
                      className="p-1 text-[#859286] hover:text-[#B44C44] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-[#2F3E33] whitespace-pre-line leading-relaxed">
                    {note.content}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
