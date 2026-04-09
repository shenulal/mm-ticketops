import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addAuditEntry, MOCK_SALES_PARENT_RECON, MOCK_PURCHASE_UNITS_AUDIT, MOCK_ALLOCATION_AUDIT, type SalesParentReconRow, type AllocationAuditRun } from '@/data/auditData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, AlertTriangle, Play, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

/* ═════════════════════════════════════════
   SALES PARENT RECONCILIATION
   ═════════════════════════════════════════ */

const ACTION_COLORS: Record<string, string> = {
  KEEP: 'bg-emerald-100 text-emerald-700',
  PROTECTED_EXCESS: 'bg-amber-100 text-amber-700',
  DELETE_CANDIDATE: 'bg-destructive/15 text-destructive',
  MISSING_IN_DIST: 'bg-blue-100 text-blue-700',
};

function SalesParentReconTab() {
  const { currentUser } = useAuth();
  const [confirmAction, setConfirmAction] = useState<'delete' | 'rebuild' | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const deleteCandidates = MOCK_SALES_PARENT_RECON.filter(r => r.action === 'DELETE_CANDIDATE');

  const handleConfirm = () => {
    if (confirmText !== 'REBUILD') {
      toast.error('Type REBUILD to confirm');
      return;
    }
    addAuditEntry({
      when: new Date().toISOString(),
      actor: currentUser?.name || 'Unknown',
      actorRole: currentUser?.role || 'unknown',
      entity: 'reconciliation',
      entityId: `recon-${Date.now()}`,
      action: confirmAction === 'delete' ? 'recon.delete_candidates' : 'recon.rebuild_sales',
      before: { candidates: deleteCandidates.length },
      after: { action: confirmAction },
      ip: '10.0.1.12',
      eventId: null,
      eventName: null,
    });
    toast.success(confirmAction === 'delete' ? `${deleteCandidates.length} candidates deleted` : 'Sales rebuild initiated');
    setConfirmAction(null);
    setConfirmText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-body text-sm font-semibold text-foreground">Sales Parent Reconciliation</h3>
          <p className="font-body text-[12px] text-muted-foreground">Mirrors the _SALES_PARENT_RECON audit sheet. {deleteCandidates.length} delete candidates found.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfirmAction('delete')} disabled={deleteCandidates.length === 0} className="text-destructive">
            Delete Candidates ({deleteCandidates.length})
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmAction('rebuild')}>
            Rebuild Sales
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[13px] font-body">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Source Sale</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Wanted</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Actual</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Dist Row</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Sales Line Key</th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Touched</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SALES_PARENT_RECON.map(r => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-3 font-mono text-[11px]">{r.sourceSaleId}</td>
                <td className="px-3 py-3 text-right font-mono">{r.wantedCount}</td>
                <td className="px-3 py-3 text-right font-mono">{r.actualCount}</td>
                <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">{r.distRow}</td>
                <td className="px-3 py-3 font-mono text-[11px]">{r.salesLineKey}</td>
                <td className="px-3 py-3 text-center">{r.touched ? <CheckCircle2 size={14} className="text-emerald-600 mx-auto" /> : '—'}</td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ACTION_COLORS[r.action]}`}>{r.action}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={!!confirmAction} onOpenChange={v => { if (!v) { setConfirmAction(null); setConfirmText(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-destructive flex items-center gap-2">
              <AlertTriangle size={20} />
              {confirmAction === 'delete' ? 'Delete Candidates' : 'Rebuild Sales'}
            </DialogTitle>
          </DialogHeader>
          <p className="font-body text-sm text-muted-foreground mt-2">
            This is a destructive action. Type <strong>REBUILD</strong> to confirm.
          </p>
          <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Type REBUILD" className="mt-3 font-mono" />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => { setConfirmAction(null); setConfirmText(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={confirmText !== 'REBUILD'}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═════════════════════════════════════════
   PURCHASE UNITS AUDIT
   ═════════════════════════════════════════ */

const ISSUE_COLORS: Record<string, string> = {
  NONE: 'bg-emerald-100 text-emerald-700',
  ALLOCATED_EXCEEDS_PURCHASES_QTY: 'bg-destructive/15 text-destructive',
  EXTRA_AVAILABLE_ROWS_REMOVED: 'bg-amber-100 text-amber-700',
  MISSING_ROWS_ADDED: 'bg-blue-100 text-blue-700',
  ORPHAN_ALLOCATED_ROW_PRESERVED: 'bg-amber-100 text-amber-700',
};

function PurchaseUnitsAuditTab() {
  const { currentUser } = useAuth();
  const [running, setRunning] = useState(false);

  const handleRun = () => {
    setRunning(true);
    addAuditEntry({
      when: new Date().toISOString(),
      actor: currentUser?.name || 'Unknown',
      actorRole: currentUser?.role || 'unknown',
      entity: 'reconciliation',
      entityId: `pua-run-${Date.now()}`,
      action: 'recon.purchase_units_audit',
      before: null,
      after: { rowsChecked: MOCK_PURCHASE_UNITS_AUDIT.length },
      ip: '10.0.1.12',
      eventId: null,
      eventName: null,
    });
    setTimeout(() => {
      setRunning(false);
      toast.success('Purchase units audit complete');
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-body text-sm font-semibold text-foreground">Purchase Units Audit</h3>
          <p className="font-body text-[12px] text-muted-foreground">Mirrors _PURCHASE_UNITS_AUDIT — verifies unit counts against purchase line quantities.</p>
        </div>
        <Button size="sm" onClick={handleRun} disabled={running} className="gap-2">
          <Play size={14} /> {running ? 'Running…' : 'Run Audit Now'}
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-auto">
        <table className="w-full text-[13px] font-body min-w-[900px]">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Checked At</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Source</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Match</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Game</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Vendor</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Contract</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Category</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Pur Qty</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Before</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Alloc</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Final</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Issue</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PURCHASE_UNITS_AUDIT.map(r => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-3 font-mono text-[11px]">{new Date(r.checkedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-3 py-3 font-mono text-[11px]">{r.source}</td>
                <td className="px-3 py-3 font-mono text-[11px]">{r.match}</td>
                <td className="px-3 py-3">{r.game}</td>
                <td className="px-3 py-3">{r.vendor}</td>
                <td className="px-3 py-3 font-mono text-[11px]">{r.contract}</td>
                <td className="px-3 py-3">{r.category}</td>
                <td className="px-3 py-3 text-right font-mono">{r.purchaseQty}</td>
                <td className="px-3 py-3 text-right font-mono">{r.unitsBefore}</td>
                <td className="px-3 py-3 text-right font-mono">{r.allocated}</td>
                <td className="px-3 py-3 text-right font-mono">{r.finalCount}</td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ISSUE_COLORS[r.issue]}`}>
                    {r.issue === 'NONE' ? 'OK' : r.issue.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════
   ALLOCATION AUDIT
   ═════════════════════════════════════════ */

function AllocationAuditTab() {
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-body text-sm font-semibold text-foreground">Allocation Audit — Run History</h3>
        <p className="font-body text-[12px] text-muted-foreground">Every allocation run is logged with unit-level detail.</p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[13px] font-body">
          <thead>
            <tr className="bg-muted/50">
              <th className="w-8 px-2 py-2.5"></th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Run ID</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Started At</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Operator</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Sales</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Sets</th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Committed</th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Rolled Back</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ALLOCATION_AUDIT.map(r => {
              const expanded = expandedRun === r.id;
              return (
                <>
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setExpandedRun(expanded ? null : r.id)}>
                    <td className="px-2 py-3 text-muted-foreground">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                    <td className="px-3 py-3 font-mono text-[11px]">{r.runId}</td>
                    <td className="px-3 py-3 font-mono text-[11px]">{new Date(r.startedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-3 py-3">{r.operator}</td>
                    <td className="px-3 py-3 text-right font-mono">{r.salesInvolved}</td>
                    <td className="px-3 py-3 text-right font-mono">{r.setsUsed}</td>
                    <td className="px-3 py-3 text-center">
                      {r.committed ? <CheckCircle2 size={14} className="text-emerald-600 mx-auto" /> : '—'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {r.rolledBack ? <AlertTriangle size={14} className="text-amber-600 mx-auto" /> : '—'}
                    </td>
                  </tr>
                  {expanded && (
                    <tr key={`${r.id}-detail`} className="border-t border-border bg-muted/20">
                      <td colSpan={8} className="px-4 py-3">
                        <p className="font-body text-xs font-medium text-foreground mb-2">{r.unitFlips.length} unit flips</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {r.unitFlips.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-card border border-border text-[11px] font-mono">
                              <span className="text-foreground">{f.unitId}</span>
                              <span className="text-muted-foreground">{f.from} →</span>
                              <span className="text-emerald-600">{f.to}</span>
                            </div>
                          ))}
                        </div>
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
  );
}

/* ═════════════════════════════════════════
   MAIN PAGE
   ═════════════════════════════════════════ */

export default function ReconciliationPage() {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isOpsManager = currentUser?.role === 'ops_manager';

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Shield size={20} className="text-primary" />
        <h1 className="font-display text-[26px] text-primary">Reconciliation</h1>
      </div>

      <Tabs defaultValue={isSuperAdmin ? 'sales-recon' : 'allocation-audit'}>
        <TabsList className="mb-4">
          {isSuperAdmin && <TabsTrigger value="sales-recon">Sales Parent Recon</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="purchase-audit">Purchase Units Audit</TabsTrigger>}
          <TabsTrigger value="allocation-audit">Allocation Audit</TabsTrigger>
        </TabsList>

        {isSuperAdmin && (
          <TabsContent value="sales-recon">
            <SalesParentReconTab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="purchase-audit">
            <PurchaseUnitsAuditTab />
          </TabsContent>
        )}
        <TabsContent value="allocation-audit">
          <AllocationAuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
