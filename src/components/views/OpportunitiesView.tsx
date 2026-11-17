import { useMemo, useState } from 'react';
import { BookmarkPlus, Compass, Search, Trash2 } from 'lucide-react';
import {
  createOpportunity,
  deleteSubdoc,
  updateOpportunityStatus,
} from '../../services/firestoreService';
import { getOffsetDateKey, type Opportunity } from '../../types/growth';

interface OpportunitiesViewProps {
  uid: string;
  todayKey: string;
  opportunities: Opportunity[];
}

interface CatalogOpportunity {
  title: string;
  organization: string;
  oppType: Opportunity['oppType'];
  deadlineOffsetDays: number;
  notes: string;
}

const CURATED_OPPORTUNITIES: CatalogOpportunity[] = [
  {
    title: 'Google Summer of Code — Open Source Stipend',
    organization: 'Open Source Foundations',
    oppType: 'internship',
    deadlineOffsetDays: 28,
    notes: 'Mentored global open-source engineering contributor program.',
  },
  {
    title: 'Women & Builders in STEM Merit Scholarship',
    organization: 'Horizon Education Fund',
    oppType: 'scholarship',
    deadlineOffsetDays: 19,
    notes: 'Tuition grant + mentorship pairing for undergraduate innovators.',
  },
  {
    title: 'GreenCampus AI & Climate Hackathon',
    organization: 'Global Campus Innovation',
    oppType: 'hackathon',
    deadlineOffsetDays: 12,
    notes: '48-hour build sprint focused on campus sustainability and clean energy.',
  },
  {
    title: 'Full-Stack Distributed Systems Specialization',
    organization: 'OpenCourseware Consortium',
    oppType: 'course',
    deadlineOffsetDays: 35,
    notes: 'Self-paced architecture course with hands-on capstone project.',
  },
];

export function OpportunitiesView({ uid, todayKey, opportunities }: OpportunitiesViewProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | Opportunity['oppType']>('all');
  const [search, setSearch] = useState('');

  // Custom Opportunity Form
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [oppType, setOppType] = useState<Opportunity['oppType']>('internship');
  const [deadline, setDeadline] = useState(todayKey);
  const [linkUrl, setLinkUrl] = useState('');
  const [notes, setNotes] = useState('');

  const filteredSaved = useMemo(() => {
    return opportunities.filter((o) => {
      const matchesType = typeFilter === 'all' || o.oppType === typeFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.title.toLowerCase().includes(q) ||
        o.organization.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [opportunities, typeFilter, search]);

  async function handleSaveCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !organization.trim()) return;
    await createOpportunity(uid, {
      title,
      organization,
      oppType,
      deadline,
      linkUrl,
      status: 'shortlisted',
      notes,
    });
    setTitle('');
    setOrganization('');
    setLinkUrl('');
    setNotes('');
  }

  async function handleSaveFromCatalog(item: CatalogOpportunity) {
    await createOpportunity(uid, {
      title: item.title,
      organization: item.organization,
      oppType: item.oppType,
      deadline: getOffsetDateKey(item.deadlineOffsetDays),
      linkUrl: '',
      status: 'exploring',
      notes: item.notes,
    });
  }

  return (
    <div className="space-y-8">
      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#EEF3EC] rounded-lg">
          {(['all', 'internship', 'scholarship', 'hackathon', 'course'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize cursor-pointer whitespace-nowrap ${
                typeFilter === t ? 'bg-white text-[#1F2A22] shadow-xs' : 'text-[#5A685C]'
              }`}
            >
              {t === 'all' ? 'All Types' : `${t}s`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#859286] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-[#E4E7DF] rounded-lg"
          />
        </div>
      </div>

      {/* Saved Tracker + Custom Add */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveCustom}
          className="lg:col-span-4 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
        >
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#3E6B4F]" />
            <h3 className="text-base font-semibold text-[#1F2A22]">Add Opportunity</h3>
          </div>
          <input
            type="text"
            required
            placeholder="Title (e.g., Summer Research Fellowship)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <input
            type="text"
            required
            placeholder="Organization / Host"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={oppType}
              onChange={(e) => setOppType(e.target.value as Opportunity['oppType'])}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            >
              <option value="internship">Internship</option>
              <option value="scholarship">Scholarship</option>
              <option value="hackathon">Hackathon</option>
              <option value="course">Course</option>
            </select>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
            />
          </div>
          <input
            type="url"
            placeholder="Application URL (optional)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <textarea
            rows={2}
            placeholder="Eligibility notes or essays needed..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
          >
            Save to Tracker
          </button>
        </form>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1F2A22]">My Tracked Opportunities</h3>
            {filteredSaved.length === 0 ? (
              <p className="text-sm text-[#859286] py-6 text-center">
                No tracked opportunities match this filter. Bookmark one from Discover below.
              </p>
            ) : (
              <div className="divide-y divide-[#EEF1EA]">
                {filteredSaved.map((opp) => (
                  <div key={opp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#1F2A22]">{opp.title}</p>
                      <p className="text-xs text-[#5A685C]">
                        {opp.organization} · {opp.oppType} · Deadline{' '}
                        <span className="font-mono tabular-nums">{opp.deadline}</span>
                      </p>
                      {opp.notes && <p className="text-xs text-[#859286]">{opp.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={opp.status}
                        onChange={(e) =>
                          updateOpportunityStatus(uid, opp.id, e.target.value as Opportunity['status'])
                        }
                        className="px-2.5 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
                      >
                        <option value="exploring">Exploring</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="applied">Applied</option>
                        <option value="enrolled">Enrolled</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => deleteSubdoc(uid, 'opportunities', opp.id)}
                        aria-label="Remove opportunity"
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

          <div className="bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#1F2A22]">Discover Curated Opportunities</h3>
              <p className="text-xs text-[#5A685C]">Add programs directly into your personal tracker</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CURATED_OPPORTUNITIES.filter(
                (c) => typeFilter === 'all' || c.oppType === typeFilter
              ).map((item) => {
                const alreadySaved = opportunities.some((o) => o.title === item.title);
                return (
                  <div
                    key={item.title}
                    className="p-4 bg-[#FAF8F3] border border-[#E4E7DF] rounded-xl flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-[#3E6B4F] font-medium capitalize">
                        {item.oppType} · {item.organization}
                      </p>
                      <h4 className="text-sm font-semibold text-[#1F2A22]">{item.title}</h4>
                      <p className="text-xs text-[#5A685C]">{item.notes}</p>
                    </div>
                    <button
                      type="button"
                      disabled={alreadySaved}
                      onClick={() => handleSaveFromCatalog(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#3E6B4F] text-[#3E6B4F] hover:bg-[#EEF3EC] disabled:opacity-50 cursor-pointer"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>{alreadySaved ? 'Saved in Tracker' : 'Save to Tracker'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
