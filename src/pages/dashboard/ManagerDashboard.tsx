import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  MOCK_MATCHES, MOCK_SUBGAMES, MOCK_SALE_LINE_ITEMS, MOCK_DIST_ROWS, MOCK_UNITS, MOCK_SALES,
  getInventorySummary, getRevenueSummary, getSellThroughByCat,
  getRevenueByClient, getDispatchUrgency, getPortalFunnel, getStaffPerformance,
  type SaleLineItem,
} from '@/data/mockData';
import {
  GitBranch, AlertTriangle, Send, FileCheck, DollarSign, Clock, CheckCircle, FileText,
} from 'lucide-react';
import DashboardControlBar, { type DashboardFilters } from './DashboardControlBar';
import { AED, shortAED, CHART_COLORS, ChartCard, CUSTOM_TOOLTIP_STYLE } from './chartHelpers';
import OversellResolutionDrawer from '@/components/OversellResolutionDrawer';
import { AnimatePresence } from 'framer-motion';

function KPI({ label, value, sub, borderColor, icon: Icon, iconColor, pulse }: {
  label: string; value: string; sub: string; borderColor: string; icon: any; iconColor: string; pulse?: boolean;
}) {
  return (
    <div className="bg-card rounded-xl p-4 shadow-sm flex-1 min-w-[170px]" style={{ borderLeft: `4px solid ${borderColor}` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`font-display text-[24px] mt-1 ${pulse ? 'animate-pulse' : ''}`} style={{ color: CHART_COLORS.navy }}>{value}</p>
          <p className="font-body text-[11px] mt-1 text-muted-foreground">{sub}</p>
        </div>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [oversellCtx, setOversellCtx] = useState<{ saleId: string; line: SaleLineItem; lineIdx: number } | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    eventId: 'evt1', matchId: 'm01', subGameId: 'sg-m01-main',
    dateRange: 'alltime', viewMode: 'overview', currency: 'AED',
  });
  const upd = (p: Partial<DashboardFilters>) => setFilters(f => ({ ...f, ...p }));
  const sgId = filters.subGameId !== 'all' ? filters.subGameId : 'sg-m01-main';
  const cur = filters.currency;

  const rev = useMemo(() => getRevenueSummary(undefined, filters.matchId !== 'all' ? filters.matchId : undefined), [filters.matchId]);
  const inv = useMemo(() => getInventorySummary(filters.subGameId !== 'all' ? filters.subGameId : undefined), [filters.subGameId]);
  const sellThrough = useMemo(() => getSellThroughByCat(sgId), [sgId]);
  const portalFunnel = useMemo(() => getPortalFunnel('sale001'), []);
  const dispatch = useMemo(() => getDispatchUrgency(filters.matchId !== 'all' ? filters.matchId : 'm01'), [filters.matchId]);
  const clientRev = useMemo(() => getRevenueByClient(), []);
  const staffPerf = useMemo(() => getStaffPerformance(), []);

  const unallocLines = MOCK_SALE_LINE_ITEMS.filter(l => l.status === 'UNALLOCATED').length;
  const pendingLines = MOCK_SALE_LINE_ITEMS.filter(l => l.oversellFlag || l.status === 'PENDING_APPROVAL').length;

  const invChartData = sellThrough.map(c => ({
    name: c.label,
    dispatched: MOCK_DIST_ROWS.filter(r => r.subGameId === sgId && r.categoryId === c.id && r.dispatchStatus === 'SENT').length,
    allocated: getInventorySummary(sgId, c.id).allocated,
    available: getInventorySummary(sgId, c.id).available,
  }));

  const allocDonut = [
    { name: 'Dispatched', value: inv.dispatched, color: CHART_COLORS.navy },
    { name: 'Allocated', value: inv.allocated - inv.dispatched, color: CHART_COLORS.gold },
    { name: 'Unallocated', value: inv.total - inv.allocated, color: CHART_COLORS.lightGrey },
  ].filter(d => d.value > 0);

  const revCostData = sellThrough.map(c => ({ name: c.label, cost: c.purchaseCost, revenue: c.revenueFromSales }));

  const dispatchBars = MOCK_MATCHES.filter(m => m.eventId === filters.eventId).map(m => {
    const d = getDispatchUrgency(m.id);
    return { name: `${m.code} ${m.teams}`, sent: d.sent, notSent: d.pending, days: d.daysToEvent };
  });

  const funnelData = portalFunnel ? [
    { name: 'Generated', value: portalFunnel.total, fill: CHART_COLORS.navy },
    { name: 'Opened', value: portalFunnel.total, fill: CHART_COLORS.blue },
    { name: 'Partial', value: portalFunnel.hasName, fill: CHART_COLORS.gold },
    { name: 'Submitted', value: portalFunnel.fullyFilled, fill: CHART_COLORS.green },
  ] : [];

  const clientBars = clientRev.map(c => ({ name: c.client, revenue: c.totalRevenue }));

  return (
    <div>
      <DashboardControlBar filters={filters} onChange={upd} showDateRange showViewMode />
      <div className="p-6 space-y-6">
        {/* KPI Strip */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <KPI label="Needs Allocation" value={`${unallocLines} lines`} sub={`Across ${new Set(MOCK_SALE_LINE_ITEMS.filter(l => l.status === 'UNALLOCATED').map(l => l.saleId)).size} sales`}
            borderColor={CHART_COLORS.amber} icon={GitBranch} iconColor={CHART_COLORS.amber} />
          <KPI label="Pending My Approval" value={`${pendingLines} items`} sub="Oversells + price changes"
            borderColor={CHART_COLORS.amber} icon={AlertTriangle} iconColor={CHART_COLORS.amber} pulse={pendingLines > 0} />
          <KPI label="Dispatched Today" value={`${dispatch.sent} tickets`} sub={`${dispatch.pending} remaining | ${dispatch.daysToEvent} days`}
            borderColor={CHART_COLORS.navy} icon={Send} iconColor={CHART_COLORS.navy} />
          <KPI label="Portal Completion" value={`${portalFunnel?.completionPct ?? 0}%`} sub={`${portalFunnel?.fullyFilled ?? 0} of ${portalFunnel?.total ?? 0} rows`}
            borderColor={CHART_COLORS.gold} icon={FileCheck} iconColor={CHART_COLORS.gold} />
          <KPI label="Revenue This Week" value={AED(rev.totalSaleRevenue, cur)} sub={`${MOCK_SALE_LINE_ITEMS.length} lines | ${rev.marginPct}% margin`}
            borderColor={CHART_COLORS.green} icon={DollarSign} iconColor={CHART_COLORS.green} />
        </div>

        {/* Charts Row 1 */}
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
          <ChartCard title="Allocation Progress" className="col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocDonut} innerRadius={50} outerRadius={80} dataKey="value" cx="50%" cy="50%">
                  {allocDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <text x="50%" y="48%" textAnchor="middle" className="font-display text-[24px]" fill={CHART_COLORS.navy}>{inv.allocated}</text>
                <text x="50%" y="58%" textAnchor="middle" className="font-body text-[11px]" fill="#6B7280">of {inv.total}</text>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-11 gap-6">
          <ChartCard title="Cost vs Revenue by Category" className="col-span-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revCostData}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => shortAED(v, cur)} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number) => [AED(v, cur)]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="cost" fill="rgba(220,38,38,0.7)" name="Cost" />
                <Bar dataKey="revenue" fill={CHART_COLORS.green} name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Dispatch Status per Match" className="col-span-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dispatchBars} layout="vertical">
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} width={130} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sent" fill={CHART_COLORS.navy} name="Dispatched" />
                <Bar dataKey="notSent" fill={CHART_COLORS.gold} name="Not Sent" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3: Actions + Staff */}
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-3">
            <h2 className="font-display text-[18px]" style={{ color: CHART_COLORS.navy }}>Action Required</h2>
            <div className="space-y-2">
              {MOCK_SALE_LINE_ITEMS.filter(l => l.oversellFlag).map(li => {
                const sale = MOCK_SALES.find(s => s.id === li.saleId);
                const lineIdx = sale ? sale.lines.findIndex(l => l.id === li.id) : 0;
                return (
                <div key={li.id} className="rounded-xl p-3 bg-card border-l-4 flex items-center gap-3" style={{ borderColor: CHART_COLORS.amber }}>
                  <AlertTriangle size={16} style={{ color: CHART_COLORS.amber }} />
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-foreground">Oversell — {li.categoryLabel} × {li.qty}</p>
                    <p className="font-body text-[11px] text-muted-foreground">{li.saleId.toUpperCase()} | M01</p>
                  </div>
                  <button onClick={() => setOversellCtx({ saleId: li.saleId, line: li, lineIdx })} className="px-3 py-1.5 rounded-lg font-body text-[11px] font-medium text-primary-foreground hover:opacity-90" style={{ backgroundColor: CHART_COLORS.amber }}>Review &amp; Approve</button>
                </div>
                );
              })}
              {dispatch.pending > 0 && (
                <div className="rounded-xl p-3 bg-card border-l-4 flex items-center gap-3" style={{ borderColor: '#DC2626' }}>
                  <Clock size={16} style={{ color: '#DC2626' }} />
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-foreground">{dispatch.pending} unsent — {dispatch.daysToEvent}d to event</p>
                  </div>
                  <button onClick={() => navigate('/staff-queue')} className="px-3 py-1.5 rounded-lg font-body text-[11px] font-medium bg-destructive text-destructive-foreground">View Queue</button>
                </div>
              )}
            </div>
          </div>
          <div className="col-span-2">
            <ChartCard title="Staff Queue Status" height={180}>
              <div className="overflow-auto h-full">
                <table className="w-full text-left">
                  <thead><tr className="bg-muted">
                    {['Name', 'Assigned', 'Sent', 'Pending', 'Rate'].map(h => (
                      <th key={h} className="px-2 py-1.5 font-body text-[10px] font-medium uppercase text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {staffPerf.map(s => (
                      <tr key={s.name} className="border-b border-border/50">
                        <td className="px-2 py-2 font-body text-[12px] text-foreground">{s.name}</td>
                        <td className="px-2 py-2 font-mono text-[12px]">{s.total}</td>
                        <td className="px-2 py-2 font-mono text-[12px] text-success">{s.sent}</td>
                        <td className="px-2 py-2 font-mono text-[12px] text-warning">{s.pending}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full" style={{
                                width: `${s.completionRate}%`,
                                backgroundColor: s.completionRate > 80 ? CHART_COLORS.green : s.completionRate > 50 ? CHART_COLORS.amber : '#DC2626',
                              }} />
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">{s.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Row 4: Funnel + Client Revenue */}
        <div className="grid grid-cols-2 gap-6">
          <ChartCard title="Client Portal Funnel" subtitle="Roadtrips — SALE-001" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={90} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Revenue by Client" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientBars} layout="vertical">
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => shortAED(v, cur)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={90} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: number) => [AED(v, cur)]} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                  {clientBars.map((_, i) => <Cell key={i} fill={[CHART_COLORS.navy, CHART_COLORS.blue, CHART_COLORS.gold][i % 3]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
