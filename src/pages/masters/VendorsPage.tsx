import { useState } from 'react';
import { useAppContext, type Vendor, type VendorEventBridge } from '@/context/AppContext';
import MasterPage, { FieldRow, SectionHeading, StatusBadge, TypeBadge, FormField, inputCls, selectCls, textareaCls, type ColumnDef, type FilterDef } from '@/components/MasterPage';
import { toast } from 'sonner';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  MARKETPLACE: { bg: 'bg-accent/20', text: 'text-accent-foreground' },
  DIRECT: { bg: 'bg-success/15', text: 'text-success' },
  AGENCY: { bg: 'bg-warning/15', text: 'text-warning' },
};

const FILTERS: FilterDef[] = [
  { id: 'type', label: 'Type', options: [{ value: 'MARKETPLACE', label: 'Marketplace' }, { value: 'DIRECT', label: 'Direct' }, { value: 'AGENCY', label: 'Agency' }] },
];

function InitialsCircle({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || name.slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold font-body text-primary shrink-0">
      {initials}
    </div>
  );
}

export default function VendorsPage() {
  const ctx = useAppContext();

  const columns: ColumnDef<Vendor>[] = [
    { key: 'name', header: 'Vendor', render: v => (
      <div className="flex items-center gap-3">
        <InitialsCircle name={v.name} />
        <div><div className="font-medium">{v.name}</div><div className="text-[11px] text-muted-foreground font-mono">{v.code}</div></div>
      </div>
    )},
    { key: 'type', header: 'Type', render: v => <TypeBadge type={v.type} colorMap={TYPE_COLORS} /> },
    { key: 'country', header: 'Country', render: v => v.country },
    { key: 'contact', header: 'Primary Contact', render: v => (
      <div><div>{v.primaryContactName}</div><div className="text-[11px] text-muted-foreground">{v.primaryContactEmail}</div></div>
    )},
    { key: 'events', header: 'Events', render: v => {
      const bridges = ctx.vendorEventBridges.filter(b => b.vendorId === v.id && b.isActive);
      return <span className="text-[12px]">{bridges.length} event{bridges.length !== 1 ? 's' : ''}</span>;
    }},
    { key: 'active', header: 'Status', render: v => <StatusBadge active={v.isActive} />, width: '100px' },
  ];

  const renderDrawer = (vendor: Vendor, onClose: () => void) => {
    const bridges = ctx.vendorEventBridges.filter(b => b.vendorId === vendor.id);
    return (
      <div>
        <SectionHeading title="Vendor Details" />
        <FieldRow label="Name" value={vendor.name} />
        <FieldRow label="Code" value={vendor.code} />
        <FieldRow label="Type"><TypeBadge type={vendor.type} colorMap={TYPE_COLORS} /></FieldRow>
        <FieldRow label="Website">{vendor.website ? <a href={`https://${vendor.website}`} target="_blank" rel="noreferrer" className="text-primary underline">{vendor.website}</a> : '—'}</FieldRow>
        <FieldRow label="Country" value={vendor.country} />
        <FieldRow label="Status"><StatusBadge active={vendor.isActive} /></FieldRow>

        <SectionHeading title="Primary Contact" />
        <FieldRow label="Name" value={vendor.primaryContactName} />
        <FieldRow label="Email"><a href={`mailto:${vendor.primaryContactEmail}`} className="text-primary underline">{vendor.primaryContactEmail}</a></FieldRow>
        <FieldRow label="Phone" value={vendor.primaryContactPhone || '—'} />

        {vendor.notes && <>
          <SectionHeading title="Notes" />
          <p className="text-[13px] font-body text-muted-foreground">{vendor.notes}</p>
        </>}

        <SectionHeading title="Event Assignments" count={bridges.length} />
        {bridges.length === 0 ? (
          <p className="text-[12px] text-muted-foreground font-body">Not assigned to any events.</p>
        ) : bridges.map(b => {
          const ev = ctx.getEvent(b.eventId);
          return (
            <div key={b.id} className="py-2 border-b border-border/50">
              <div className="font-body text-[13px] font-medium text-foreground">{ev?.name ?? b.eventId}</div>
              <div className="text-[11px] text-muted-foreground font-body mt-0.5">Login: {b.loginEmail ? '••••••' : '—'} · {b.platformUrl || 'No platform URL'}</div>
            </div>
          );
        })}

        <div className="mt-6 flex gap-3">
          <button onClick={() => { ctx.updateVendor(vendor.id, { isActive: !vendor.isActive }); toast.success(`Vendor ${vendor.isActive ? 'deactivated' : 'activated'}`); onClose(); }}
            className={`px-4 py-2 rounded-xl text-[13px] font-body font-medium ${vendor.isActive ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-success/10 text-success hover:bg-success/20'}`}>
            {vendor.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    );
  };

  const renderCreate = (onClose: () => void) => <VendorForm onClose={onClose} />;

  return (
    <MasterPage<Vendor>
      title="Vendors"
      entityName="Vendor"
      data={ctx.vendors}
      columns={columns}
      filters={FILTERS}
      searchFields={v => `${v.name} ${v.code} ${v.country} ${v.primaryContactName} ${v.primaryContactEmail}`}
      getId={v => v.id}
      getIsActive={v => v.isActive}
      renderDrawer={renderDrawer}
      renderCreateModal={renderCreate}
      writeRoles={['super_admin', 'event_admin', 'ops_manager']}
    />
  );
}

function VendorForm({ onClose }: { onClose: () => void }) {
  const { addVendor } = useAppContext();
  const [form, setForm] = useState({ name: '', code: '', type: 'MARKETPLACE' as Vendor['type'], website: '', primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '', country: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const upd = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => { const n = { ...p }; delete n[k]; return n; }); };

  const save = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.code.trim()) e.code = 'Required';
    if (!form.primaryContactName.trim()) e.primaryContactName = 'Required';
    if (!form.primaryContactEmail.trim()) e.primaryContactEmail = 'Required';
    if (Object.keys(e).length) { setErrors(e); return; }
    addVendor({ ...form, isActive: true, logoUrl: '' });
    toast.success(`Vendor "${form.name}" created`);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Vendor Name" required error={errors.name}><input className={inputCls} value={form.name} onChange={e => upd('name', e.target.value)} placeholder="e.g. StubHub" /></FormField>
        <FormField label="Vendor Code" required error={errors.code}><input className={inputCls} value={form.code} onChange={e => upd('code', e.target.value.toUpperCase())} placeholder="e.g. STUBHUB" /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Type" required><select className={selectCls} value={form.type} onChange={e => upd('type', e.target.value)}><option value="MARKETPLACE">Marketplace</option><option value="DIRECT">Direct</option><option value="AGENCY">Agency</option></select></FormField>
        <FormField label="Country"><input className={inputCls} value={form.country} onChange={e => upd('country', e.target.value)} placeholder="e.g. France" /></FormField>
      </div>
      <FormField label="Website"><input className={inputCls} value={form.website} onChange={e => upd('website', e.target.value)} placeholder="e.g. stubhub.com" /></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Primary Contact Name" required error={errors.primaryContactName}><input className={inputCls} value={form.primaryContactName} onChange={e => upd('primaryContactName', e.target.value)} /></FormField>
        <FormField label="Email" required error={errors.primaryContactEmail}><input className={inputCls} type="email" value={form.primaryContactEmail} onChange={e => upd('primaryContactEmail', e.target.value)} /></FormField>
      </div>
      <FormField label="Phone"><input className={inputCls} value={form.primaryContactPhone} onChange={e => upd('primaryContactPhone', e.target.value)} /></FormField>
      <FormField label="Notes"><textarea className={textareaCls} rows={3} value={form.notes} onChange={e => upd('notes', e.target.value)} /></FormField>
      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-body text-muted-foreground hover:text-foreground">Cancel</button>
        <button onClick={save} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90">Save Vendor</button>
      </div>
    </div>
  );
}
