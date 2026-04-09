import { useState, useEffect, useCallback } from 'react';
import { Lock, CheckCircle } from 'lucide-react';

interface GuestRow {
  ticket: number;
  ref: string;
  category: string;
  firstName: string;
  lastName: string;
  email: string;
  comments: string;
  status: 'SENT' | 'NOT_SENT';
  disabled: boolean;
}

function initRows(): GuestRow[] {
  return Array.from({ length: 12 }, (_, i) => ({
    ticket: i + 1,
    ref: `S250132-${i + 1}`,
    category: 'Top Cat 1',
    firstName: i === 0 ? 'John' : '',
    lastName: i === 0 ? 'Smith' : '',
    email: i === 0 ? 'john.smith@roadtrips.ae' : '',
    comments: '',
    status: i === 0 ? 'SENT' : 'NOT_SENT',
    disabled: i === 0,
  }));
}

export default function ClientPortalPage() {
  const [rows, setRows] = useState<GuestRow[]>(initRows);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailErrors, setEmailErrors] = useState<Set<number>>(new Set());

  const completedCount = rows.filter(r => r.firstName && r.lastName && r.email && !emailErrors.has(r.ticket)).length;
  const editableComplete = rows.filter(r => !r.disabled && r.firstName && r.lastName && r.email && !emailErrors.has(r.ticket)).length;
  const canSubmit = editableComplete === 11 && confirmed;

  const updateRow = useCallback((index: number, field: keyof GuestRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    setSaving('saving');
  }, []);

  useEffect(() => {
    if (saving === 'saving') {
      const t = setTimeout(() => setSaving('saved'), 800);
      return () => clearTimeout(t);
    }
    if (saving === 'saved') {
      const t = setTimeout(() => setSaving('idle'), 2000);
      return () => clearTimeout(t);
    }
  }, [saving]);

  const validateEmail = (index: number, email: string) => {
    const valid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setEmailErrors(prev => {
      const next = new Set(prev);
      valid ? next.delete(index + 1) : next.add(index + 1);
      return next;
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F9FC' }}>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-12 rounded-2xl mx-6 max-w-lg" style={{ backgroundColor: '#D1FAE5' }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#A7F3D0' }}>
              <CheckCircle size={40} style={{ color: '#1A7A4A' }} />
            </div>
            <h2 className="font-display text-[26px] mb-2" style={{ color: '#065F46' }}>Guest Details Submitted!</h2>
            <p className="font-body text-sm" style={{ color: '#065F46' }}>Your tickets will be dispatched to the email addresses provided.</p>
            <p className="font-body text-sm mt-2" style={{ color: '#065F46' }}>You will receive a confirmation email once each ticket has been sent.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F9FC' }}>
      <Header />

      {/* Welcome strip */}
      <div className="py-6 px-8" style={{ backgroundColor: '#0B2D5E' }}>
        <h1 className="font-display text-2xl" style={{ color: 'white' }}>Welcome, David Clarke</h1>
        <p className="font-body text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Roadtrips · FIFA World Cup 2026 · M01 MEX v RSA
        </p>
      </div>

      {/* Instructions */}
      <div className="mx-6 mt-4 rounded-xl p-4" style={{ backgroundColor: '#FEF3C7' }}>
        <p className="font-body text-sm" style={{ color: '#92400E' }}>
          <strong>Please verify your ticket details and fill in guest information for each ticket.</strong>
          <br />All fields marked with * are required. Details auto-save as you type.
        </p>
      </div>

      {/* Summary */}
      <div className="mx-6 mt-4 bg-bg-card rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap gap-2 mb-3">
          {['Sale Ref: S250132', 'Match: M01 MEX v RSA', 'Category: Top Cat 1', '12 Tickets'].map(p => (
            <span key={p} className="px-3 py-1 rounded-full font-body text-xs" style={{ backgroundColor: '#F3F4F6', color: '#374151' }}>{p}</span>
          ))}
          <span className="px-3 py-1 rounded-full font-body text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>ALLOCATED ✓</span>
        </div>
        <p className="font-body text-sm mb-2" style={{ color: '#1A1A2E' }}>Guest Details: {completedCount} of 12 rows completed</p>
        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${(completedCount / 12) * 100}%`, backgroundColor: '#0B2D5E' }} />
        </div>
      </div>

      {/* Table */}
      <div className="mx-6 mt-4 bg-bg-card rounded-xl shadow-sm overflow-hidden flex-1 mb-24">
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="font-display text-lg" style={{ color: '#0B2D5E' }}>Guest Information</h3>
          {saving !== 'idle' && (
            <span className="font-body text-xs" style={{ color: saving === 'saving' ? '#D97706' : '#1A7A4A' }}>
              {saving === 'saving' ? 'Saving...' : 'Saved ✓'}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr style={{ backgroundColor: '#0B2D5E', height: 40 }}>
                {['#', 'Row Ref', 'Category', 'First Name *', 'Last Name *', 'Email *', 'Comments', 'Status'].map(h => (
                  <th key={h} className="px-3 py-2 font-body text-[12px] font-bold" style={{ color: 'white' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.ref} style={{ backgroundColor: r.disabled ? '#F9FAFB' : i % 2 === 0 ? 'white' : '#FAFBFD' }}>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: '#6B7280' }}>{r.ticket}</td>
                  <td className="px-3 py-2 font-mono text-[11px]" style={{ color: '#6B7280' }}>{r.ref}</td>
                  <td className="px-3 py-2 font-body text-xs" style={{ color: '#6B7280' }}>{r.category}</td>
                  <td className="px-3 py-2">
                    <input
                      value={r.firstName}
                      onChange={e => updateRow(i, 'firstName', e.target.value)}
                      disabled={r.disabled}
                      className="w-full h-9 px-2 rounded-lg font-body text-[13px] border outline-none transition-colors disabled:bg-muted disabled:cursor-not-allowed focus:border-gold"
                      style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={r.lastName}
                      onChange={e => updateRow(i, 'lastName', e.target.value)}
                      disabled={r.disabled}
                      className="w-full h-9 px-2 rounded-lg font-body text-[13px] border outline-none transition-colors disabled:bg-muted disabled:cursor-not-allowed focus:border-gold"
                      style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="email"
                      value={r.email}
                      onChange={e => updateRow(i, 'email', e.target.value)}
                      onBlur={() => validateEmail(i, r.email)}
                      disabled={r.disabled}
                      className="w-full h-9 px-2 rounded-lg font-body text-[13px] border outline-none transition-colors disabled:bg-muted disabled:cursor-not-allowed focus:border-gold"
                      style={{ borderColor: emailErrors.has(r.ticket) ? '#DC2626' : '#E5E7EB', color: '#1A1A2E' }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={r.comments}
                      onChange={e => updateRow(i, 'comments', e.target.value)}
                      disabled={r.disabled}
                      className="w-full h-9 px-2 rounded-lg font-body text-[13px] border outline-none transition-colors disabled:bg-muted disabled:cursor-not-allowed focus:border-gold"
                      style={{ borderColor: '#E5E7EB', color: '#1A1A2E' }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {r.status === 'SENT' ? (
                      <span className="badge-sent px-2 py-0.5 rounded-full font-body text-[10px] font-medium">SENT ✓</span>
                    ) : (
                      <span className="badge-not-sent px-2 py-0.5 rounded-full font-body text-[10px] font-medium">NOT SENT</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-card border-t px-6 py-4 flex items-center justify-between" style={{ borderColor: '#E5E7EB' }}>
        <p className="font-body text-sm" style={{ color: '#6B7280' }}>Completing row {Math.min(completedCount + 1, 12)} of 12</p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-4 h-4 rounded accent-gold" />
            <span className="font-body text-sm" style={{ color: '#1A1A2E' }}>I confirm all guest details are accurate *</span>
          </label>
          <button
            onClick={() => setSubmitted(true)}
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-lg font-body text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: canSubmit ? '#C9A84C' : '#E5E7EB', color: canSubmit ? '#0B2D5E' : '#6B7280' }}
          >
            Submit All Details →
          </button>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-bg-card border-b flex items-center justify-between px-6 h-14" style={{ borderColor: '#E5E7EB' }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm" style={{ backgroundColor: '#C9A84C', color: '#0B2D5E', fontWeight: 700 }}>T</div>
        <span className="font-display text-lg" style={{ color: '#0B2D5E' }}>TicketOps</span>
      </div>
      <span className="font-body text-[15px]" style={{ color: '#6B7280' }}>Secure Client Portal</span>
      <div className="flex items-center gap-2">
        <Lock size={14} style={{ color: '#D97706' }} />
        <span className="font-body text-[13px]" style={{ color: '#D97706' }}>Session expires in 6d 23h</span>
      </div>
    </header>
  );
}
