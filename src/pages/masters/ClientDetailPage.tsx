import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext, type Client } from '@/context/AppContext';
import {
  MOCK_SALES, MOCK_SALE_LINE_ITEMS, MOCK_UNITS, MOCK_DIST_ROWS,
  MOCK_MATCHES, MOCK_SUBGAMES, getAllocatedUnitsForSaleLine,
} from '@/data/mockData';
import { ArrowLeft, Building2, FileText, ShoppingCart, Package, TrendingUp, Send, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  CORPORATE: { bg: 'bg-primary/15', text: 'text-primary' },
  AGENCY: { bg: 'bg-warning/15', text: 'text-warning' },
  INDIVIDUAL: { bg: 'bg-success/15', text: 'text-success' },
};

function getMatchLabel(matchId: string) {
  const m = MOCK_MATCHES.find(x => x.id === matchId);
  return m ? `${m.code} ${m.teams}` : matchId;
}

function getSubGameName(sgId: string) {
  return MOCK_SUBGAMES.find(sg => sg.id === sgId)?.name ?? '—';
}

type Tab = 'overview' | 'sales' | 'allocations' | 'dispatch';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ctx = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const client = ctx.clients.find(c => c.id === id);
  if (!client) return (
    <div className="p-8 text-center">
      <p className="font-body text-muted-foreground">Client not found</p>
      <Link to="/masters/clients" className="font-body text-sm text-primary hover:underline mt-2 inline-block">← Back to Clients</Link>
    </div>
  );

  // Gather all data for this client
  const clientSales = MOCK_SALES.filter(s => s.client === client.companyName);
  const clientSaleIds = new Set(clientSales.map(s => s.id));
  const clientSaleLines = MOCK_SALE_LINE_ITEMS.filter(l => clientSaleIds.has(l.saleId));
  const clientDistRows = MOCK_DIST_ROWS.filter(r => clientSaleIds.has(r.saleId));
  const clientContracts = ctx.contracts.filter(c => c.partyId === client.id);

  // Allocated units for this client
  const allocatedLineIds = new Set(clientSaleLines.map(l => l.id));
  const allocatedUnits = MOCK_UNITS.filter(u => u.allocatedToLineItemId && allocatedLineIds.has(u.allocatedToLineItemId));

  // Stats
  const totalRevenue = clientSales.reduce((s, sale) => s + sale.totalValue, 0);
  const totalQty = clientSaleLines.reduce((s, l) => s + l.qty, 0);
  const allocatedCount = allocatedUnits.length;
  const dispatchedCount = clientDistRows.filter(r => r.dispatchStatus === 'SENT').length;
  const pendingDispatch = clientDistRows.filter(r => r.dispatchStatus === 'NOT_SENT').length;

  const tabCls = (t: Tab) => `px-4 py-2.5 font-body text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`;
  const cardCls = "rounded-xl border border-border p-4";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/masters/clients')} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold font-body text-accent-foreground shrink-0">
            {client.companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h1 className="font-display text-[26px] text-primary">{client.companyName}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-[12px] text-muted-foreground">{client.code}</span>
              <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${TYPE_COLORS[client.type]?.bg} ${TYPE_COLORS[client.type]?.text}`}>{client.type}</span>
              <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${client.isActive ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive'}`}>{client.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Revenue', value: `AED ${totalRevenue.toLocaleString()}`, icon: TrendingUp },
          { label: 'Sales', value: String(clientSales.length), icon: ShoppingCart },
          { label: 'Total Tickets', value: String(totalQty), icon: Package },
          { label: 'Allocated', value: String(allocatedCount), icon: FileText },
          { label: 'Dispatched', value: `${dispatchedCount} / ${dispatchedCount + pendingDispatch}`, icon: Send },
        ].map(kpi => (
          <div key={kpi.label} className={cardCls}>
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon size={14} className="text-primary" />
              <span className="font-body text-[10px] uppercase tracking-wide text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="font-mono text-lg font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(['overview', 'sales', 'allocations', 'dispatch'] as Tab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={tabCls(t)}>
            {t === 'overview' ? 'Profile & Contracts' : t === 'sales' ? `Sales (${clientSales.length})` : t === 'allocations' ? `Allocations (${allocatedCount})` : `Dispatch (${dispatchedCount + pendingDispatch})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={cardCls + ' space-y-2'}>
            <h3 className="font-body text-sm font-bold text-foreground flex items-center gap-2"><Building2 size={14} className="text-primary" /> Contact Details</h3>
            {[
              ['Primary Contact', client.primaryContactName],
              ['Email', client.email],
              ['Phone', client.phone || '—'],
              ['Location', `${client.city}, ${client.country}`],
              ['Address', client.address || '—'],
              ['Tax ID', client.taxId || '—'],
              ['Payment Terms', client.paymentTerms || '—'],
              ['Credit Limit', `AED ${client.creditLimit.toLocaleString()}`],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">{l}</span>
                <span className="font-body text-[13px] text-foreground text-right">{v}</span>
              </div>
            ))}
          </div>

          <div className={cardCls + ' space-y-3'}>
            <h3 className="font-body text-sm font-bold text-foreground flex items-center gap-2"><FileText size={14} className="text-primary" /> Contracts ({clientContracts.length})</h3>
            {clientContracts.length === 0 && <p className="font-body text-[12px] text-muted-foreground italic">No contracts on file.</p>}
            {clientContracts.map(c => {
              const ev = ctx.getEvent(c.eventId);
              return (
                <div key={c.id} className="rounded-lg border border-border/50 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] font-bold text-primary">{c.contractRef}</span>
                    <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${c.status === 'ACTIVE' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
                  </div>
                  <p className="font-body text-[11px] text-muted-foreground">
                    {ev?.name ?? c.eventId} · {c.contractType} · {c.validFrom} → {c.validTo}
                  </p>
                  <p className="font-body text-[11px] text-muted-foreground">Max: {ctx.formatCurrency(c.maxValue, c.currency)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary h-[40px]">
                {['Sale ID', 'Date', 'Match', 'Contract / Invoice', 'Lines', 'Qty', 'Value', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2 font-body text-[12px] font-bold text-primary-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientSales.map((s, i) => {
                const saleLabel = s.id.toUpperCase().replace('SALE', 'SALE-');
                const status = s.status;
                return (
                  <tr key={s.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to="/sales" className="font-mono text-xs font-bold text-primary hover:underline">{saleLabel}</Link>
                    </td>
                    <td className="px-4 py-3 font-body text-[13px] text-foreground">{s.date}</td>
                    <td className="px-4 py-3 font-body text-[13px] text-foreground">{getMatchLabel(s.matchId)}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{s.contract || s.invoiceNumber || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[12px]">{s.lines.length}</td>
                    <td className="px-4 py-3 font-mono text-[12px]">{s.totalQty}</td>
                    <td className="px-4 py-3 font-mono text-[12px] font-medium">AED {s.totalValue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${
                        status === 'FULFILLED' ? 'bg-success text-primary-foreground' :
                        status === 'ALLOCATED' ? 'bg-success/15 text-success' :
                        status.includes('PARTIAL') ? 'bg-warning/15 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>{status}</span>
                    </td>
                  </tr>
                );
              })}
              {clientSales.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center font-body text-sm text-muted-foreground">No sales found for this client.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'allocations' && (
        <div className="space-y-4">
          {clientSaleLines.map(line => {
            const units = getAllocatedUnitsForSaleLine(line.id);
            if (units.length === 0) return null;
            const sale = clientSales.find(s => s.id === line.saleId);
            const saleLabel = sale?.id.toUpperCase().replace('SALE', 'SALE-') ?? line.saleId;
            const setGroups = [...new Set(units.map(u => u.setId))];

            return (
              <div key={line.id} className={cardCls + ' space-y-2'}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[12px] font-bold text-primary">{saleLabel}</span>
                    <span className="font-body text-[12px] text-foreground">{line.categoryLabel} × {line.qty}</span>
                    <span className="font-body text-[11px] text-muted-foreground">{getSubGameName(line.subGameId)}</span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">{units.length} units allocated</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {setGroups.map(sid => {
                    const setUnits = units.filter(u => u.setId === sid);
                    const first = setUnits[0];
                    return (
                      <div key={sid} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted/50">
                        <span className="font-mono text-[10px] font-bold text-primary">{sid}</span>
                        <span className="font-body text-[10px] text-muted-foreground">{first.vendor}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{setUnits.length} units</span>
                        {first.block && <span className="font-mono text-[9px] text-muted-foreground">Blk {first.block} R{first.row}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {units.map(u => (
                    <span key={u.id} className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-success/10 text-success border border-success/20">
                      {u.id} {u.block && `${u.block}-${u.row}-${u.seat}`}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {allocatedUnits.length === 0 && (
            <p className="text-center py-8 font-body text-sm text-muted-foreground">No allocations yet.</p>
          )}
        </div>
      )}

      {activeTab === 'dispatch' && (
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-primary h-[40px]">
                {['Row ID', 'Sale', 'Category', 'Unit', 'Guest Name', 'Email', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2 font-body text-[12px] font-bold text-primary-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientDistRows.map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-primary font-bold">{r.id}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-foreground">{r.saleId.toUpperCase().replace('SALE', 'SALE-')}</td>
                  <td className="px-4 py-2.5 font-body text-[12px] text-foreground">{r.categoryLabel}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-primary">{r.unitId ?? '—'}</td>
                  <td className="px-4 py-2.5 font-body text-[12px] text-foreground">{r.clientFirstName && r.clientLastName ? `${r.clientFirstName} ${r.clientLastName}` : '—'}</td>
                  <td className="px-4 py-2.5 font-body text-[11px] text-muted-foreground">{r.clientEmail || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${r.dispatchStatus === 'SENT' ? 'bg-success text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{r.dispatchStatus}</span>
                  </td>
                </tr>
              ))}
              {clientDistRows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center font-body text-sm text-muted-foreground">No dispatch rows.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
