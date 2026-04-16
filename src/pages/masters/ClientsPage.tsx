import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, type Client } from '@/context/AppContext';
import MasterPage, { FieldRow, SectionHeading, StatusBadge, TypeBadge, FormField, inputCls, selectCls, textareaCls, type ColumnDef, type FilterDef } from '@/components/MasterPage';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight } from 'lucide-react';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  CORPORATE: { bg: 'bg-primary/15', text: 'text-primary' },
  AGENCY: { bg: 'bg-warning/15', text: 'text-warning' },
  INDIVIDUAL: { bg: 'bg-success/15', text: 'text-success' },
};

const FILTERS: FilterDef[] = [
  { id: 'type', label: 'Type', options: [{ value: 'CORPORATE', label: 'Corporate' }, { value: 'AGENCY', label: 'Agency' }, { value: 'INDIVIDUAL', label: 'Individual' }] },
];

function InitialsCircle({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || name.slice(0, 2).toUpperCase();
  return <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-[11px] font-bold font-body text-accent-foreground shrink-0">{initials}</div>;
}

export default function ClientsPage() {
  const ctx = useAppContext();

  const columns: ColumnDef<Client>[] = [
    { key: 'name', header: 'Company', render: c => (
      <div className="flex items-center gap-3">
        <InitialsCircle name={c.companyName} />
        <div><div className="font-medium">{c.companyName}</div><div className="text-[11px] text-muted-foreground font-mono">{c.code}</div></div>
      </div>
    )},
    { key: 'type', header: 'Type', render: c => <TypeBadge type={c.type} colorMap={TYPE_COLORS} /> },
    { key: 'location', header: 'Location', render: c => `${c.city}${c.city && c.country ? ', ' : ''}${c.country}` },
    { key: 'contact', header: 'Primary Contact', render: c => (
      <div><div>{c.primaryContactName}</div><div className="text-[11px] text-muted-foreground">{c.email}</div></div>
    )},
    { key: 'contracts', header: 'Active Contracts', render: c => {
      const activeContracts = ctx.contracts.filter(ct => ct.partyId === c.id && ct.status === 'ACTIVE');
      if (activeContracts.length === 0) {
        return (
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground italic">
            <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
            No active contracts
          </span>
        );
      }
      const eventIds = new Set(activeContracts.map(ct => ct.eventId));
      return <span className="text-[12px]">{activeContracts.length} contract{activeContracts.length !== 1 ? 's' : ''} · {eventIds.size} event{eventIds.size !== 1 ? 's' : ''}</span>;
    }},
    { key: 'credit', header: 'Credit Limit', render: c => ctx.formatCurrency(c.creditLimit) },
    { key: 'active', header: 'Status', render: c => <StatusBadge active={c.isActive} />, width: '100px' },
  ];

  const renderDrawer = (client: Client, onClose: () => void) => (
    <ClientDrawer client={client} onClose={onClose} />
  );

  const renderCreate = (onClose: () => void) => <ClientForm onClose={onClose} />;

  return (
    <MasterPage<Client>
      title="Clients"
      entityName="Client"
      data={ctx.clients}
      columns={columns}
      filters={FILTERS}
      searchFields={c => `${c.companyName} ${c.code} ${c.primaryContactName} ${c.email} ${c.city} ${c.country}`}
      getId={c => c.id}
      getIsActive={c => c.isActive}
      renderDrawer={renderDrawer}
      renderCreateModal={renderCreate}
      writeRoles={['super_admin', 'event_admin', 'ops_manager']}
      headerNote="Clients exist globally. Their event relationship is established through sale contracts. A client appears in sale forms only when they have an active contract for the active event."
    />
  );
}

/* ── Client Detail Drawer ── */
function ClientDrawer({ client, onClose }: { client: Client; onClose: () => void }) {
  const ctx = useAppContext();
  const allContracts = ctx.contracts.filter(c => c.partyId === client.id);
  const [contractsOpen, setContractsOpen] = useState(true);

  // Group contracts by event
  const byEvent: Record<string, { eventName: string; eventStatus: string; contracts: typeof allContracts }> = {};
  allContracts.forEach(c => {
    const ev = ctx.getEvent(c.eventId);
    if (!byEvent[c.eventId]) byEvent[c.eventId] = { eventName: ev?.name ?? c.eventId, eventStatus: ev?.status ?? '—', contracts: [] };
    byEvent[c.eventId].contracts.push(c);
  });

  return (
    <div>
      {/* SECTION A: Global Client Profile */}
      <div className="border-l-4 border-accent pl-3 mb-4">
        <h3 className="font-body text-[14px] font-semibold text-foreground">Global Client Profile</h3>
      </div>
      <FieldRow label="Company Name" value={client.companyName} />
      <FieldRow label="Code" value={client.code} />
      <FieldRow label="Type"><TypeBadge type={client.type} colorMap={TYPE_COLORS} /></FieldRow>
      <FieldRow label="Tax ID" value={client.taxId || '—'} />
      <FieldRow label="Payment Terms" value={client.paymentTerms || '—'} />
      <FieldRow label="Credit Limit" value={ctx.formatCurrency(client.creditLimit)} />
      <FieldRow label="Location" value={`${client.address ? client.address + ', ' : ''}${client.city}, ${client.country}`} />
      <FieldRow label="Status"><StatusBadge active={client.isActive} /></FieldRow>

      <SectionHeading title="Primary Contact" />
      <FieldRow label="Name" value={client.primaryContactName} />
      <FieldRow label="Email"><a href={`mailto:${client.email}`} className="text-primary underline text-[12px]">{client.email}</a></FieldRow>
      <FieldRow label="Phone" value={client.phone || '—'} />

      {client.notes && <><SectionHeading title="Notes" /><p className="text-[13px] font-body text-muted-foreground">{client.notes}</p></>}

      <p className="text-[11px] font-body text-muted-foreground italic mt-3 mb-6">This information is shared across all events.</p>

      {/* SECTION B: Contracts by Event */}
      <div className="border-l-4 border-primary pl-3 mb-3">
        <button onClick={() => setContractsOpen(o => !o)} className="flex items-center gap-2 w-full text-left">
          {contractsOpen ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
          <h3 className="font-body text-[14px] font-semibold text-foreground">Contracts by Event</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-primary/10 text-primary">{allContracts.length}</span>
        </button>
      </div>

      {contractsOpen && (
        <div className="space-y-4">
          {Object.keys(byEvent).length === 0 && (
            <p className="text-[12px] text-muted-foreground font-body italic">No contracts on file.</p>
          )}
          {Object.entries(byEvent).map(([eventId, group]) => (
            <div key={eventId}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-body text-[13px] font-semibold text-foreground">{group.eventName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${group.eventStatus === 'SELLING' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{group.eventStatus}</span>
                <span className="text-[11px] text-muted-foreground">{group.contracts.length} contract{group.contracts.length !== 1 ? 's' : ''}</span>
              </div>
              {group.contracts.map(c => (
                <div key={c.id} className="py-2 border-b border-border/50 ml-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] text-foreground">{c.contractRef}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${c.status === 'ACTIVE' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-body mt-0.5">
                    {c.contractType} · {c.validFrom} → {c.validTo} · Max: {ctx.formatCurrency(c.maxValue, c.currency)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={() => window.location.href = `/masters/clients/${client.id}`}
          className="px-4 py-2 rounded-xl text-[13px] font-body font-medium bg-primary/10 text-primary hover:bg-primary/20">
          View Full History →
        </button>
        <button onClick={() => { ctx.updateClient(client.id, { isActive: !client.isActive }); toast.success(`Client ${client.isActive ? 'deactivated' : 'activated'}`); onClose(); }}
          className={`px-4 py-2 rounded-xl text-[13px] font-body font-medium ${client.isActive ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-success/10 text-success hover:bg-success/20'}`}>
          {client.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

function ClientForm({ onClose }: { onClose: () => void }) {
  const { addClient } = useAppContext();
  const [form, setForm] = useState({ companyName: '', code: '', type: 'CORPORATE' as Client['type'], primaryContactName: '', email: '', phone: '', country: '', city: '', address: '', taxId: '', paymentTerms: 'Net 30', creditLimit: 0, notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const upd = (k: string, v: string | number) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => { const n = { ...p }; delete n[k]; return n; }); };

  const save = () => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = 'Required';
    if (!form.code.trim()) e.code = 'Required';
    if (!form.primaryContactName.trim()) e.primaryContactName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!form.country.trim()) e.country = 'Required';
    if (Object.keys(e).length) { setErrors(e); return; }
    addClient({ ...form, isActive: true, logoUrl: '' });
    toast.success(`Client "${form.companyName}" created`);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Company Name" required error={errors.companyName}><input className={inputCls} value={form.companyName} onChange={e => upd('companyName', e.target.value)} /></FormField>
        <FormField label="Client Code" required error={errors.code}><input className={inputCls} value={form.code} onChange={e => upd('code', e.target.value.toUpperCase())} /></FormField>
      </div>
      <FormField label="Type" required><select className={selectCls} value={form.type} onChange={e => upd('type', e.target.value)}><option value="CORPORATE">Corporate</option><option value="AGENCY">Agency</option><option value="INDIVIDUAL">Individual</option></select></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Primary Contact" required error={errors.primaryContactName}><input className={inputCls} value={form.primaryContactName} onChange={e => upd('primaryContactName', e.target.value)} /></FormField>
        <FormField label="Email" required error={errors.email}><input className={inputCls} type="email" value={form.email} onChange={e => upd('email', e.target.value)} /></FormField>
      </div>
      <FormField label="Phone"><input className={inputCls} value={form.phone} onChange={e => upd('phone', e.target.value)} /></FormField>
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Country" required error={errors.country}><input className={inputCls} value={form.country} onChange={e => upd('country', e.target.value)} /></FormField>
        <FormField label="City"><input className={inputCls} value={form.city} onChange={e => upd('city', e.target.value)} /></FormField>
        <FormField label="Tax ID"><input className={inputCls} value={form.taxId} onChange={e => upd('taxId', e.target.value)} /></FormField>
      </div>
      <FormField label="Address"><input className={inputCls} value={form.address} onChange={e => upd('address', e.target.value)} /></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Payment Terms"><input className={inputCls} value={form.paymentTerms} onChange={e => upd('paymentTerms', e.target.value)} /></FormField>
        <FormField label="Credit Limit (AED)"><input className={inputCls} type="number" value={form.creditLimit || ''} onChange={e => upd('creditLimit', Number(e.target.value))} /></FormField>
      </div>
      <FormField label="Notes"><textarea className={textareaCls} rows={3} value={form.notes} onChange={e => upd('notes', e.target.value)} /></FormField>
      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-body text-muted-foreground hover:text-foreground">Cancel</button>
        <button onClick={save} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90">Save Client</button>
      </div>
    </div>
  );
}
