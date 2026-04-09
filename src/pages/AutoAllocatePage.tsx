import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  MOCK_SALES, MOCK_UNITS, MOCK_SUBGAMES, MOCK_MATCHES,
  MOCK_SALE_LINE_ITEMS,
  type PurchaseUnit, type SaleLineItem,
} from '@/data/mockData';
import {
  MOCK_POLICIES, MOCK_ALLOCATION_RUNS, MOCK_RUN_ITEMS,
  type AllocationPolicy, type AllocationRun, type AllocationRunItem, type AllocationMode,
} from '@/data/allocationData';
import { DEFAULT_SCORING_WEIGHTS } from '@/data/allocationData';
import { runEngine, type EngineResult, type SetCountEntry } from '@/lib/allocationEngine';
import { CHART_COLORS } from '@/pages/dashboard/chartHelpers';
import {
  Play, Download, RotateCcw, ChevronRight, CheckCircle, AlertTriangle,
  ShieldAlert, Package, Loader2, Eye, ToggleLeft, ToggleRight,
  Zap, Settings2, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Helpers ──

function formatCurrency(v: number) {
  return v.toLocaleString('en-AE', { minimumFractionDigits: 0 });
}

function getMatchLabel(matchId: string) {
  const m = MOCK_MATCHES.find(x => x.id === matchId);
  return m ? `${m.code} — ${m.teams}` : matchId;
}

function getCatLevel(subGameId: string, catId: string): number {
  const sg = MOCK_SUBGAMES.find(s => s.id === subGameId);
  const cat = sg?.categories.find(c => c.id === catId);
  return cat?.level ?? 99;
}

type ScopeType = 'selected' | 'all_event' | 'all_match';
type TabType = 'committed' | 'needs_human' | 'shortages' | 'audit';

function StatusPill({ label, variant }: { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }) {
  const cls: Record<string, string> = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-destructive/15 text-destructive',
    info: 'bg-accent/15 text-accent-foreground',
    neutral: 'bg-muted text-muted-foreground',
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[11px] font-medium ${cls[variant]}`}>{label}</span>;
}

// ── Main Page ──

export default function AutoAllocatePage() {
  const navigate = useNavigate();
  const { currentUser, isAdmin, isManager, isSrOperator } = useAuth();
  const canFullyAuto = isManager() || isAdmin();

  // Controls
  const [scope, setScope] = useState<ScopeType>('all_event');
  const [mode, setMode] = useState<AllocationMode>('SEMI_AUTO');
  const [policyId, setPolicyId] = useState(MOCK_POLICIES[0]?.id ?? '');
  const [dryRun, setDryRun] = useState(true);
  const [tab, setTab] = useState<TabType>('committed');

  // Run state
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<EngineResult[] | null>(null);
  const [runTimestamp, setRunTimestamp] = useState<string | null>(null);

  // Overrides for SEMI_AUTO
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});

  const activePolicies = MOCK_POLICIES.filter(p => p.active);
  const currentPolicy = MOCK_POLICIES.find(p => p.id === policyId) ?? MOCK_POLICIES[0];

  // Get unallocated sale lines
  const targetLines = useMemo(() => {
    return MOCK_SALE_LINE_ITEMS.filter(l => l.status === 'UNALLOCATED' && !l.oversellFlag);
  }, []);

  const handleRun = async () => {
    setRunning(true);
    setResults(null);

    // Simulate delay
    await new Promise(r => setTimeout(r, 1500));

    // Build engine inputs
    const inputs = targetLines.map(line => {
      const available = MOCK_UNITS.filter(
        u => u.subGameId === line.subGameId && u.categoryId === line.categoryId && u.status === 'AVAILABLE'
      );
      const setGroups: Record<string, PurchaseUnit[]> = {};
      available.forEach(u => {
        (setGroups[u.setId] = setGroups[u.setId] || []).push(u);
      });
      const setCounts: SetCountEntry[] = Object.entries(setGroups).map(([setId, units]) => ({
        setId,
        count: units.length,
        vendor: units[0].vendor,
        unitCost: 27525, // mock — would come from purchase line
      }));

      const sale = MOCK_SALES.find(s => s.id === line.saleId);
      const isVip = sale?.client === 'Al Habtoor Group';

      return {
        saleLineId: line.id,
        saleId: line.saleId,
        subGameId: line.subGameId,
        categoryId: line.categoryId,
        targetQty: line.qty,
        unitPrice: line.unitPrice,
        saleValue: line.lineTotal,
        setCounts,
        soldCategoryLevel: getCatLevel(line.subGameId, line.categoryId),
        effectiveCategoryLevel: getCatLevel(line.subGameId, line.categoryId),
        isVipClient: isVip,
      };
    });

    const engineResults = runEngine(inputs, currentPolicy, DEFAULT_SCORING_WEIGHTS);
    setResults(engineResults);
    setRunTimestamp(new Date().toISOString());

    // Pre-select best plans
    const selections: Record<string, string> = {};
    engineResults.forEach(r => {
      if (r.bestPlan) selections[r.saleLineId] = r.bestPlan.id;
    });
    setSelectedPlans(selections);

    setRunning(false);
  };

  const committed = results?.filter(r => r.status === 'COMMITTED') ?? [];
  const blocked = results?.filter(r => r.status === 'BLOCKED_BY_POLICY') ?? [];
  const shortages = results?.filter(r => r.status === 'SHORTAGE') ?? [];

  const totalMarginDelta = committed.reduce((s, r) => s + (r.bestPlan?.marginDelta ?? 0), 0);

  const TABS: { key: TabType; label: string; count: number; icon: any }[] = [
    { key: 'committed', label: 'Committed', count: committed.length, icon: CheckCircle },
    { key: 'needs_human', label: 'Needs Human', count: blocked.length, icon: ShieldAlert },
    { key: 'shortages', label: 'Shortages', count: shortages.length, icon: AlertTriangle },
    { key: 'audit', label: 'Run Audit', count: results?.length ?? 0, icon: FileText },
  ];

  const selectCls = "h-10 px-3 rounded-lg font-body text-sm bg-card border border-border outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 font-body text-[13px] text-muted-foreground mb-4">
        <button onClick={() => navigate('/distribution')} className="hover:text-primary hover:underline">Distribution</button>
        <ChevronRight size={12} />
        <span className="text-foreground font-medium">Auto-Allocate</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] text-primary">Auto-Allocation Engine</h1>
          <p className="font-body text-sm text-muted-foreground mt-0.5">
            Run the allocation engine to match inventory to unallocated sale lines.
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Scope */}
          <div>
            <label className="block font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">Scope</label>
            <select value={scope} onChange={e => setScope(e.target.value as ScopeType)} className={selectCls}>
              <option value="all_event">All unallocated in event</option>
              <option value="all_match">All unallocated in match</option>
              <option value="selected">Selected sales only</option>
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="block font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value as AllocationMode)} className={selectCls}>
              <option value="SUGGEST">SUGGEST (preview only)</option>
              <option value="SEMI_AUTO">SEMI-AUTO (review + commit)</option>
              <option value="FULLY_AUTO" disabled={!canFullyAuto}>FULLY-AUTO {!canFullyAuto ? '(Ops Manager+)' : ''}</option>
            </select>
          </div>

          {/* Policy */}
          <div>
            <label className="block font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">Policy</label>
            <select value={policyId} onChange={e => setPolicyId(e.target.value)} className={selectCls}>
              {activePolicies.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Dry run toggle */}
          <div className="flex items-center gap-2 pb-0.5">
            <button
              onClick={() => setDryRun(!dryRun)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-body font-medium transition-colors ${dryRun ? 'bg-warning/15 text-warning border border-warning/30' : 'bg-success/15 text-success border border-success/30'}`}
            >
              {dryRun ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
              {dryRun ? 'Dry Run ON' : 'Dry Run OFF'}
            </button>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleRun}
              disabled={running}
              className="h-10 px-6 rounded-lg font-body text-sm font-bold bg-gradient-to-r from-accent to-[#E8C56A] text-primary hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {running ? <><Loader2 size={14} className="animate-spin" /> Running...</> : <><Play size={14} /> Run Engine</>}
            </button>
            {results && (
              <button className="h-10 px-4 rounded-lg font-body text-sm font-medium border border-border hover:bg-muted flex items-center gap-2">
                <Download size={14} /> CSV
              </button>
            )}
          </div>
        </div>

        {/* Policy summary */}
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-3 text-[11px] font-body text-muted-foreground">
          <span><strong>Policy:</strong> {currentPolicy.name}</span>
          <span>·</span>
          <span>Split: {currentPolicy.splitPolicy.replace(/_/g, ' ')}</span>
          <span>·</span>
          <span>Min margin: {currentPolicy.minMarginPct}%</span>
          <span>·</span>
          <span>Max commit: AED {formatCurrency(currentPolicy.maxAutoCommitValue)}</span>
          {currentPolicy.vendorWhitelist.length > 0 && <><span>·</span><span>Whitelist: {currentPolicy.vendorWhitelist.join(', ')}</span></>}
          {currentPolicy.vendorBlocklist.length > 0 && <><span>·</span><span className="text-destructive">Blocklist: {currentPolicy.vendorBlocklist.join(', ')}</span></>}
          <button
            onClick={() => navigate('/admin/allocation-policies')}
            className="text-primary hover:underline flex items-center gap-1"
          >
            <Settings2 size={10} /> View policy
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
            {[
              { label: 'Sales Processed', value: results.length, color: CHART_COLORS.navy },
              { label: 'Committed', value: committed.length, color: CHART_COLORS.green },
              { label: 'Blocked', value: blocked.length, color: CHART_COLORS.red },
              { label: 'Shortages', value: shortages.length, color: CHART_COLORS.amber },
              { label: 'Skipped', value: results.filter(r => r.status === 'SKIPPED').length, color: CHART_COLORS.grey },
              { label: 'Margin Δ', value: `AED ${formatCurrency(totalMarginDelta)}`, color: totalMarginDelta >= 0 ? CHART_COLORS.green : CHART_COLORS.red },
              { label: 'Mode', value: dryRun ? 'DRY RUN' : mode, color: dryRun ? CHART_COLORS.amber : CHART_COLORS.blue },
            ].map(kpi => (
              <div key={kpi.label} className="bg-card rounded-xl border border-border p-3">
                <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="font-display text-lg mt-0.5" style={{ color: typeof kpi.color === 'string' ? kpi.color : undefined }}>
                  {typeof kpi.value === 'number' ? kpi.value : kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-border mb-4">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`pb-2.5 font-body text-sm font-medium transition-colors relative flex items-center gap-1.5 ${tab === t.key ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <Icon size={13} />
                  {t.label} ({t.count})
                  {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {tab === 'committed' && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-primary">
                    {['Sale', 'Line', 'Plan', 'Vendor Mix', 'Qty', 'Margin Δ', 'Score', 'Action'].map(h => (
                      <th key={h} className="px-4 py-2.5 font-body text-[12px] font-bold text-primary-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {committed.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center font-body text-sm text-muted-foreground">No committed allocations</td></tr>
                  ) : committed.map(r => {
                    const plan = r.bestPlan!;
                    const line = MOCK_SALE_LINE_ITEMS.find(l => l.id === r.saleLineId);
                    const sale = MOCK_SALES.find(s => s.id === r.saleId);
                    return (
                      <tr key={r.saleLineId} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{r.saleId.toUpperCase().replace('SALE', 'SALE-')}</td>
                        <td className="px-4 py-3 font-body text-[13px]">{line?.categoryLabel} × {line?.qty}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {plan.chunks.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-muted font-mono text-[10px]">
                                {c.setId}: {c.qty}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-body text-[12px]">{plan.vendorMix.join(', ')}</td>
                        <td className="px-4 py-3 font-mono text-[13px]">{plan.total}</td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-[12px] ${plan.marginDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {plan.marginDelta >= 0 ? '+' : ''}AED {formatCurrency(plan.marginDelta)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-accent/15 font-mono text-[10px] text-accent-foreground font-bold">
                            {plan.score.toFixed(3)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {!dryRun && (
                            <button className="px-3 py-1 rounded-lg font-body text-[11px] font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 flex items-center gap-1">
                              <RotateCcw size={10} /> Rollback
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'needs_human' && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-primary">
                    {['Sale', 'Line', 'Reason(s)', 'Top Plan Score', 'Action'].map(h => (
                      <th key={h} className="px-4 py-2.5 font-body text-[12px] font-bold text-primary-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blocked.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center font-body text-sm text-muted-foreground">No blocked items — all clear!</td></tr>
                  ) : blocked.map(r => {
                    const line = MOCK_SALE_LINE_ITEMS.find(l => l.id === r.saleLineId);
                    return (
                      <tr key={r.saleLineId} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{r.saleId.toUpperCase().replace('SALE', 'SALE-')}</td>
                        <td className="px-4 py-3 font-body text-[13px]">{line?.categoryLabel} × {line?.qty}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {r.reason.split('; ').map((reason, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <ShieldAlert size={11} className="text-destructive mt-0.5 shrink-0" />
                                <span className="font-body text-[11px] text-destructive">{reason}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {r.plans[0]?.score.toFixed(3) ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/distribution/${r.saleId}/preview`)}
                              className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-accent text-accent-foreground hover:opacity-90"
                            >
                              Manual Allocate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'shortages' && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-primary">
                    {['Sale', 'Line', 'Short By', 'Action'].map(h => (
                      <th key={h} className="px-4 py-2.5 font-body text-[12px] font-bold text-primary-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shortages.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center font-body text-sm text-muted-foreground">No shortages detected</td></tr>
                  ) : shortages.map(r => {
                    const line = MOCK_SALE_LINE_ITEMS.find(l => l.id === r.saleLineId);
                    return (
                      <tr key={r.saleLineId} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{r.saleId.toUpperCase().replace('SALE', 'SALE-')}</td>
                        <td className="px-4 py-3 font-body text-[13px]">{line?.categoryLabel} × {line?.qty}</td>
                        <td className="px-4 py-3 font-mono text-[13px] text-destructive">{line?.qty ?? 0} tickets</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate('/purchases/new')}
                            className="px-3 py-1 rounded-lg font-body text-[11px] font-medium bg-primary text-primary-foreground hover:opacity-90"
                          >
                            Create Purchase Request
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'audit' && (
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="space-y-2">
                {results.map((r, i) => {
                  const line = MOCK_SALE_LINE_ITEMS.find(l => l.id === r.saleLineId);
                  const statusVariant = r.status === 'COMMITTED' ? 'success' : r.status === 'BLOCKED_BY_POLICY' ? 'error' : r.status === 'SHORTAGE' ? 'warning' : 'neutral';
                  return (
                    <div key={r.saleLineId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="font-mono text-[11px] text-muted-foreground w-6">{i + 1}</span>
                      <span className="font-mono text-xs font-bold text-primary">{r.saleId.toUpperCase().replace('SALE', 'SALE-')}</span>
                      <span className="font-body text-[12px] text-foreground">{line?.categoryLabel} × {line?.qty}</span>
                      <div className="flex-1" />
                      <StatusPill label={r.status.replace(/_/g, ' ')} variant={statusVariant} />
                      {r.bestPlan && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          score: {r.bestPlan.score.toFixed(3)} | {r.bestPlan.strategy}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEMI_AUTO commit bar */}
          {mode === 'SEMI_AUTO' && committed.length > 0 && !dryRun && (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-primary border-t border-primary/20 shadow-lg">
              <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-body text-[11px] text-primary-foreground/60 uppercase tracking-wider">Ready to Commit</p>
                    <p className="font-display text-xl text-accent">{committed.length} lines</p>
                  </div>
                  <div className="w-px h-10 bg-primary-foreground/20" />
                  <div>
                    <p className="font-body text-[11px] text-primary-foreground/60 uppercase tracking-wider">Margin Δ</p>
                    <p className={`font-mono text-sm ${totalMarginDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {totalMarginDelta >= 0 ? '+' : ''}AED {formatCurrency(totalMarginDelta)}
                    </p>
                  </div>
                </div>
                <button className="h-11 px-8 rounded-xl font-body text-sm font-bold bg-gradient-to-r from-accent to-[#E8C56A] text-primary hover:shadow-lg flex items-center gap-2">
                  <Zap size={14} /> Commit All Selected
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!results && !running && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Zap size={32} className="text-accent" />
          </div>
          <h2 className="font-display text-xl text-primary mb-2">Ready to Run</h2>
          <p className="font-body text-sm text-muted-foreground mb-1">
            {targetLines.length} unallocated sale line{targetLines.length !== 1 ? 's' : ''} in scope
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Select mode, policy, and scope above, then hit <strong>Run Engine</strong>.
          </p>
        </div>
      )}

      {running && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Loader2 size={40} className="animate-spin text-accent mx-auto mb-4" />
          <h2 className="font-display text-xl text-primary mb-2">Running Engine…</h2>
          <p className="font-body text-sm text-muted-foreground">
            Processing {targetLines.length} lines with policy "{currentPolicy.name}"
          </p>
        </div>
      )}
    </div>
  );
}
