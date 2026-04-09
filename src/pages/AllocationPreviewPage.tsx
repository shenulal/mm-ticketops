import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  MOCK_SALES, MOCK_UNITS, MOCK_MATCHES, MOCK_SUBGAMES,
  getSubGamesForMatch, getCategoriesForSubGame, getHierarchyForSubGame,
  getInventoryAvailable,
  type SaleLineItem, type PurchaseUnit,
} from '@/data/mockData';
import { suggestPlans, scorePlan, type CandidatePlan, type SetCountEntry } from '@/lib/allocationEngine';
import { DEFAULT_SCORING_WEIGHTS } from '@/data/allocationData';
import {
  ChevronRight, AlertTriangle, CheckCircle, Loader2, ArrowUpRight,
  ArrowDownRight, Package, ShieldAlert, Info, Layers, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ──

interface PlanChunk { setId: string; qty: number; vendor: string; }
interface AllocationPlan {
  id: string;
  chunks: PlanChunk[];
  total: number;
  vendorMix: string[];
  marginDelta: number; // vs sold price
  note: string;
}

interface LinePlanState {
  lineId: string;
  effectiveCategory: string;       // may differ from soldCategory if upgrade/downgrade
  effectiveCategoryLabel: string;
  selectedPlanId: string | null;
  plans: AllocationPlan[];
  remaining: number;               // qty not covered by best plan
  isUpgrade: boolean;
  isDowngrade: boolean;
  partialCommit: boolean;          // user explicitly marked partial
}

// ── Helpers ──

const CATEGORY_RANK: Record<string, number> = {};
MOCK_SUBGAMES.forEach(sg => sg.categories.forEach(c => {
  const key = `${sg.id}::${c.id}`;
  CATEGORY_RANK[key] = c.level;
}));

function getCatLevel(subGameId: string, catId: string): number {
  return CATEGORY_RANK[`${subGameId}::${catId}`] ?? 99;
}

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

/** Generate allocation plans using the ported suggestPlans engine */
function generatePlans(subGameId: string, categoryId: string, qty: number, unitPrice: number): AllocationPlan[] {
  const available = MOCK_UNITS.filter(
    u => u.subGameId === subGameId && u.categoryId === categoryId && u.status === 'AVAILABLE'
  );
  if (available.length === 0) return [];

  // Group by setId → build SetCountEntry[]
  const setGroups: Record<string, PurchaseUnit[]> = {};
  available.forEach(u => {
    (setGroups[u.setId] = setGroups[u.setId] || []).push(u);
  });

  const setCounts: SetCountEntry[] = Object.entries(setGroups).map(([setId, units]) => ({
    setId,
    count: units.length,
    vendor: units[0].vendor,
    unitCost: 27525, // mock unit cost from purchase line
  }));

  // Use the ported suggestPlans algorithm
  const candidates = suggestPlans(setCounts, qty, 6);

  // Score each plan
  candidates.forEach(plan => {
    scorePlan(plan, qty, unitPrice, DEFAULT_SCORING_WEIGHTS);
  });

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Map to legacy AllocationPlan format
  return candidates.map(c => ({
    id: c.id,
    chunks: c.chunks.map(ch => ({ setId: ch.setId, qty: ch.qty, vendor: ch.vendor })),
    total: c.total,
    vendorMix: c.vendorMix,
    marginDelta: c.marginDelta,
    note: `${c.strategy} — score ${c.score.toFixed(3)}`,
  }));
}

// ── Status Badges ──

function StatusPill({ label, variant }: { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' | 'info' }) {
  const cls: Record<string, string> = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-destructive/15 text-destructive',
    neutral: 'bg-muted text-muted-foreground',
    info: 'bg-accent/15 text-accent-foreground',
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[11px] font-medium ${cls[variant]}`}>{label}</span>;
}

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

export default function AllocationPreviewPage() {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();
  const { currentUser, isSrOperator, isManager, isAdmin } = useAuth();
  const canCommitUpgrade = isSrOperator() || isManager() || isAdmin();

  const sale = MOCK_SALES.find(s => s.id === saleId);

  // Build line plan states
  const [linePlans, setLinePlans] = useState<LinePlanState[]>(() => {
    if (!sale) return [];
    return sale.lines.map(li => {
      const plans = generatePlans(li.subGameId, li.categoryId, li.qty, li.unitPrice);
      const bestPlan = plans[0];
      return {
        lineId: li.id,
        effectiveCategory: li.categoryId,
        effectiveCategoryLabel: li.categoryLabel,
        selectedPlanId: bestPlan ? bestPlan.id : null,
        plans,
        remaining: bestPlan ? li.qty - bestPlan.total : li.qty,
        isUpgrade: false,
        isDowngrade: false,
        partialCommit: false,
      };
    });
  });

  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);

  if (!sale) {
    return (
      <div className="p-8 text-center">
        <h1 className="font-display text-xl text-primary">Sale not found</h1>
        <Link to="/distribution" className="font-body text-sm text-accent hover:underline mt-2 inline-block">← Back to Distribution</Link>
      </div>
    );
  }

  const matchLabel = getMatchLabel(sale.matchId);
  const totalQty = sale.totalQty;
  const totalValue = sale.totalValue;

  // Change effective category for a line
  const handleCategoryChange = (lineIdx: number, newCatId: string) => {
    const li = sale.lines[lineIdx];
    const sg = MOCK_SUBGAMES.find(s => s.id === li.subGameId);
    const newCat = sg?.categories.find(c => c.id === newCatId);
    if (!newCat) return;

    const soldLevel = getCatLevel(li.subGameId, li.categoryId);
    const newLevel = getCatLevel(li.subGameId, newCatId);
    const plans = generatePlans(li.subGameId, newCatId, li.qty, li.unitPrice);
    const bestPlan = plans[0];

    setLinePlans(prev => prev.map((lp, i) => i !== lineIdx ? lp : {
      ...lp,
      effectiveCategory: newCatId,
      effectiveCategoryLabel: newCat.label,
      plans,
      selectedPlanId: bestPlan?.id ?? null,
      remaining: bestPlan ? li.qty - bestPlan.total : li.qty,
      isUpgrade: newLevel < soldLevel,
      isDowngrade: newLevel > soldLevel,
    }));
  };

  const handlePlanSelect = (lineIdx: number, planId: string) => {
    setLinePlans(prev => prev.map((lp, i) => {
      if (i !== lineIdx) return lp;
      const plan = lp.plans.find(p => p.id === planId);
      return {
        ...lp,
        selectedPlanId: planId,
        remaining: plan ? sale.lines[i].qty - plan.total : lp.remaining,
      };
    }));
  };

  const togglePartial = (lineIdx: number) => {
    setLinePlans(prev => prev.map((lp, i) => i !== lineIdx ? lp : { ...lp, partialCommit: !lp.partialCommit }));
  };

  // Commit validation
  const hasUpgrades = linePlans.some(lp => lp.isUpgrade);
  const allCovered = linePlans.every(lp => lp.remaining <= 0 || lp.partialCommit);
  const canCommit = allCovered && (!hasUpgrades || canCommitUpgrade) && !committing;

  const totalToCommit = linePlans.reduce((sum, lp) => {
    const plan = lp.plans.find(p => p.id === lp.selectedPlanId);
    return sum + (plan?.total ?? 0);
  }, 0);

  const totalMarginDelta = linePlans.reduce((sum, lp) => {
    const plan = lp.plans.find(p => p.id === lp.selectedPlanId);
    return sum + (plan?.marginDelta ?? 0);
  }, 0);

  const handleCommit = async () => {
    setCommitting(true);
    await new Promise(r => setTimeout(r, 2000));
    setCommitting(false);
    setCommitted(true);
  };

  if (committed) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-full bg-success/15 border-2 border-success flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-success" />
        </motion.div>
        <h1 className="font-display text-[26px] text-primary mb-2">Allocation Committed</h1>
        <p className="font-body text-sm text-muted-foreground mb-1">
          Sale {sale.id.toUpperCase().replace('SALE', 'SALE-')} · {totalToCommit} tickets allocated
        </p>
        <p className="font-mono text-xs text-muted-foreground mb-6">
          Audit Run: ALLOC-{Date.now().toString(36).toUpperCase()}
        </p>
        <div className="space-y-2 mb-8">
          {linePlans.map((lp, i) => {
            const plan = lp.plans.find(p => p.id === lp.selectedPlanId);
            const li = sale.lines[i];
            return (
              <div key={lp.lineId} className="bg-muted/50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-primary/10 text-primary">L{i + 1}</span>
                  <span className="font-body text-sm text-foreground">{lp.effectiveCategoryLabel} × {plan?.total ?? 0}</span>
                  {lp.isUpgrade && <StatusPill label="UPGRADE" variant="info" />}
                </div>
                <StatusPill label={lp.remaining <= 0 ? 'ALLOCATED' : 'PARTIAL'} variant={lp.remaining <= 0 ? 'success' : 'warning'} />
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/distribution')}
            className="h-11 px-6 rounded-xl font-body text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90">
            Back to Distribution
          </button>
          <button onClick={() => navigate(`/distribution/${sale.id}/preview`)}
            className="h-11 px-6 rounded-xl font-body text-sm font-semibold border border-border hover:bg-muted">
            View Audit Log
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 font-body text-[13px] text-muted-foreground mb-4">
        <Link to="/distribution" className="hover:text-primary hover:underline">Distribution</Link>
        <ChevronRight size={12} />
        <span>Sale {sale.id.toUpperCase().replace('SALE', 'SALE-')}</span>
        <ChevronRight size={12} />
        <span className="text-foreground font-medium">Allocate</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-[26px] text-primary">Allocation Preview</h1>
      </div>

      {/* Sale summary pill */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card rounded-xl border border-border shadow-sm">
        <span className="font-mono text-xs font-bold text-primary">{sale.id.toUpperCase().replace('SALE', 'SALE-')}</span>
        <span className="w-px h-4 bg-border" />
        <span className="font-body text-sm text-foreground">{sale.client}</span>
        <span className="w-px h-4 bg-border" />
        <span className="font-body text-sm text-muted-foreground">{matchLabel}</span>
        <span className="w-px h-4 bg-border" />
        <span className="font-mono text-sm text-foreground">{totalQty} tickets</span>
        <span className="w-px h-4 bg-border" />
        <span className="font-body text-sm font-semibold text-foreground">AED {formatCurrency(totalValue)}</span>
        <span className="w-px h-4 bg-border" />
        <StatusPill label={sale.status} variant={sale.status === 'UNALLOCATED' ? 'neutral' : sale.status.includes('PARTIAL') ? 'warning' : 'success'} />
      </div>

      {/* Lines grid */}
      <div className="space-y-6">
        {sale.lines.map((li, idx) => {
          const lp = linePlans[idx];
          if (!lp) return null;
          const sg = MOCK_SUBGAMES.find(s => s.id === li.subGameId);
          const categories = sg?.categories.filter(c => c.isActive) ?? [];
          const selectedPlan = lp.plans.find(p => p.id === lp.selectedPlanId);
          const sgName = getSubGameName(li.subGameId);

          return (
            <div key={li.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT: Line card */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold bg-primary/10 text-primary">Line {idx + 1}</span>
                    <span className="font-body text-xs text-muted-foreground">{sgName}</span>
                  </div>
                  {lp.isUpgrade && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(59,130,246,0.15)] text-[#3B82F6]">
                      <ArrowUpRight size={10} /> UPGRADE
                    </span>
                  )}
                  {lp.isDowngrade && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(245,158,11,0.15)] text-warning">
                      <ArrowDownRight size={10} /> DOWNGRADE
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Sold Category</p>
                    <p className="font-body text-sm font-medium text-foreground">{li.categoryLabel}</p>
                  </div>
                  <div>
                    <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Quantity</p>
                    <p className="font-body text-sm font-medium text-foreground">{li.qty} tickets</p>
                  </div>
                  <div>
                    <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Price / Ticket</p>
                    <p className="font-body text-sm font-medium text-foreground">AED {formatCurrency(li.unitPrice)}</p>
                  </div>
                  <div>
                    <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Line Total</p>
                    <p className="font-body text-sm font-semibold text-foreground">AED {formatCurrency(li.lineTotal)}</p>
                  </div>
                </div>

                {/* Allocate from category */}
                <div className="mb-3">
                  <label className="font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Allocate from Category
                  </label>
                  <select
                    value={lp.effectiveCategory}
                    onChange={e => handleCategoryChange(idx, e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background font-body text-sm text-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                    aria-label={`Allocate from category for line ${idx + 1}`}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        L{c.level} — {c.label}
                        {c.id === li.categoryId ? ' (sold)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remaining indicator */}
                <div className={`rounded-lg p-3 ${lp.remaining <= 0 ? 'bg-success/10 border border-success/30' : lp.remaining < li.qty ? 'bg-warning/10 border border-warning/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                  <div className="flex items-center gap-2">
                    {lp.remaining <= 0 ? <CheckCircle size={14} className="text-success" /> :
                     lp.remaining < li.qty ? <AlertTriangle size={14} className="text-warning" /> :
                     <AlertTriangle size={14} className="text-destructive" />}
                    <span className="font-body text-sm font-medium">
                      {lp.remaining <= 0
                        ? `Fully covered: ${li.qty} / ${li.qty}`
                        : `Remaining to allocate: ${lp.remaining} / ${li.qty}`}
                    </span>
                  </div>
                  {lp.remaining > 0 && lp.remaining === li.qty && (
                    <p className="font-body text-xs text-destructive mt-1">
                      No plans available for {lp.effectiveCategoryLabel}. Consider a different category or create a purchase request.
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT: Plans */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                <p className="font-body text-sm font-bold text-primary mb-3 flex items-center gap-2">
                  <Layers size={14} /> Suggested Plans
                </p>

                {lp.plans.length === 0 ? (
                  <div className="rounded-lg p-4 bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert size={16} className="text-destructive" />
                      <span className="font-body text-sm font-bold text-destructive">Short by {li.qty} tickets</span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mb-3">
                      No inventory available for {lp.effectiveCategoryLabel} in {sgName}.
                    </p>
                    <button className="h-9 px-4 rounded-lg font-body text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-90">
                      Create Purchase Request
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lp.plans.map((plan, pi) => {
                      const isSelected = lp.selectedPlanId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          onClick={() => handlePlanSelect(idx, plan.id)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlanSelect(idx, plan.id); } }}
                          tabIndex={0}
                          role="radio"
                          aria-checked={isSelected}
                          className={`w-full text-left rounded-xl p-4 border-2 transition-all ${isSelected ? 'border-accent bg-accent/5 shadow-sm' : 'border-border hover:border-accent/50 hover:bg-muted/30'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {pi === 0 && <span className="px-2 py-0.5 rounded-full font-body text-[9px] font-bold bg-accent/20 text-accent-foreground">BEST</span>}
                              <span className="font-body text-xs font-medium text-foreground">
                                {plan.total >= li.qty ? 'Full' : `Partial (${plan.total}/${li.qty})`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isSelected && <CheckCircle size={14} className="text-accent" />}
                            </div>
                          </div>

                          {/* Chunk chips */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {plan.chunks.map((ch, ci) => (
                              <span key={ci} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted font-mono text-[10px] text-foreground">
                                <Package size={9} /> {ch.setId}: {ch.qty}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-body">
                            <span>Covers: {plan.total}</span>
                            <span>·</span>
                            <span>Vendors: {plan.vendorMix.join(', ')}</span>
                            <span>·</span>
                            <span className={plan.marginDelta >= 0 ? 'text-success' : 'text-destructive'}>
                              Margin: {plan.marginDelta >= 0 ? '+' : ''}{plan.marginDelta} AED/ticket
                            </span>
                          </div>

                          {plan.note && (
                            <p className="font-body text-[10px] text-muted-foreground mt-1 italic">{plan.note}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Partial commit checkbox */}
                {lp.remaining > 0 && lp.plans.length > 0 && (
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lp.partialCommit}
                      onChange={() => togglePartial(idx)}
                      className="w-4 h-4 rounded border-border accent-accent"
                    />
                    <span className="font-body text-xs text-muted-foreground">
                      Mark as PARTIAL COMMIT ({selectedPlan?.total ?? 0} of {li.qty})
                    </span>
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade role warning */}
      {hasUpgrades && !canCommitUpgrade && (
        <div className="mt-4 rounded-xl p-4 bg-warning/10 border border-warning/30 flex items-center gap-3">
          <ShieldAlert size={18} className="text-warning" />
          <div>
            <p className="font-body text-sm font-bold text-warning">Upgrade Requires Sr. Operator+</p>
            <p className="font-body text-xs text-muted-foreground">
              One or more lines have been upgraded to a higher category. Only Sr. Operator, Ops Manager, or Super Admin can commit upgrades.
            </p>
          </div>
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-primary border-t border-primary/20 shadow-lg">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="font-body text-[11px] text-primary-foreground/60 uppercase tracking-wider">Total to Commit</p>
              <p className="font-display text-xl text-accent">{totalToCommit} tickets</p>
            </div>
            <div className="w-px h-10 bg-primary-foreground/20" />
            <div>
              <p className="font-body text-[11px] text-primary-foreground/60 uppercase tracking-wider">Expected Margin Delta</p>
              <p className={`font-body text-sm font-semibold ${totalMarginDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                {totalMarginDelta >= 0 ? '+' : ''}{totalMarginDelta} AED
              </p>
            </div>
            <div className="w-px h-10 bg-primary-foreground/20" />
            <div>
              <p className="font-body text-[11px] text-primary-foreground/60 uppercase tracking-wider">Lines</p>
              <p className="font-body text-sm text-primary-foreground">
                {linePlans.filter(lp => lp.remaining <= 0).length} full · {linePlans.filter(lp => lp.remaining > 0 && lp.partialCommit).length} partial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/distribution')}
              className="h-11 px-5 rounded-xl font-body text-sm font-medium border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={!canCommit}
              className="h-11 px-8 rounded-xl font-body text-sm font-bold bg-gradient-to-r from-accent to-[#E8C56A] text-primary hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              aria-label="Commit allocation"
            >
              {committing ? (
                <><Loader2 size={16} className="animate-spin" /> Committing...</>
              ) : (
                <>Commit Allocation</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
