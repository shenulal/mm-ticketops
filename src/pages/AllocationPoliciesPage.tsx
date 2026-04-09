import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  MOCK_POLICIES,
  type AllocationPolicy, type AllocationMode, type SplitPolicy,
} from '@/data/allocationData';
import { CHART_COLORS } from '@/pages/dashboard/chartHelpers';
import {
  Plus, GripVertical, ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  Download, Upload, Trash2, Copy, Play, Save, X, Shield,
} from 'lucide-react';
import { toast } from 'sonner';

function StatusPill({ label, variant }: { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }) {
  const cls: Record<string, string> = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-destructive/15 text-destructive',
    neutral: 'bg-muted text-muted-foreground',
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-body text-[11px] font-medium ${cls[variant]}`}>{label}</span>;
}

const inputCls = "w-full h-10 px-3 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-accent bg-card";
const labelCls = "block font-body text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5";

export default function AllocationPoliciesPage() {
  const { isAdmin, isManager } = useAuth();
  const canEdit = isAdmin() || isManager();

  const [policies, setPolicies] = useState<AllocationPolicy[]>([...MOCK_POLICIES]);
  const [editing, setEditing] = useState<AllocationPolicy | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const toggleActive = (id: string) => {
    setPolicies(p => p.map(pol => pol.id === id ? { ...pol, active: !pol.active } : pol));
    toast.success('Policy updated');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(policies, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'allocation-policies.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Policies exported');
  };

  const startEdit = (pol: AllocationPolicy) => {
    setEditing({ ...pol });
  };

  const saveEdit = () => {
    if (!editing) return;
    setPolicies(p => p.map(pol => pol.id === editing.id ? { ...editing, updatedAt: new Date().toISOString() } : pol));
    setEditing(null);
    toast.success('Policy saved');
  };

  const deletePolicy = (id: string) => {
    setPolicies(p => p.filter(pol => pol.id !== id));
    toast.success('Policy deleted');
  };

  const addPolicy = () => {
    const newPol: AllocationPolicy = {
      id: `pol-${Date.now()}`,
      eventId: null,
      name: 'New Policy',
      active: false,
      priority: policies.length + 1,
      scopeFilter: {},
      mode: 'SUGGEST',
      allowUpgrade: false,
      maxUpgradeRankGap: 0,
      allowDowngrade: false,
      maxDowngradeRankGap: 0,
      vendorWhitelist: [],
      vendorBlocklist: [],
      minMarginPct: 5,
      maxAutoCommitValue: 100000,
      splitPolicy: 'ALLOW_MULTI_SET',
      minChunkSize: 1,
      requireVendorDiversity: false,
      excludeVip: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'Current User',
    };
    setPolicies(p => [...p, newPol]);
    setEditing(newPol);
  };

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] text-primary">Allocation Policies</h1>
          <p className="font-body text-sm text-muted-foreground">
            Manage rules for automated allocation. Policies evaluated in priority order.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="h-10 px-4 rounded-lg font-body text-sm font-medium border border-border hover:bg-muted flex items-center gap-2">
            <Download size={14} /> Export JSON
          </button>
          {canEdit && (
            <button onClick={addPolicy} className="h-10 px-4 rounded-lg font-body text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-2">
              <Plus size={14} /> New Policy
            </button>
          )}
        </div>
      </div>

      {/* Policy list */}
      <div className="space-y-3">
        {policies.sort((a, b) => a.priority - b.priority).map(pol => {
          const isExp = expanded[pol.id];
          return (
            <div key={pol.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              {/* Header */}
              <div
                className="px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-muted/30"
                onClick={() => toggleExpand(pol.id)}
              >
                <GripVertical size={14} className="text-muted-foreground cursor-grab" />
                <span className="font-mono text-[10px] text-muted-foreground w-6">#{pol.priority}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-bold text-foreground">{pol.name}</span>
                    <StatusPill
                      label={pol.active ? 'ACTIVE' : 'INACTIVE'}
                      variant={pol.active ? 'success' : 'neutral'}
                    />
                    <span className="px-2 py-0.5 rounded-full bg-accent/15 font-body text-[10px] font-medium text-accent-foreground">
                      {pol.mode}
                    </span>
                  </div>
                  <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                    {pol.eventId ? `Event-specific` : 'Global'} · Min margin {pol.minMarginPct}% · Max commit AED {pol.maxAutoCommitValue.toLocaleString()} · {pol.splitPolicy.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {canEdit && (
                    <button
                      onClick={() => toggleActive(pol.id)}
                      className="p-1.5 rounded hover:bg-muted"
                      title={pol.active ? 'Deactivate' : 'Activate'}
                    >
                      {pol.active ? <ToggleRight size={18} className="text-success" /> : <ToggleLeft size={18} className="text-muted-foreground" />}
                    </button>
                  )}
                  <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isExp ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded details */}
              {isExp && (
                <div className="px-5 pb-5 border-t border-border pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[
                      ['Mode', pol.mode],
                      ['Split Policy', pol.splitPolicy.replace(/_/g, ' ')],
                      ['Min Margin', `${pol.minMarginPct}%`],
                      ['Max Auto-Commit', `AED ${pol.maxAutoCommitValue.toLocaleString()}`],
                      ['Allow Upgrade', pol.allowUpgrade ? `Yes (max gap ${pol.maxUpgradeRankGap})` : 'No'],
                      ['Allow Downgrade', pol.allowDowngrade ? `Yes (max gap ${pol.maxDowngradeRankGap})` : 'No'],
                      ['Vendor Whitelist', pol.vendorWhitelist.length > 0 ? pol.vendorWhitelist.join(', ') : 'Any'],
                      ['Vendor Blocklist', pol.vendorBlocklist.length > 0 ? pol.vendorBlocklist.join(', ') : 'None'],
                      ['Require Vendor Diversity', pol.requireVendorDiversity ? 'Yes' : 'No'],
                      ['Exclude VIP', pol.excludeVip ? 'Yes' : 'No'],
                      ['Min Chunk Size', pol.minChunkSize.toString()],
                      ['Updated', new Date(pol.updatedAt).toLocaleDateString()],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                        <p className="font-body text-sm font-medium text-foreground mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {canEdit && (
                      <>
                        <button onClick={() => startEdit(pol)} className="h-9 px-4 rounded-lg font-body text-xs font-medium bg-primary text-primary-foreground hover:opacity-90">
                          Edit Policy
                        </button>
                        <button onClick={() => deletePolicy(pol.id)} className="h-9 px-4 rounded-lg font-body text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 flex items-center gap-1">
                          <Trash2 size={12} /> Delete
                        </button>
                      </>
                    )}
                    <button className="h-9 px-4 rounded-lg font-body text-xs font-medium border border-border hover:bg-muted flex items-center gap-1">
                      <Play size={12} /> Simulate on last 30 days
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setEditing(null)} />
          <div className="relative bg-card rounded-2xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[85vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-primary">Edit Policy</h2>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Policy Name *</label>
                <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Mode *</label>
                  <select value={editing.mode} onChange={e => setEditing({ ...editing, mode: e.target.value as AllocationMode })} className={inputCls}>
                    <option value="SUGGEST">SUGGEST</option>
                    <option value="SEMI_AUTO">SEMI-AUTO</option>
                    <option value="FULLY_AUTO">FULLY-AUTO</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Split Policy *</label>
                  <select value={editing.splitPolicy} onChange={e => setEditing({ ...editing, splitPolicy: e.target.value as SplitPolicy })} className={inputCls}>
                    <option value="SINGLE_SET_ONLY">Single Set Only</option>
                    <option value="ALLOW_MULTI_SET">Allow Multi-Set</option>
                    <option value="REQUIRE_MIN_CHUNK_SIZE">Require Min Chunk Size</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Min Margin %</label>
                  <input type="number" value={editing.minMarginPct} onChange={e => setEditing({ ...editing, minMarginPct: +e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Max Auto-Commit (AED)</label>
                  <input type="number" value={editing.maxAutoCommitValue} onChange={e => setEditing({ ...editing, maxAutoCommitValue: +e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Min Chunk Size</label>
                  <input type="number" value={editing.minChunkSize} onChange={e => setEditing({ ...editing, minChunkSize: +e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Vendor Whitelist (comma-separated)</label>
                  <input value={editing.vendorWhitelist.join(', ')} onChange={e => setEditing({ ...editing, vendorWhitelist: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className={inputCls} placeholder="Leave empty for any" />
                </div>
                <div>
                  <label className={labelCls}>Vendor Blocklist (comma-separated)</label>
                  <input value={editing.vendorBlocklist.join(', ')} onChange={e => setEditing({ ...editing, vendorBlocklist: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={editing.allowUpgrade} onChange={e => setEditing({ ...editing, allowUpgrade: e.target.checked })} />
                  <span className="font-body text-sm">Allow Upgrade</span>
                  {editing.allowUpgrade && (
                    <input type="number" min={0} max={5} value={editing.maxUpgradeRankGap}
                      onChange={e => setEditing({ ...editing, maxUpgradeRankGap: +e.target.value })}
                      className="w-16 h-8 px-2 rounded border border-border font-mono text-xs" placeholder="Gap" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={editing.allowDowngrade} onChange={e => setEditing({ ...editing, allowDowngrade: e.target.checked })} />
                  <span className="font-body text-sm">Allow Downgrade</span>
                  {editing.allowDowngrade && (
                    <input type="number" min={0} max={5} value={editing.maxDowngradeRankGap}
                      onChange={e => setEditing({ ...editing, maxDowngradeRankGap: +e.target.value })}
                      className="w-16 h-8 px-2 rounded border border-border font-mono text-xs" placeholder="Gap" />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 font-body text-sm">
                  <input type="checkbox" checked={editing.requireVendorDiversity} onChange={e => setEditing({ ...editing, requireVendorDiversity: e.target.checked })} />
                  Require Vendor Diversity
                </label>
                <label className="flex items-center gap-2 font-body text-sm">
                  <input type="checkbox" checked={editing.excludeVip} onChange={e => setEditing({ ...editing, excludeVip: e.target.checked })} />
                  Exclude VIP Clients
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button onClick={() => setEditing(null)} className="h-10 px-5 rounded-lg font-body text-sm border border-border hover:bg-muted">Cancel</button>
              <button onClick={saveEdit} className="h-10 px-6 rounded-lg font-body text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-2">
                <Save size={14} /> Save Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
