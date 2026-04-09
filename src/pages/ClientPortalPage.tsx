import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Lock, CheckCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import {
  MOCK_SALES, MOCK_MATCHES, MOCK_SUBGAMES, MOCK_DIST_ROWS,
  getSubGamesForMatch, hasMultipleSubGames,
  type SaleLineItem, type DistRow,
} from '@/data/mockData';

/* ── Types ── */
interface GuestRow {
  distId: string;
  ticket: number;
  ref: string;
  firstName: string;
  lastName: string;
  email: string;
  comments: string;
  status: string;
  disabled: boolean;
}

interface LineGroup {
  lineItem: SaleLineItem;
  lineIdx: number;
  sgName: string;
  sgTime: string;
  venue: string;
  showSubGame: boolean;
  isPending: boolean;
  isCancelled: boolean;
  rows: GuestRow[];
}

/* ── Helpers ── */
function getSubGameInfo(sgId: string) {
  const sg = MOCK_SUBGAMES.find(s => s.id === sgId);
  return { name: sg?.name ?? '—', time: sg?.startTime ?? '', matchId: sg?.matchId ?? '' };
}

function buildGroups(saleId: string): LineGroup[] {
  const sale = MOCK_SALES.find(s => s.id === saleId);
  if (!sale) return [];

  const match = MOCK_MATCHES.find(m => m.id === sale.matchId);
  const isMultiSg = hasMultipleSubGames(sale.matchId);

  return sale.lines.map((li, liIdx) => {
    const sgInfo = getSubGameInfo(li.subGameId);
    const isPending = li.oversellFlag || li.status === 'PENDING_APPROVAL';
    const isCancelled = li.status === 'CANCELLED';
    const distRows = MOCK_DIST_ROWS.filter(dr => dr.lineItemId === li.id);

    const rows: GuestRow[] = distRows.length > 0
      ? distRows.map((dr, i) => ({
          distId: dr.id,
          ticket: i + 1,
          ref: dr.id,
          firstName: dr.clientFirstName,
          lastName: dr.clientLastName,
          email: dr.clientEmail,
          comments: '',
          status: dr.dispatchStatus,
          disabled: dr.dispatchStatus === 'SENT',
        }))
      : Array.from({ length: li.qty }, (_, i) => ({
          distId: `${li.id}-${i + 1}`,
          ticket: i + 1,
          ref: `${li.id.toUpperCase()}-${i + 1}`,
          firstName: '',
          lastName: '',
          email: '',
          comments: '',
          status: 'NOT_SENT',
          disabled: false,
        }));

    return {
      lineItem: li,
      lineIdx: liIdx,
      sgName: sgInfo.name,
      sgTime: sgInfo.time,
      venue: match ? `${match.venue}, ${match.city}` : '',
      showSubGame: isMultiSg,
      isPending,
      isCancelled,
      rows,
    };
  });
}

/* ── Header ── */
function Header() {
  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border flex items-center justify-between px-6 h-14">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm bg-accent text-accent-foreground font-bold">T</div>
        <span className="font-display text-lg text-primary">TicketOps</span>
      </div>
      <span className="font-body text-[15px] text-muted-foreground">Secure Client Portal</span>
      <div className="flex items-center gap-2">
        <Lock size={14} className="text-warning" />
        <span className="font-body text-[13px] text-warning">Session expires in 6d 23h</span>
      </div>
    </header>
  );
}

