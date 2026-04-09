import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  MOCK_SALES, MOCK_UNITS, MOCK_MATCHES, MOCK_SUBGAMES,
  getInventoryAvailable, getCategoriesForSubGame,
  type SaleLineItem,
} from '@/data/mockData';
import {
  X, AlertTriangle, CheckCircle, Loader2, ArrowUpRight, ArrowDownRight,
  ShieldAlert, FileText, Clock, User, Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OversellResolutionDrawerProps {
  saleId: string;
  lineItem: SaleLineItem;
  lineIdx: number;
  onClose: () => void;
  onResolved: () => void;
}

type ResolutionOption = 'approve' | 'upgrade' | 'downgrade' | 'split' | 'cancel';

function getMatchLabel(matchId: string) {
  const m = MOCK_MATCHES.find(x => x.id === matchId);
  return m ? `${m.code} — ${m.teams}` : matchId;
}

function getSubGameName(sgId: string) {
  return MOCK_SUBGAMES.find(sg => sg.id === sgId)?.name ?? '—';
}

function formatCurrency(v: number) {
  return v.toLocaleString('en-AE', { minimumFractionDigits: 0 });
}

export default function OversellResolutionDrawer({
  saleId, lineItem, lineIdx, onClose, onResolved,
}: OversellResolutionDrawerProps) {
  const { currentUser, isSrOperator, isManager, isAdmin } = useAuth();
  const canResolve = isSrOperator() || isManager() || isAdmin();

  const sale = MOCK_SALES.find(s => s.id === saleId);
  const saleLabel = saleId.toUpperCase().replace('SALE', 'SALE-');
  const sgName = getSubGameName(lineItem.subGameId);
  const available = getInventoryAvailable(lineItem.subGameId, lineItem.categoryId);
  const overBy = Math.max(0, lineItem.qty - available);

  // Next-best category (one level up)
  const categories = getCategoriesForSubGame(lineItem.subGameId);
  const soldCat = categories.find(c => c.id === lineItem.categoryId);
  const soldLevel = soldCat?.level ?? 99;
  const nextBest = categories.filter(c => c.level < soldLevel).sort((a, b) => b.level - a.level)[0];
  const nextBestAvail = nextBest ? getInventoryAvailable(lineItem.subGameId, nextBest.id) : 0;
  const nextWorst = categories.filter(c => c.level > soldLevel).sort((a, b) => a.level - b.level)[0];
  const nextWorstAvail = nextWorst ? getInventoryAvailable(lineItem.subGameId, nextWorst.id) : 0;

  // Margin delta estimate (upgrade costs more, downgrade saves)
  const avgPurchaseCost = lineItem.unitPrice * 0.72; // estimate
  const upgradeCostPerUnit = nextBest ? avgPurchaseCost * 1.4 : 0;
  const upgradeDelta = nextBest ? -(upgradeCostPerUnit - avgPurchaseCost) * overBy : 0;
  const downgradeSavings = nextWorst ? avgPurchaseCost * 0.3 * overBy : 0;

  // State
  const [selectedOption, setSelectedOption] = useState<ResolutionOption | null>(null);
  const [reason, setReason] = useState('');
  const [notifyPurchasing, setNotifyPurchasing] = useState(true);
  const [clientConsent, setClientConsent] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [resolved, setResolved] = useState(false);

  // Mock audit history
  const auditHistory = [
    { actor: 'System', action: 'Oversell detected', time: '16 Apr 2026 14:32', note: `${lineItem.categoryLabel} × ${lineItem.qty} exceeds stock by ${overBy}` },
  ];

  const isValid = (): boolean => {
    if (!selectedOption) return false;
    if (!canResolve) return false;
    switch (selectedOption) {
      case 'approve': return reason.trim().length > 0;
      case 'upgrade': return !!nextBest && nextBestAvail >= overBy;
      case 'downgrade': return !!nextWorst && clientConsent;
      case 'split': return true;
      case 'cancel': return cancelReason.trim().length > 0;
    }
  };

  const handleSave = async () => {
    if (!isValid()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setSaving(false);
    setResolved(true);
    setTimeout(() => onResolved(), 1200);
  };

  const OPTION_CARDS: { key: ResolutionOption; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'approve', label: 'Approve As-Is', icon: <CheckCircle size={16} className="text-warning" />, desc: `Allocate ${available} available, mark ${overBy} as PENDING_PURCHASE.` },
    ...(nextBest ? [{ key: 'upgrade' as const, label: `Upgrade to ${nextBest.label}`, icon: <ArrowUpRight size={16} className="text-[#3B82F6]" />, desc: `Allocate ${overBy} over-limit from ${nextBest.label} stock (${nextBestAvail} available).` }] : []),
    ...(nextWorst ? [{ key: 'downgrade' as const, label: `Downgrade to ${nextWorst.label}`, icon: <ArrowDownRight size={16} className="text-warning" />, desc: `Allocate ${overBy} over-limit from ${nextWorst.label} stock (${nextWorstAvail} available).` }] : []),
    { key: 'split', label: 'Split / Swap Vendors', icon: <FileText size={16} className="text-primary" />, desc: 'Open Allocation Preview for manual set picking across vendors.' },
    { key: 'cancel', label: 'Cancel Over-Limit', icon: <X size={16} className="text-destructive" />, desc: `Cancel ${overBy} over-limit tickets. Credit back to client.` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <motion.div
        initial={{ x: 500, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 500, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-[520px] max-w-full h-full bg-card shadow-2xl flex flex-col z-10 border-l border-border"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={18} className="text-warning" />
                <h2 className="font-display text-lg text-primary">Oversell — {saleLabel} Line {lineIdx + 1}</h2>
              </div>
              <p className="font-body text-sm text-muted-foreground">
                {sale?.client} · {getMatchLabel(sale?.matchId ?? '')} · {sgName}
              </p>
              <p className="font-body text-sm text-foreground mt-1">
                Requested <strong>{lineItem.qty} {lineItem.categoryLabel}</strong>, Available <strong className="text-success">{available}</strong>, Over by <strong className="text-destructive">{overBy}</strong>
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {resolved ? (
              <motion.div
                key="resolved"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-success/15 border-2 border-success flex items-center justify-center mb-4">
                  <CheckCircle size={36} className="text-success" />
                </div>
                <h3 className="font-display text-xl text-primary mb-2">Oversell Resolved</h3>
                <p className="font-body text-sm text-muted-foreground">
                  {selectedOption === 'approve' && `${available} allocated, ${overBy} marked PENDING_PURCHASE.`}
                  {selectedOption === 'upgrade' && `${overBy} units upgraded to ${nextBest?.label}.`}
                  {selectedOption === 'downgrade' && `${overBy} units downgraded to ${nextWorst?.label}.`}
                  {selectedOption === 'split' && 'Manual allocation saved.'}
                  {selectedOption === 'cancel' && `${overBy} over-limit tickets cancelled.`}
                </p>
                <p className="font-mono text-xs text-muted-foreground mt-2">
                  Audit: OSRL-{Date.now().toString(36).toUpperCase()}
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5">
                {/* Panel 1: Impact Summary */}
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <h3 className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Impact Summary</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Requested Qty', `${lineItem.qty} tickets`],
                      ['Over-Limit Qty', `${overBy} tickets`],
                      [`Current ${lineItem.categoryLabel} Stock`, `${available} units`],
                      ...(nextBest ? [[`Next Best: ${nextBest.label}`, `${nextBestAvail} available`]] : [['Next Best', 'None higher']]),
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="font-body text-[11px] text-muted-foreground">{label}</p>
                        <p className="font-body text-sm font-medium text-foreground">{val}</p>
                      </div>
                    ))}
                  </div>
                  {nextBest && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="font-body text-xs text-muted-foreground">
                        Margin delta if upgraded to {nextBest.label}: <span className="font-semibold text-destructive">AED {formatCurrency(Math.round(upgradeDelta))}</span> ({overBy} units × higher cost)
                      </p>
                    </div>
                  )}
                </div>

                {/* Panel 2: Resolution Options */}
                <div>
                  <h3 className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Resolution Options</h3>
                  <div className="space-y-2">
                    {OPTION_CARDS.map(opt => {
                      const isSelected = selectedOption === opt.key;
                      return (
                        <div key={opt.key}>
                          <button
                            onClick={() => setSelectedOption(opt.key)}
                            tabIndex={0}
                            role="radio"
                            aria-checked={isSelected}
                            className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                              isSelected
                                ? 'border-accent bg-accent/5 shadow-sm'
                                : 'border-border hover:border-accent/50 hover:bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {opt.icon}
                              <span className="font-body text-sm font-semibold text-foreground">{opt.label}</span>
                              {isSelected && <CheckCircle size={14} className="text-accent ml-auto" />}
                            </div>
                            <p className="font-body text-xs text-muted-foreground">{opt.desc}</p>
                          </button>

                          {/* Expanded fields per option */}
                          <AnimatePresence>
                            {isSelected && opt.key === 'approve' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 space-y-3">
                                  <div>
                                    <label className="font-body text-xs font-medium text-foreground block mb-1">Reason *</label>
                                    <textarea
                                      value={reason}
                                      onChange={e => setReason(e.target.value)}
                                      className="w-full h-16 rounded-lg border border-border px-3 py-2 font-body text-sm text-foreground bg-card resize-none focus:ring-1 focus:ring-accent outline-none"
                                      placeholder="Why approve this oversell?"
                                      aria-label="Reason for approval"
                                    />
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={notifyPurchasing}
                                      onChange={() => setNotifyPurchasing(!notifyPurchasing)}
                                      className="w-4 h-4 rounded border-border accent-accent"
                                    />
                                    <span className="font-body text-xs text-foreground flex items-center gap-1">
                                      <Bell size={12} /> Notify purchasing team
                                    </span>
                                  </label>
                                </div>
                              </motion.div>
                            )}

                            {isSelected && opt.key === 'upgrade' && nextBest && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 space-y-2">
                                  <div className="rounded-lg bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <ArrowUpRight size={14} className="text-[#3B82F6]" />
                                      <span className="font-body text-xs font-bold text-foreground">Upgrade Preview</span>
                                    </div>
                                    <p className="font-body text-xs text-muted-foreground">
                                      {overBy} units from {nextBest.label} ({nextBestAvail} available) → {nextBestAvail - overBy} remaining after
                                    </p>
                                    <p className="font-body text-xs mt-1">
                                      Margin impact: <span className="font-semibold text-destructive">AED {formatCurrency(Math.round(upgradeDelta))}</span>
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User size={12} />
                                    <span className="font-body">Approver: <strong className="text-foreground">{currentUser?.name ?? 'Unknown'}</strong></span>
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            {isSelected && opt.key === 'downgrade' && nextWorst && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 space-y-3">
                                  <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
                                    <p className="font-body text-xs text-muted-foreground">
                                      {overBy} units from {nextWorst.label} ({nextWorstAvail} available)
                                    </p>
                                    <p className="font-body text-xs mt-1">
                                      Cost savings: <span className="font-semibold text-success">+AED {formatCurrency(Math.round(downgradeSavings))}</span>
                                    </p>
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={clientConsent}
                                      onChange={() => setClientConsent(!clientConsent)}
                                      className="w-4 h-4 rounded border-border accent-accent"
                                    />
                                    <span className="font-body text-xs text-foreground">Client has consented to downgrade</span>
                                  </label>
                                  {!clientConsent && selectedOption === 'downgrade' && (
                                    <p className="font-body text-[10px] text-destructive">Client consent required before saving.</p>
                                  )}
                                </div>
                              </motion.div>
                            )}

                            {isSelected && opt.key === 'split' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4">
                                  <p className="font-body text-xs text-muted-foreground mb-2">
                                    Opens the Allocation Preview page where you can manually pick sets from different vendors.
                                  </p>
                                  <a
                                    href={`/distribution/${saleId}/preview`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-body text-xs font-medium bg-primary text-primary-foreground hover:opacity-90"
                                  >
                                    Open Allocation Preview →
                                  </a>
                                </div>
                              </motion.div>
                            )}

                            {isSelected && opt.key === 'cancel' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 space-y-3">
                                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                                    <p className="font-body text-xs text-foreground">
                                      Cancel {overBy} over-limit tickets. {available > 0 ? `${available} will still be allocated.` : 'Entire line will be cancelled.'}
                                    </p>
                                    <p className="font-body text-xs text-muted-foreground mt-1">
                                      Credit: AED {formatCurrency(overBy * lineItem.unitPrice)} back to {sale?.client}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="font-body text-xs font-medium text-foreground block mb-1">Cancellation Reason *</label>
                                    <textarea
                                      value={cancelReason}
                                      onChange={e => setCancelReason(e.target.value)}
                                      className="w-full h-16 rounded-lg border border-border px-3 py-2 font-body text-sm text-foreground bg-card resize-none focus:ring-1 focus:ring-accent outline-none"
                                      placeholder="Reason for cancellation..."
                                      aria-label="Cancellation reason"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Role warning */}
                {!canResolve && (
                  <div className="rounded-xl p-3 bg-warning/10 border border-warning/30 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-warning shrink-0" />
                    <p className="font-body text-xs text-foreground">
                      Only Sr. Operator, Ops Manager, or Super Admin can resolve oversells. Current role: <strong>{currentUser?.role}</strong>
                    </p>
                  </div>
                )}

                {/* Audit trail */}
                <div>
                  <h3 className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Clock size={12} /> Audit Trail
                  </h3>
                  <div className="space-y-1.5">
                    {auditHistory.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">{entry.time}</span>
                        <span className="font-body text-foreground"><strong>{entry.actor}</strong>: {entry.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!resolved && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
            <button onClick={onClose} className="font-body text-sm text-muted-foreground hover:underline">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!isValid() || saving}
              className="h-10 px-6 rounded-xl font-body text-sm font-bold bg-gradient-to-r from-accent to-[#E8C56A] text-primary hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              aria-label="Save resolution"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Saving...</>
              ) : (
                'Save Resolution'
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
