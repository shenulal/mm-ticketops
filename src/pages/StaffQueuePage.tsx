import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MOCK_STAFF_TASKS, MOCK_USERS } from '@/data/mockData';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

type TaskTab = 'all' | 'sent' | 'not_sent';

interface Task {
  id: string; saleChildId: string; unitId: string; vendor: string;
  invNo: string; vendorLogin: string; clientName: string; clientEmail: string;
  assignedTo: string; status: string; dispatchedAt: string | null;
}

function StaffView() {
  const [tab, setTab] = useState<TaskTab>('not_sent');
  const [tasks, setTasks] = useState<Task[]>(MOCK_STAFF_TASKS as Task[]);
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Auto-hide passwords after 10 seconds
  useEffect(() => {
    if (showPasswords.size === 0) return;
    const timer = setTimeout(() => setShowPasswords(new Set()), 10000);
    return () => clearTimeout(timer);
  }, [showPasswords]);

  const sentCount = tasks.filter(t => t.status === 'SENT').length;
  const notSentCount = tasks.filter(t => t.status === 'NOT_SENT').length;

  const filtered = tasks.filter(t => {
    if (tab === 'sent') return t.status === 'SENT';
    if (tab === 'not_sent') return t.status === 'NOT_SENT';
    return true;
  });

  const handleMarkSent = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'SENT', dispatchedAt: new Date().toLocaleString() } : t));
    setConfirmId(null);
  };

  const TABS: { key: TaskTab; label: string }[] = [
    { key: 'all', label: `All My Tasks (${tasks.length})` },
    { key: 'sent', label: `Sent (${sentCount})` },
    { key: 'not_sent', label: `Not Sent (${notSentCount})` },
  ];

  return (
    <div>
      {/* Summary */}
      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#F8F9FC' }}>
        <p className="font-body text-sm" style={{ color: '#1A1A2E' }}>
          You have <strong>{tasks.length}</strong> assigned tasks · <strong>{sentCount}</strong> dispatched · <strong>{notSentCount}</strong> pending
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-4" style={{ borderColor: '#E5E7EB' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="pb-2.5 font-body text-sm font-medium relative"
            style={{ color: tab === t.key ? '#0B2D5E' : '#6B7280' }}>
            {t.label}
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#0B2D5E' }} />}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map(task => {
          const isSent = task.status === 'SENT';
          const showPw = showPasswords.has(task.id);
          return (
            <div key={task.id} className="bg-bg-card rounded-xl shadow-sm p-5" style={{ borderLeft: `4px solid ${isSent ? '#1A7A4A' : '#D97706'}` }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs" style={{ color: '#6B7280' }}>Task #{task.id.toUpperCase()}</span>
                <span className="px-2.5 py-1 rounded-full font-body text-[11px] font-medium"
                  style={{ backgroundColor: isSent ? '#D1FAE5' : '#FEF3C7', color: isSent ? '#065F46' : '#92400E' }}>
                  {isSent ? 'SENT ✓' : 'NOT SENT ⏳'}
                </span>
              </div>
              <p className="font-body text-sm" style={{ color: '#1A1A2E' }}>
                {task.saleChildId} | Top Cat 1 | M01 MEX v RSA
              </p>

              <div className="my-3 border-t" style={{ borderColor: '#E5E7EB' }} />

              {/* Client + Vendor */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="font-body text-xs" style={{ color: '#6B7280' }}>Client</p>
                  <p className="font-body text-sm font-medium" style={{ color: '#1A1A2E' }}>{task.clientName}</p>
                  <p className="font-body text-xs" style={{ color: '#6B7280' }}>{task.clientEmail}</p>
                </div>
                <div>
                  <p className="font-body text-xs" style={{ color: '#6B7280' }}>Vendor</p>
                  <p className="font-body text-sm font-medium" style={{ color: '#1A1A2E' }}>{task.vendor} · viagogo.com</p>
                </div>
              </div>

              {/* Credentials */}
              <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: '#F8F9FC' }}>
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs" style={{ color: '#6B7280' }}>Login: <span className="font-mono">{task.vendorLogin}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs" style={{ color: '#6B7280' }}>
                    Password: <span className="font-mono">{showPw ? 'Demo1234!' : '••••••••'}</span>
                  </span>
                  <button onClick={() => setShowPasswords(prev => {
                    const n = new Set(prev); showPw ? n.delete(task.id) : n.add(task.id); return n;
                  })}>
                    {showPw ? <EyeOff size={12} style={{ color: '#6B7280' }} /> : <Eye size={12} style={{ color: '#6B7280' }} />}
                  </button>
                </div>
                <span className="font-body text-xs" style={{ color: '#6B7280' }}>INV NO: <span className="font-mono font-bold">{task.invNo}</span></span>
              </div>

              {/* Footer */}
              {isSent ? (
                <p className="mt-3 font-body text-xs italic" style={{ color: '#6B7280' }}>
                  Dispatched: {task.dispatchedAt} by Mohammed Hassan
                </p>
              ) : (
                <div className="mt-3">
                  {confirmId === task.id ? (
                    <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: '#FEF3C7' }}>
                      <p className="font-body text-sm" style={{ color: '#92400E' }}>
                        Confirm you have dispatched ticket {task.invNo} to {task.clientEmail}?
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => handleMarkSent(task.id)}
                          className="px-4 py-2 rounded-lg font-body text-sm font-bold transition-opacity hover:opacity-90"
                          style={{ backgroundColor: '#C9A84C', color: '#0B2D5E' }}>Yes, Mark Sent</button>
                        <button onClick={() => setConfirmId(null)} className="font-body text-sm hover:underline" style={{ color: '#6B7280' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setConfirmId(task.id)}
                        className="w-full h-11 rounded-xl font-body text-sm font-bold transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#1A7A4A', color: 'white' }}>
                        MARK AS SENT
                      </button>
                      <p className="font-body text-xs mt-2 text-center" style={{ color: '#6B7280' }}>
                        Check vendor site and confirm ticket sent before marking.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ManagerView() {
  const [tasks] = useState<Task[]>(MOCK_STAFF_TASKS as Task[]);
  const [assignDropdown, setAssignDropdown] = useState<string | null>(null);
  const staffUsers = MOCK_USERS.filter(u => u.role === 'staff');

  return (
    <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr style={{ backgroundColor: '#0B2D5E', height: 44 }}>
              {['Task #', 'Sale Ref', 'Client', 'Email', 'Vendor', 'INV NO', 'Assigned To', 'Priority', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-3 py-2.5 font-body text-[12px] font-bold" style={{ color: 'white' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => {
              const isSent = t.status === 'SENT';
              const assigned = MOCK_USERS.find(u => u.id === t.assignedTo);
              return (
                <tr key={t.id} style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}>
                  <td className="px-3 py-3 font-mono text-xs" style={{ color: '#0B2D5E' }}>{t.id.toUpperCase()}</td>
                  <td className="px-3 py-3 font-mono text-xs" style={{ color: '#6B7280' }}>{t.saleChildId}</td>
                  <td className="px-3 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{t.clientName}</td>
                  <td className="px-3 py-3 font-mono text-[11px]" style={{ color: '#6B7280' }}>{t.clientEmail}</td>
                  <td className="px-3 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{t.vendor}</td>
                  <td className="px-3 py-3 font-mono text-xs font-bold" style={{ color: '#1A1A2E' }}>{t.invNo}</td>
                  <td className="px-3 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{assigned?.name || '—'}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>Normal</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium"
                      style={{ backgroundColor: isSent ? '#D1FAE5' : '#F3F4F6', color: isSent ? '#065F46' : '#374151' }}>
                      {isSent ? 'SENT' : 'NOT SENT'}
                    </span>
                  </td>
                  <td className="px-3 py-3 relative">
                    <button onClick={() => setAssignDropdown(assignDropdown === t.id ? null : t.id)}
                      className="px-2.5 py-1 rounded-lg font-body text-[11px] font-medium border transition-opacity hover:opacity-90"
                      style={{ borderColor: '#0B2D5E', color: '#0B2D5E' }}>
                      Assign Staff
                    </button>
                    {assignDropdown === t.id && (
                      <div className="absolute right-0 top-full mt-1 bg-bg-card rounded-lg shadow-lg border z-10 py-1 min-w-[160px]" style={{ borderColor: '#E5E7EB' }}>
                        {staffUsers.map(u => (
                          <button key={u.id} onClick={() => setAssignDropdown(null)}
                            className="w-full text-left px-3 py-2 font-body text-sm hover:bg-muted transition-colors" style={{ color: '#1A1A2E' }}>
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
  const isManager = currentUser?.role === 'ops_manager' || currentUser?.role === 'super_admin';

  return (
    <div>
      <h1 className="font-display text-[26px] mb-4" style={{ color: '#0B2D5E' }}>Staff Dispatch Queue</h1>
      {isManager ? <ManagerView /> : <StaffView />}
    </div>
  );
}
