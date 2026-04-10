import { useState } from 'react';
import { useAppContext, type Vendor, type VendorEventBridge } from '@/context/AppContext';
import MasterPage, { FieldRow, SectionHeading, StatusBadge, TypeBadge, FormField, inputCls, selectCls, textareaCls, type ColumnDef, type FilterDef } from '@/components/MasterPage';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, AlertTriangle, ExternalLink, Trash2, Pencil } from 'lucide-react';
import { MOCK_PURCHASES } from '@/data/mockData';
import { VendorCredentialsTab } from '@/pages/VendorCredentialsPage';

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
    { key: 'events', header: 'Event Assignments', render: v => {
      const bridges = ctx.vendorEventBridges.filter(b => b.vendorId === v.id && b.isActive);
      if (bridges.length === 0) {
        return (
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground italic">
            <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
            Not assigned to any event
          </span>
        );
      }
      const eventCodes = bridges.map(b => ctx.getEvent(b.eventId)?.code ?? '?').filter(Boolean);
      const shown = eventCodes.slice(0, 3);
      const extra = eventCodes.length - 3;
      return (
        <div className="flex items-center gap-1 flex-wrap">
          {shown.map((code, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-primary/10 text-primary">{code}</span>
          ))}
          {extra > 0 && <span className="text-[11px] text-muted-foreground">+ {extra} more</span>}
        </div>
      );
    }},
    { key: 'active', header: 'Status', render: v => <StatusBadge active={v.isActive} />, width: '100px' },
  ];

  const renderDrawer = (vendor: Vendor, onClose: () => void) => (
    <VendorDrawer vendor={vendor} onClose={onClose} />
  );

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
      headerNote="Vendors exist globally. They must be assigned to each event with event-specific login credentials before appearing in purchase forms."
    />
  );
}

