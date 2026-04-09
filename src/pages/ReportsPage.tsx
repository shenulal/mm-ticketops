import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '@/context/AppContext';
import { useEvent } from '@/context/EventContext';
import { TrendingUp, ShoppingCart, BarChart3, Send, ChevronRight, ChevronDown } from 'lucide-react';
import {
  MOCK_MATCHES, MOCK_SUBGAMES, MOCK_PURCHASE_LINE_ITEMS, MOCK_SALE_LINE_ITEMS,
  MOCK_UNITS, MOCK_DIST_ROWS, hasMultipleSubGames, getSubGamesForMatch,
  type SubGame, type PurchaseLineItem, type SaleLineItem,
} from '@/data/mockData';

type Tab = 'summary' | 'health' | 'allocation' | 'dispatch' | 'pnl';
type DrillLevel = 'event' | 'match' | 'subgame';

const TABS: { key: Tab; label: string }[] = [
  { key: 'summary', label: 'Event Summary' },
  { key: 'health', label: 'Inventory Health' },
  { key: 'allocation', label: 'Allocation Progress' },
  { key: 'dispatch', label: 'Dispatch Status' },
  { key: 'pnl', label: 'Financial P&L' },
];

// helpers
function purchasedForSgCat(sgId: string, catId: string) {
  return MOCK_PURCHASE_LINE_ITEMS.filter(l => l.subGameId === sgId && l.categoryId === catId).reduce((s, l) => s + l.qty, 0);
}
function soldForSgCat(sgId: string, catId: string) {
  return MOCK_SALE_LINE_ITEMS.filter(l => l.subGameId === sgId && l.categoryId === catId).reduce((s, l) => s + l.qty, 0);
}
function allocatedForSgCat(sgId: string, catId: string) {
  return MOCK_UNITS.filter(u => u.subGameId === sgId && u.categoryId === catId && u.status === 'ALLOCATED').length;
}
function dispatchedForSgCat(sgId: string, catId: string) {
  return MOCK_DIST_ROWS.filter(r => r.subGameId === sgId && r.categoryId === catId && r.dispatchStatus === 'SENT').length;
}
function revenueForSgCat(sgId: string, catId: string) {
  return MOCK_SALE_LINE_ITEMS.filter(l => l.subGameId === sgId && l.categoryId === catId).reduce((s, l) => s + l.lineTotal, 0);
}
function costForSgCat(sgId: string, catId: string) {
  return MOCK_PURCHASE_LINE_ITEMS.filter(l => l.subGameId === sgId && l.categoryId === catId).reduce((s, l) => s + l.lineTotal, 0);
}

function matchStats(matchId: string) {
  const sgs = getSubGamesForMatch(matchId);
  let purchased = 0, sold = 0, allocated = 0, dispatched = 0, revenue = 0;
  sgs.forEach(sg => sg.categories.forEach(c => {
    purchased += purchasedForSgCat(sg.id, c.id);
    sold += soldForSgCat(sg.id, c.id);
    allocated += allocatedForSgCat(sg.id, c.id);
    dispatched += dispatchedForSgCat(sg.id, c.id);
    revenue += revenueForSgCat(sg.id, c.id);
  }));
  return { purchased, sold, allocated, dispatched, revenue };
}

function sgStats(sg: SubGame) {
  let purchased = 0, sold = 0, allocated = 0, dispatched = 0;
  sg.categories.forEach(c => {
    purchased += purchasedForSgCat(sg.id, c.id);
    sold += soldForSgCat(sg.id, c.id);
    allocated += allocatedForSgCat(sg.id, c.id);
    dispatched += dispatchedForSgCat(sg.id, c.id);
  });
  return { purchased, sold, allocated, dispatched };
}

