import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { MOCK_STAFF_TASKS, getDispatchUrgency } from '@/data/mockData';
import { Inbox, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { CHART_COLORS } from './chartHelpers';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const name = currentUser?.name?.split(' ')[0] ?? 'Staff';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const myTasks = MOCK_STAFF_TASKS.filter(t => t.assignedTo === currentUser?.id);
  const sent = myTasks.filter(t => t.status === 'SENT').length;
  const pending = myTasks.length - sent;
  const pct = myTasks.length > 0 ? Math.round((sent / myTasks.length) * 100) : 0;
  const dispatch = getDispatchUrgency('m01');

  const donutData = [
    { name: 'Completed', value: sent, color: CHART_COLORS.navy },
    { name: 'Pending', value: pending, color: CHART_COLORS.lightGrey },
  ];

  return (
    <div className="max-w-[700px] mx-auto py-8 px-4">
      {/* Greeting */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: CHART_COLORS.navy }}>
        <p className="font-display text-[22px] text-primary-foreground">{greeting}, {name}</p>
        <p className="font-body text-[14px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>FIFA World Cup 2026 · {myTasks.length} tasks in your queue</p>
      </div>

      {/* Task Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 shadow-sm" style={{ borderLeft: `4px solid ${CHART_COLORS.navy}` }}>
          <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">Total Assigned</p>
          <p className="font-display text-[28px] mt-1" style={{ color: CHART_COLORS.navy }}>{myTasks.length}</p>
          <p className="font-body text-[11px] mt-1 text-muted-foreground">To you in FIFA WC 2026</p>
          <Inbox size={16} className="mt-1" style={{ color: CHART_COLORS.navy }} />
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm" style={{ borderLeft: `4px solid ${CHART_COLORS.green}` }}>
          <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">Dispatched</p>
          <p className="font-display text-[28px] mt-1" style={{ color: CHART_COLORS.navy }}>{sent}</p>
          <p className="font-body text-[11px] mt-1 text-muted-foreground">Tickets sent ✓</p>
          <CheckCircle size={16} className="mt-1" style={{ color: CHART_COLORS.green }} />
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm" style={{ borderLeft: `4px solid ${CHART_COLORS.amber}`, backgroundColor: pending > 0 ? 'hsl(var(--warning-bg))' : undefined }}>
          <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">Pending</p>
          <p className="font-display text-[28px] mt-1" style={{ color: CHART_COLORS.navy }}>{pending}</p>
          <p className="font-body text-[11px] mt-1 text-muted-foreground">Need your action</p>
          <Clock size={16} className="mt-1" style={{ color: CHART_COLORS.amber }} />
        </div>
      </div>

      {/* Progress Circle */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-6 flex flex-col items-center">
        <div style={{ width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} innerRadius={60} outerRadius={80} dataKey="value" cx="50%" cy="50%" startAngle={90} endAngle={-270}>
                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <text x="50%" y="44%" textAnchor="middle" className="font-display text-[32px]" fill={CHART_COLORS.navy}>{sent}/{myTasks.length}</text>
              <text x="50%" y="58%" textAnchor="middle" className="font-body text-[12px]" fill="#6B7280">Dispatched</text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="font-body text-[16px] mt-2 text-foreground">Completion Rate: {pct}%</p>
      </div>

      {/* Urgency Panel */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-6">
        <h3 className="font-body text-[15px] font-semibold mb-3" style={{ color: CHART_COLORS.navy }}>Dispatch Deadlines</h3>
        <div className="space-y-2">
          {myTasks.filter(t => t.status !== 'SENT').map(t => {
            const dColor = dispatch.daysToEvent > 14 ? CHART_COLORS.green : dispatch.daysToEvent > 7 ? CHART_COLORS.amber : '#DC2626';
            return (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="font-mono text-[12px] text-primary">{t.unitId}</span>
                <span className="font-body text-[12px] text-foreground">FIFA WC 2026</span>
                <span className="font-body text-[12px]" style={{ color: dColor }}>{dispatch.daysToEvent} days remaining</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's dispatches */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-6">
        <h3 className="font-body text-[15px] font-semibold mb-3" style={{ color: CHART_COLORS.navy }}>Today's Dispatches</h3>
        {sent > 0 ? (
          <div className="space-y-2">
            {myTasks.filter(t => t.status === 'SENT').map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <CheckCircle size={14} style={{ color: CHART_COLORS.green }} />
                <span className="font-mono text-[12px]">{t.unitId}</span>
                <span className="font-body text-[12px] text-foreground">{t.clientFirstName} {t.clientLastName}</span>
                <span className="font-body text-[11px] text-muted-foreground ml-auto">{t.dispatchedAt}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-sm text-muted-foreground text-center py-4">No dispatches today yet</p>
        )}
      </div>

      {/* CTA */}
      <button onClick={() => navigate('/staff-queue')}
        className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-opacity hover:opacity-90"
        style={{ backgroundColor: CHART_COLORS.gold }}>
        <span className="font-body text-lg font-bold" style={{ color: CHART_COLORS.navy }}>Go to My Dispatch Queue</span>
        <ArrowRight size={20} style={{ color: CHART_COLORS.navy }} />
      </button>
    </div>
  );
}