/* ── Ticket Group Section ── */
function TicketGroupSection({ group, onUpdateRow, saving }: {
  group: LineGroup;
  onUpdateRow: (distId: string, field: keyof GuestRow, value: string) => void;
  saving: 'idle' | 'saving' | 'saved';
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [emailErrors, setEmailErrors] = useState<Set<string>>(new Set());

  const validateEmail = (distId: string, email: string) => {
    const valid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setEmailErrors(prev => {
      const next = new Set(prev);
      valid ? next.delete(distId) : next.add(distId);
      return next;
    });
  };

  const completedInGroup = group.rows.filter(r => r.firstName && r.lastName && r.email && !emailErrors.has(r.distId)).length;

  // Cancelled line
  if (group.isCancelled) {
    return (
      <div className="mx-6 mt-4">
        <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
          <div className="p-3 flex items-center justify-between bg-muted">
            <span className="font-body text-sm font-bold text-muted-foreground line-through">
              {group.sgName} — {group.lineItem.categoryLabel}
            </span>
            <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium bg-destructive/10 text-destructive">CANCELLED</span>
          </div>
          <div className="p-5">
            <p className="font-body text-sm text-muted-foreground">
              {group.lineItem.categoryLabel} section has been removed from this booking. Contact your account manager for details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (group.isPending) {
    return (
      <div className="mx-6 mt-4">
        <div className="rounded-xl overflow-hidden border border-warning">
          <div className="p-3 flex items-center justify-between bg-warning/20">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-warning" />
              <span className="font-body text-sm font-bold text-warning">
                {group.sgName} — {group.lineItem.categoryLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-warning">{group.lineItem.qty} tickets</span>
              <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium bg-warning/20 text-warning">PENDING APPROVAL ⚠</span>
            </div>
          </div>
          <div className="p-5 bg-warning/5">
            <p className="font-body text-sm text-foreground mb-2">
              These tickets are currently pending manager approval due to limited availability.
            </p>
            <p className="font-body text-sm text-muted-foreground">
              You will be notified by email once confirmed and able to enter guest details.
            </p>
            <button className="mt-3 px-4 py-2 rounded-lg font-body text-xs font-medium border border-warning text-warning hover:bg-warning/10">
              Check back later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-6 mt-4">
      <div className="rounded-xl overflow-hidden shadow-sm border border-border">
        {/* Group header */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-full p-3 flex items-center justify-between bg-primary text-primary-foreground rounded-t-xl">
          <span className="font-body text-sm font-bold">
            {group.sgName} — {group.lineItem.categoryLabel}
          </span>
          <div className="flex items-center gap-3">
            <span className="font-body text-xs text-primary-foreground/80">{group.lineItem.qty} tickets</span>
            <span className="font-body text-[10px] text-primary-foreground/60">{completedInGroup}/{group.rows.length} complete</span>
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </div>
        </button>

        {/* Sub-header */}
        {!collapsed && (
          <>
            {group.showSubGame && (
              <div className="px-4 py-2 bg-muted border-b border-border">
                <span className="font-body text-xs text-muted-foreground">
                  {group.sgName} | {group.sgTime} | {group.venue}
                </span>
              </div>
            )}

            {/* Ticket table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-muted h-[36px]">
                    {['#', 'Ref', 'Guest First *', 'Guest Last *', 'Email *', 'Comments', 'Status'].map(h => (
                      <th key={h} className="px-3 py-2 font-body text-[11px] font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((r, i) => (
                    <tr key={r.distId} className={r.disabled ? 'bg-muted/50' : i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.ticket}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{r.ref}</td>
                      <td className="px-3 py-2">
                        <input value={r.firstName} onChange={e => onUpdateRow(r.distId, 'firstName', e.target.value)}
                          disabled={r.disabled}
                          className="w-full h-8 px-2 rounded-lg font-body text-[13px] border border-border outline-none focus:border-accent disabled:bg-muted disabled:cursor-not-allowed bg-card" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={r.lastName} onChange={e => onUpdateRow(r.distId, 'lastName', e.target.value)}
                          disabled={r.disabled}
                          className="w-full h-8 px-2 rounded-lg font-body text-[13px] border border-border outline-none focus:border-accent disabled:bg-muted disabled:cursor-not-allowed bg-card" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="email" value={r.email}
                          onChange={e => onUpdateRow(r.distId, 'email', e.target.value)}
                          onBlur={() => validateEmail(r.distId, r.email)}
                          disabled={r.disabled}
                          className={`w-full h-8 px-2 rounded-lg font-body text-[13px] border outline-none focus:border-accent disabled:bg-muted disabled:cursor-not-allowed bg-card ${emailErrors.has(r.distId) ? 'border-destructive' : 'border-border'}`} />
                      </td>
                      <td className="px-3 py-2">
                        <input value={r.comments} onChange={e => onUpdateRow(r.distId, 'comments', e.target.value)}
                          disabled={r.disabled}
                          className="w-full h-8 px-2 rounded-lg font-body text-[13px] border border-border outline-none focus:border-accent disabled:bg-muted disabled:cursor-not-allowed bg-card" />
                      </td>
                      <td className="px-3 py-2">
                        {r.status === 'SENT' ? (
                          <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium bg-success/15 text-success">SENT ✓</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-body text-[10px] font-medium bg-muted text-muted-foreground">NOT SENT</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();

  // Determine which sale to show based on token
  const saleId = token === 'blend-f1-token' ? 'sale002' : 'sale001';
  const sale = MOCK_SALES.find(s => s.id === saleId)!;
  const match = MOCK_MATCHES.find(m => m.id === sale.matchId);
  const isMultiSg = hasMultipleSubGames(sale.matchId);

  const [groups, setGroups] = useState<LineGroup[]>(() => buildGroups(saleId));
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateRow = useCallback((distId: string, field: keyof GuestRow, value: string) => {
    setGroups(prev => prev.map(g => ({
      ...g,
      rows: g.rows.map(r => r.distId === distId ? { ...r, [field]: value } : r),
    })));
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

  const activeGroups = groups.filter(g => !g.isPending);
  const pendingGroups = groups.filter(g => g.isPending);
  const pendingTickets = pendingGroups.reduce((s, g) => s + g.lineItem.qty, 0);

  const totalActiveRows = activeGroups.reduce((s, g) => s + g.rows.length, 0);
  const completedRows = activeGroups.reduce((s, g) =>
    s + g.rows.filter(r => r.firstName && r.lastName && r.email).length, 0);
  const allComplete = completedRows === totalActiveRows && totalActiveRows > 0;
  const canSubmit = allComplete && confirmed;

  const totalQty = sale.lines.reduce((s, l) => s + l.qty, 0);
  const totalValue = sale.lines.reduce((s, l) => s + l.lineTotal, 0);

  // Client name based on sale
  const clientName = saleId === 'sale002' ? 'Blend Group' : 'David Clarke';

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-12 rounded-2xl mx-6 max-w-lg bg-success/10">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-success/20">
              <CheckCircle size={40} className="text-success" />
            </div>
            <h2 className="font-display text-[26px] mb-2 text-success">Guest Details Submitted!</h2>
            <p className="font-body text-sm text-success">Your tickets will be dispatched to the email addresses provided.</p>
            <p className="font-body text-sm mt-2 text-success">You will receive a confirmation email once each ticket has been sent.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Welcome strip */}
      <div className="py-6 px-8 bg-primary">
        <h1 className="font-display text-2xl text-primary-foreground">Welcome, {clientName}</h1>
        <p className="font-body text-sm mt-1 text-primary-foreground/70">
          {sale.client} · {match?.teams ? `${match.code} ${match.teams}` : sale.matchId}
        </p>
      </div>

      {/* Multi-session note */}
      {isMultiSg && (
        <div className="mx-6 mt-4 rounded-xl p-4 bg-accent/10 border border-accent/30">
          <p className="font-body text-sm text-accent-foreground">
            Your booking covers <strong>{groups.length} sessions</strong>. Please fill guest details for each.
          </p>
        </div>
      )}

      {/* Sale summary card */}
      <div className="mx-6 mt-4 bg-card rounded-xl shadow-sm p-5">
        <p className="font-body text-xs font-medium text-muted-foreground mb-2">Sale Reference: {sale.id.toUpperCase()}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {sale.lines.map((li, i) => {
            const isPending = li.oversellFlag || li.status === 'PENDING_APPROVAL';
            return (
              <span key={li.id} className={`px-3 py-1 rounded-full font-body text-xs font-medium ${
                isPending ? 'bg-warning/15 text-warning' : 'bg-primary/10 text-primary'
              }`}>
                {li.categoryLabel}: {li.qty} tickets{isPending ? ' — Pending' : ''}
              </span>
            );
          })}
        </div>
        <p className="font-body text-sm text-foreground mb-3">
          {totalQty} tickets | {sale.lines.length} categories | AED {totalValue.toLocaleString()}
        </p>

        {/* Progress bar */}
        <p className="font-body text-sm text-foreground mb-1">
          Guest Details: {completedRows} of {totalActiveRows} rows completed
        </p>
        <div className="w-full h-1.5 rounded-full bg-border">
          <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${totalActiveRows > 0 ? (completedRows / totalActiveRows) * 100 : 0}%` }} />
        </div>
        {pendingTickets > 0 && (
          <p className="font-body text-xs text-warning mt-2">
            {pendingGroups[0].lineItem.categoryLabel} rows ({pendingTickets} tickets) are currently pending approval and will appear once confirmed.
          </p>
        )}
      </div>

      {/* Per-group progress */}
      <div className="mx-6 mt-3 flex flex-wrap gap-3">
        {activeGroups.map(g => {
          const done = g.rows.filter(r => r.firstName && r.lastName && r.email).length;
          return (
            <span key={g.lineItem.id} className="font-body text-xs text-muted-foreground">
              {g.lineItem.categoryLabel}: {done}/{g.rows.length} complete
            </span>
          );
        })}
      </div>

      {/* Ticket groups */}
      {groups.map(g => (
        <TicketGroupSection key={g.lineItem.id} group={g} onUpdateRow={updateRow} saving={saving} />
      ))}

      {/* Spacer for footer */}
      <div className="h-24" />

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between z-30">
        <div>
          <p className="font-body text-sm text-muted-foreground">
            {completedRows} of {totalActiveRows} rows across {activeGroups.length} active group{activeGroups.length > 1 ? 's' : ''} completed
          </p>
          {saving !== 'idle' && (
            <span className={`font-body text-xs ${saving === 'saving' ? 'text-warning' : 'text-success'}`}>
              {saving === 'saving' ? 'Saving...' : 'Saved ✓'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-4 h-4 rounded accent-accent" />
            <span className="font-body text-sm text-foreground">I confirm all guest details are accurate *</span>
          </label>
          <button onClick={() => setSubmitted(true)} disabled={!canSubmit}
            className={`px-6 py-2.5 rounded-lg font-body text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40 ${
              canSubmit ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            Submit All Details →
          </button>
        </div>
      </div>
    </div>
  );
}
