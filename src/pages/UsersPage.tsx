import { useState } from 'react';
import { MOCK_USERS } from '@/data/mockData';
import { X } from 'lucide-react';

const ROLE_BADGES: Record<string, { label: string; bg: string; text: string; avatarBg: string }> = {
  super_admin: { label: 'Super Admin', bg: '#FEE2E2', text: '#991B1B', avatarBg: '#FECACA' },
  ops_manager: { label: 'Ops Manager', bg: '#EDE9FE', text: '#5B21B6', avatarBg: '#DDD6FE' },
  sr_operator: { label: 'Sr. Operator', bg: '#DBEAFE', text: '#1E40AF', avatarBg: '#BFDBFE' },
  operator: { label: 'Operator', bg: '#CCFBF1', text: '#0F766E', avatarBg: '#99F6E4' },
  staff: { label: 'Staff', bg: '#FEF3C7', text: '#92400E', avatarBg: '#FDE68A' },
  client: { label: 'Client', bg: '#D1FAE5', text: '#065F46', avatarBg: '#A7F3D0' },
};

const LAST_LOGINS = ['Just now', '2h ago', '1h ago', '3h ago', '30m ago', '1d ago'];
const EVENT_ASSIGNS = ['All Events', 'FIFA WC 2026', 'FIFA WC 2026', 'FIFA WC 2026', 'FIFA WC 2026', 'Portal only'];

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-[26px]" style={{ color: '#0B2D5E' }}>User Management</h1>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg font-body text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0B2D5E', color: 'white' }}>
          Add User +
        </button>
      </div>

      <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[950px]">
            <thead>
              <tr style={{ backgroundColor: '#0B2D5E', height: 44 }}>
                {['', 'Name', 'Email', 'Role', 'Event Assignments', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-body text-[12px] font-bold" style={{ color: 'white' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((u, i) => {
                const rb = ROLE_BADGES[u.role] || ROLE_BADGES.client;
                return (
                  <tr key={u.id}
                    className="transition-colors"
                    style={{ backgroundColor: 'white' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8F9FC')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold"
                        style={{ backgroundColor: rb.avatarBg, color: rb.text }}>{u.initials}</div>
                    </td>
                    <td className="px-4 py-3 font-body text-sm font-medium" style={{ color: '#1A1A2E' }}>{u.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px]" style={{ color: '#6B7280' }}>{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full font-body text-[10px] font-medium" style={{ backgroundColor: rb.bg, color: rb.text }}>{rb.label}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{EVENT_ASSIGNS[i]}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1A7A4A' }} />
                        <span className="font-body text-xs" style={{ color: '#1A7A4A' }}>Active</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-xs" style={{ color: '#6B7280' }}>{LAST_LOGINS[i]}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-lg font-body text-[11px] font-medium border transition-opacity hover:opacity-90"
                          style={{ borderColor: '#0B2D5E', color: '#0B2D5E' }}>Edit</button>
                        {u.role !== 'super_admin' && (
                          <button className="px-3 py-1.5 rounded-lg font-body text-[11px] font-medium transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>Deactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <AddUserModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(['FIFA WC 2026']));
  const toggleEvent = (e: string) => setSelectedEvents(prev => { const n = new Set(prev); n.has(e) ? n.delete(e) : n.add(e); return n; });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-bg-card rounded-2xl shadow-xl max-w-md w-full mx-4 p-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-muted"><X size={18} /></button>
        <h2 className="font-display text-2xl mb-6" style={{ color: '#0B2D5E' }}>Add New User</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-body text-sm font-medium mb-1.5" style={{ color: '#1A1A2E' }}>Full Name *</label>
            <input className="w-full h-10 px-3 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-gold bg-bg-card" />
          </div>
          <div>
            <label className="block font-body text-sm font-medium mb-1.5" style={{ color: '#1A1A2E' }}>Email Address *</label>
            <input type="email" className="w-full h-10 px-3 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-gold bg-bg-card" />
          </div>
          <div>
            <label className="block font-body text-sm font-medium mb-1.5" style={{ color: '#1A1A2E' }}>Role *</label>
            <select className="w-full h-10 px-3 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-gold bg-bg-card">
              {Object.entries(ROLE_BADGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-body text-sm font-medium mb-1.5" style={{ color: '#1A1A2E' }}>Event Assignment</label>
            <div className="flex gap-2 flex-wrap">
              {['FIFA WC 2026', 'F1 SGP 2026'].map(e => (
                <button key={e} onClick={() => toggleEvent(e)}
                  className="px-3 py-1.5 rounded-full font-body text-xs font-medium border transition-all"
                  style={{
                    backgroundColor: selectedEvents.has(e) ? '#0B2D5E' : 'white',
                    color: selectedEvents.has(e) ? 'white' : '#0B2D5E',
                    borderColor: '#0B2D5E',
                  }}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-body text-sm font-medium mb-1.5" style={{ color: '#1A1A2E' }}>Match Group Scope (optional)</label>
            <input placeholder="Leave blank for all matches" className="w-full h-10 px-3 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-gold bg-bg-card" />
          </div>
          <button className="w-full h-11 rounded-xl font-body text-sm font-bold transition-opacity hover:opacity-90 mt-2"
            style={{ backgroundColor: '#0B2D5E', color: 'white' }}>
            Create User &amp; Send Invite
          </button>
          <div className="text-center">
            <button onClick={onClose} className="font-body text-sm hover:underline" style={{ color: '#6B7280' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
