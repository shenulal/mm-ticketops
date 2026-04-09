import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  MOCK_MATCHES, MOCK_SUBGAMES, MOCK_SALE_LINE_ITEMS, MOCK_PURCHASE_LINE_ITEMS, MOCK_UNITS,
  getInventorySummary, getSellThroughByCat, getSubGamesForMatch,
} from '@/data/mockData';
import { Activity, GitBranch, Package, TrendingUp } from 'lucide-react';
import DashboardControlBar, { type DashboardFilters } from './DashboardControlBar';
import { CHART_COLORS, ChartCard, CUSTOM_TOOLTIP_STYLE } from './chartHelpers';
import ActionCenter from './ActionCenter';

function KPI({ label, value, sub, borderColor, icon: Icon, iconColor, badge }: {
  label: string; value: string; sub: string; borderColor: string; icon: any; iconColor: string; badge?: string;
}) {
  return (
    <div className="bg-card rounded-xl p-4 shadow-sm flex-1 min-w-[170px]" style={{ borderLeft: `4px solid ${borderColor}` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-display text-[24px] mt-1" style={{ color: CHART_COLORS.navy }}>{value}</p>
          <p className="font-body text-[11px] mt-1 text-muted-foreground">{sub}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Icon size={18} style={{ color: iconColor }} />
          {badge && <span className="px-1.5 py-0.5 rounded font-body text-[9px] font-medium bg-warning/15 text-warning">{badge}</span>}
        </div>
      </div>
    </div>
  );
}

export default function SrOperatorDashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DashboardFilters>({
    eventId: 'evt1', matchId: 'm01', subGameId: 'sg-m01-main',
    dateRange: 'alltime', viewMode: 'overview', currency: 'AED',
  });
  const upd = (p: Partial<DashboardFilters>) => setFilters(f => ({ ...f, ...p }));
  const sgId = filters.subGameId !== 'all' ? filters.subGameId : 'sg-m01-main';

  const inv = useMemo(() => getInventorySummary(filters.subGameId !== 'all' ? filters.subGameId : undefined), [filters.subGameId]);
  const sellThrough = useMemo(() => getSellThroughByCat(sgId), [sgId]);
  const unallocLines = MOCK_SALE_LINE_ITEMS.filter(l => l.status === 'UNALLOCATED');
  const totalSold = MOCK_SALE_LINE_ITEMS.reduce((s, l) => s + l.qty, 0);
  const totalPurchased = MOCK_PURCHASE_LINE_ITEMS.reduce((s, l) => s + l.qty, 0);
  const sellPct = totalPurchased > 0 ? Math.round((totalSold / totalPurchased) * 100) : 0;

  const invChartData = sellThrough.map(c => ({
    name: c.label,
    dispatched: getInventorySummary(sgId, c.id).dispatched,
    allocated: getInventorySummary(sgId, c.id).allocated,
    available: getInventorySummary(sgId, c.id).available,
  }));

  const sellThroughBars = sellThrough.map(c => ({ name: c.label, pct: c.sellThroughPct, sold: c.sold, purchased: c.purchased }));

  // Heatmap data
  const matches = MOCK_MATCHES.filter(m => m.eventId === filters.eventId);
  const allCats = [...new Set(MOCK_SUBGAMES.flatMap(sg => sg.categories.map(c => c.label)))];
  const heatmapData = allCats.map(catLabel => {
    const cells = matches.map(m => {
      const sgs = getSubGamesForMatch(m.id);
      let avail = 0, total = 0;
      sgs.forEach(sg => {
        const cat = sg.categories.find(c => c.label === catLabel);
        if (cat) {
          const s = getInventorySummary(sg.id, cat.id);
          avail += s.available;
          total += s.total;
        }
      });
      const pct = total > 0 ? Math.round((avail / total) * 100) : -1;
      return { matchCode: m.code, avail, total, pct };
    });
    return { category: catLabel, cells };
  });

  const heatColor = (pct: number) =>
    pct < 0 ? '#F3F4F6' : pct > 60 ? CHART_COLORS.teal : pct > 30 ? CHART_COLORS.amber : pct > 10 ? '#F97316' : '#DC2626';

  return (
    <div>
      <DashboardControlBar filters={filters} onChange={upd} showViewMode />
      <ActionCenter />
      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="flex gap-4">
          <KPI label="My Entries Today" value="3" sub="2 purchases + 1 sale" borderColor={CHART_COLORS.navy} icon={Activity} iconColor={CHART_COLORS.navy} />
          <KPI label="Unallocated Lines" value={`${unallocLines.length} lines`} sub={`${unallocLines.reduce((s, l) => s + l.qty, 0)} tickets need allocation`}
            borderColor={CHART_COLORS.amber} icon={GitBranch} iconColor={CHART_COLORS.amber} badge={unallocLines.length > 0 ? 'Action needed' : undefined} />
          <KPI label="Units Available" value={`${inv.available} units`} sub={`Across ${sellThrough.length} categories`}
            borderColor={CHART_COLORS.teal} icon={Package} iconColor={CHART_COLORS.teal} />
          <KPI label="Sell-Through" value={`${sellPct}%`} sub={`${totalSold} of ${totalPurchased} tickets`}
            borderColor={CHART_COLORS.green} icon={TrendingUp} iconColor={CHART_COLORS.green} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-5 gap-6">
          <ChartCard title="Inventory by Category" className="col-span-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invChartData}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="dispatched" stackId="a" fill={CHART_COLORS.navy} name="Dispatched" />
                <Bar dataKey="allocated" stackId="a" fill={CHART_COLORS.gold} name="Allocated" />
                <Bar dataKey="available" stackId="a" fill={CHART_COLORS.green} name="Available" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Sell-Through Rate" className="col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sellThroughBars} layout="vertical">
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={80} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`]} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {sellThroughBars.map((d, i) => <Cell key={i} fill={d.pct > 70 ? CHART_COLORS.green : d.pct > 40 ? CHART_COLORS.amber : '#DC2626'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Unallocated Priority List */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <h3 className="font-body text-[15px] font-semibold mb-4" style={{ color: CHART_COLORS.navy }}>Unallocated Sales — Allocation Required</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-muted">
                {['Sale ID', 'Client', 'Match', 'Line', 'Category', 'Qty', 'Available', 'Priority', 'Action'].map(h => (
                  <th key={h} className="px-3 py-2 font-body text-[11px] font-medium uppercase text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {unallocLines.map((li, i) => {
                  const sg = MOCK_SUBGAMES.find(s => s.id === li.subGameId);
                  const match = MOCK_MATCHES.find(m => m.id === sg?.matchId);
                  const avail = getInventorySummary(li.subGameId, li.categoryId).available;
                  return (
                    <tr key={li.id} className="border-b border-border/50">
                      <td className="px-3 py-2 font-mono text-[12px] text-primary">{li.saleId.toUpperCase()}</td>
                      <td className="px-3 py-2 font-body text-[12px]">—</td>
                      <td className="px-3 py-2 font-body text-[12px]">{match?.code ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-[12px]">L{i + 1}</td>
                      <td className="px-3 py-2 font-body text-[12px]">{li.categoryLabel}</td>
                      <td className="px-3 py-2 font-mono text-[12px]">{li.qty}</td>
                      <td className="px-3 py-2 font-mono text-[12px] text-success">{avail}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium bg-warning/15 text-warning">NORMAL</span>
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => navigate('/distribution')} className="px-3 py-1.5 rounded-lg font-body text-[11px] font-medium bg-accent text-accent-foreground hover:opacity-90">Allocate Now</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Heatmap */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <h3 className="font-body text-[15px] font-semibold mb-4" style={{ color: CHART_COLORS.navy }}>Inventory Availability Grid</h3>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: `120px repeat(${matches.length}, 120px)` }}>
              <div />
              {matches.map(m => <div key={m.id} className="text-center font-body text-[11px] font-medium text-muted-foreground py-1">{m.code}</div>)}
              {heatmapData.map(row => (
                <>
                  <div key={row.category} className="font-body text-[12px] text-foreground py-2 pr-2">{row.category}</div>
                  {row.cells.map(cell => (
                    <div key={`${row.category}-${cell.matchCode}`}
                      className="rounded-lg py-2 text-center font-mono text-[11px] text-primary-foreground cursor-default"
                      style={{ backgroundColor: heatColor(cell.pct) }}
                      title={`${cell.matchCode} | ${row.category} | Available: ${cell.avail} / ${cell.total}`}>
                      {cell.pct < 0 ? '—' : `${cell.avail}/${cell.total}`}
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            {[
              ['>60%', CHART_COLORS.teal], ['30–60%', CHART_COLORS.amber],
              ['10–30%', '#F97316'], ['<10%', '#DC2626'],
            ].map(([l, c]) => (
              <div key={l as string} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: c as string }} />
                <span className="font-body text-[10px] text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
