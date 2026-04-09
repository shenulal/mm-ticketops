import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MOCK_MATCHES } from '@/data/mockData';
import { useSupplierUnits, type SupplierUnit, type DeliveryStatus } from './SupplierDashboardPage';
import { toast } from 'sonner';
import { ArrowLeft, Upload, CheckSquare, Square, Check, AlertTriangle } from 'lucide-react';

const inputCls = 'w-full px-2 py-1.5 rounded-lg border border-border bg-background text-[12px] font-body focus:outline-none focus:ring-2 focus:ring-primary/30';

const STATUS_OPTIONS: DeliveryStatus[] = ['NOT_SENT', 'SENT', 'PENDING', 'ACCEPTED', 'ISSUE', 'UPLOADED'];
const STATUS_COLORS: Record<string, string> = {
  NOT_SENT: 'bg-muted text-muted-foreground',
  SENT: 'bg-primary/15 text-primary',
  PENDING: 'bg-warning/15 text-warning',
  ACCEPTED: 'bg-success/15 text-success',
  ISSUE: 'bg-destructive/15 text-destructive',
  UPLOADED: 'bg-accent/15 text-accent-foreground',
};

export default function SupplierMatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const initialUnits = useSupplierUnits();
  const match = MOCK_MATCHES.find(m => m.id === matchId);

  const matchUnits = useMemo(() => initialUnits.filter(u => u.matchId === matchId), [initialUnits, matchId]);

  // Local editable state
  const [units, setUnits] = useState<SupplierUnit[]>(matchUnits);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [proofUploads, setProofUploads] = useState<Record<string, string>>({});

  const updateUnit = useCallback((unitId: string, field: keyof SupplierUnit, value: string) => {
    setUnits(prev => prev.map(u => u.unitId === unitId ? { ...u, [field]: value } : u));
  }, []);

  const toggleSelect = (unitId: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(unitId) ? n.delete(unitId) : n.add(unitId);
      return n;
    });
  };

  const selectAll = () => {
    if (selected.size === units.length) setSelected(new Set());
    else setSelected(new Set(units.map(u => u.unitId)));
  };

  const bulkMarkSent = () => {
    setUnits(prev => prev.map(u => selected.has(u.unitId) ? { ...u, deliveryStatus: 'SENT' as DeliveryStatus } : u));
    toast.success(`${selected.size} tickets marked as SENT`);
    setSelected(new Set());
  };

  const handleProof = (unitId: string) => {
    // Simulate file upload
    const proof = `proof-${unitId}-${Date.now()}.pdf`;
    setProofUploads(prev => ({ ...prev, [unitId]: proof }));
    setUnits(prev => prev.map(u => u.unitId === unitId ? { ...u, proof, deliveryStatus: 'UPLOADED' as DeliveryStatus } : u));
    toast.success(`Proof uploaded for ${unitId}`);
  };

  const handleStatusChange = (unitId: string, status: DeliveryStatus) => {
    updateUnit(unitId, 'deliveryStatus', status);
    if (status === 'ISSUE') {
      toast.warning(`Issue reported for ${unitId} — Ops Manager will be notified.`);
    }
  };

  if (!match) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/supplier')} className="flex items-center gap-2 text-[13px] font-body text-primary hover:underline">
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
        <p className="font-body text-muted-foreground">Match not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/supplier')} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={16} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="font-heading text-[22px] text-foreground">{match.code} — {match.teams}</h1>
            <p className="text-[12px] font-body text-muted-foreground">{match.venue}, {match.city} · {match.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={bulkMarkSent}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90 flex items-center gap-2">
              <Check size={14} /> Mark {selected.size} as SENT
            </button>
          )}
          <span className="px-3 py-1.5 rounded-full text-[11px] font-body font-medium bg-primary/10 text-primary">
            {units.length} tickets
          </span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map(s => {
          const count = units.filter(u => u.deliveryStatus === s).length;
          if (count === 0) return null;
          return (
            <span key={s} className={`px-2.5 py-1 rounded-lg text-[11px] font-body font-medium ${STATUS_COLORS[s]}`}>
              {s.replace('_', ' ')}: {count}
            </span>
          );
        })}
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-x-auto bg-card">
        <table className="w-full text-[12px] font-body min-w-[900px]">
          <thead>
            <tr className="bg-muted/50 text-left text-[11px] text-muted-foreground uppercase tracking-wider">
              <th className="px-3 py-3 w-10">
                <button onClick={selectAll} className="p-0.5">
                  {selected.size === units.length && units.length > 0 ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} />}
                </button>
              </th>
              <th className="px-3 py-3">Unit ID</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Set ID</th>
              <th className="px-3 py-3">Pos</th>
              <th className="px-3 py-3">Block</th>
              <th className="px-3 py-3">Row</th>
              <th className="px-3 py-3">Seat</th>
              <th className="px-3 py-3">Delivery</th>
              <th className="px-3 py-3">Notes</th>
              <th className="px-3 py-3">Proof</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {units.map(u => (
              <tr key={u.unitId} className={`border-t border-border transition-colors ${selected.has(u.unitId) ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                <td className="px-3 py-2.5">
                  <button onClick={() => toggleSelect(u.unitId)} className="p-0.5">
                    {selected.has(u.unitId) ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} className="text-muted-foreground" />}
                  </button>
                </td>
                <td className="px-3 py-2.5 font-mono text-[11px] font-medium text-foreground">{u.unitId}</td>
                <td className="px-3 py-2.5">{u.category}</td>
                <td className="px-3 py-2.5 font-mono text-[11px]">{u.setId}</td>
                <td className="px-3 py-2.5 text-center">{u.setPos}</td>
                <td className="px-3 py-2.5">
                  <input className={inputCls} value={u.block} onChange={e => updateUnit(u.unitId, 'block', e.target.value)} placeholder="—" style={{ width: 50 }} />
                </td>
                <td className="px-3 py-2.5">
                  <input className={inputCls} value={u.row} onChange={e => updateUnit(u.unitId, 'row', e.target.value)} placeholder="—" style={{ width: 50 }} />
                </td>
                <td className="px-3 py-2.5">
                  <input className={inputCls} value={u.seat} onChange={e => updateUnit(u.unitId, 'seat', e.target.value)} placeholder="—" style={{ width: 50 }} />
                </td>
                <td className="px-3 py-2.5">
                  <select className={`${inputCls} ${STATUS_COLORS[u.deliveryStatus]}`} value={u.deliveryStatus}
                    onChange={e => handleStatusChange(u.unitId, e.target.value as DeliveryStatus)} style={{ width: 110 }}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input className={inputCls} value={u.notes} onChange={e => updateUnit(u.unitId, 'notes', e.target.value)} placeholder="Notes..." style={{ width: 120 }} />
                </td>
                <td className="px-3 py-2.5">
                  {proofUploads[u.unitId] || u.proof ? (
                    <span className="text-[10px] text-success font-medium flex items-center gap-1"><Check size={10} /> Uploaded</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <button onClick={() => handleProof(u.unitId)}
                    className="px-2 py-1 rounded-lg text-[11px] font-body text-primary hover:bg-primary/10 flex items-center gap-1">
                    <Upload size={11} /> Upload
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <p className="text-[11px] font-body text-muted-foreground italic">
        Changes are synced to the internal dispatch system. Reporting "ISSUE" will notify the Ops Manager immediately.
      </p>
    </div>
  );
}