/* ── Vendor Detail Drawer ── */
function VendorDrawer({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const ctx = useAppContext();
  const bridges = ctx.vendorEventBridges.filter(b => b.vendorId === vendor.id);
  const [assignOpen, setAssignOpen] = useState(false);
  const [eventAssignmentsOpen, setEventAssignmentsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials'>('profile');
  const credCount = ctx.getCredentialsForVendor(vendor.id).length;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-border">
        <button onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-[13px] font-body font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          Profile
        </button>
        <button onClick={() => setActiveTab('credentials')}
          className={`px-4 py-2 text-[13px] font-body font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'credentials' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          Credentials
          {credCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">{credCount}</span>}
        </button>
      </div>

      {activeTab === 'profile' ? (
        <>
          {/* SECTION A: Global Vendor Profile */}
          <div className="border-l-4 border-accent pl-3 mb-4">
            <h3 className="font-body text-[14px] font-semibold text-foreground">Global Vendor Profile</h3>
          </div>
          <FieldRow label="Name" value={vendor.name} />
          <FieldRow label="Code" value={vendor.code} />
          <FieldRow label="Type"><TypeBadge type={vendor.type} colorMap={TYPE_COLORS} /></FieldRow>
          <FieldRow label="Website">{vendor.website ? <a href={`https://${vendor.website}`} target="_blank" rel="noreferrer" className="text-primary underline text-[12px] inline-flex items-center gap-1">{vendor.website} <ExternalLink size={10} /></a> : '—'}</FieldRow>
          <FieldRow label="Country" value={vendor.country} />
          <FieldRow label="Status"><StatusBadge active={vendor.isActive} /></FieldRow>

          <SectionHeading title="Primary Contact" />
          <FieldRow label="Name" value={vendor.primaryContactName} />
          <FieldRow label="Email"><a href={`mailto:${vendor.primaryContactEmail}`} className="text-primary underline text-[12px]">{vendor.primaryContactEmail}</a></FieldRow>
          <FieldRow label="Phone" value={vendor.primaryContactPhone || '—'} />

          {vendor.notes && <><SectionHeading title="Notes" /><p className="text-[13px] font-body text-muted-foreground">{vendor.notes}</p></>}

          <p className="text-[11px] font-body text-muted-foreground italic mt-3 mb-6">This information is shared across all events.</p>

          {/* SECTION B: Event Assignments */}
          <div className="border-l-4 border-primary pl-3 mb-3">
            <button onClick={() => setEventAssignmentsOpen(o => !o)} className="flex items-center gap-2 w-full text-left">
              {eventAssignmentsOpen ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
              <h3 className="font-body text-[14px] font-semibold text-foreground">Event Assignments</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-primary/10 text-primary">{bridges.length} event{bridges.length !== 1 ? 's' : ''}</span>
            </button>
          </div>

          {eventAssignmentsOpen && (
            <div className="space-y-3">
              {bridges.length === 0 && (
                <p className="text-[12px] text-muted-foreground font-body italic">Not assigned to any events yet.</p>
              )}
              {bridges.map(b => (
                <EventAssignmentCard key={b.id} bridge={b} vendorId={vendor.id} />
              ))}

              {!assignOpen ? (
                <button onClick={() => setAssignOpen(true)}
                  className="w-full py-2 rounded-xl border border-dashed border-border text-[13px] font-body text-muted-foreground hover:bg-muted/50 transition-colors">
                  + Assign to New Event
                </button>
              ) : (
                <AssignToEventForm vendorId={vendor.id} assignedEventIds={bridges.map(b => b.eventId)} onDone={() => setAssignOpen(false)} />
              )}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button onClick={() => { ctx.updateVendor(vendor.id, { isActive: !vendor.isActive }); toast.success(`Vendor ${vendor.isActive ? 'deactivated' : 'activated'}`); onClose(); }}
              className={`px-4 py-2 rounded-xl text-[13px] font-body font-medium ${vendor.isActive ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-success/10 text-success hover:bg-success/20'}`}>
              {vendor.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </>
      ) : (
        <VendorCredentialsTab vendorId={vendor.id} />
      )}
    </div>
  );
}

/* ── Event Assignment Card ── */
function EventAssignmentCard({ bridge, vendorId }: { bridge: VendorEventBridge; vendorId: string }) {
  const ctx = useAppContext();
  const ev = ctx.getEvent(bridge.eventId);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [form, setForm] = useState({
    platformUrl: bridge.platformUrl,
    loginEmail: bridge.loginEmail,
    credentialHint: bridge.credentialHint,
    primaryContactForEvent: bridge.primaryContactForEvent,
    notes: bridge.notes,
  });
  const [justAdded] = useState(() => Date.now() - parseInt(bridge.id.replace('veb-', '')) < 5000);

  const activePurchaseCount = MOCK_PURCHASES.filter(p => p.vendor === ctx.getVendor(vendorId)?.name).length;

  const handleSave = () => {
    ctx.setVendorEventBridge({ ...bridge, ...form });
    toast.success('Event assignment updated');
    setEditing(false);
  };

  const handleRemove = () => {
    ctx.vendorEventBridges.splice(ctx.vendorEventBridges.indexOf(bridge), 1);
    toast.success('Vendor removed from event', { action: { label: 'Undo', onClick: () => ctx.setVendorEventBridge(bridge) } });
    setRemoving(false);
  };

  const statusColors: Record<string, string> = {
    SELLING: 'bg-success/15 text-success', PLANNING: 'bg-muted text-muted-foreground',
    BUYING: 'bg-indigo-100 text-indigo-700', CLOSED: 'bg-primary/10 text-primary',
    ARCHIVED: 'bg-muted text-muted-foreground', DRAFT: 'bg-muted text-muted-foreground',
    ALLOCATING: 'bg-amber-100 text-amber-700', DISPATCHING: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-body text-[13px] font-medium text-foreground">{ev?.name ?? bridge.eventId}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${statusColors[ev?.status ?? ''] ?? 'bg-muted text-muted-foreground'}`}>
            {ev?.status ?? '—'}
          </span>
          {justAdded && <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-accent/20 text-accent">Just added</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(!editing)} className="p-1 rounded hover:bg-muted"><Pencil size={12} className="text-muted-foreground" /></button>
          <button onClick={() => setRemoving(true)} className="p-1 rounded hover:bg-destructive/10"><Trash2 size={12} className="text-destructive" /></button>
        </div>
      </div>

      {removing && (
        <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 space-y-2">
          {activePurchaseCount > 0 && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
              <p className="text-[12px] font-body text-warning">This vendor has {activePurchaseCount} active purchase{activePurchaseCount !== 1 ? 's' : ''} in {ev?.name}. Remove assignment anyway?</p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handleRemove} className="px-3 py-1.5 rounded-lg text-[12px] font-body font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove Assignment</button>
            <button onClick={() => setRemoving(false)} className="px-3 py-1.5 rounded-lg text-[12px] font-body text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {!editing ? (
        <div className="space-y-1 text-[12px] font-body text-muted-foreground">
          <p>Platform: {form.platformUrl ? <a href={`https://${form.platformUrl}`} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-0.5">{form.platformUrl} <ExternalLink size={9} /></a> : '—'}</p>
          <p>Login: {form.loginEmail || '—'}</p>
          {form.credentialHint && <p>Hint: {form.credentialHint}</p>}
          {form.primaryContactForEvent && <p>Contact: {form.primaryContactForEvent}</p>}
          {form.notes && <p>Notes: {form.notes}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <div><label className="text-[11px] font-body text-muted-foreground">Platform URL</label><input className={inputCls} value={form.platformUrl} onChange={e => setForm(f => ({ ...f, platformUrl: e.target.value }))} /></div>
          <div><label className="text-[11px] font-body text-muted-foreground">Login Email</label><input className={inputCls} value={form.loginEmail} onChange={e => setForm(f => ({ ...f, loginEmail: e.target.value }))} /></div>
          <div><label className="text-[11px] font-body text-muted-foreground">Credential Hint</label><input className={inputCls} value={form.credentialHint} onChange={e => setForm(f => ({ ...f, credentialHint: e.target.value }))} /></div>
          <div><label className="text-[11px] font-body text-muted-foreground">Contact for Event</label><input className={inputCls} value={form.primaryContactForEvent} onChange={e => setForm(f => ({ ...f, primaryContactForEvent: e.target.value }))} /></div>
          <div><label className="text-[11px] font-body text-muted-foreground">Notes</label><textarea className={textareaCls} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-3 py-1.5 rounded-lg text-[12px] font-body font-medium bg-primary text-primary-foreground hover:opacity-90">Save</button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-[12px] font-body text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Assign to Event Form ── */
function AssignToEventForm({ vendorId, assignedEventIds, onDone }: { vendorId: string; assignedEventIds: string[]; onDone: () => void }) {
  const ctx = useAppContext();
  const available = ctx.events.filter(e => e.status !== 'ARCHIVED' && !assignedEventIds.includes(e.id));
  const [eventId, setEventId] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [credentialHint, setCredentialHint] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!eventId) { toast.error('Select an event'); return; }
    if (!platformUrl.trim()) { toast.error('Platform URL is required'); return; }
    if (!loginEmail.trim()) { toast.error('Login email is required'); return; }
    ctx.setVendorEventBridge({
      id: `veb-${Date.now()}`, vendorId, eventId,
      platformUrl, loginEmail, credentialHint,
      primaryContactForEvent: contact, notes, isActive: true,
    });
    toast.success('Vendor assigned to event');
    onDone();
  };

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
      <p className="font-body text-[13px] font-medium text-foreground">Assign to New Event</p>
      <div>
        <label className="text-[11px] font-body text-muted-foreground">Event *</label>
        <select className={selectCls} value={eventId} onChange={e => setEventId(e.target.value)}>
          <option value="">Select event...</option>
          {available.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[11px] font-body text-muted-foreground">Platform URL *</label><input className={inputCls} value={platformUrl} onChange={e => setPlatformUrl(e.target.value)} placeholder="seatwave.com" /></div>
        <div><label className="text-[11px] font-body text-muted-foreground">Login Email *</label><input className={inputCls} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="user@platform.com" /></div>
      </div>
      <div><label className="text-[11px] font-body text-muted-foreground">Credential Hint</label><input className={inputCls} value={credentialHint} onChange={e => setCredentialHint(e.target.value)} placeholder="Password format: [name].WC#[year]" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[11px] font-body text-muted-foreground">Contact</label><input className={inputCls} value={contact} onChange={e => setContact(e.target.value)} /></div>
        <div><label className="text-[11px] font-body text-muted-foreground">Notes</label><input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} /></div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="px-4 py-2 rounded-xl text-[12px] font-body font-medium bg-primary text-primary-foreground hover:opacity-90">Save Assignment</button>
        <button onClick={onDone} className="px-3 py-2 rounded-xl text-[12px] font-body text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
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
        <FormField label="Vendor Name" required error={errors.name}><input className={inputCls} value={form.name} onChange={e => upd('name', e.target.value)} placeholder="e.g. FanPass" /></FormField>
        <FormField label="Vendor Code" required error={errors.code}><input className={inputCls} value={form.code} onChange={e => upd('code', e.target.value.toUpperCase())} placeholder="e.g. FANPASS" /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Type" required><select className={selectCls} value={form.type} onChange={e => upd('type', e.target.value)}><option value="MARKETPLACE">Marketplace</option><option value="DIRECT">Direct</option><option value="AGENCY">Agency</option></select></FormField>
        <FormField label="Country"><input className={inputCls} value={form.country} onChange={e => upd('country', e.target.value)} placeholder="e.g. France" /></FormField>
      </div>
      <FormField label="Website"><input className={inputCls} value={form.website} onChange={e => upd('website', e.target.value)} placeholder="e.g. fanpass.com" /></FormField>
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
