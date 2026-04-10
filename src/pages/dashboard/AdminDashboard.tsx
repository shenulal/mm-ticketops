import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  MOCK_EVENTS, MOCK_MATCHES, MOCK_SUBGAMES, MOCK_SALES, MOCK_SALE_LINE_ITEMS,
  MOCK_PURCHASE_LINE_ITEMS, MOCK_DIST_ROWS, MOCK_UNITS, MOCK_REVENUE_TIMELINE,
  getSubGamesForMatch, getInventorySummary, getRevenueSummary, getSellThroughByCat,
  getRevenueByClient, getDispatchUrgency, getPortalFunnel,
} from '@/data/mockData';
import {
  TrendingDown, TrendingUp, BarChart2, CheckCircle, Clock, GitBranch,
  AlertTriangle, Package,
} from 'lucide-react';
import DashboardControlBar, { type DashboardFilters } from './DashboardControlBar';
import { AED, shortAED, CHART_COLORS, ChartCard, EmptyChart, CUSTOM_TOOLTIP_STYLE } from './chartHelpers';
import ActionCenter from './ActionCenter';
import EventSnapshot from './EventSnapshot';

/* ── KPI Card ── */
function KPICard({ label, value, sub, borderColor, icon: Icon, iconColor, tooltip, pulse }: {
  label: string; value: string; sub: string; borderColor: string; icon: any; iconColor: string; tooltip?: string; pulse?: boolean;
}) {
  return (
    <div className="min-w-[200px] bg-card rounded-xl p-4 shadow-sm shrink-0" style={{ borderLeft: `4px solid ${borderColor}` }} title={tooltip}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`font-display text-[28px] mt-1 ${pulse ? 'animate-pulse' : ''}`} style={{ color: borderColor === '#DC2626' || borderColor === '#D97706' ? borderColor : CHART_COLORS.navy }}>{value}</p>
          <p className="font-body text-[11px] mt-1 text-muted-foreground">{sub}</p>
        </div>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
    </div>
  );
}

