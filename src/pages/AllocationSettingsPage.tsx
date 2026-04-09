import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  DEFAULT_SCORING_WEIGHTS, DEFAULT_SAFETY_RAILS, DEFAULT_SCHEDULER_CONFIG,
  MOCK_POLICIES,
  type ScoringWeights, type SafetyRails, type SchedulerConfig,
} from '@/data/allocationData';
import { CHART_COLORS } from '@/pages/dashboard/chartHelpers';
import { RotateCcw, Save, Clock, Shield, Sliders, Zap } from 'lucide-react';
import { toast } from 'sonner';

const labelCls = "block font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5";
const inputCls = "w-full h-10 px-3 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-accent bg-card";
const cardCls = "bg-card rounded-xl shadow-sm border border-border p-6";

function WeightSlider({ label, value, onChange, description }: {
  label: string; value: number; onChange: (v: number) => void; description: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-accent-foreground bg-accent/15 px-2 py-0.5 rounded">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.01} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
      />
      <p className="font-body text-[10px] text-muted-foreground">{description}</p>
    </div>
  );
}

export default function AllocationSettingsPage() {
  const { isAdmin } = useAuth();

  const [weights, setWeights] = useState<ScoringWeights>({ ...DEFAULT_SCORING_WEIGHTS });
  const [rails, setRails] = useState<SafetyRails>({ ...DEFAULT_SAFETY_RAILS });
  const [scheduler, setScheduler] = useState<SchedulerConfig>({ ...DEFAULT_SCHEDULER_CONFIG });

  const setWeight = (k: keyof ScoringWeights, v: number) => setWeights(p => ({ ...p, [k]: v }));
  const setRail = (k: keyof SafetyRails, v: any) => setRails(p => ({ ...p, [k]: v }));
  const setSched = (k: keyof SchedulerConfig, v: any) => setScheduler(p => ({ ...p, [k]: v }));

  const resetWeights = () => {
    setWeights({ ...DEFAULT_SCORING_WEIGHTS });
    toast.info('Weights reset to defaults');
  };

  const save = () => toast.success('Allocation settings saved');

  return (
    <div className="pb-8 max-w-4xl">
      <h1 className="font-display text-[26px] text-primary mb-1">Allocation Settings</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Scoring weights, global safety rails, and scheduler configuration. Super Admin only.
      </p>

      {/* Scoring Weights */}
      <div className={`${cardCls} mb-6`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-accent" />
            <h2 className="font-display text-lg text-primary">Scoring Weights</h2>
          </div>
          <button onClick={resetWeights} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium border border-border hover:bg-muted">
            <RotateCcw size={12} /> Reset to Defaults
          </button>
        </div>

        <div className="space-y-4">
          <p className="font-body text-xs text-muted-foreground border-b border-border pb-2 mb-2">Positive weights (maximize)</p>
          <WeightSlider label="w1 — Exactness" value={weights.w1_exactness} onChange={v => setWeight('w1_exactness', v)}
            description="Reward plans that exactly match target quantity (1 if exact, drops linearly)" />
          <WeightSlider label="w2 — Margin" value={weights.w2_margin} onChange={v => setWeight('w2_margin', v)}
            description="Reward higher projected margin percentage" />
          <WeightSlider label="w3 — Vendor SLA" value={weights.w3_vendorSla} onChange={v => setWeight('w3_vendorSla', v)}
            description="Reward vendors with higher reliability / SLA scores" />
          <WeightSlider label="w4 — Set Continuity" value={weights.w4_setContinuity} onChange={v => setWeight('w4_setContinuity', v)}
            description="Reward keeping seats within the same set (adjacency)" />
          <WeightSlider label="w5 — Freshness (FIFO)" value={weights.w5_freshness} onChange={v => setWeight('w5_freshness', v)}
            description="Reward older stock to implement FIFO inventory rotation" />

          <p className="font-body text-xs text-muted-foreground border-b border-border pb-2 mb-2 mt-6">Penalties (subtract)</p>
          <WeightSlider label="p1 — Category Upgrade Penalty" value={weights.p1_categoryUpgrade} onChange={v => setWeight('p1_categoryUpgrade', v)}
            description="Penalty when effective category differs from sold category" />
          <WeightSlider label="p2 — Vendor Diversity Penalty" value={weights.p2_vendorDiversity} onChange={v => setWeight('p2_vendorDiversity', v)}
            description="Penalty when multiple vendors in one line allocation" />
          <WeightSlider label="p3 — Split Penalty" value={weights.p3_split} onChange={v => setWeight('p3_split', v)}
            description="Penalty proportional to chunk count when single set is available" />
        </div>
      </div>

      {/* Safety Rails */}
      <div className={`${cardCls} mb-6`}>
        <div className="flex items-center gap-2 mb-5">
          <Shield size={18} className="text-destructive" />
          <h2 className="font-display text-lg text-primary">Global Safety Rails</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Max Concurrent Runs</label>
            <input type="number" min={1} max={5} value={rails.maxConcurrentRuns}
              onChange={e => setRail('maxConcurrentRuns', +e.target.value)} className={inputCls} />
            <p className="font-body text-[10px] text-muted-foreground mt-1">Per event. Prevents resource contention.</p>
          </div>
          <div>
            <label className={labelCls}>Reservation TTL (seconds)</label>
            <input type="number" min={30} max={600} value={rails.defaultReservationTtlSeconds}
              onChange={e => setRail('defaultReservationTtlSeconds', +e.target.value)} className={inputCls} />
            <p className="font-body text-[10px] text-muted-foreground mt-1">Soft reserve expires after this. Default 120s.</p>
          </div>
          <div>
            <label className={labelCls}>Max Auto-Commit Value Cap (AED)</label>
            <input type="number" min={0} value={rails.maxAutoCommitValueCap}
              onChange={e => setRail('maxAutoCommitValueCap', +e.target.value)} className={inputCls} />
            <p className="font-body text-[10px] text-muted-foreground mt-1">Hard ceiling regardless of policy setting.</p>
          </div>
          <div>
            <label className={labelCls}>Max Sale Lines Per Run</label>
            <input type="number" min={1} max={1000} value={rails.maxSaleLinesPerRun}
              onChange={e => setRail('maxSaleLinesPerRun', +e.target.value)} className={inputCls} />
            <p className="font-body text-[10px] text-muted-foreground mt-1">Larger scopes are chunked. Default 500.</p>
          </div>
          <div>
            <label className={labelCls}>Rollback Window (hours)</label>
            <input type="number" min={1} max={168} value={rails.rollbackWindowHours}
              onChange={e => setRail('rollbackWindowHours', +e.target.value)} className={inputCls} />
            <p className="font-body text-[10px] text-muted-foreground mt-1">Runs older than this cannot be rolled back.</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <p className="font-body text-[11px] font-bold text-destructive mb-1">Hard-coded rules (non-overridable):</p>
          <ul className="font-body text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
            <li>FULLY_AUTO never commits on sales with existing oversells</li>
            <li>FULLY_AUTO never modifies existing allocations</li>
            <li>FULLY_AUTO disabled for DRAFT / PLANNING events</li>
            <li>Max 500 lines per run; larger scopes chunked automatically</li>
          </ul>
        </div>
      </div>

      {/* Scheduler */}
      <div className={`${cardCls} mb-6`}>
        <div className="flex items-center gap-2 mb-5">
          <Clock size={18} style={{ color: CHART_COLORS.blue }} />
          <h2 className="font-display text-lg text-primary">Scheduler</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSched('enabled', !scheduler.enabled)}
              className={`w-11 h-6 rounded-full transition-colors ${scheduler.enabled ? 'bg-accent' : 'bg-muted'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${scheduler.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="font-body text-sm text-foreground">Enable scheduled auto-allocation</span>
          </div>

          {scheduler.enabled && (
            <>
              <div>
                <label className={labelCls}>Cron Expression</label>
                <input value={scheduler.cronExpression} onChange={e => setSched('cronExpression', e.target.value)} className={inputCls} />
                <p className="font-body text-[10px] text-muted-foreground mt-1">
                  Current: Every 15 min during business hours (Mon–Fri 9–18)
                </p>
              </div>
              <div>
                <label className={labelCls}>Scope Filter</label>
                <input value={JSON.stringify(scheduler.scopeFilter)} onChange={e => {
                  try { setSched('scopeFilter', JSON.parse(e.target.value)); } catch {}
                }} className={`${inputCls} font-mono text-xs`} />
                <p className="font-body text-[10px] text-muted-foreground mt-1">
                  Only events matching this filter. E.g. {`{"eventStatus":"ALLOCATING"}`}
                </p>
              </div>
            </>
          )}

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setSched('onSaleCreateEnabled', !scheduler.onSaleCreateEnabled)}
                className={`w-11 h-6 rounded-full transition-colors ${scheduler.onSaleCreateEnabled ? 'bg-accent' : 'bg-muted'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${scheduler.onSaleCreateEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <div>
                <span className="font-body text-sm text-foreground">On-sale-create trigger</span>
                <p className="font-body text-[10px] text-muted-foreground">Run FULLY_AUTO when a new sale matches a named policy</p>
              </div>
            </div>

            {scheduler.onSaleCreateEnabled && (
              <div>
                <label className={labelCls}>Trigger Policy</label>
                <select
                  value={scheduler.onSaleCreatePolicyId ?? ''}
                  onChange={e => setSched('onSaleCreatePolicyId', e.target.value || null)}
                  className={inputCls}
                >
                  <option value="">Select policy...</option>
                  {MOCK_POLICIES.filter(p => p.active).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={save} className="h-11 px-8 rounded-lg font-body text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-2">
          <Save size={14} /> Save All Settings
        </button>
      </div>
    </div>
  );
}
