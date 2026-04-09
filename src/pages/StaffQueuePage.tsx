import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MOCK_STAFF_TASKS, MOCK_USERS, type StaffTask, type TaskStatus } from '@/data/mockData';
import { Eye, EyeOff, CheckCircle, QrCode, Filter } from 'lucide-react';
import { toast } from 'sonner';

type TaskTab = 'all' | 'sent' | 'not_sent' | 'issue';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  NOT_SENT: { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', label: 'NOT SENT ⏳' },
  SENT:     { bg: 'hsl(var(--success) / 0.15)', text: 'hsl(var(--success))', label: 'SENT ✓' },
  PENDING:  { bg: 'hsl(var(--warning) / 0.15)', text: 'hsl(var(--warning))', label: 'PENDING' },
  ACCEPTED: { bg: 'hsl(var(--success) / 0.25)', text: 'hsl(var(--success))', label: 'ACCEPTED' },
  ISSUE:    { bg: 'hsl(var(--destructive) / 0.15)', text: 'hsl(var(--destructive))', label: 'ISSUE ⚠' },
};

const PRIORITY_DOT: Record<string, string> = {
  High: 'hsl(var(--destructive))',
  Normal: 'hsl(var(--muted-foreground))',
  Low: 'hsl(var(--accent-foreground))',
};