/* ── Admin Dashboard ── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DashboardFilters>({
    eventId: 'evt1', matchId: 'm01', subGameId: 'sg-m01-main',
    dateRange: 'alltime', viewMode: 'overview', currency: 'AED',
  });
  const upd = (p: Partial<DashboardFilters>) => setFilters(f => ({ ...f, ...p }));

  const isAllEvents = filters.eventId === 'all';
  const sgId = filters.subGameId !== 'all' ? filters.subGameId : 'sg-m01-main';
  const cur = filters.currency;

  // FX-aware revenue: filter purchases by same match scope as sales
  const rev = useMemo(() => {
    const matchFilter = filters.matchId !== 'all' ? filters.matchId : undefined;
    const sgFilter = filters.subGameId !== 'all' ? filters.subGameId : undefined;
    return getRevenueSummary(undefined, matchFilter, sgFilter);
  }, [filters.matchId, filters.subGameId]);

  const sellThrough = useMemo(() => getSellThroughByCat(sgId), [sgId]);
  const clientRev = useMemo(() => getRevenueByClient(), []);
  const portalFunnel = useMemo(() => getPortalFunnel('sale001'), []);
  const dispatch = useMemo(() => getDispatchUrgency(filters.matchId !== 'all' ? filters.matchId : 'm01'), [filters.matchId]);
  const inv = useMemo(() => getInventorySummary(filters.subGameId !== 'all' ? filters.subGameId : undefined), [filters.subGameId]);

  const now = new Date();
  const asOfStr = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

  // Chart data
  const invChartData = sellThrough.map(c => ({
    name: c.label,
    dispatched: MOCK_DIST_ROWS.filter(r => r.subGameId === sgId && r.categoryId === c.id && r.dispatchStatus === 'SENT').length,
    allocated: getInventorySummary(sgId, c.id).allocated,
    pending: MOCK_SALE_LINE_ITEMS.filter(l => l.subGameId === sgId && l.categoryId === c.id && l.status === 'PENDING_APPROVAL').reduce((s, l) => s + l.qty, 0),
    available: getInventorySummary(sgId, c.id).available,
    value: AED(MOCK_PURCHASE_LINE_ITEMS.filter(l => l.subGameId === sgId && l.categoryId === c.id).reduce((s, l) => s + l.lineTotal, 0), cur),
  }));

  const allocDonut = [
    { name: 'Dispatched', value: inv.dispatched, color: CHART_COLORS.navy },
    { name: 'Allocated', value: inv.allocated - inv.dispatched, color: CHART_COLORS.gold },
    { name: 'Unallocated', value: inv.total - inv.allocated, color: CHART_COLORS.lightGrey },
  ].filter(d => d.value > 0);

  const revCostData = sellThrough.map(c => ({
    name: c.label,
    cost: c.purchaseCost,
    revenue: c.revenueFromSales,
    margin: c.margin,
    marginPct: c.purchaseCost > 0 ? ((c.margin / c.purchaseCost) * 100).toFixed(1) : '0',
  }));

  const sellThroughBars = sellThrough.map(c => ({
    name: c.label,
    pct: c.sellThroughPct,
    sold: c.sold,
    purchased: c.purchased,
  }));

  const clientBars = clientRev.map(c => ({ name: c.client, revenue: c.totalRevenue, sales: c.saleCount, lines: c.lineCount }));

  const funnelData = portalFunnel ? [
    { name: 'Portal Generated', value: portalFunnel.total, fill: CHART_COLORS.navy },
    { name: 'Portal Opened', value: portalFunnel.total, fill: CHART_COLORS.blue },
    { name: 'Partially Filled', value: portalFunnel.hasName, fill: CHART_COLORS.gold },
    { name: 'Fully Submitted', value: portalFunnel.fullyFilled, fill: CHART_COLORS.green },
  ] : [];

  // Revenue trajectory with milestone markers
  const milestones = [
    { date: 'Apr 12', label: 'Purchases Booked' },
    { date: 'Apr 16', label: 'First Sale' },
  ];

  return (
    <div>
      <DashboardControlBar filters={filters} onChange={upd} showAllEvents showDateRange showViewMode showCurrency />

      {/* ── TOP: Action Center ── */}
      <ActionCenter />

      <div className="p-6 space-y-6">
        {/* ── MIDDLE: KPI Strip ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[11px] text-muted-foreground">
              As of {asOfStr} · Based on {cur === 'AED' ? 'AED' : 'USD'} {cur === 'USD' && <span className="text-muted-foreground/70">(1 USD = 3.67 AED)</span>}
            </p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            <KPICard label="Total Invested" value={AED(rev.totalPurchaseCost, cur)} sub={`${MOCK_PURCHASE_LINE_ITEMS.length} purchase lines · ${MOCK_UNITS.length} units`} borderColor={CHART_COLORS.navy} icon={TrendingDown} iconColor="#DC2626" />
            <KPICard label="Total Sale Value" value={AED(rev.totalSaleRevenue, cur)} sub={`${MOCK_SALE_LINE_ITEMS.length} sale lines · ${MOCK_SALE_LINE_ITEMS.reduce((s, l) => s + l.qty, 0)} tickets`} borderColor={CHART_COLORS.green} icon={TrendingUp} iconColor={CHART_COLORS.green} />
            <KPICard label="Gross Margin" value={AED(rev.grossMargin, cur)} sub={`Margin: ${rev.marginPct}%`} borderColor={Number(rev.marginPct) >= 0 ? CHART_COLORS.green : '#DC2626'} icon={BarChart2} iconColor={Number(rev.marginPct) >= 0 ? CHART_COLORS.green : '#DC2626'} />
            <KPICard label="Realised Revenue" value={AED(rev.realisedRevenue, cur)} sub={`${inv.dispatched} ticket${inv.dispatched !== 1 ? 's' : ''} dispatched`} borderColor={CHART_COLORS.gold} icon={CheckCircle} iconColor={CHART_COLORS.gold} tooltip="Revenue from tickets physically sent" />
            <KPICard label="Committed Revenue" value={AED(rev.committedRevenue, cur)} sub={`${inv.allocated - inv.dispatched} tickets allocated — awaiting dispatch`} borderColor={CHART_COLORS.blue} icon={Clock} iconColor={CHART_COLORS.blue} />
            <KPICard label="Pipeline Revenue" value={AED(rev.pipelineRevenue, cur)} sub={`${MOCK_SALE_LINE_ITEMS.filter(l => l.status === 'UNALLOCATED').reduce((s, l) => s + l.qty, 0)} tickets — not yet allocated`} borderColor={CHART_COLORS.grey} icon={GitBranch} iconColor={CHART_COLORS.grey} />
            <KPICard label="At Risk" value={AED(rev.atRiskRevenue, cur)} sub={`${MOCK_SALE_LINE_ITEMS.filter(l => l.status === 'PENDING_APPROVAL').reduce((s, l) => s + l.qty, 0)} pending approval`} borderColor={CHART_COLORS.amber} icon={AlertTriangle} iconColor={CHART_COLORS.amber} pulse={rev.atRiskRevenue > 0} />
            <KPICard label="Unsold Stock Value" value={AED(rev.unsoldInventoryValue, cur)} sub={`${inv.available} units available`} borderColor={CHART_COLORS.grey} icon={Package} iconColor={CHART_COLORS.grey} tooltip="Purchase cost of unsold tickets" />
          </div>
        </div>

        {/* ── Charts Row 1: Inventory + Allocation ── */}
        <div className="grid grid-cols-5 gap-6">
          <ChartCard title="Inventory Breakdown by Category" subtitle={`${MOCK_SUBGAMES.find(s => s.id === sgId)?.name ?? 'All'} · hover for $ value`} className="col-span-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invChartData}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: '"DM Sans"' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={CUSTOM_TOOLTIP_STYLE}
                  formatter={(v: number, name: string) => [v, name]}
                  labelFormatter={(label) => {
                    const item = invChartData.find(d => d.name === label);
                    return `${label} — Value: ${item?.value ?? '—'}`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: '"DM Sans"' }} />
                <Bar dataKey="dispatched" stackId="a" fill={CHART_COLORS.navy} name="Dispatched" />
                <Bar dataKey="allocated" stackId="a" fill={CHART_COLORS.gold} name="Allocated" />
                <Bar dataKey="pending" stackId="a" fill={CHART_COLORS.amber} name="Pending" />
                <Bar dataKey="available" stackId="a" fill={CHART_COLORS.green} name="Available" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Allocation Progress" className="col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocDonut} innerRadius={55} outerRadius={85} dataKey="value" cx="50%" cy="50%"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/distribution')}
                >
                  {allocDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v} tickets`, name]} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: '"DM Sans"' }} />
                <text x="50%" y="46%" textAnchor="middle" className="font-display text-[28px]" fill={CHART_COLORS.navy}>{inv.allocated}</text>
                <text x="50%" y="56%" textAnchor="middle" className="font-body text-[12px]" fill="#6B7280">of {inv.total}</text>
                <text x="50%" y="64%" textAnchor="middle" className="font-body text-[11px]" fill={CHART_COLORS.blue} style={{ cursor: 'pointer', textDecoration: 'underline' }}>view distribution →</text>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Charts Row 2: Revenue ── */}
        <div className="grid grid-cols-11 gap-6">
          <ChartCard title="Revenue vs Cost by Category" subtitle="Gross margin % shown above each group" className="col-span-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revCostData}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => shortAED(v, cur)} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number, name: string) => [AED(v as number, cur), name]} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: '"DM Sans"' }} />
                <Bar dataKey="cost" fill="rgba(220,38,38,0.7)" name="Purchase Cost" />
                <Bar dataKey="revenue" fill={CHART_COLORS.green} name="Sale Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Revenue Trajectory" subtitle="Cumulative · milestones marked" className="col-span-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_REVENUE_TIMELINE}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => shortAED(v, cur)} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number, name: string) => [AED(v as number, cur), name]} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: '"DM Sans"' }} />
                {milestones.map(m => (
                  <ReferenceLine key={m.date} x={m.date} stroke={CHART_COLORS.gold} strokeDasharray="4 4" label={{ value: m.label, position: 'top', fontSize: 9, fill: CHART_COLORS.gold, fontFamily: '"DM Sans"' }} />
                ))}
                <Line type="monotone" dataKey="saleRevenue" stroke={CHART_COLORS.green} strokeWidth={2} name="Sale Revenue" dot={false} />
                <Line type="monotone" dataKey="purchaseCost" stroke="#DC2626" strokeWidth={2} strokeDasharray="5 5" name="Purchase Cost" dot={false} />
                <Line type="monotone" dataKey="margin" stroke={CHART_COLORS.gold} strokeWidth={2} name="Margin" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Charts Row 3: Sell-through, Portal, Client ── */}
        <div className="grid grid-cols-3 gap-6">
          <ChartCard title="Sell-Through Rate by Category" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sellThroughBars} layout="vertical">
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={80} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, 'Sell-through']} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {sellThroughBars.map((d, i) => (
                    <Cell key={i} fill={d.pct > 70 ? CHART_COLORS.green : d.pct > 40 ? CHART_COLORS.amber : '#DC2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Client Portal Funnel" subtitle="Meridian Travel — SALE-001" height={240}>
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={110} />
                  <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Revenue by Client" subtitle="Click to view sales" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientBars} layout="vertical">
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => shortAED(v, cur)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={90} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number, name: string) => [AED(v as number, cur), name]} />
                <Bar
                  dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(data: any) => navigate(`/sales?client=${encodeURIComponent(data.name)}`)}
                >
                  {clientBars.map((_, i) => <Cell key={i} fill={[CHART_COLORS.navy, CHART_COLORS.blue, CHART_COLORS.gold][i % 3]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Deep Dive Tables ── */}
        {filters.viewMode === 'deepdive' && (
          <div className="space-y-6">
            <ChartCard title="Detailed Inventory Health" height={300}>
              <div className="overflow-x-auto h-full">
                <table className="w-full text-left">
                  <thead><tr className="bg-muted">
                    {['Match', 'Sub-Game', 'Category', 'Purchased', 'Available', 'Allocated', 'Dispatched', 'Sell-Through %', 'Revenue'].map(h => (
                      <th key={h} className="px-3 py-2 font-body text-[11px] font-medium uppercase text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {MOCK_SUBGAMES.map(sg => sg.categories.map(cat => {
                      const s = getInventorySummary(sg.id, cat.id);
                      const st = getSellThroughByCat(sg.id).find(c => c.id === cat.id);
                      const match = MOCK_MATCHES.find(m => m.id === sg.matchId);
                      return (
                        <tr key={`${sg.id}-${cat.id}`} className="border-b border-border/50">
                          <td className="px-3 py-2 font-body text-[12px]">{match?.code}</td>
                          <td className="px-3 py-2 font-body text-[12px]">{sg.name}</td>
                          <td className="px-3 py-2 font-body text-[12px]">{cat.label}</td>
                          <td className="px-3 py-2 font-mono text-[12px]">{st?.purchased ?? 0}</td>
                          <td className="px-3 py-2 font-mono text-[12px] text-success">{s.available}</td>
                          <td className="px-3 py-2 font-mono text-[12px]">{s.allocated}</td>
                          <td className="px-3 py-2 font-mono text-[12px]">{s.dispatched}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${
                              (st?.sellThroughPct ?? 0) > 70 ? 'bg-success/15 text-success' :
                              (st?.sellThroughPct ?? 0) > 40 ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive'
                            }`}>{st?.sellThroughPct ?? 0}%</span>
                          </td>
                          <td className="px-3 py-2 font-mono text-[12px]">{AED(st?.revenueFromSales ?? 0, cur)}</td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}
      </div>

      {/* ── BOTTOM: Event Snapshot ── */}
      <EventSnapshot />
    </div>
  );
}
