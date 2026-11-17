import { useState } from 'react';
import { Briefcase, CheckCircle2, Circle, FileText, Trash2 } from 'lucide-react';
import {
  createCareerApplication,
  createCareerPrepItem,
  createCareerSkill,
  deleteSubdoc,
  toggleCareerPrepItem,
  updateCareerApplicationStatus,
  updateCareerSkillProficiency,
} from '../../services/firestoreService';
import type { CareerApplication, CareerPrepItem, CareerSkill } from '../../types/growth';

interface CareerViewProps {
  uid: string;
  todayKey: string;
  skills: CareerSkill[];
  applications: CareerApplication[];
  prepItems: CareerPrepItem[];
}

export function CareerView({ uid, todayKey, skills, applications, prepItems }: CareerViewProps) {
  const [tab, setTab] = useState<'apps' | 'skills' | 'prep'>('apps');

  // Application Form
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [appType, setAppType] = useState<CareerApplication['appType']>('internship');
  const [deadline, setDeadline] = useState(todayKey);
  const [resumeVersion, setResumeVersion] = useState('v1.0');
  const [appNotes, setAppNotes] = useState('');

  // Skill Form
  const [skillName, setSkillName] = useState('');
  const [skillCat, setSkillCat] = useState('Engineering');
  const [proficiency, setProficiency] = useState(65);
  const [targetLevel, setTargetLevel] = useState(90);

  // Prep Form
  const [prepTitle, setPrepTitle] = useState('');
  const [prepCategory, setPrepCategory] = useState<CareerPrepItem['category']>('behavioral');
  const [prepNotes, setPrepNotes] = useState('');

  async function handleAddApp(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    await createCareerApplication(uid, {
      company,
      role,
      appType,
      status: 'applied',
      deadline,
      resumeVersion,
      notes: appNotes,
    });
    setCompany('');
    setRole('');
    setAppNotes('');
  }

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!skillName.trim()) return;
    await createCareerSkill(uid, {
      name: skillName,
      category: skillCat,
      proficiency,
      targetLevel,
      notes: '',
    });
    setSkillName('');
  }

  async function handleAddPrep(e: React.FormEvent) {
    e.preventDefault();
    if (!prepTitle.trim()) return;
    await createCareerPrepItem(uid, {
      title: prepTitle,
      category: prepCategory,
      answerNotes: prepNotes,
      completed: false,
    });
    setPrepTitle('');
    setPrepNotes('');
  }

  return (
    <div className="space-y-8">
      {/* Career Pipeline Summary */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Total Applications</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {applications.length}
          </p>
        </div>
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Interviewing</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#3E6B4F]">
            {applications.filter((a) => a.status === 'interviewing').length}
          </p>
        </div>
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Skills Tracked</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {skills.length}
          </p>
        </div>
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Prep Completed</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {prepItems.filter((p) => p.completed).length}/{prepItems.length}
          </p>
        </div>
      </section>

      <div className="flex items-center gap-1 p-1 bg-[#EEF3EC] rounded-lg w-fit">
        {[
          { id: 'apps', label: 'Internships & Jobs' },
          { id: 'skills', label: 'Skill Tracking' },
          { id: 'prep', label: 'Resume & Interview Prep' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              tab === t.id ? 'bg-white text-[#1F2A22] shadow-xs' : 'text-[#5A685C]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'apps' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddApp}
            className="lg:col-span-4 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#3E6B4F]" />
              <h3 className="text-base font-semibold text-[#1F2A22]">Track Application</h3>
            </div>
            <input
              type="text"
              required
              placeholder="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <input
              type="text"
              required
              placeholder="Role Title"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={appType}
                onChange={(e) => setAppType(e.target.value as CareerApplication['appType'])}
                className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              >
                <option value="internship">Internship</option>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="research">Research</option>
              </select>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
              />
            </div>
            <input
              type="text"
              placeholder="Resume version (e.g., v2.4-SWE)"
              value={resumeVersion}
              onChange={(e) => setResumeVersion(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <textarea
              rows={2}
              placeholder="Recruiter contact or interview notes..."
              value={appNotes}
              onChange={(e) => setAppNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
            >
              Add Application
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1F2A22]">Application Pipeline</h3>
            {applications.length === 0 ? (
              <p className="text-sm text-[#859286] py-8 text-center">No applications tracked yet.</p>
            ) : (
              <div className="divide-y divide-[#EEF1EA]">
                {applications.map((app) => (
                  <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#1F2A22]">
                        {app.company} — {app.role}
                      </p>
                      <p className="text-xs text-[#5A685C]">
                        {app.appType.replace('_', ' ')} · Resume {app.resumeVersion || 'Default'} · Deadline{' '}
                        <span className="font-mono tabular-nums">{app.deadline}</span>
                      </p>
                      {app.notes && <p className="text-xs text-[#859286]">{app.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={app.status}
                        disabled={app.status === 'rejected'}
                        onChange={(e) =>
                          updateCareerApplicationStatus(
                            uid,
                            app.id,
                            e.target.value as CareerApplication['status']
                          )
                        }
                        className="px-2.5 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg disabled:opacity-60"
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => deleteSubdoc(uid, 'careerApps', app.id)}
                        aria-label="Delete application"
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

      {tab === 'skills' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddSkill}
            className="lg:col-span-4 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
          >
            <h3 className="text-base font-semibold text-[#1F2A22]">Add Career Skill</h3>
            <input
              type="text"
              required
              placeholder="Skill (e.g., System Design)"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <input
              type="text"
              placeholder="Category (Engineering, Design, Data...)"
              value={skillCat}
              onChange={(e) => setSkillCat(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <div className="space-y-1">
              <label className="text-xs text-[#5A685C] font-mono tabular-nums">
                Current Proficiency: {proficiency}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={proficiency}
                onChange={(e) => setProficiency(Number(e.target.value))}
                className="w-full accent-[#3E6B4F]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#5A685C] font-mono tabular-nums">
                Target Level: {targetLevel}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={targetLevel}
                onChange={(e) => setTargetLevel(Number(e.target.value))}
                className="w-full accent-[#3E6B4F]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
            >
              Add Skill
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1F2A22]">Skill Proficiency Matrix</h3>
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.id} className="p-4 bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#1F2A22]">{skill.name}</p>
                      <p className="text-xs text-[#5A685C]">{skill.category} · Target {skill.targetLevel}%</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-sm font-semibold text-[#3E6B4F]">
                        {skill.proficiency}%
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteSubdoc(uid, 'careerSkills', skill.id)}
                        aria-label="Delete skill"
                        className="text-[#859286] hover:text-[#B44C44] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={skill.proficiency}
                    onChange={(e) =>
                      updateCareerSkillProficiency(uid, skill.id, Number(e.target.value))
                    }
                    className="w-full accent-[#3E6B4F]"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'prep' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddPrep}
            className="lg:col-span-4 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3E6B4F]" />
              <h3 className="text-base font-semibold text-[#1F2A22]">Add Resume / Interview Item</h3>
            </div>
            <input
              type="text"
              required
              placeholder="Prompt or resume check"
              value={prepTitle}
              onChange={(e) => setPrepTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <select
              value={prepCategory}
              onChange={(e) => setPrepCategory(e.target.value as CareerPrepItem['category'])}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            >
              <option value="resume">Resume Checklist</option>
              <option value="behavioral">Behavioral Interview</option>
              <option value="technical">Technical Interview</option>
            </select>
            <textarea
              rows={4}
              placeholder="Draft your STAR story or bullet improvements..."
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
            >
              Save Prep Item
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1F2A22]">Resume & Interview Prep</h3>
            <div className="divide-y divide-[#EEF1EA]">
              {prepItems.map((item) => (
                <div key={item.id} className="py-4 flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => toggleCareerPrepItem(uid, item.id, !item.completed)}
                    className="flex items-start gap-3 text-left flex-1 cursor-pointer"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#3E6B4F] mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#9AA89B] mt-0.5 shrink-0" />
                    )}
                    <div className="space-y-1">
                      <p className={`text-sm font-medium ${item.completed ? 'line-through text-[#859286]' : 'text-[#1F2A22]'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-[#5A685C]">{item.category}</p>
                      {item.answerNotes && (
                        <p className="text-xs text-[#2F3E33] whitespace-pre-line">{item.answerNotes}</p>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSubdoc(uid, 'careerPrep', item.id)}
                    aria-label="Delete prep item"
                    className="p-1 text-[#859286] hover:text-[#B44C44] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