function StaffView() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<TaskTab>('not_sent');
  const [assignedOnly, setAssignedOnly] = useState(true);
  const [tasks, setTasks] = useState<StaffTask[]>([...MOCK_STAFF_TASKS]);
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = tasks;
    if (assignedOnly && currentUser) list = list.filter(t => t.assignedTo === currentUser.id);
    if (tab === 'sent') list = list.filter(t => t.status === 'SENT');
    else if (tab === 'not_sent') list = list.filter(t => t.status === 'NOT_SENT');
    else if (tab === 'issue') list = list.filter(t => t.status === 'ISSUE');
    return list;
  }, [tasks, tab, assignedOnly, currentUser]);

  const counts = useMemo(() => ({
    all: tasks.length,
    sent: tasks.filter(t => t.status === 'SENT').length,
    not_sent: tasks.filter(t => t.status === 'NOT_SENT').length,
    issue: tasks.filter(t => t.status === 'ISSUE').length,
  }), [tasks]);

  const handleMarkSent = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'SENT' as TaskStatus, dispatchedAt: new Date().toLocaleString() } : t));
    setConfirmId(null);
  };

  const handleScanQR = () => {
    toast.info('QR scanner coming soon — scan a task barcode to open its detail page.');
  };

  const TABS: { key: TaskTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'not_sent', label: 'Not Sent', count: counts.not_sent },
    { key: 'sent', label: 'Sent', count: counts.sent },
    { key: 'issue', label: 'Issues', count: counts.issue },
  ];

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setAssignedOnly(a => !a)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-body font-medium border transition-colors ${
            assignedOnly ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted'
          }`}
        >
          <Filter size={13} /> Assigned to me
        </button>
        <button
          onClick={handleScanQR}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-body font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors"
        >
          <QrCode size={14} /> Scan Task QR
        </button>
      </div>

      {/* Summary */}
      <div className="rounded-xl p-4 mb-4 bg-muted/50">
        <p className="font-body text-sm text-foreground">
          {assignedOnly ? 'Your' : 'All'} tasks: <strong>{filtered.length}</strong> shown · <strong>{counts.sent}</strong> dispatched · <strong>{counts.not_sent}</strong> pending
          {counts.issue > 0 && <> · <span className="text-destructive font-semibold">{counts.issue} issues</span></>}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pb-2.5 font-body text-sm font-medium relative whitespace-nowrap ${
              tab === t.key ? 'text-primary' : 'text-muted-foreground'
            }`}>
            {t.label} ({t.count})
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map(task => {
          const ss = STATUS_STYLES[task.status] ?? STATUS_STYLES.NOT_SENT;
          const showPw = showPasswords.has(task.id);
          const pd = PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.Normal;
          return (
            <div
              key={task.id}
              className="bg-card rounded-xl shadow-sm p-5 border-l-4 cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderLeftColor: task.status === 'SENT' ? 'hsl(var(--success))' : task.status === 'ISSUE' ? 'hsl(var(--destructive))' : 'hsl(var(--warning))' }}
              onClick={() => navigate(`/staff-queue/${task.id}`)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pd }} />
                  <span className="font-mono text-xs text-muted-foreground">Task #{task.id.toUpperCase()}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full font-body text-[11px] font-medium"
                  style={{ backgroundColor: ss.bg, color: ss.text }}>
                  {ss.label}
                </span>
              </div>
              <p className="font-body text-sm text-foreground">
                {task.saleChildId} | {task.category} | {task.matchCode} {task.matchLabel}
              </p>

              <div className="my-3 border-t border-border" />

              {/* Client + Vendor */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="font-body text-xs text-muted-foreground">Client</p>
                  <p className="font-body text-sm font-medium text-foreground">{task.clientFirstName} {task.clientLastName}</p>
                  <p className="font-body text-xs text-muted-foreground">{task.clientEmail}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">Vendor</p>
                  <p className="font-body text-sm font-medium text-foreground">{task.vendor}</p>
                </div>
              </div>

              {/* Footer */}
              {task.status === 'SENT' ? (
                <p className="mt-3 font-body text-xs italic text-muted-foreground">
                  Dispatched: {task.dispatchedAt}
                </p>
              ) : (
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  {confirmId === task.id ? (
                    <div className="rounded-lg p-3 space-y-2 bg-warning/10">
                      <p className="font-body text-sm text-warning">
                        Confirm dispatch of {task.invNo} to {task.clientEmail}?
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => handleMarkSent(task.id)}
                          className="px-4 py-2 rounded-lg font-body text-sm font-bold bg-gold text-navy hover:opacity-90">Yes, Mark Sent</button>
                        <button onClick={() => setConfirmId(null)} className="font-body text-sm text-muted-foreground hover:underline">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(task.id)}
                      className="w-full h-11 rounded-xl font-body text-sm font-bold bg-success text-white hover:opacity-90 transition-opacity">
                      MARK AS SENT
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground font-body text-sm py-8">No tasks match your filters.</p>
        )}
      </div>
    </div>
  );
}

function ManagerView() {
  const navigate = useNavigate();
  const [tasks] = useState<StaffTask[]>([...MOCK_STAFF_TASKS]);
  const [assignDropdown, setAssignDropdown] = useState<string | null>(null);
  const staffUsers = MOCK_USERS.filter(u => u.role === 'staff');

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1100px]">
          <thead>
            <tr className="bg-navy h-11">
              {['Task #', 'Sale Ref', 'Client', 'Email', 'Vendor', 'INV NO', 'Priority', 'Assigned To', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-3 py-2.5 font-body text-[12px] font-bold text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => {
              const ss = STATUS_STYLES[t.status] ?? STATUS_STYLES.NOT_SENT;
              const assigned = MOCK_USERS.find(u => u.id === t.assignedTo);
              return (
                <tr key={t.id}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                  onClick={() => navigate(`/staff-queue/${t.id}`)}
                >
                  <td className="px-3 py-3 font-mono text-xs text-primary">{t.id.toUpperCase()}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{t.saleChildId}</td>
                  <td className="px-3 py-3 font-body text-[13px] text-foreground">{t.clientFirstName} {t.clientLastName}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">{t.clientEmail}</td>
                  <td className="px-3 py-3 font-body text-[13px] text-foreground">{t.vendor}</td>
                  <td className="px-3 py-3 font-mono text-xs font-bold text-foreground">{t.invNo}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_DOT[t.priority] }} />
                      <span className="font-body text-[11px]">{t.priority}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-body text-[13px] text-foreground">{assigned?.name || '—'}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium"
                      style={{ backgroundColor: ss.bg, color: ss.text }}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-3 relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setAssignDropdown(assignDropdown === t.id ? null : t.id)}
                      className="px-2.5 py-1 rounded-lg font-body text-[11px] font-medium border border-primary text-primary hover:opacity-90">
                      Assign Staff
                    </button>
                    {assignDropdown === t.id && (
                      <div className="absolute right-0 top-full mt-1 bg-card rounded-lg shadow-lg border border-border z-10 py-1 min-w-[160px]">
                        {staffUsers.map(u => (
                          <button key={u.id} onClick={() => setAssignDropdown(null)}
                            className="w-full text-left px-3 py-2 font-body text-sm text-foreground hover:bg-muted transition-colors">
                            {u.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StaffQueuePage() {
  const { currentUser } = useAuth();
  const isManager = currentUser?.role === 'ops_manager' || currentUser?.role === 'super_admin' || currentUser?.role === 'sr_operator';

  return (
    <div>
      <h1 className="font-heading text-[26px] text-primary mb-4">Staff Dispatch Queue</h1>
      {isManager ? <ManagerView /> : <StaffView />}
    </div>
  );
}
