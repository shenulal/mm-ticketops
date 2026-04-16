import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext, type Vendor, type VendorEventBridge } from '@/context/AppContext';
import {
  MOCK_PURCHASES, MOCK_PURCHASE_LINE_ITEMS, MOCK_UNITS, MOCK_MATCHES, MOCK_SUBGAMES,
  getTicketSets, type PurchaseUnit,
} from '@/data/mockData';
import { ArrowLeft, Truck, FileText, ShoppingCart, Package, Key, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addAuditEntry } from '@/data/auditData';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  MARKETPLACE: { bg: 'bg-accent/20', text: 'text-accent-foreground' },
  DIRECT: { bg: 'bg-success/15', text: 'text-success' },
  AGENCY: { bg: 'bg-warning/15', text: 'text-warning' },
};

function getMatchLabel(matchId: string) {
  const m = MOCK_MATCHES.find(x => x.id === matchId);
  return m ? `${m.code} ${m.teams}` : matchId;
}

type Tab = 'overview' | 'purchases' | 'inventory' | 'credentials';

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ctx = useAppContext();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const vendor = ctx.vendors.find(v => v.id === id);
  if (!vendor) return (
    <div className="p-8 text-center">
      <p className="font-body text-muted-foreground">Vendor not found</p>
      <Link to="/masters/vendors" className="font-body text-sm text-primary hover:underline mt-2 inline-block">← Back to Vendors</Link>
    </div>
  );

  // Gather data
  const vendorPurchases = MOCK_PURCHASES.filter(p => p.vendor === vendor.name);
  const vendorUnits = MOCK_UNITS.filter(u => u.vendor === vendor.name);
  const vendorBridges = ctx.vendorEventBridges.filter(b => b.vendorId === vendor.id);
  const vendorContracts = ctx.contracts.filter(c => c.partyId === vendor.id);
  const credentials = ctx.getCredentialsForVendor(vendor.id);

  // Stats
  const totalPurchaseValue = vendorPurchases.reduce((s, p) => s + p.totalValue, 0);
  const totalUnits = vendorUnits.length;
  const availableUnits = vendorUnits.filter(u => u.status === 'AVAILABLE').length;
  const allocatedUnits = vendorUnits.filter(u => u.status === 'ALLOCATED').length;
  const cancelledUnits = vendorUnits.filter(u => u.status === 'CANCELLED' || u.status === 'REPLACED').length;

  const tabCls = (t: Tab) => `px-4 py-2.5 font-body text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`;
  const cardCls = "rounded-xl border border-border p-4";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/masters/vendors')} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-lg font-bold font-body text-primary shrink-0">
            {vendor.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h1 className="font-display text-[26px] text-primary">{vendor.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-[12px] text-muted-foreground">{vendor.code}</span>
              <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${TYPE_COLORS[vendor.type]?.bg} ${TYPE_COLORS[vendor.type]?.text}`}>{vendor.type}</span>
              <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${vendor.isActive ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive'}`}>{vendor.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Purchase Value', value: `AED ${totalPurchaseValue.toLocaleString()}`, icon: ShoppingCart },
          { label: 'Purchases', value: String(vendorPurchases.length), icon: FileText },
          { label: 'Total Units', value: String(totalUnits), icon: Package },
          { label: 'Available', value: String(availableUnits), cls: 'text-success' },
          { label: 'Allocated', value: String(allocatedUnits), cls: 'text-warning' },
        ].map(kpi => (
          <div key={kpi.label} className={cardCls}>
            <div className="flex items-center gap-2 mb-1">
              {'icon' in kpi && kpi.icon && <kpi.icon size={14} className="text-primary" />}
              <span className="font-body text-[10px] uppercase tracking-wide text-muted-foreground">{kpi.label}</span>
            </div>
            <p className={`font-mono text-lg font-bold ${'cls' in kpi ? kpi.cls : 'text-foreground'}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(['overview', 'purchases', 'inventory', 'credentials'] as Tab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={tabCls(t)}>
            {t === 'overview' ? 'Profile & Events' : t === 'purchases' ? `Purchases (${vendorPurchases.length})` : t === 'inventory' ? `Inventory (${totalUnits})` : `Credentials (${credentials.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={cardCls + ' space-y-2'}>
            <h3 className="font-body text-sm font-bold text-foreground flex items-center gap-2"><Truck size={14} className="text-primary" /> Vendor Profile</h3>
            {[
              ['Contact', vendor.primaryContactName],
              ['Email', vendor.primaryContactEmail],
              ['Phone', vendor.primaryContactPhone || '—'],
              ['Country', vendor.country],
              ['Website', vendor.website || '—'],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">{l}</span>
                <span className="font-body text-[13px] text-foreground text-right">{v}</span>
              </div>
            ))}
            {vendor.notes && <p className="font-body text-[12px] text-muted-foreground mt-2">{vendor.notes}</p>}
          </div>

          <div className={cardCls + ' space-y-3'}>
            <h3 className="font-body text-sm font-bold text-foreground flex items-center gap-2"><FileText size={14} className="text-primary" /> Event Assignments ({vendorBridges.length})</h3>
            {vendorBridges.map(b => {
              const ev = ctx.getEvent(b.eventId);
              return (
                <div key={b.id} className="rounded-lg border border-border/50 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[13px] font-medium text-foreground">{ev?.name ?? b.eventId}</span>
                    <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${b.isActive ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{b.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                  </div>
                  <p className="font-body text-[11px] text-muted-foreground">
                    Platform: {b.platformUrl || '—'} · Login: {b.loginEmail || '—'}
                  </p>
                </div>
              );
            })}
            {vendorBridges.length === 0 && <p className="font-body text-[12px] text-muted-foreground italic">Not assigned to any events.</p>}

            {vendorContracts.length > 0 && (
              <>
                <h3 className="font-body text-sm font-bold text-foreground mt-4">Contracts ({vendorContracts.length})</h3>
                {vendorContracts.map(c => {
                  const ev = ctx.getEvent(c.eventId);
                  return (
                    <div key={c.id} className="rounded-lg border border-border/50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[12px] font-bold text-primary">{c.contractRef}</span>
                        <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${c.status === 'ACTIVE' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
                      </div>
                      <p className="font-body text-[11px] text-muted-foreground">{ev?.name ?? c.eventId} · {c.validFrom} → {c.validTo}</p>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary h-[40px]">
                {['Purchase', 'Date', 'Match', 'Contract', 'Lines', 'Qty', 'Value', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2 font-body text-[12px] font-bold text-primary-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendorPurchases.map((p, pi) => {
                const purLabel = `PUR-${String(MOCK_PURCHASES.indexOf(p) + 1).padStart(3, '0')}`;
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link to="/purchases" className="font-mono text-xs font-bold text-primary hover:underline">{purLabel}</Link>
                    </td>
                    <td className="px-4 py-3 font-body text-[13px] text-foreground">{p.date}</td>
                    <td className="px-4 py-3 font-body text-[13px] text-foreground">{getMatchLabel(p.matchId)}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{p.contract}</td>
                    <td className="px-4 py-3 font-mono text-[12px]">{p.lines.length}</td>
                    <td className="px-4 py-3 font-mono text-[12px]">{p.totalQty}</td>
                    <td className="px-4 py-3 font-mono text-[12px] font-medium">AED {p.totalValue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${p.status === 'ACTIVE' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
                    </td>
                  </tr>
                );
              })}
              {vendorPurchases.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center font-body text-sm text-muted-foreground">No purchases from this vendor.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Summary by status */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Available', count: availableUnits, cls: 'text-success' },
              { label: 'Allocated', count: allocatedUnits, cls: 'text-warning' },
              { label: 'Cancelled / Replaced', count: cancelledUnits, cls: 'text-destructive' },
              { label: 'Total', count: totalUnits, cls: 'text-foreground' },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-border p-3 text-center">
                <p className="font-body text-[10px] uppercase text-muted-foreground">{s.label}</p>
                <p className={`font-mono text-xl font-bold ${s.cls}`}>{s.count}</p>
              </div>
            ))}
          </div>

          {/* Sets breakdown by purchase */}
          {vendorPurchases.map(p => {
            const purLabel = `PUR-${String(MOCK_PURCHASES.indexOf(p) + 1).padStart(3, '0')}`;
            const purUnits = vendorUnits.filter(u => u.purchaseId === p.id);
            const sets = getTicketSets().filter(s => s.vendor === vendor.name && purUnits.some(u => u.setId === s.setId));

            return (
              <div key={p.id} className={cardCls + ' space-y-2'}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] font-bold text-primary">{purLabel}</span>
                  <span className="font-body text-[12px] text-muted-foreground">{getMatchLabel(p.matchId)}</span>
                  <span className="font-body text-[11px] text-muted-foreground">{purUnits.length} units</span>
                </div>
                <div className="space-y-1">
                  {sets.map(s => (
                    <div key={s.setId} className="flex items-center gap-3 py-1 border-b border-border/30 last:border-0">
                      <span className="font-mono text-[11px] font-bold text-primary w-32">{s.setId}</span>
                      <span className="font-body text-[11px] text-foreground">{s.categoryLabel}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">Blk {s.block} R{s.row}</span>
                      <span className="font-mono text-[11px] text-success">{s.available} avail</span>
                      <span className="font-mono text-[11px] text-warning">{s.allocated} alloc</span>
                      <span className="font-mono text-[11px] text-muted-foreground">/ {s.totalSize} total</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'credentials' && (
        <CredentialsTab vendorId={vendor.id} vendorName={vendor.name} />
      )}
    </div>
  );
}

/* ── Credentials Tab ── */
function CredentialsTab({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const ctx = useAppContext();
  const { currentUser } = useAuth();
  const creds = ctx.getCredentialsForVendor(vendorId);
  const role = currentUser?.role ?? 'operator';
  const canView = ['super_admin', 'ops_manager', 'sr_operator'].includes(role);

  if (!canView) return (
    <div className="py-8 text-center">
      <Key size={24} className="mx-auto text-muted-foreground mb-2" />
      <p className="font-body text-sm text-muted-foreground">You do not have permission to view credentials.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {creds.length === 0 && <p className="font-body text-[12px] text-muted-foreground italic">No credentials on file.</p>}
      {creds.map(c => {
        const ev = c.eventId ? ctx.getEvent(c.eventId) : null;
        return <CredentialCard key={c.id} cred={c} eventName={ev?.name} />;
      })}
    </div>
  );
}

function CredentialCard({ cred, eventName }: { cred: any; eventName?: string }) {
  const [visible, setVisible] = useState(false);
  const { currentUser } = useAuth();

  const reveal = () => {
    setVisible(true);
    addAuditEntry({
      when: new Date().toISOString(),
      actor: currentUser?.name ?? 'Unknown',
      actorRole: currentUser?.role ?? 'operator',
      entity: 'credential',
      entityId: cred.id,
      action: 'credential.view',
      before: null,
      after: { credentialId: cred.id },
      ip: '10.0.1.12',
      eventId: 'evt1',
      eventName: 'FIFA World Cup 2026',
    });
    setTimeout(() => setVisible(false), 15000);
  };

  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key size={14} className="text-primary" />
          <span className="font-body text-[13px] font-medium text-foreground">{cred.loginId}</span>
          {eventName && <span className="px-2 py-0.5 rounded-full font-body text-[10px] bg-primary/10 text-primary">{eventName}</span>}
        </div>
        <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${cred.active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{cred.active ? 'ACTIVE' : 'INACTIVE'}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="font-body text-[10px] uppercase text-muted-foreground">Email</span>
          <p className="font-body text-[12px] text-foreground">{cred.email}</p>
        </div>
        <div>
          <span className="font-body text-[10px] uppercase text-muted-foreground">Password</span>
          <div className="flex items-center gap-2">
            <p className="font-mono text-[12px] text-foreground">{visible ? cred.passwordHash : '••••••••••'}</p>
            <button onClick={reveal} className="p-1 rounded hover:bg-muted" title={visible ? 'Auto-hides in 15s' : 'Reveal (logged)'}>
              {visible ? <EyeOff size={14} className="text-muted-foreground" /> : <Eye size={14} className="text-muted-foreground" />}
            </button>
          </div>
        </div>
      </div>
      {cred.notes && <p className="font-body text-[11px] text-muted-foreground">{cred.notes}</p>}
    </div>
  );
}
