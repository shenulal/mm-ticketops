import { useState, useMemo, useRef } from 'react';
import { useAppContext, type VendorCredential } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Plus, Search, Shield, ShieldAlert, ShieldCheck, ShieldOff,
  Upload, X, Clock, CheckCircle2, AlertTriangle, History, Key, ChevronDown
} from 'lucide-react';

const inputCls = 'w-full px-3 py-2 rounded-xl border border-border bg-background text-[13px] font-body focus:outline-none focus:ring-2 focus:ring-primary/30';
const selectCls = inputCls;
const textareaCls = inputCls + ' resize-none';

const WRITE_ROLES = ['super_admin', 'event_admin', 'ops_manager'];
const VIEW_PASSWORD_ROLES = ['super_admin', 'event_admin', 'ops_manager', 'sr_operator'];

function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);
  const label = score <= 1 ? 'Weak' : score <= 3 ? 'Fair' : 'Strong';
  const color = score <= 1 ? 'bg-destructive' : score <= 3 ? 'bg-warning' : 'bg-success';
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? color : 'bg-muted'}`} />
        ))}
      </div>
      <p className="text-[10px] font-body text-muted-foreground">{label}</p>
    </div>
  );
}

function CredentialForm({ onClose, editCred }: { onClose: () => void; editCred?: VendorCredential }) {
  const ctx = useAppContext();
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    vendorId: editCred?.vendorId ?? '',
    eventId: editCred?.eventId ?? '',
    loginId: editCred?.loginId ?? '',
    email: editCred?.email ?? '',
    password: '',
    active: editCred?.active ?? true,
    notes: editCred?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const upd = (k: string, v: string | boolean) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => { const n = { ...p }; delete n[k]; return n; }); };

  const save = () => {
    const e: Record<string, string> = {};
    if (!form.vendorId) e.vendorId = 'Required';
    if (!form.loginId.trim()) e.loginId = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!editCred && !form.password.trim()) e.password = 'Required';
    if (Object.keys(e).length) { setErrors(e); return; }
    const now = new Date().toISOString();
    const actor = currentUser?.name ?? 'System';
    if (editCred) {
      const data: Partial<VendorCredential> = {
        vendorId: form.vendorId, eventId: form.eventId || null,
        loginId: form.loginId, email: form.email, active: form.active,
        notes: form.notes, updatedBy: actor, updatedAt: now,
      };
      if (form.password) data.passwordHash = form.password;
      ctx.updateVendorCredential(editCred.id, data);
      ctx.addCredentialHistoryEntry({ credentialId: editCred.id, action: 'UPDATED', actor, timestamp: now, details: form.password ? 'Credential and password updated' : 'Credential updated' });
      toast.success('Credential updated');
    } else {
      ctx.addVendorCredential({
        vendorId: form.vendorId, eventId: form.eventId || null,
        loginId: form.loginId, email: form.email, passwordHash: form.password,
        active: form.active, notes: form.notes, updatedBy: actor, updatedAt: now, createdAt: now,
      });
      toast.success('Credential created');
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-[18px] text-foreground">{editCred ? 'Edit Credential' : 'Add Credential'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-body text-muted-foreground">Vendor *</label>
          <select className={selectCls} value={form.vendorId} onChange={e => upd('vendorId', e.target.value)}>
            <option value="">Select vendor...</option>
            {ctx.vendors.filter(v => v.isActive).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          {errors.vendorId && <p className="text-[11px] text-destructive mt-0.5">{errors.vendorId}</p>}
        </div>
        <div>
          <label className="text-[11px] font-body text-muted-foreground">Event (optional — blank = global)</label>
          <select className={selectCls} value={form.eventId} onChange={e => upd('eventId', e.target.value)}>
            <option value="">Global (all events)</option>
            {ctx.events.filter(e => e.status !== 'ARCHIVED').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-body text-muted-foreground">Login ID *</label>
          <input className={inputCls} value={form.loginId} onChange={e => upd('loginId', e.target.value)} placeholder="e.g. clara.wc2026" />
          {errors.loginId && <p className="text-[11px] text-destructive mt-0.5">{errors.loginId}</p>}
        </div>
        <div>
          <label className="text-[11px] font-body text-muted-foreground">Email *</label>
          <input className={inputCls} type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="user@vendor.com" />
          {errors.email && <p className="text-[11px] text-destructive mt-0.5">{errors.email}</p>}
        </div>
      </div>
      <div>
        <label className="text-[11px] font-body text-muted-foreground">Password {editCred ? '(leave blank to keep current)' : '*'}</label>
        <input className={inputCls} type="password" value={form.password} onChange={e => upd('password', e.target.value)} placeholder={editCred ? '••••••••' : 'Enter password'} />
        {errors.password && <p className="text-[11px] text-destructive mt-0.5">{errors.password}</p>}
        {form.password && <PasswordStrength password={form.password} />}
      </div>
      <div className="flex items-center gap-3">
        <label className="text-[12px] font-body text-foreground">Active</label>
        <button onClick={() => upd('active', !form.active)}
          className={`w-10 h-5 rounded-full transition-colors relative ${form.active ? 'bg-success' : 'bg-muted'}`}>
          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${form.active ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>
      <div>
        <label className="text-[11px] font-body text-muted-foreground">Notes</label>
        <textarea className={textareaCls} rows={2} value={form.notes} onChange={e => upd('notes', e.target.value)} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-body text-muted-foreground hover:text-foreground">Cancel</button>
        <button onClick={save} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90">
          {editCred ? 'Update' : 'Save Credential'}
        </button>
      </div>
    </div>
  );
}

function CredentialHistoryPanel({ credentialId }: { credentialId: string }) {
  const ctx = useAppContext();
  const history = ctx.getCredentialHistory(credentialId);
  const icons: Record<string, typeof CheckCircle2> = { CREATED: CheckCircle2, UPDATED: Clock, DEACTIVATED: ShieldOff, PASSWORD_VIEWED: Eye };
  return (
    <div className="space-y-2">
      <h4 className="font-body text-[13px] font-semibold text-foreground flex items-center gap-2"><History size={14} /> Credential History</h4>
      {history.length === 0 ? <p className="text-[12px] text-muted-foreground italic">No history entries.</p> : (
        <div className="space-y-1.5">
          {history.map(h => {
            const Icon = icons[h.action] ?? Clock;
            return (
              <div key={h.id} className="flex items-start gap-2 text-[12px] font-body">
                <Icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">{h.action}</span>
                  <span className="text-muted-foreground"> by {h.actor} — {format(new Date(h.timestamp), 'dd MMM yyyy HH:mm')}</span>
                  {h.details && <p className="text-muted-foreground">{h.details}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BulkImportPanel({ onClose }: { onClose: () => void }) {
  const ctx = useAppContext();
  const { currentUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<{ vendor: string; event: string; login_id: string; email: string; password: string; notes: string; skip: boolean; vendorId?: string; eventId?: string; error?: string }[]>([]);
  const [parsed, setParsed] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV must have header + data rows'); return; }
      const parsed = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const vendorName = cols[0] ?? '';
        const eventName = cols[1] ?? '';
        const vendor = ctx.vendors.find(v => v.name.toLowerCase() === vendorName.toLowerCase() || v.code.toLowerCase() === vendorName.toLowerCase());
        const event = eventName ? ctx.events.find(ev => ev.name.toLowerCase() === eventName.toLowerCase() || ev.code.toLowerCase() === eventName.toLowerCase()) : undefined;
        const error = !vendor ? `Vendor "${vendorName}" not found` : (eventName && !event ? `Event "${eventName}" not found` : undefined);
        return {
          vendor: vendorName, event: eventName,
          login_id: cols[2] ?? '', email: cols[3] ?? '', password: cols[4] ?? '', notes: cols[5] ?? '',
          skip: !!error, vendorId: vendor?.id, eventId: event?.id ?? undefined, error,
        };
      });
      setRows(parsed);
      setParsed(true);
    };
    reader.readAsText(file);
  };

  const importRows = () => {
    const toImport = rows.filter(r => !r.skip && r.vendorId);
    const now = new Date().toISOString();
    const actor = currentUser?.name ?? 'System';
    toImport.forEach(r => {
      ctx.addVendorCredential({
        vendorId: r.vendorId!, eventId: r.eventId ?? null,
        loginId: r.login_id, email: r.email, passwordHash: r.password,
        active: true, notes: r.notes, updatedBy: actor, updatedAt: now, createdAt: now,
      });
    });
    toast.success(`${toImport.length} credential(s) imported`);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-[18px] text-foreground flex items-center gap-2"><Upload size={18} /> Bulk Import Credentials</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={16} /></button>
      </div>
      <p className="text-[12px] font-body text-muted-foreground">CSV format: <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">vendor, event, login_id, email, password, notes</code></p>
      {!parsed ? (
        <div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-xl border border-dashed border-border text-[13px] font-body text-muted-foreground hover:bg-muted/50 w-full">
            Choose CSV File…
          </button>
        </div>
      ) : (
        <>
          <div className="max-h-[300px] overflow-auto border border-border rounded-xl">
            <table className="w-full text-[12px] font-body">
              <thead><tr className="bg-muted/50 text-left">
                <th className="px-3 py-2">Skip</th><th className="px-3 py-2">Vendor</th><th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Login ID</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Status</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-t border-border ${r.skip ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-2"><input type="checkbox" checked={r.skip} onChange={() => setRows(prev => prev.map((rr, j) => j === i ? { ...rr, skip: !rr.skip } : rr))} /></td>
                    <td className="px-3 py-2">{r.vendor}</td>
                    <td className="px-3 py-2">{r.event || <span className="text-muted-foreground italic">Global</span>}</td>
                    <td className="px-3 py-2">{r.login_id}</td>
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2">{r.error ? <span className="text-destructive flex items-center gap-1"><AlertTriangle size={11} /> {r.error}</span> : <span className="text-success">✓ Ready</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setRows([]); setParsed(false); }} className="px-4 py-2 rounded-xl text-[13px] font-body text-muted-foreground">Reset</button>
            <button onClick={importRows} disabled={rows.filter(r => !r.skip && r.vendorId).length === 0}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90 disabled:opacity-40">
              Import {rows.filter(r => !r.skip && r.vendorId).length} Row(s)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function VendorCredentialsPage() {
  const ctx = useAppContext();
  const { currentUser } = useAuth();
  const role = currentUser?.role ?? 'staff';
  const canWrite = WRITE_ROLES.includes(role);
  const canViewPassword = VIEW_PASSWORD_ROLES.includes(role);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [vendorFilter, setVendorFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editCred, setEditCred] = useState<VendorCredential | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [confirmReveal, setConfirmReveal] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return ctx.vendorCredentials.filter(c => {
      if (statusFilter === 'active' && !c.active) return false;
      if (statusFilter === 'inactive' && c.active) return false;
      if (vendorFilter && c.vendorId !== vendorFilter) return false;
      if (search) {
        const vendor = ctx.getVendor(c.vendorId);
        const event = c.eventId ? ctx.getEvent(c.eventId) : null;
        const haystack = `${vendor?.name} ${vendor?.code} ${event?.name ?? 'Global'} ${c.loginId} ${c.email}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [ctx, search, statusFilter, vendorFilter]);

  const handleRevealPassword = (credId: string) => {
    if (!canViewPassword) { toast.error('Insufficient permissions to view passwords'); return; }
    setConfirmReveal(credId);
  };

  const confirmRevealPassword = (credId: string) => {
    setRevealedPasswords(prev => new Set(prev).add(credId));
    ctx.addCredentialHistoryEntry({
      credentialId: credId, action: 'PASSWORD_VIEWED',
      actor: currentUser?.name ?? 'System', timestamp: new Date().toISOString(),
      details: `Password viewed by ${currentUser?.name}`,
    });
    setConfirmReveal(null);
    // Auto-hide after 10 seconds
    setTimeout(() => setRevealedPasswords(prev => { const n = new Set(prev); n.delete(credId); return n; }), 10000);
  };

  const handleDeactivate = (cred: VendorCredential) => {
    ctx.updateVendorCredential(cred.id, { active: !cred.active, updatedBy: currentUser?.name ?? 'System', updatedAt: new Date().toISOString() });
    ctx.addCredentialHistoryEntry({
      credentialId: cred.id, action: cred.active ? 'DEACTIVATED' : 'UPDATED',
      actor: currentUser?.name ?? 'System', timestamp: new Date().toISOString(),
      details: cred.active ? 'Credential deactivated' : 'Credential reactivated',
    });
    toast.success(cred.active ? 'Credential deactivated' : 'Credential activated');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-[26px] text-foreground">Vendor Credentials</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-body font-medium bg-primary/10 text-primary">
            {ctx.vendorCredentials.length}
          </span>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <button onClick={() => setShowBulk(true)} className="px-4 py-2 rounded-xl border border-border text-[13px] font-body text-foreground hover:bg-muted/50 flex items-center gap-2">
              <Upload size={14} /> Bulk Import
            </button>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90 flex items-center gap-2">
              <Plus size={14} /> Add Credential
            </button>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
        <ShieldAlert size={16} className="text-warning mt-0.5 shrink-0" />
        <p className="text-[12px] font-body text-warning">
          Passwords are write-only and masked. Viewing requires Sr. Operator+ role and is logged to the audit trail.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inputCls} pl-9`} placeholder="Search credentials..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={`${selectCls} w-40`} value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className={`${selectCls} w-44`} value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
          <option value="">All Vendors</option>
          {ctx.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        <table className="w-full text-[13px] font-body">
          <thead>
            <tr className="bg-muted/50 text-left text-[11px] text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Login ID</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Password</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Updated By</th>
              <th className="px-4 py-3">Updated At</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No credentials found.</td></tr>
            )}
            {filtered.map(cred => {
              const vendor = ctx.getVendor(cred.vendorId);
              const event = cred.eventId ? ctx.getEvent(cred.eventId) : null;
              const isRevealed = revealedPasswords.has(cred.id);
              return (
                <tr key={cred.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{vendor?.name ?? cred.vendorId}</td>
                  <td className="px-4 py-3">
                    {event ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-primary/10 text-primary">{event.code}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-accent/20 text-accent-foreground">Global</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px]">{role === 'operator' || role === 'staff' ? '—' : cred.loginId}</td>
                  <td className="px-4 py-3">{role === 'staff' ? '—' : cred.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px]">{isRevealed ? cred.passwordHash : '••••••••'}</span>
                      {canViewPassword && (
                        <button onClick={() => isRevealed ? setRevealedPasswords(prev => { const n = new Set(prev); n.delete(cred.id); return n; }) : handleRevealPassword(cred.id)}
                          className="p-1 rounded hover:bg-muted" title={isRevealed ? 'Hide' : 'Reveal password'}>
                          {isRevealed ? <EyeOff size={13} className="text-muted-foreground" /> : <Eye size={13} className="text-muted-foreground" />}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {cred.active ? (
                      <span className="flex items-center gap-1 text-success text-[12px]"><ShieldCheck size={13} /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground text-[12px]"><ShieldOff size={13} /> Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{cred.updatedBy}</td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{format(new Date(cred.updatedAt), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canWrite && (
                        <>
                          <button onClick={() => setEditCred(cred)} className="px-2 py-1 rounded-lg text-[11px] font-body text-primary hover:bg-primary/10">Edit</button>
                          <button onClick={() => handleDeactivate(cred)} className={`px-2 py-1 rounded-lg text-[11px] font-body ${cred.active ? 'text-destructive hover:bg-destructive/10' : 'text-success hover:bg-success/10'}`}>
                            {cred.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                      <button onClick={() => setShowHistory(showHistory === cred.id ? null : cred.id)} className="px-2 py-1 rounded-lg text-[11px] font-body text-muted-foreground hover:bg-muted flex items-center gap-1">
                        <History size={11} /> History
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* History inline panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border border-border rounded-2xl p-4 bg-card">
            <CredentialHistoryPanel credentialId={showHistory} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm reveal dialog */}
      <AnimatePresence>
        {confirmReveal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-warning" />
                <h3 className="font-heading text-[16px] text-foreground">Reveal Password?</h3>
              </div>
              <p className="text-[13px] font-body text-muted-foreground">This action will be logged to the audit trail. The password will auto-hide after 10 seconds.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmReveal(null)} className="px-4 py-2 rounded-xl text-[13px] font-body text-muted-foreground">Cancel</button>
                <button onClick={() => confirmRevealPassword(confirmReveal)} className="px-4 py-2 rounded-xl bg-warning text-warning-foreground text-[13px] font-body font-medium hover:opacity-90">
                  Yes, Reveal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit modal */}
      <AnimatePresence>
        {(showCreate || editCred) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowCreate(false); setEditCred(null); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <CredentialForm editCred={editCred ?? undefined} onClose={() => { setShowCreate(false); setEditCred(null); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk import modal */}
      <AnimatePresence>
        {showBulk && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBulk(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <BulkImportPanel onClose={() => setShowBulk(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Exported sub-component for use in VendorsPage drawer
export function VendorCredentialsTab({ vendorId }: { vendorId: string }) {
  const ctx = useAppContext();
  const { currentUser } = useAuth();
  const role = currentUser?.role ?? 'staff';
  const canWrite = WRITE_ROLES.includes(role);
  const canViewPassword = VIEW_PASSWORD_ROLES.includes(role);
  const creds = ctx.getCredentialsForVendor(vendorId);
  const [showCreate, setShowCreate] = useState(false);
  const [editCred, setEditCred] = useState<VendorCredential | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [confirmReveal, setConfirmReveal] = useState<string | null>(null);

  const handleReveal = (credId: string) => {
    if (!canViewPassword) { toast.error('Insufficient permissions'); return; }
    setConfirmReveal(credId);
  };

  const doReveal = (credId: string) => {
    setRevealedPasswords(prev => new Set(prev).add(credId));
    ctx.addCredentialHistoryEntry({
      credentialId: credId, action: 'PASSWORD_VIEWED',
      actor: currentUser?.name ?? 'System', timestamp: new Date().toISOString(),
      details: `Password viewed by ${currentUser?.name}`,
    });
    setConfirmReveal(null);
    setTimeout(() => setRevealedPasswords(prev => { const n = new Set(prev); n.delete(credId); return n; }), 10000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-body text-[14px] font-semibold text-foreground flex items-center gap-2"><Key size={14} /> Credentials</h4>
        {canWrite && (
          <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded-lg text-[12px] font-body font-medium bg-primary text-primary-foreground hover:opacity-90">
            + Add
          </button>
        )}
      </div>
      {creds.length === 0 && <p className="text-[12px] text-muted-foreground italic">No credentials configured.</p>}
      {creds.map(cred => {
        const event = cred.eventId ? ctx.getEvent(cred.eventId) : null;
        const isRevealed = revealedPasswords.has(cred.id);
        return (
          <div key={cred.id} className="border border-border rounded-xl p-3 space-y-2 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {event ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-primary/10 text-primary">{event.code}</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-accent/20 text-accent-foreground">Global</span>
                )}
                <span className={`text-[11px] font-body ${cred.active ? 'text-success' : 'text-muted-foreground'}`}>
                  {cred.active ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {canWrite && <button onClick={() => setEditCred(cred)} className="p-1 rounded hover:bg-muted text-[11px] text-primary">Edit</button>}
                <button onClick={() => setShowHistory(showHistory === cred.id ? null : cred.id)} className="p-1 rounded hover:bg-muted"><History size={12} className="text-muted-foreground" /></button>
              </div>
            </div>
            <div className="text-[12px] font-body text-muted-foreground space-y-0.5">
              <p>Login: <span className="font-mono text-foreground">{cred.loginId}</span></p>
              <p>Email: <span className="text-foreground">{cred.email}</span></p>
              <div className="flex items-center gap-2">
                <span>Password: <span className="font-mono">{isRevealed ? cred.passwordHash : '••••••••'}</span></span>
                {canViewPassword && (
                  <button onClick={() => isRevealed ? setRevealedPasswords(prev => { const n = new Set(prev); n.delete(cred.id); return n; }) : handleReveal(cred.id)}
                    className="p-0.5 rounded hover:bg-muted">
                    {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                )}
              </div>
              {cred.notes && <p>Notes: {cred.notes}</p>}
              <p className="text-[10px] text-muted-foreground">Updated by {cred.updatedBy} on {format(new Date(cred.updatedAt), 'dd MMM yyyy')}</p>
            </div>
            {showHistory === cred.id && (
              <div className="border-t border-border pt-2 mt-2"><CredentialHistoryPanel credentialId={cred.id} /></div>
            )}
          </div>
        );
      })}

      {/* Confirm reveal */}
      {confirmReveal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-3">
            <p className="font-body text-[13px] text-foreground font-medium">Reveal password? This will be logged.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmReveal(null)} className="px-3 py-1.5 rounded-lg text-[12px] font-body text-muted-foreground">Cancel</button>
              <button onClick={() => doReveal(confirmReveal)} className="px-3 py-1.5 rounded-lg bg-warning text-warning-foreground text-[12px] font-body font-medium">Reveal</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit inline modal */}
      {(showCreate || editCred) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => { setShowCreate(false); setEditCred(null); }}>
          <div className="bg-card border border-border rounded-2xl p-5 max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <CredentialForm editCred={editCred ?? undefined} onClose={() => { setShowCreate(false); setEditCred(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}
