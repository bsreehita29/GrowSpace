import { useState } from 'react';
import type { FinanceTransaction, HealthLog, MoodEntry } from '../../types/growth';

export function MoodStressChart({ entries }: { entries: MoodEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.dateKey.localeCompare(b.dateKey)).slice(-10);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (sorted.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-[#859286]">
        Log your first mood check-in to see your emotional trajectory.
      </div>
    );
  }

  const width = 560;
  const height = 180;
  const padX = 28;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const getX = (i: number) =>
    sorted.length === 1 ? padX + innerW / 2 : padX + (i / (sorted.length - 1)) * innerW;
  const getY = (val: number) => padY + ((5 - val) / 4) * innerH;

  const moodPath = sorted.map((e, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(e.moodScore)}`).join(' ');
  const stressPath = sorted.map((e, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(e.stressLevel)}`).join(' ');

  const hovered = hoverIdx !== null ? sorted[hoverIdx] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[#5A685C]">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#3E6B4F] inline-block" />
            Mood (1-5)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#C07A72] inline-block" />
            Stress (1-5)
          </span>
        </div>
        {hovered && (
          <span className="font-mono tabular-nums text-[#1F2A22]">
            {hovered.dateKey} · Mood {hovered.moodScore}/5 · Stress {hovered.stressLevel}/5
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
        {[1, 2, 3, 4, 5].map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#EEF1EA" strokeWidth="1" />
              <text x={8} y={y + 4} className="fill-[#859286] text-[10px] font-mono">
                {tick}
              </text>
            </g>
          );
        })}

        <path d={stressPath} fill="none" stroke="#C07A72" strokeWidth="2" strokeDasharray="4 4" />
        <path d={moodPath} fill="none" stroke="#3E6B4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {sorted.map((entry, idx) => {
          const cx = getX(idx);
          const cyMood = getY(entry.moodScore);
          const cyStress = getY(entry.stressLevel);
          return (
            <g
              key={entry.id}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <circle cx={cx} cy={cyStress} r={hoverIdx === idx ? 5 : 3.5} fill="#C07A72" />
              <circle cx={cx} cy={cyMood} r={hoverIdx === idx ? 5.5 : 4} fill="#3E6B4F" />
              <text
                x={cx}
                y={height - 2}
                textAnchor="middle"
                className="fill-[#859286] text-[9px] font-mono"
              >
                {entry.dateKey.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function HealthTrendsChart({ logs }: { logs: HealthLog[] }) {
  const sorted = [...logs].sort((a, b) => a.dateKey.localeCompare(b.dateKey)).slice(-7);

  if (sorted.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-[#859286]">
        Log today&apos;s sleep and water intake to view your 7-day trend.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-5 text-xs text-[#5A685C]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#8AA992] inline-block" />
          Sleep (hrs)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#A9C7CE] inline-block" />
          Water (L)
        </span>
      </div>
      <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4 border-b border-[#E4E7DF] pb-2">
        {sorted.map((log) => {
          const sleepPct = Math.min(100, Math.round((log.sleepHours / 10) * 100));
          const waterLiters = log.waterMl / 1000;
          const waterPct = Math.min(100, Math.round((waterLiters / 3.5) * 100));
          return (
            <div key={log.id} className="flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="flex items-end gap-1 h-28 w-full justify-center">
                <div
                  title={`Sleep: ${log.sleepHours}h`}
                  style={{ height: `${Math.max(8, sleepPct)}%` }}
                  className="w-3 bg-[#8AA992] rounded-t-sm transition-all"
                />
                <div
                  title={`Water: ${waterLiters.toFixed(1)}L`}
                  style={{ height: `${Math.max(8, waterPct)}%` }}
                  className="w-3 bg-[#A9C7CE] rounded-t-sm transition-all"
                />
              </div>
              <span className="text-[10px] font-mono tabular-nums text-[#5A685C]">
                {log.dateKey.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface PillarScore {
  label: string;
  score: number;
}

export function LifeBalanceRadar({ pillars }: { pillars: PillarScore[] }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 82;
  const count = pillars.length;

  const getPoint = (index: number, pct: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (pct / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = pillars
    .map((p, idx) => {
      const pt = getPoint(idx, Math.max(15, p.score));
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-56 h-56 shrink-0">
        {[25, 50, 75, 100].map((ring) => {
          const pts = pillars
            .map((_, idx) => {
              const pt = getPoint(idx, ring);
              return `${pt.x},${pt.y}`;
            })
            .join(' ');
          return <polygon key={ring} points={pts} fill="none" stroke="#E4E7DF" strokeWidth="1" />;
        })}

        {pillars.map((p, idx) => {
          const outer = getPoint(idx, 100);
          const labelPt = getPoint(idx, 122);
          return (
            <g key={p.label}>
              <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#E4E7DF" strokeWidth="1" />
              <text
                x={labelPt.x}
                y={labelPt.y + 3}
                textAnchor="middle"
                className="fill-[#5A685C] text-[10px] font-medium"
              >
                {p.label}
              </text>
            </g>
          );
        })}

        <polygon
          points={polygonPoints}
          fill="rgba(62, 107, 79, 0.18)"
          stroke="#3E6B4F"
          strokeWidth="2"
        />

        {pillars.map((p, idx) => {
          const pt = getPoint(idx, Math.max(15, p.score));
          return <circle key={p.label} cx={pt.x} cy={pt.y} r="3.5" fill="#3E6B4F" />;
        })}
      </svg>

      <div className="flex-1 w-full space-y-2.5">
        {pillars.map((p) => (
          <div key={p.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#2F3E33] font-medium">{p.label}</span>
              <span className="font-mono tabular-nums text-[#5A685C]">{p.score}%</span>
            </div>
            <div className="h-1.5 bg-[#EEF1EA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3E6B4F] rounded-full transition-all"
                style={{ width: `${p.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinanceCategoryChart({
  transactions,
  currency,
}: {
  transactions: FinanceTransaction[];
  currency: string;
}) {
  const expenses = transactions.filter((t) => t.txType === 'expense');
  const totals: Record<string, number> = {};
  for (const tx of expenses) {
    totals[tx.category || 'Other'] = (totals[tx.category || 'Other'] || 0) + tx.amount;
  }
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const grandTotal = rows.reduce((s, r) => s + r[1], 0);

  if (rows.length === 0) {
    return (
      <p className="text-xs text-[#859286] py-6">
        No expenses recorded yet. Add an expense to see category allocation.
      </p>
    );
  }

  const barColors = ['#3E6B4F', '#8AA992', '#C09A6B', '#8FAAB5', '#B998B2'];

  return (
    <div className="space-y-3">
      {rows.map(([cat, amt], idx) => {
        const pct = grandTotal > 0 ? Math.round((amt / grandTotal) * 100) : 0;
        return (
          <div key={cat} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#2F3E33]">{cat}</span>
              <span className="font-mono tabular-nums text-[#5A685C]">
                {currency}
                {amt.toFixed(2)} ({pct}%)
              </span>
            </div>
            <div className="h-2 bg-[#EEF1EA] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: barColors[idx % barColors.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
