import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext, type Organisation, type SystemSettings, type Currency, type NotificationTemplate } from '@/context/AppContext';
import { MOCK_USERS, MOCK_PURCHASES, MOCK_SALES, MOCK_UNITS } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Calendar, ShieldCheck, Bell, GitBranch, Globe,
  DollarSign, FileSearch, Plug, Server, Lock, ChevronDown, ChevronRight,
  Check, Send, Plus, X,
} from 'lucide-react';

/* ── Nav Sections ── */
const SECTIONS = [
  { id: 'org', label: 'Organisation Profile', icon: Building2 },
  { id: 'event-defaults', label: 'Event Defaults', icon: Calendar },
  { id: 'rbac', label: 'RBAC & Permissions', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'allocation', label: 'Allocation Rules', icon: GitBranch },
  { id: 'portal', label: 'Portal Settings', icon: Globe },
  { id: 'currency', label: 'Currency & Pricing', icon: DollarSign },
  { id: 'audit', label: 'Audit & Compliance', icon: FileSearch },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'system', label: 'System Info', icon: Server },
] as const;

/* ── Helpers ── */
const labelCls = "block font-body text-xs font-medium text-foreground mb-1.5";
const helperCls = "font-body text-xs mt-1 text-muted-foreground";
const inputCls = "w-full h-10 px-3 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-accent bg-card";
const cardCls = "bg-card rounded-xl shadow-sm border border-border p-6";

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button onClick={() => !disabled && onChange(!value)} disabled={disabled}
      className={`w-10 h-5 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-muted'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SECTION 1: Organisation Profile                           */
/* ────────────────────────────────────────────────────────── */
function OrgSection() {
  const ctx = useAppContext();
  const [f, setF] = useState<Organisation>({ ...ctx.organisation });
  const set = (k: keyof Organisation, v: any) => setF(p => ({ ...p, [k]: v }));
  const save = () => { ctx.updateOrganisation(f); toast.success('Organisation profile updated'); };

  return (
    <div>
      <h2 className="font-display text-[22px] text-primary">Organisation Profile</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">Company details, branding, and contact information.</p>
      <div className="border-b border-border mb-6" />

      <div className="space-y-5">
        <div className="flex items-start gap-4">
          {f.logoUrl ? (
            <img src={f.logoUrl} className="w-[60px] h-[60px] rounded-xl object-cover border border-border" />
          ) : (
            <div className="w-[60px] h-[60px] rounded-xl bg-primary flex items-center justify-center">
              <span className="font-display text-xl text-primary-foreground">T</span>
            </div>
          )}
          <div className="flex-1">
            <label className={labelCls}>Logo URL</label>
            <Input value={f.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Company Name *</label><Input value={f.name} onChange={e => set('name', e.target.value)} /></div>
          <div><label className={labelCls}>Website</label><Input value={f.website} onChange={e => set('website', e.target.value)} /></div>
        </div>

        <div><label className={labelCls}>Address</label>
          <textarea value={f.address} onChange={e => set('address', e.target.value)} rows={2}
            className="w-full px-3 py-2 rounded-lg font-body text-sm border border-border outline-none focus:ring-1 focus:ring-accent bg-card resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Timezone *</label><Input value={f.timezone} onChange={e => set('timezone', e.target.value)} /></div>
          <div>
            <label className={labelCls}>Default Currency *</label>
            <select value={f.defaultCurrency} onChange={e => set('defaultCurrency', e.target.value)} className={inputCls}>
              {ctx.currencies.filter(c => c.isActive).map(c => <option key={c.id} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Contact Email *</label><Input type="email" value={f.contactEmail} onChange={e => set('contactEmail', e.target.value)} /></div>
          <div><label className={labelCls}>Support Email *</label><Input type="email" value={f.supportEmail} onChange={e => set('supportEmail', e.target.value)} /></div>
        </div>

        <div>
          <label className={labelCls}>Fiscal Year Start Month</label>
          <select value={f.fiscalYearStart} onChange={e => set('fiscalYearStart', +e.target.value)} className={inputCls}>
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-6"><Button onClick={save}>Save Changes</Button></div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SECTION 2: Event Defaults                                 */
/* ────────────────────────────────────────────────────────── */
function EventDefaultsSection() {
  const ctx = useAppContext();
  const [f, setF] = useState<SystemSettings>({ ...ctx.settings });
  const set = (k: keyof SystemSettings, v: any) => setF(p => ({ ...p, [k]: v }));
  const save = () => { ctx.updateSettings(f); toast.success('Event defaults updated'); };

  return (
    <div>
      <h2 className="font-display text-[22px] text-primary">Event Defaults</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">These defaults are applied when creating new events. Individual events can override these values in their own settings.</p>
      <div className="border-b border-border mb-6" />

      <div className="space-y-5">
        <div>
          <label className={labelCls}>Dispatch Buffer Hours *</label>
          <Input type="number" min={1} max={168} value={f.defaultDispatchBufferHours} onChange={e => set('defaultDispatchBufferHours', +e.target.value)} className="max-w-[200px]" />
          <p className={helperCls}>Dispatch deadline = match date/time minus this number of hours</p>
        </div>
        <div>
          <label className={labelCls}>Portal Token Expiry Days *</label>
          <Input type="number" min={1} max={90} value={f.defaultPortalTokenExpiryDays} onChange={e => set('defaultPortalTokenExpiryDays', +e.target.value)} className="max-w-[200px]" />
          <p className={helperCls}>Client portal links expire after this many days</p>
        </div>
        <div className="flex items-center gap-4">
          <Toggle value={f.defaultAllowOversell} onChange={v => set('defaultAllowOversell', v)} />
          <div>
            <span className="font-body text-sm text-foreground">Allow oversell by default on new events</span>
            <p className={helperCls}>When ON: oversell triggers approval request. When OFF: hard block.</p>
          </div>
        </div>
        <div>
          <label className={labelCls}>Portal Reminder Timing (hours) *</label>
          <Input type="number" min={1} value={f.portalReminderHours} onChange={e => set('portalReminderHours', +e.target.value)} className="max-w-[200px]" />
          <p className={helperCls}>Send reminder email to client if portal not submitted within X hours</p>
        </div>
        <div>
          <label className={labelCls}>Default Currency *</label>
          <select value={f.defaultCurrency} onChange={e => set('defaultCurrency', e.target.value)} className={`${inputCls} max-w-[240px]`}>
            {ctx.currencies.filter(c => c.isActive).map(c => <option key={c.id} value={c.code}>{c.code} — {c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end mt-6"><Button onClick={save}>Save Changes</Button></div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SECTION 3: RBAC & Permissions                             */
/* ────────────────────────────────────────────────────────── */
const ROLES_INFO = [
  { role: 'super_admin', name: 'Super Admin', color: 'bg-red-100 text-red-700', desc: 'Full system access. Can manage all settings, users, events and data. The only role that can modify system-level configuration and create event_admin users.', perms: ['All Settings', 'User Management', 'All Events', 'All Data', 'System Config'] },
  { role: 'event_admin', name: 'Event Admin', color: 'bg-purple-100 text-purple-700', desc: 'Manages specific events end-to-end. Can configure event settings, assign vendors, manage contracts and oversee all operations for their events.', perms: ['Event Settings', 'Vendor Assignment', 'Contracts', 'Reports', 'User Oversight'] },
  { role: 'ops_manager', name: 'Operations Manager', color: 'bg-blue-100 text-blue-700', desc: 'Oversees day-to-day operations. Approves oversells, reviews allocations, manages vendors and clients. Cannot modify system settings.', perms: ['Approve Oversells', 'Manage Vendors', 'Manage Clients', 'Reports', 'Master Data'] },
  { role: 'sr_operator', name: 'Senior Operator', color: 'bg-teal-100 text-teal-700', desc: 'Handles purchases, sales and allocations. Can create and manage transactions but cannot approve oversells or modify master data.', perms: ['Purchases', 'Sales', 'Allocations', 'Distribution', 'Read Master Data'] },
  { role: 'operator', name: 'Operator', color: 'bg-amber-100 text-amber-700', desc: 'Creates purchases and sales entries. Cannot allocate tickets or access distribution. Limited to transaction entry.', perms: ['Create Purchases', 'Create Sales', 'View Events', 'Dashboard'] },
  { role: 'staff', name: 'Staff', color: 'bg-gray-100 text-gray-700', desc: 'Handles ticket dispatch from the Staff Queue. Cannot access purchases, sales or distribution pages directly.', perms: ['Staff Queue', 'Dispatch Tickets', 'Dashboard'] },
];

function RBACSection() {
  const [showMatrix, setShowMatrix] = useState(false);
  return (
    <div>
      <h2 className="font-display text-[22px] text-primary">RBAC & Permissions</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">Overview of role hierarchy and permissions. Contact HelloPixels to modify role definitions.</p>
      <div className="border-b border-border mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {ROLES_INFO.map(r => (
          <div key={r.role} className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full font-body text-[11px] font-medium ${r.color}`}>{r.name}</span>
            </div>
            <p className="font-body text-xs text-muted-foreground mb-3">{r.desc}</p>
            <div className="flex flex-wrap gap-1">
              {r.perms.map(p => (
                <span key={p} className="px-2 py-0.5 rounded bg-muted font-body text-[10px] text-muted-foreground">{p}</span>
              ))}
            </div>
            <p className="font-body text-[10px] text-muted-foreground mt-2">Assigned by: {r.role === 'super_admin' ? 'System' : 'super_admin / event_admin'}</p>
          </div>
        ))}
      </div>

      <button onClick={() => setShowMatrix(!showMatrix)} className="flex items-center gap-2 font-body text-sm font-medium text-accent hover:underline">
        {showMatrix ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {showMatrix ? 'Hide' : 'View'} Full Permission Matrix
      </button>
      <AnimatePresence>
        {showMatrix && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body">
                <thead><tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-2 text-left">Permission</th>
                  {ROLES_INFO.map(r => <th key={r.role} className="px-2 py-2 text-center">{r.name}</th>)}
                </tr></thead>
                <tbody>
                  {['View Dashboard','View Events','Create Events','Edit Events','View Purchases','Create Purchases','Edit Purchases','Cancel Purchases',
                    'View Sales','Create Sales','Edit Sales','Cancel Sales','Approve Oversell','View Distribution','Allocate Tickets','View Staff Queue',
                    'Dispatch Tickets','View Reports','Export Reports','View Master Data','Edit Master Data','View Users','Manage Users',
                    'View Settings','Edit Settings','View Audit Logs','Manage Integrations'].map((perm, i) => {
                    const matrix = [
                      ['Full','Full','Full','Full','Full','Read'],
                      ['Full','Full','Full','Full','Read','—'],
                      ['Full','Full','—','—','—','—'],
                      ['Full','Full','Full','Read','—','—'],
                      ['Full','Full','Full','Full','—','—'],
                      ['Full','Full','Full','Full','—','—'],
                      ['Full','Full','Full','Full','—','—'],
                      ['Full','Full','Full','—','—','—'],
                      ['Full','Full','Full','Full','—','—'],
                      ['Full','Full','Full','Full','—','—'],
                      ['Full','Full','Full','Full','—','—'],
                      ['Full','Full','Full','—','—','—'],
                      ['Full','Full','Approve','—','—','—'],
                      ['Full','Full','Full','Full','—','—'],
                      ['Full','Full','Full','—','—','—'],
                      ['Full','Full','Full','Full','—','Full'],
                      ['Full','Full','Full','Full','—','Full'],
                      ['Full','Full','Full','Full','—','—'],
                      ['Full','Full','Full','—','—','—'],
                      ['Full','Full','Full','Read','—','—'],
                      ['Full','Full','Full','—','—','—'],
                      ['Full','Full','—','—','—','—'],
                      ['Full','Full','—','—','—','—'],
                      ['Full','Full','—','—','—','—'],
                      ['Full','—','—','—','—','—'],
                      ['Full','Full','Read','—','—','—'],
                      ['Full','—','—','—','—','—'],
                    ];
                    return (
                      <tr key={perm} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                        <td className="px-3 py-1.5 font-medium text-foreground">{perm}</td>
                        {matrix[i]?.map((v, j) => (
                          <td key={j} className={`px-2 py-1.5 text-center ${v === 'Full' ? 'text-emerald-600' : v === '—' ? 'text-muted-foreground' : 'text-amber-600'}`}>{v}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SECTION 4: Notifications                                  */
/* ────────────────────────────────────────────────────────── */
function NotificationsSection() {
  const ctx = useAppContext();
  const navigate = useNavigate();

  const CHANNEL_COLORS: Record<string, string> = { email: 'bg-blue-100 text-blue-700', in_app: 'bg-emerald-100 text-emerald-700', whatsapp: 'bg-green-100 text-green-700', slack: 'bg-purple-100 text-purple-700' };

  return (
    <div>
      <h2 className="font-display text-[22px] text-primary">Notifications</h2>
      <p className="font-body text-sm text-muted-foreground mb-4">
        Quick overview of notification templates. For full management, use the dedicated admin screen.
      </p>
      <Button size="sm" variant="outline" className="mb-6" onClick={() => navigate('/admin/notifications')}>
        <Bell size={14} className="mr-1.5" /> Open Notification Templates
      </Button>
      <div className="border-b border-border mb-6" />

      <div className="space-y-3">
        {ctx.notificationTemplates.map(t => (
          <div key={t.id} className="border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-[15px] font-bold text-foreground">{t.name}</span>
              <Toggle value={t.active} onChange={v => ctx.updateNotificationTemplate(t.id, { active: v })} />
            </div>
            <div className="flex gap-1.5 mb-2">
              {t.channels.map(ch => <span key={ch} className={`px-2 py-0.5 rounded-full font-body text-[10px] font-medium ${CHANNEL_COLORS[ch] ?? 'bg-muted text-muted-foreground'}`}>{ch}</span>)}
            </div>
            <p className="font-body text-xs text-muted-foreground">
              {ctx.getTriggersForTemplate(t.id).length} trigger(s)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SECTION 5: Allocation Rules                               */
/* ────────────────────────────────────────────────────────── */
function AllocationSection() {
  const ctx = useAppContext();
  const [f, setF] = useState({ ...ctx.settings });
  const set = (k: keyof SystemSettings, v: any) => setF(p => ({ ...p, [k]: v }));
  const save = () => { ctx.updateSettings(f); toast.success('Allocation rules updated'); };

  return (
    <div>
      <h2 className="font-display text-[22px] text-primary">Allocation Rules</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">Default allocation strategy and oversell rules.</p>
      <div className="border-b border-border mb-6" />

      <div className="space-y-6">
        <div>
          <label className={labelCls}>Default Allocation Strategy *</label>
          <div className="space-y-2 mt-2">
            {([
              ['CONSECUTIVE', 'Consecutive', 'Allocate in SetPos order (1,2,3...). Keeps seat blocks together.'],
              ['BEST_FIT', 'Best Fit', 'Find the smallest available block that fits the quantity.'],
              ['MANUAL', 'Manual', 'Always require manual unit selection. Auto-suggest disabled.'],
            ] as const).map(([val, label, desc]) => (
              <label key={val} className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50">
                <input type="radio" name="strategy" checked={f.defaultAllocationStrategy === val}
                  onChange={() => set('defaultAllocationStrategy', val)} className="mt-1" />
                <div>
                  <span className="font-body text-sm font-medium text-foreground">{label}</span>
                  <p className={helperCls}>{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Toggle value={f.autoSuggestAllocation} onChange={v => set('autoSuggestAllocation', v)} />
          <span className="font-body text-sm text-foreground">Automatically highlight the best matching vendor block in the Allocator</span>
        </div>

        <div>
          <label className={labelCls}>Oversell Handling *</label>
          <div className="space-y-2 mt-2">
            {([
              [false, 'Require Approval', 'Oversell triggers approval request. Sale saved as PENDING.'],
              [true, 'Hard Block', 'Oversell is not possible. Form submission blocked.'],
            ] as const).map(([isBlock, label, desc]) => (
              <label key={label} className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50">
                <input type="radio" name="oversell"
                  checked={isBlock ? !f.defaultAllowOversell : f.defaultAllowOversell}
                  onChange={() => set('defaultAllowOversell', !isBlock)} className="mt-1" />
                <div>
                  <span className="font-body text-sm font-medium text-foreground">{label}</span>
                  <p className={helperCls}>{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Price Change Approval Threshold (%)</label>
          <Input type="number" min={0} max={100} value={f.priceChangeApprovalThreshold}
            onChange={e => set('priceChangeApprovalThreshold', +e.target.value)} className="max-w-[200px]" />
          <p className={helperCls}>Price changes above this % require Operations Manager approval. 0 = all changes need approval.</p>
        </div>
      </div>
      <div className="flex justify-end mt-6"><Button onClick={save}>Save Changes</Button></div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SECTION 6: Portal Settings                                */
/* ────────────────────────────────────────────────────────── */
function PortalSection() {
  const ctx = useAppContext();
  const [portalColor, setPortalColor] = useState('#0B2D5E');
  const [footerText, setFooterText] = useState('© 2026 MM-DMCC. All rights reserved.');
  const [portalLogo, setPortalLogo] = useState('');
  const [reminderHours, setReminderHours] = useState(ctx.settings.portalReminderHours);
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [showSeatDetails, setShowSeatDetails] = useState(false);
  const [guestFields, setGuestFields] = useState({
    passport: false, nationality: false, dob: false, phone: false, specialReqs: true,
  });

  const save = () => {
    ctx.updateSettings({ portalReminderHours: reminderHours });
    toast.success('Portal settings saved');
  };

  return (
    <div>
      <h2 className="font-display text-[22px] text-primary">Portal Settings</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">Client portal branding, required fields, and behaviour.</p>
      <div className="border-b border-border mb-6" />

      {/* Branding */}
      <h3 className="font-body text-base font-semibold text-foreground mb-4">Branding</h3>
      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-4">
          {portalLogo ? (
            <img src={portalLogo} className="w-[60px] h-[60px] rounded-xl object-cover border border-border" />
          ) : (
            <div className="w-[60px] h-[60px] rounded-xl bg-primary flex items-center justify-center">
              <span className="font-display text-xl text-primary-foreground">T</span>
            </div>
          )}
          <div className="flex-1">
            <label className={labelCls}>Portal Logo URL</label>
            <Input value={portalLogo} onChange={e => setPortalLogo(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Portal Accent Colour</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={portalColor} onChange={e => setPortalColor(e.target.value)} className="w-10 h-10 rounded border-0 cursor-pointer" />
              <Input value={portalColor} onChange={e => setPortalColor(e.target.value)} className="flex-1 font-mono" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Portal Footer Text</label>
            <Input value={footerText} onChange={e => setFooterText(e.target.value)} />
          </div>
        </div>

        {/* Preview bar */}
        <div className="rounded-lg overflow-hidden border border-border">
          <div className="h-10 flex items-center px-4" style={{ backgroundColor: portalColor }}>
            <span className="font-display text-sm text-white">TicketOps Portal Preview</span>
          </div>
          <div className="p-3 bg-muted">
            <p className="font-body text-xs text-muted-foreground text-center">{footerText}</p>
          </div>
        </div>
      </div>

      {/* Required Guest Fields */}
      <h3 className="font-body text-base font-semibold text-foreground mb-4">Required Guest Fields</h3>
      <p className={`${helperCls} mb-3`}>Locked fields are required by all events. Toggled fields can be further restricted at event level.</p>
      <div className="space-y-2 mb-8">
        {[
          { label: 'Guest First Name', locked: true, value: true },
          { label: 'Guest Last Name', locked: true, value: true },
          { label: 'Delivery Email', locked: true, value: true },
          { label: 'Passport Number', locked: false, key: 'passport' as const },
          { label: 'Nationality', locked: false, key: 'nationality' as const },
          { label: 'Date of Birth', locked: false, key: 'dob' as const },
          { label: 'Phone Number', locked: false, key: 'phone' as const },
          { label: 'Special Requirements', locked: false, key: 'specialReqs' as const },
        ].map(f => (
          <div key={f.label} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border">
            <span className="font-body text-sm text-foreground flex items-center gap-2">
              {f.locked && <Lock size={12} className="text-muted-foreground" />}
              {f.label}
            </span>
            <Toggle value={f.locked ? true : guestFields[f.key!]} onChange={v => !f.locked && setGuestFields(p => ({ ...p, [f.key!]: v }))} disabled={f.locked} />
          </div>
        ))}
      </div>

      {/* Behaviour */}
      <h3 className="font-body text-base font-semibold text-foreground mb-4">Portal Behaviour</h3>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Reminder Email Timing (hours)</label>
          <Input type="number" min={1} value={reminderHours} onChange={e => setReminderHours(+e.target.value)} className="max-w-[200px]" />
        </div>
        <div className="flex items-center gap-4">
          <Toggle value={allowResubmission} onChange={setAllowResubmission} />
          <span className="font-body text-sm text-foreground">Client can edit submitted details before SENT</span>
        </div>
        <div className="flex items-center gap-4">
          <Toggle value={showSeatDetails} onChange={setShowSeatDetails} />
          <span className="font-body text-sm text-foreground">Show Unit SetID in portal</span>
        </div>
      </div>
      <div className="flex justify-end mt-6"><Button onClick={save}>Save Changes</Button></div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SECTION 7: Currency & Pricing                             */
/* ────────────────────────────────────────────────────────── */
function CurrencySection() {
  const ctx = useAppContext();
  const [editId, setEditId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');
  const [adding, setAdding] = useState(false);
  const [newCur, setNewCur] = useState({ code: '', name: '', symbol: '', rate: '' });

  const startEdit = (c: Currency) => { setEditId(c.id); setEditRate(String(c.exchangeRateToAed)); };
  const saveRate = (id: string) => {
    ctx.updateCurrency(id, { exchangeRateToAed: parseFloat(editRate) || 1, lastUpdated: new Date().toISOString().slice(0, 10) });
    setEditId(null);
    toast.success('Exchange rate updated');
  };
  const addCurrency = () => {
    if (!newCur.code.trim() || !newCur.name.trim()) { toast.error('Fill required fields'); return; }
    ctx.addCurrency({ code: newCur.code.toUpperCase(), name: newCur.name, symbol: newCur.symbol || newCur.code, exchangeRateToAed: parseFloat(newCur.rate) || 1, isActive: true, lastUpdated: new Date().toISOString().slice(0, 10) });
    toast.success(`Currency ${newCur.code.toUpperCase()} added`);
    setAdding(false);
    setNewCur({ code: '', name: '', symbol: '', rate: '' });
  };

  return (
    <div>
      <h2 className="font-display text-[22px] text-primary">Currency & Pricing</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">Manage currencies and exchange rates.</p>
      <div className="border-b border-border mb-6" />

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm font-body">
          <thead><tr className="bg-primary text-primary-foreground">
            <th className="px-3 py-2.5 text-left">Code</th>
            <th className="px-3 py-2.5 text-left">Name</th>
            <th className="px-3 py-2.5 text-left">Symbol</th>
            <th className="px-3 py-2.5 text-right">Rate to AED</th>
            <th className="px-3 py-2.5 text-left">Last Updated</th>
            <th className="px-3 py-2.5 text-center">Active</th>
            <th className="px-3 py-2.5 text-right">Actions</th>
          </tr></thead>
          <tbody>
            {ctx.currencies.map((c, i) => {
              const isAed = c.code === 'AED';
              return (
                <tr key={c.id} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                  <td className="px-3 py-2 font-mono font-bold text-foreground">{c.code}</td>
                  <td className="px-3 py-2 text-foreground">{c.name}</td>
                  <td className="px-3 py-2 text-foreground">{c.symbol}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">
                    {editId === c.id ? (
                      <Input type="number" step="0.0001" value={editRate} onChange={e => setEditRate(e.target.value)} className="w-24 h-7 text-xs inline-block" />
                    ) : c.exchangeRateToAed.toFixed(4)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.lastUpdated}</td>
                  <td className="px-3 py-2 text-center">
                    {isAed ? <Lock size={14} className="inline text-muted-foreground" /> : (
                      <span className={c.isActive ? 'text-emerald-600' : 'text-muted-foreground'}>{c.isActive ? '●' : '○'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {isAed ? (
                      <span className="font-body text-[10px] text-muted-foreground">Base currency</span>
                    ) : editId === c.id ? (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => saveRate(c.id)}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => startEdit(c)}>Edit Rate</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={helperCls}>Exchange rates are manually maintained. All purchase and sale values are stored in AED. Display currency is applied at render time.</p>

      {adding ? (
        <div className="border border-border rounded-lg p-4 mt-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div><label className={labelCls}>Code *</label><Input value={newCur.code} onChange={e => setNewCur(p => ({ ...p, code: e.target.value }))} placeholder="SGD" maxLength={3} className="font-mono" /></div>
            <div><label className={labelCls}>Name *</label><Input value={newCur.name} onChange={e => setNewCur(p => ({ ...p, name: e.target.value }))} placeholder="Singapore Dollar" /></div>
            <div><label className={labelCls}>Symbol *</label><Input value={newCur.symbol} onChange={e => setNewCur(p => ({ ...p, symbol: e.target.value }))} placeholder="S$" /></div>
            <div><label className={labelCls}>Rate to AED *</label><Input type="number" step="0.0001" value={newCur.rate} onChange={e => setNewCur(p => ({ ...p, rate: e.target.value }))} placeholder="2.72" /></div>
          </div>
          <div className="flex gap-2"><Button size="sm" onClick={addCurrency}>Add Currency</Button><Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button></div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setAdding(true)}><Plus size={14} className="mr-1" /> Add Currency</Button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SECTION 8: Audit & Compliance                             */
/* ────────────────────────────────────────────────────────── */
function AuditSection() {
  const ctx = useAppContext();
  const [f, setF] = useState({
    auditRetentionDays: ctx.settings.auditRetentionDays,
    sessionTimeoutMinutes: ctx.settings.sessionTimeoutMinutes,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
  });
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportEntity, setExportEntity] = useState('All');

  const save = () => {
    ctx.updateSettings({ auditRetentionDays: f.auditRetentionDays, sessionTimeoutMinutes: f.sessionTimeoutMinutes });
    toast.success('Audit settings updated');
  };

  return (
    <div>
      <h2 className="font-display text-[22px] text-primary">Audit & Compliance</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">Audit log retention and compliance settings.</p>
      <div className="border-b border-border mb-6" />

      <div className="space-y-5 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Audit Log Retention (days)</label><Input type="number" min={90} value={f.auditRetentionDays} onChange={e => setF(p => ({ ...p, auditRetentionDays: +e.target.value }))} /></div>
          <div><label className={labelCls}>Session Timeout (minutes)</label><Input type="number" min={5} value={f.sessionTimeoutMinutes} onChange={e => setF(p => ({ ...p, sessionTimeoutMinutes: +e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Max Login Attempts</label><Input type="number" min={1} value={f.maxLoginAttempts} onChange={e => setF(p => ({ ...p, maxLoginAttempts: +e.target.value }))} /></div>
          <div><label className={labelCls}>Account Lockout Duration (minutes)</label><Input type="number" min={1} value={f.lockoutDuration} onChange={e => setF(p => ({ ...p, lockoutDuration: +e.target.value }))} /></div>
        </div>
      </div>
      <div className="flex justify-end mb-8"><Button onClick={save}>Save Changes</Button></div>

      {/* Export */}
      <h3 className="font-body text-base font-semibold text-foreground mb-4">Export Audit Logs</h3>
      <div className="border border-border rounded-xl p-4 space-y-3 mb-8">
        <div className="grid grid-cols-3 gap-3">
          <div><label className={labelCls}>From</label><Input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} /></div>
          <div><label className={labelCls}>To</label><Input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} /></div>
          <div>
            <label className={labelCls}>Entity</label>
            <select value={exportEntity} onChange={e => setExportEntity(e.target.value)} className={inputCls}>
              {['All', 'Sales', 'Purchases', 'Allocations', 'Portals', 'Users'].map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <Button variant="outline" onClick={() => toast.success('Audit export ready (demo)')}>Export CSV</Button>
      </div>

      {/* Data purge */}
      <div className="rounded-xl p-4 bg-muted border border-border">
        <p className="font-body text-sm text-foreground font-medium">Data Purge Schedule</p>
        <p className="font-body text-xs text-muted-foreground mt-1">Archived events older than 2 years: scheduled purge on 1 Jan 2029</p>
        <p className="font-body text-xs text-muted-foreground mt-2">To adjust data retention policies, contact HelloPixels support.</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SECTION 9: Integrations                                   */
/* ────────────────────────────────────────────────────────── */
function IntegrationsSection() {
  const [fromAddr, setFromAddr] = useState('noreply@mm-dmcc.ae');
  const [replyTo, setReplyTo] = useState('ops@mm-dmcc.ae');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showWebhook, setShowWebhook] = useState(false);

  const FUTURE = [
    { name: 'viagogo API', phase: 'Phase 2' },
    { name: 'Salesforce CRM', phase: 'Phase 3' },
    { name: 'QuickBooks Finance', phase: 'Phase 3' },
    { name: 'WhatsApp Business', phase: 'Phase 2' },
  ];

  return (
    <div>
      <h2 className="font-display text-[22px] text-primary">Integrations</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">Third-party service connections.</p>
      <div className="border-b border-border mb-6" />

      {/* Email Provider */}
      <div className="border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-body text-base font-bold text-foreground">Resend API</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-body text-[10px] font-medium">Connected ✓</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div><label className={labelCls}>From Address</label><Input value={fromAddr} onChange={e => setFromAddr(e.target.value)} /></div>
          <div><label className={labelCls}>Reply-To</label><Input value={replyTo} onChange={e => setReplyTo(e.target.value)} /></div>
        </div>
        <div className="mb-3">
          <label className={labelCls}>API Key</label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">••••••••••re_xxxx</span>
            <button className="font-body text-xs text-accent hover:underline">Regenerate</button>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => toast.success('Test email sent successfully (demo)')}>
          <Send size={12} className="mr-1" /> Test Email
        </Button>
      </div>

      {/* Future integrations */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {FUTURE.map(f => (
          <div key={f.name} className="border border-border rounded-xl p-4 opacity-60">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} className="text-muted-foreground" />
              <span className="font-body text-sm font-medium text-foreground">{f.name}</span>
            </div>
            <span className="font-body text-xs text-muted-foreground">Coming Soon — {f.phase}</span>
            <button className="block font-body text-xs text-accent hover:underline mt-2">Request Integration</button>
          </div>
        ))}
      </div>

      {/* Webhook */}
      <button onClick={() => setShowWebhook(!showWebhook)} className="flex items-center gap-2 font-body text-sm font-medium text-accent hover:underline mb-3">
        {showWebhook ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Webhook Settings
      </button>
      <AnimatePresence>
        {showWebhook && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border border-border rounded-xl p-4 space-y-3">
            <div><label className={labelCls}>Endpoint URL</label><Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://..." /></div>
            <div>
              <label className={labelCls}>Events to send</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['OVERSELL_DETECTED','PORTAL_GENERATED','PORTAL_REMINDER','TICKET_DISPATCHED','DISPATCH_OVERDUE','ALLOCATION_COMPLETE','SALE_CANCELLED','PRICE_CHANGE_APPROVAL'].map(e => (
                  <label key={e} className="flex items-center gap-1.5 px-2 py-1 rounded border border-border cursor-pointer hover:bg-muted">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="font-mono text-[10px] text-foreground">{e}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button size="sm" onClick={() => toast.success('Webhook saved (demo)')}>Save Webhook</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SECTION 10: System Info                                   */
/* ────────────────────────────────────────────────────────── */
function SystemSection() {
  const ctx = useAppContext();
  const activeUsers = MOCK_USERS.filter(u => u.role !== 'client').length;
  const activeEvents = ctx.events.filter(e => e.status !== 'ARCHIVED').length;

  const HEALTH = [
    { label: 'Application', value: 'v1.0.0 — Production', status: 'Operational' },
    { label: 'Database', value: 'PostgreSQL 16 — AWS RDS', status: 'Operational' },
    { label: 'Last Backup', value: '17 Apr 2026 02:00 GST', status: '18h ago' },
    { label: 'Email Service', value: 'Resend API', status: 'Operational' },
  ];

  return (
    <div>
      <h2 className="font-display text-[22px] text-primary">System Info</h2>
      <p className="font-body text-sm text-muted-foreground mb-6">System version, environment, and diagnostics.</p>
      <div className="border-b border-border mb-6" />

      {/* Health grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {HEALTH.map(h => (
          <div key={h.label} className="border border-border rounded-xl p-4">
            <p className="font-body text-xs text-muted-foreground mb-1">{h.label}</p>
            <p className="font-body text-sm font-medium text-foreground">{h.value}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-body text-xs text-emerald-600">{h.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Usage stats */}
      <h3 className="font-body text-base font-semibold text-foreground mb-4">Usage Statistics</h3>
      <div className="grid grid-cols-5 gap-3 mb-8">
        {[
          ['Active Users', activeUsers],
          ['Active Events', activeEvents],
          ['Total Purchases', MOCK_PURCHASES.length],
          ['Total Sales', MOCK_SALES.length],
          ['Unit Records', MOCK_UNITS.length],
        ].map(([label, val]) => (
          <div key={label as string} className="border border-border rounded-lg p-3 text-center">
            <p className="font-body text-2xl font-bold text-primary">{val}</p>
            <p className="font-body text-[10px] text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Environment */}
      <h3 className="font-body text-base font-semibold text-foreground mb-4">Environment</h3>
      <div className="space-y-2 mb-8">
        {[
          ['Environment', 'Production'],
          ['Node.js', 'v20.x'],
          ['React', '18.x'],
          ['Database', 'PostgreSQL 16'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
            <span className="font-body text-xs text-muted-foreground">{k}</span>
            <span className="font-mono text-xs text-foreground">{v}</span>
          </div>
        ))}
      </div>

      {/* Support */}
      <div className="rounded-xl p-5 bg-primary/5 border border-primary/20">
        <p className="font-body text-sm font-bold text-primary">Technical Support: HelloPixels Digital Agency</p>
        <p className="font-body text-xs text-muted-foreground mt-1">support@hellopixels.ae | +971 4 XXX XXXX</p>
        <p className="font-body text-xs text-muted-foreground mt-1">SLA: P1 Critical — 2 hours | Premium AMC — WhatsApp + Email</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* MAIN SETTINGS PAGE                                        */
/* ────────────────────────────────────────────────────────── */
const SECTION_COMPONENTS: Record<string, React.FC> = {
  'org': OrgSection,
  'event-defaults': EventDefaultsSection,
  'rbac': RBACSection,
  'notifications': NotificationsSection,
  'allocation': AllocationSection,
  'portal': PortalSection,
  'currency': CurrencySection,
  'audit': AuditSection,
  'integrations': IntegrationsSection,
  'system': SystemSection,
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active section from URL
  const pathParts = location.pathname.split('/');
  const activeSection = pathParts[2] || 'org';
  const ActiveComponent = SECTION_COMPONENTS[activeSection] || OrgSection;

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      {/* Left nav */}
      <div className="w-[240px] shrink-0 sticky top-4 self-start">
        <div className={`${cardCls} p-2`}>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => navigate(`/settings/${s.id}`)}
                className={`w-full h-[42px] flex items-center gap-3 px-3 rounded-xl font-body text-sm transition-colors ${
                  active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                }`}>
                <Icon size={16} />
                <span className={active ? 'font-medium' : ''}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 min-w-0">
        <div className={cardCls}>
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