const fmtAED = (v: number) => v === 0 ? '—' : `AED ${v.toLocaleString()}`;

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [drillMatch, setDrillMatch] = useState<string | null>(null);
  const [expandedSg, setExpandedSg] = useState<Set<string>>(new Set());

  const toggleSg = (id: string) => setExpandedSg(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  // global metrics
  const totalRevenue = MOCK_SALE_LINE_ITEMS.reduce((s, l) => s + l.lineTotal, 0);
  const totalCost = MOCK_PURCHASE_LINE_ITEMS.reduce((s, l) => s + l.lineTotal, 0);
  const margin = totalRevenue - totalCost;
  const marginPct = totalCost > 0 ? ((margin / totalCost) * 100).toFixed(1) : '0';
  const totalDispatched = MOCK_DIST_ROWS.filter(r => r.dispatchStatus === 'SENT').length;
  const totalAllocated = MOCK_UNITS.filter(u => u.status === 'ALLOCATED').length;

  const METRICS = [
    { label: 'Total Revenue', value: fmtAED(totalRevenue), sub: `↑ from ${MOCK_SALE_LINE_ITEMS.length} sale lines`, borderColor: '#1A7A4A', icon: TrendingUp, iconColor: '#1A7A4A' },
    { label: 'Total Cost', value: fmtAED(totalCost), sub: `${MOCK_PURCHASE_LINE_ITEMS.length} purchase lines`, borderColor: '#0B2D5E', icon: ShoppingCart, iconColor: '#0B2D5E' },
    { label: 'Gross Margin', value: fmtAED(margin), sub: `${marginPct}% margin`, borderColor: '#D97706', icon: BarChart3, iconColor: '#D97706' },
    { label: 'Dispatch Rate', value: totalAllocated > 0 ? `${((totalDispatched / totalAllocated) * 100).toFixed(1)}%` : '0%', sub: `${totalDispatched} of ${totalAllocated} sent`, borderColor: '#6B7280', icon: Send, iconColor: '#6B7280' },
  ];

  // donut data for selected match or overall
  const donutData = useMemo(() => {
    if (!drillMatch) {
      // all units are either ALLOCATED or AVAILABLE
      return [
        { name: 'Dispatched', value: totalDispatched, color: '#0B2D5E' },
        { name: 'Allocated (not dispatched)', value: totalAllocated - totalDispatched, color: '#C9A84C' },
        { name: 'Available', value: MOCK_UNITS.filter(u => u.status === 'AVAILABLE').length, color: '#1A7A4A' },
      ];
    }
    const isMulti = hasMultipleSubGames(drillMatch);
    const sgs = getSubGamesForMatch(drillMatch);
    if (!isMulti) {
      // flat
      const alloc = sgs.reduce((s, sg) => s + sg.categories.reduce((ss, c) => ss + allocatedForSgCat(sg.id, c.id), 0), 0);
      const disp = sgs.reduce((s, sg) => s + sg.categories.reduce((ss, c) => ss + dispatchedForSgCat(sg.id, c.id), 0), 0);
      const avail = MOCK_UNITS.filter(u => u.matchId === drillMatch && u.status === 'AVAILABLE').length;
      return [
        { name: 'Dispatched', value: disp, color: '#0B2D5E' },
        { name: 'Allocated', value: alloc - disp, color: '#C9A84C' },
        { name: 'Available', value: avail, color: '#1A7A4A' },
      ];
    }
    // multi sub-game: segments per sg+cat
    const segments: { name: string; value: number; color: string }[] = [];
    const colors = ['#0B2D5E', '#C9A84C', '#1A7A4A', '#D97706', '#6366F1', '#DC2626', '#059669', '#8B5CF6'];
    let ci = 0;
    sgs.forEach(sg => {
      sg.categories.forEach(cat => {
        const avail = MOCK_UNITS.filter(u => u.subGameId === sg.id && u.categoryId === cat.id && u.status === 'AVAILABLE').length;
        const alloc = allocatedForSgCat(sg.id, cat.id);
        const disp = dispatchedForSgCat(sg.id, cat.id);
        const total = avail + alloc;
        if (total > 0) {
          segments.push({ name: `${sg.name} — ${cat.label}`, value: total, color: colors[ci % colors.length] });
          ci++;
        }
      });
    });
    return segments.length > 0 ? segments : [{ name: 'No inventory', value: 1, color: '#E5E7EB' }];
  }, [drillMatch, totalDispatched, totalAllocated]);

  const selectedMatch = drillMatch ? MOCK_MATCHES.find(m => m.id === drillMatch) : null;

  const DonutTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    const total = donutData.reduce((s, i) => s + i.value, 0);
    // For multi-subgame, show breakdown
    const sgId = drillMatch && hasMultipleSubGames(drillMatch) ? d.name : null;
    let extra = '';
    if (sgId && drillMatch) {
      // parse sg+cat from name
      const sgs = getSubGamesForMatch(drillMatch);
      for (const sg of sgs) {
        for (const cat of sg.categories) {
          if (`${sg.name} — ${cat.label}` === d.name) {
            const avail = MOCK_UNITS.filter(u => u.subGameId === sg.id && u.categoryId === cat.id && u.status === 'AVAILABLE').length;
            const alloc = allocatedForSgCat(sg.id, cat.id);
            const disp = dispatchedForSgCat(sg.id, cat.id);
            extra = `${avail} available, ${alloc} allocated, ${disp} dispatched`;
          }
        }
      }
    }
    return (
      <div className="bg-white rounded-lg shadow-lg border px-3 py-2" style={{ borderColor: '#E5E7EB' }}>
        <p className="font-body text-sm font-medium" style={{ color: '#1A1A2E' }}>{d.name}</p>
        <p className="font-mono text-xs" style={{ color: '#6B7280' }}>{d.value} units · {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</p>
        {extra && <p className="font-body text-[11px] mt-1" style={{ color: '#6B7280' }}>{extra}</p>}
      </div>
    );
  };

  // P&L data grouped by match > subgame > category
  const pnlRows = useMemo(() => {
    const rows: { match: string; subGame: string; category: string; cost: number; revenue: number; margin: number; isGroupHeader?: boolean; groupLabel?: string }[] = [];
    MOCK_MATCHES.forEach(m => {
      const sgs = getSubGamesForMatch(m.id);
      const isMulti = hasMultipleSubGames(m.id);
      sgs.forEach(sg => {
        sg.categories.forEach(cat => {
          const cost = costForSgCat(sg.id, cat.id);
          const rev = revenueForSgCat(sg.id, cat.id);
          if (cost > 0 || rev > 0) {
            rows.push({
              match: `${m.code} ${m.teams}`,
              subGame: isMulti ? sg.name : '—',
              category: cat.label,
              cost, revenue: rev, margin: rev - cost,
            });
          }
        });
      });
    });
    return rows;
  }, []);

  return (
    <div>
      <h1 className="font-display text-[26px] mb-4" style={{ color: '#0B2D5E' }}>Reports</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-6" style={{ borderColor: '#E5E7EB' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); if (t.key !== 'summary' && t.key !== 'health') setDrillMatch(null); }}
            className="pb-2.5 font-body text-sm font-medium relative"
            style={{ color: activeTab === t.key ? '#0B2D5E' : '#6B7280' }}>
            {t.label}
            {activeTab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#0B2D5E' }} />}
          </button>
        ))}
      </div>

      {/* === EVENT SUMMARY TAB === */}
      {activeTab === 'summary' && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {METRICS.map(m => (
              <div key={m.label} className="bg-white rounded-xl p-5 shadow-sm" style={{ borderLeft: `4px solid ${m.borderColor}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-body text-xs uppercase tracking-wide" style={{ color: '#6B7280' }}>{m.label}</p>
                    <p className="font-display text-2xl mt-1" style={{ color: '#0B2D5E' }}>{m.value}</p>
                    <p className="font-body text-xs mt-1" style={{ color: '#6B7280' }}>{m.sub}</p>
                  </div>
                  <m.icon size={20} style={{ color: m.iconColor }} />
                </div>
              </div>
            ))}
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mb-4 font-body text-sm">
            <button onClick={() => setDrillMatch(null)} className="font-medium hover:underline" style={{ color: drillMatch ? '#C9A84C' : '#0B2D5E' }}>Event</button>
            {drillMatch && (
              <>
                <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
                <span className="font-medium" style={{ color: '#0B2D5E' }}>{selectedMatch?.code} {selectedMatch?.teams}</span>
                {hasMultipleSubGames(drillMatch) && (
                  <>
                    <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
                    <span style={{ color: '#6B7280' }}>Sub-Game</span>
                    <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
                    <span style={{ color: '#6B7280' }}>Category</span>
                  </>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
            {/* Table */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>
                  {drillMatch ? `${selectedMatch?.code} ${selectedMatch?.teams} — Sub-Game Breakdown` : 'Match Summary'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                {!drillMatch ? (
                  /* Match-level table */
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ backgroundColor: '#0B2D5E' }}>
                        {['', 'Match', 'Purchased', 'Sold', 'Allocated', 'Dispatched', 'Revenue', 'Status'].map(h => (
                          <th key={h} className="px-4 py-2.5 font-body text-[11px] font-bold text-white">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_MATCHES.map((m, i) => {
                        const s = matchStats(m.id);
                        const hasData = s.purchased > 0;
                        return (
                          <tr key={m.id} className="cursor-pointer hover:bg-gray-50 transition-colors"
                            style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}
                            onClick={() => setDrillMatch(m.id)}>
                            <td className="px-4 py-3"><ChevronRight size={14} style={{ color: '#9CA3AF' }} /></td>
                            <td className="px-4 py-3 font-body text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{m.code} {m.teams}</td>
                            <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{s.purchased}</td>
                            <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{s.sold}</td>
                            <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{s.allocated}</td>
                            <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{s.dispatched}</td>
                            <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{fmtAED(s.revenue)}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium"
                                style={{ backgroundColor: hasData ? '#D1FAE5' : '#F3F4F6', color: hasData ? '#065F46' : '#374151' }}>
                                {hasData ? 'ACTIVE' : 'PLANNING'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  /* Sub-game breakdown for selected match */
                  <SubGameBreakdown matchId={drillMatch} expandedSg={expandedSg} toggleSg={toggleSg} />
                )}
              </div>
            </div>

            {/* Donut */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-display text-lg mb-4" style={{ color: '#0B2D5E' }}>
                {drillMatch && hasMultipleSubGames(drillMatch) ? 'Inventory by Session' : 'Inventory Breakdown'}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-3">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="font-body text-xs" style={{ color: '#6B7280' }}>{d.name}</span>
                    <span className="font-mono text-xs ml-auto" style={{ color: '#1A1A2E' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Oversell alerts */}
          <OversellAlerts />
        </>
      )}

      {/* === INVENTORY HEALTH TAB === */}
      {activeTab === 'health' && (
        <>
          <div className="flex items-center gap-1.5 mb-4 font-body text-sm">
            <button onClick={() => setDrillMatch(null)} className="font-medium hover:underline" style={{ color: drillMatch ? '#C9A84C' : '#0B2D5E' }}>Event</button>
            {drillMatch && (
              <>
                <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
                <span className="font-medium" style={{ color: '#0B2D5E' }}>{selectedMatch?.code} {selectedMatch?.teams}</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>
                  {drillMatch ? 'Sub-Game Inventory Health' : 'Match Inventory Health'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                {!drillMatch ? (
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ backgroundColor: '#0B2D5E' }}>
                        {['', 'Match', 'Purchased', 'Available', 'Allocated', 'Dispatched', 'Status'].map(h => (
                          <th key={h} className="px-4 py-2.5 font-body text-[11px] font-bold text-white">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_MATCHES.map((m, i) => {
                        const s = matchStats(m.id);
                        const avail = MOCK_UNITS.filter(u => u.matchId === m.id && u.status === 'AVAILABLE').length;
                        return (
                          <tr key={m.id} className="cursor-pointer hover:bg-gray-50" style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}
                            onClick={() => setDrillMatch(m.id)}>
                            <td className="px-4 py-3"><ChevronRight size={14} style={{ color: '#9CA3AF' }} /></td>
                            <td className="px-4 py-3 font-body text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{m.code} {m.teams}</td>
                            <td className="px-4 py-3 font-mono text-[13px]">{s.purchased}</td>
                            <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A7A4A' }}>{avail}</td>
                            <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#C9A84C' }}>{s.allocated}</td>
                            <td className="px-4 py-3 font-mono text-[13px]">{s.dispatched}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium"
                                style={{ backgroundColor: s.purchased > 0 ? '#D1FAE5' : '#F3F4F6', color: s.purchased > 0 ? '#065F46' : '#374151' }}>
                                {s.purchased > 0 ? 'ACTIVE' : 'NO STOCK'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <SubGameBreakdown matchId={drillMatch} expandedSg={expandedSg} toggleSg={toggleSg} />
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-display text-lg mb-4" style={{ color: '#0B2D5E' }}>
                {drillMatch && hasMultipleSubGames(drillMatch) ? 'Inventory by Session' : 'Inventory Breakdown'}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-3">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="font-body text-xs" style={{ color: '#6B7280' }}>{d.name}</span>
                    <span className="font-mono text-xs ml-auto" style={{ color: '#1A1A2E' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <OversellAlerts />
        </>
      )}

      {/* === FINANCIAL P&L TAB === */}
      {activeTab === 'pnl' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>Profit & Loss — Line Item Breakdown</h3>
            <p className="font-body text-xs mt-1" style={{ color: '#6B7280' }}>Grouped by Match → Sub-Game → Category</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ backgroundColor: '#0B2D5E' }}>
                  {['Match', 'Sub-Game', 'Category', 'Purchase Cost', 'Sale Revenue', 'Margin', 'Margin %'].map(h => (
                    <th key={h} className="px-4 py-2.5 font-body text-[11px] font-bold text-white">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pnlRows.map((r, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}>
                    <td className="px-4 py-3 font-body text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{r.match}</td>
                    <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#6B7280' }}>{r.subGame}</td>
                    <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.category}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#DC2626' }}>{fmtAED(r.cost)}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A7A4A' }}>{fmtAED(r.revenue)}</td>
                    <td className="px-4 py-3 font-mono text-[13px] font-bold" style={{ color: r.margin >= 0 ? '#1A7A4A' : '#DC2626' }}>{fmtAED(r.margin)}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: r.margin >= 0 ? '#1A7A4A' : '#DC2626' }}>
                      {r.cost > 0 ? `${((r.margin / r.cost) * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
                {/* Totals */}
                <tr style={{ backgroundColor: '#F0F4F8', borderTop: '2px solid #0B2D5E' }}>
                  <td colSpan={3} className="px-4 py-3 font-body text-[13px] font-bold" style={{ color: '#0B2D5E' }}>TOTAL</td>
                  <td className="px-4 py-3 font-mono text-[13px] font-bold" style={{ color: '#DC2626' }}>{fmtAED(totalCost)}</td>
                  <td className="px-4 py-3 font-mono text-[13px] font-bold" style={{ color: '#1A7A4A' }}>{fmtAED(totalRevenue)}</td>
                  <td className="px-4 py-3 font-mono text-[13px] font-bold" style={{ color: margin >= 0 ? '#1A7A4A' : '#DC2626' }}>{fmtAED(margin)}</td>
                  <td className="px-4 py-3 font-mono text-[13px] font-bold" style={{ color: margin >= 0 ? '#1A7A4A' : '#DC2626' }}>{marginPct}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Placeholder for other tabs */}
      {(activeTab === 'allocation' || activeTab === 'dispatch') && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="font-body text-sm" style={{ color: '#6B7280' }}>
            {activeTab === 'allocation' ? 'Allocation Progress' : 'Dispatch Status'} — coming soon
          </p>
        </div>
      )}
    </div>
  );
}

/* === Sub-Game Breakdown Table Component === */
function SubGameBreakdown({ matchId, expandedSg, toggleSg }: { matchId: string; expandedSg: Set<string>; toggleSg: (id: string) => void }) {
  const sgs = getSubGamesForMatch(matchId);
  const isMulti = hasMultipleSubGames(matchId);

  if (!isMulti) {
    // Single sub-game — flat category rows, no sub-game column
    const sg = sgs[0];
    if (!sg) return <div className="p-6 text-center font-body text-sm" style={{ color: '#6B7280' }}>No inventory data</div>;
    return (
      <table className="w-full text-left">
        <thead>
          <tr style={{ backgroundColor: '#0B2D5E' }}>
            {['Category', 'Purchased', 'Sold', 'Allocated', 'Dispatched', 'Revenue', 'Status'].map(h => (
              <th key={h} className="px-4 py-2.5 font-body text-[11px] font-bold text-white">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sg.categories.map((cat, i) => {
            const p = purchasedForSgCat(sg.id, cat.id);
            const s = soldForSgCat(sg.id, cat.id);
            const a = allocatedForSgCat(sg.id, cat.id);
            const d = dispatchedForSgCat(sg.id, cat.id);
            const rev = revenueForSgCat(sg.id, cat.id);
            return (
              <tr key={cat.id} style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}>
                <td className="px-4 py-3 font-body text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{cat.label}</td>
                <td className="px-4 py-3 font-mono text-[13px]">{p}</td>
                <td className="px-4 py-3 font-mono text-[13px]">{s}</td>
                <td className="px-4 py-3 font-mono text-[13px]">{a}</td>
                <td className="px-4 py-3 font-mono text-[13px]">{d}</td>
                <td className="px-4 py-3 font-mono text-[13px]">{fmtAED(rev)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium"
                    style={{ backgroundColor: p > 0 ? '#D1FAE5' : '#F3F4F6', color: p > 0 ? '#065F46' : '#374151' }}>
                    {p > 0 ? 'ACTIVE' : 'NO STOCK'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  // Multi sub-game — collapsible groups
  return (
    <div>
      {sgs.map(sg => {
        const stats = sgStats(sg);
        const isOpen = expandedSg.has(sg.id);
        return (
          <div key={sg.id}>
            {/* Group header */}
            <button onClick={() => toggleSg(sg.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              style={{ backgroundColor: '#F0F4F8', borderBottom: '1px solid #E5E7EB' }}>
              {isOpen ? <ChevronDown size={14} style={{ color: '#0B2D5E' }} /> : <ChevronRight size={14} style={{ color: '#0B2D5E' }} />}
              <span className="font-body text-[13px] font-bold" style={{ color: '#0B2D5E' }}>{sg.name}</span>
              <span className="px-2 py-0.5 rounded font-body text-[10px] font-medium" style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}>{sg.sessionType}</span>
              <span className="font-body text-[11px]" style={{ color: '#6B7280' }}>{stats.purchased} purchased</span>
              <span className="font-body text-[11px]" style={{ color: '#6B7280' }}>{stats.sold} sold</span>
              <span className="font-body text-[11px]" style={{ color: '#6B7280' }}>{stats.dispatched} dispatched</span>
            </button>
            {isOpen && (
              <table className="w-full text-left">
                <thead>
                  <tr style={{ backgroundColor: '#0B2D5E' }}>
                    {['Category', 'Purchased', 'Sold', 'Allocated', 'Dispatched', 'Revenue', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2 font-body text-[10px] font-bold text-white">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sg.categories.map((cat, i) => {
                    const p = purchasedForSgCat(sg.id, cat.id);
                    const s = soldForSgCat(sg.id, cat.id);
                    const a = allocatedForSgCat(sg.id, cat.id);
                    const d = dispatchedForSgCat(sg.id, cat.id);
                    const rev = revenueForSgCat(sg.id, cat.id);
                    return (
                      <tr key={cat.id} style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}>
                        <td className="px-4 py-2.5 font-body text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{cat.label}</td>
                        <td className="px-4 py-2.5 font-mono text-[13px]">{p}</td>
                        <td className="px-4 py-2.5 font-mono text-[13px]">{s}</td>
                        <td className="px-4 py-2.5 font-mono text-[13px]">{a}</td>
                        <td className="px-4 py-2.5 font-mono text-[13px]">{d}</td>
                        <td className="px-4 py-2.5 font-mono text-[13px]">{fmtAED(rev)}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium"
                            style={{ backgroundColor: p > 0 ? '#D1FAE5' : '#F3F4F6', color: p > 0 ? '#065F46' : '#374151' }}>
                            {p > 0 ? 'ACTIVE' : 'NO STOCK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* === Oversell Alerts === */
function OversellAlerts() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>Active Alerts</h3>
        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>1</span>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
            {['Sale ID', 'Client', 'Category', 'Requested', 'Over Limit', 'Action'].map(h => (
              <th key={h} className="px-5 py-2.5 font-body text-[11px] font-medium uppercase tracking-wide" style={{ color: '#6B7280' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-5 py-3 font-mono text-xs font-bold" style={{ color: '#0B2D5E' }}>SALE-001 / L2</td>
            <td className="px-5 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>Roadtrips</td>
            <td className="px-5 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>Cat 2</td>
            <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>6</td>
            <td className="px-5 py-3 font-mono text-[13px] font-bold" style={{ color: '#DC2626' }}>6</td>
            <td className="px-5 py-3">
              <button className="px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#D97706', color: 'white' }}>Review</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
