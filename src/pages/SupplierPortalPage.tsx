import { useState } from 'react';
import { Lock, CheckCircle } from 'lucide-react';

const ROWS = [
  { invNo: '630679135', match: 'M01', category: 'Top Cat 1', seat: 'Block A', guest: 'John Smith', email: 'john.smith@roadtrips.ae', status: 'SENT' },
  { invNo: '630679136', match: 'M01', category: 'Top Cat 1', seat: 'Block A', guest: 'Emma Watson', email: 'emma.w@roadtrips.ae', status: 'NOT_SENT' },
  { invNo: '630679137', match: 'M01', category: 'Top Cat 1', seat: 'Block A', guest: '', email: '', status: 'NOT_SENT', awaiting: true },
  { invNo: '630679138', match: 'M01', category: 'Top Cat 1', seat: 'Block A', guest: '', email: '', status: 'NOT_SENT', awaiting: true },
  { invNo: '630679139', match: 'M01', category: 'Top Cat 1', seat: 'Block A', guest: '', email: '', status: 'NOT_SENT', awaiting: true },
];

export default function SupplierPortalPage() {
  const [rows, setRows] = useState(ROWS);

  const markSent = (invNo: string) => {
    setRows(prev => prev.map(r => r.invNo === invNo ? { ...r, status: 'SENT' } : r));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FC' }}>
      {/* Header */}
      <header className="bg-bg-card border-b flex items-center justify-between px-6 h-14" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-display text-xs" style={{ backgroundColor: '#C9A84C', color: '#0B2D5E', fontWeight: 700 }}>T</div>
          <span className="font-display text-base" style={{ color: '#0B2D5E' }}>TicketOps</span>
        </div>
        <span className="font-body text-[15px]" style={{ color: '#6B7280' }}>Supplier Dispatch Portal</span>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full font-body text-[11px] font-bold" style={{ backgroundColor: '#0B2D5E', color: 'white' }}>poxami</span>
          <span className="font-body text-[13px]" style={{ color: '#6B7280' }}>Session: 12d 4h remaining</span>
        </div>
      </header>

      {/* Instructions */}
      <div className="mx-6 mt-4 rounded-xl p-4" style={{ backgroundColor: '#0B2D5E' }}>
        <p className="font-body text-sm" style={{ color: 'white' }}>
          The tickets below have been allocated for dispatch. Please send each ticket to the
          provided delivery email and update the dispatch status. Client company details are not shown.
        </p>
      </div>

      {/* Table */}
      <div className="mx-6 mt-4 bg-bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr style={{ backgroundColor: '#0B2D5E', height: 44 }}>
                {['INV NO', 'Match', 'Category', 'Seat Info', 'Guest Name', 'Delivery Email', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-body text-[12px] font-bold" style={{ color: 'white' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isSent = r.status === 'SENT';
                const isAwaiting = 'awaiting' in r && r.awaiting && !r.guest;
                return (
                  <>
                    <tr key={r.invNo} style={{ backgroundColor: i % 2 === 1 ? '#F8F9FC' : 'white' }}>
                      <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: '#0B2D5E' }}>{r.invNo}</td>
                      <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.match}</td>
                      <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.category}</td>
                      <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.seat}</td>
                      <td className="px-4 py-3 font-body text-[13px]" style={{ color: '#1A1A2E' }}>{r.guest || '—'}</td>
                      <td className="px-4 py-3 font-mono text-[11px]" style={{ color: '#6B7280' }}>{r.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium"
                          style={{ backgroundColor: isSent ? '#D1FAE5' : '#F3F4F6', color: isSent ? '#065F46' : '#374151' }}>
                          {isSent ? 'SENT' : 'NOT SENT'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isSent ? (
                          <span className="font-body text-xs" style={{ color: '#6B7280' }}>Already Sent</span>
                        ) : isAwaiting ? (
                          <button disabled className="px-3 py-1.5 rounded-lg font-body text-[11px] font-medium opacity-60"
                            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>Awaiting details</button>
                        ) : (
                          <button onClick={() => markSent(r.invNo)}
                            className="px-3 py-1.5 rounded-lg font-body text-[11px] font-medium transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#1A7A4A', color: 'white' }}>Mark Sent</button>
                        )}
                      </td>
                    </tr>
                    {isAwaiting && (
                      <tr key={`${r.invNo}-help`}>
                        <td colSpan={8} className="px-4 py-1.5 font-body text-[11px] italic" style={{ backgroundColor: '#FFFBEB', color: '#92400E' }}>
                          Guest details not yet submitted. You will be notified by email when ready.
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
