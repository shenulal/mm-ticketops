import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import RoleGuard from '@/components/RoleGuard';
import { TrendingUp, ShoppingCart, BarChart3, Send } from 'lucide-react';

const METRICS = [
  { label: 'Total Revenue', value: 'AED 808,792', sub: '↑ from 3 sales', borderColor: '#1A7A4A', icon: TrendingUp, iconColor: '#1A7A4A' },
  { label: 'Total Cost', value: 'AED 750,795', sub: '3 purchases', borderColor: '#0B2D5E', icon: ShoppingCart, iconColor: '#0B2D5E' },
  { label: 'Gross Margin', value: 'AED 57,997', sub: '7.2% margin', borderColor: '#D97706', icon: BarChart3, iconColor: '#D97706' },
  { label: 'Dispatch Rate', value: '8.3%', sub: '1 of 12 sent', borderColor: '#6B7280', icon: Send, iconColor: '#6B7280' },
];

const MATCH_ROWS = [
  { match: 'M01 MEX v RSA', purchased: 203, sold: 38, allocated: 12, dispatched: 1, revenue: '808,792', status: 'ACTIVE', statusBg: '#D1FAE5', statusText: '#065F46' },
  { match: 'M02 USA v CAN', purchased: 0, sold: 0, allocated: 0, dispatched: 0, revenue: '—', status: 'PLANNING', statusBg: '#F3F4F6', statusText: '#374151' },
  { match: 'M03 BRA v ARG', purchased: 0, sold: 0, allocated: 0, dispatched: 0, revenue: '—', status: 'PLANNING', statusBg: '#F3F4F6', statusText: '#374151' },
];

const DONUT_DATA = [
  { name: 'Dispatched', value: 1, color: '#0B2D5E' },
  { name: 'Allocated (not dispatched)', value: 11, color: '#C9A84C' },
  { name: 'Available', value: 31, color: '#1A7A4A' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const total = DONUT_DATA.reduce((s, i) => s + i.value, 0);
  return (
    <div className="bg-bg-card rounded-lg shadow-lg border px-3 py-2" style={{ borderColor: '#E5E7EB' }}>
      <p className="font-body text-sm font-medium" style={{ color: '#1A1A2E' }}>{d.name}</p>
      <p className="font-mono text-xs" style={{ color: '#6B7280' }}>{d.value} units · {((d.value / total) * 100).toFixed(1)}%</p>
    </div>
  );
};

export default function ReportsPage() {
  return (
    <div>
      <h1 className="font-display text-[26px] mb-4" style={{ color: '#0B2D5E' }}>Reports</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-6" style={{ borderColor: '#E5E7EB' }}>
        {['Event Summary', 'Inventory Health', 'Allocation Progress', 'Dispatch Status', 'Financial P&L'].map((t, i) => (
          <button key={t} className="pb-2.5 font-body text-sm font-medium relative"
            style={{ color: i === 0 ? '#0B2D5E' : '#6B7280' }}>
            {t}
            {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#0B2D5E' }} />}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {METRICS.map(m => (
          <div key={m.label} className="bg-bg-card rounded-xl p-5 shadow-sm" style={{ borderLeft: `4px solid ${m.borderColor}` }}>
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

      {/* Table + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Match summary */}
        <div className="lg:col-span-3 bg-bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>Match Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ backgroundColor: '#0B2D5E' }}>
                  {['Match', 'Purchased', 'Sold', 'Allocated', 'Dispatched', 'Revenue (AED)', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 font-body text-[11px] font-bold" style={{ color: 'white' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATCH_ROWS.map((r, i) => (
                  <tr key={r.match} style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}>
                    <td className="px-4 py-3 font-body text-[13px] font-medium" style={{ color: '#1A1A2E' }}>{r.match}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{r.purchased}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{r.sold}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{r.allocated}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{r.dispatched}</td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>{r.revenue}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium" style={{ backgroundColor: r.statusBg, color: r.statusText }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donut */}
        <div className="lg:col-span-2 bg-bg-card rounded-xl shadow-sm p-5">
          <h3 className="font-display text-lg mb-4" style={{ color: '#0B2D5E' }}>Inventory Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                {DONUT_DATA.map(d => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-3">
            {DONUT_DATA.map(d => (
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
      <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
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
              <td className="px-5 py-3 font-mono text-xs font-bold" style={{ color: '#0B2D5E' }}>S250145</td>
              <td className="px-5 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>Blend Group</td>
              <td className="px-5 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>Cat 2</td>
              <td className="px-5 py-3 font-mono text-[13px]" style={{ color: '#1A1A2E' }}>6</td>
              <td className="px-5 py-3 font-mono text-[13px] font-bold" style={{ color: '#DC2626' }}>0</td>
              <td className="px-5 py-3">
                <button className="px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#D97706', color: 'white' }}>Review</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
