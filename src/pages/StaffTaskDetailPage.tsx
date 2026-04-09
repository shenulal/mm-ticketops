import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MOCK_STAFF_TASKS, MOCK_USERS, type StaffTask, type TaskStatus } from '@/data/mockData';
import { toast } from 'sonner';
import {
  ArrowLeft, AlertTriangle, Copy, Eye, EyeOff, Upload, Camera,
  Send, MessageSquare, Clock, ChevronDown, ChevronUp, Shield, CheckSquare,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────
const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  High:   { bg: 'hsl(var(--destructive) / 0.15)', text: 'hsl(var(--destructive))' },
  Normal: { bg: 'hsl(var(--muted))',               text: 'hsl(var(--muted-foreground))' },
  Low:    { bg: 'hsl(var(--accent) / 0.15)',        text: 'hsl(var(--accent-foreground))' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  NOT_SENT: { bg: 'hsl(var(--muted))',               text: 'hsl(var(--muted-foreground))' },
  SENT:     { bg: 'hsl(var(--success) / 0.15)',       text: 'hsl(var(--success))' },
  PENDING:  { bg: 'hsl(var(--warning) / 0.15)',       text: 'hsl(var(--warning))' },
  ACCEPTED: { bg: 'hsl(var(--success) / 0.25)',       text: 'hsl(var(--success))' },
  ISSUE:    { bg: 'hsl(var(--destructive) / 0.15)',   text: 'hsl(var(--destructive))' },
};

const CREDENTIAL_ROLES = ['super_admin', 'ops_manager', 'sr_operator', 'staff'];
const MANAGER_ROLES = ['super_admin', 'ops_manager', 'sr_operator'];

function Badge({ label, style }: { label: string; style: { bg: string; text: string } }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[11px] font-body font-semibold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {label}
    </span>
  );
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
}

// ─── Main Component ───────────────────────────────────
export default function StaffTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [task, setTask] = useState<StaffTask | null>(null);
  const [credOpen, setCredOpen] = useState(false);
  const [credRevealed, setCredRevealed] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const pwTimer = useRef<ReturnType<typeof setTimeout>>();

  // Issue composer
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueNote, setIssueNote] = useState('');
  // Staff note
  const [noteText, setNoteText] = useState('');
  // Mark-sent flow
  const [sentConfirmOpen, setSentConfirmOpen] = useState(false);
  const [legacyNoProof, setLegacyNoProof] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    const found = MOCK_STAFF_TASKS.find(t => t.id === taskId);
    if (found) {
      setTask({ ...found, activityLog: [...found.activityLog] });
      setNoteText(found.staffNote);
    }
  }, [taskId]);

  // Access check
  const canAccess = useCallback(() => {
    if (!currentUser || !task) return false;
    if (MANAGER_ROLES.includes(currentUser.role)) return true;
    return task.assignedTo === currentUser.id;
  }, [currentUser, task]);

  // Password auto-redact after 15s
  useEffect(() => {
    if (pwVisible) {
      pwTimer.current = setTimeout(() => setPwVisible(false), 15000);
      return () => clearTimeout(pwTimer.current);
    }
  }, [pwVisible]);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <p className="text-muted-foreground font-body text-sm">Task not found.</p>
        <button onClick={() => navigate('/staff-queue')} className="text-primary text-sm font-body underline">
          Back to queue
        </button>
      </div>
    );
  }

  if (!canAccess()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Shield size={32} className="text-destructive" />
        <p className="text-destructive font-body text-sm font-medium">You don't have access to this task.</p>
        <button onClick={() => navigate('/staff-queue')} className="text-primary text-sm font-body underline">
          Back to queue
        </button>
      </div>
    );
  }

  const addLog = (action: string) => {
    setTask(prev => prev ? {
      ...prev,
      activityLog: [...prev.activityLog, { action, actor: currentUser?.name ?? '—', at: new Date().toLocaleString() }],
    } : prev);
  };

  const updateStatus = (status: TaskStatus, note?: string) => {
    setTask(prev => prev ? { ...prev, status, dispatchedAt: status === 'SENT' ? new Date().toLocaleString() : prev.dispatchedAt } : prev);
    addLog(`Status → ${status}${note ? `: ${note}` : ''}`);
    toast.success(`Task marked as ${status}`);
  };

  const handleMarkSent = () => {
    if (!proofFile && !legacyNoProof) {
      toast.error('Upload proof or check "Delivered without proof" to continue.');
      return;
    }
    updateStatus('SENT');
    if (proofFile) addLog(`Proof uploaded: ${proofFile.name}`);
    setSentConfirmOpen(false);
  };

  const handleIssue = () => {
    if (!issueNote.trim()) { toast.error('Please describe the issue.'); return; }
    updateStatus('ISSUE', issueNote.trim());
    setIssueOpen(false);
    setIssueNote('');
  };

  const handleSaveNote = () => {
    setTask(prev => prev ? { ...prev, staffNote: noteText } : prev);
    addLog(`Staff note updated`);
    toast.success('Note saved');
  };

  const handleRevealCredentials = () => {
    if (!CREDENTIAL_ROLES.includes(currentUser?.role ?? '')) {
      toast.error('Insufficient permissions to view credentials.');
      return;
    }
    addLog('Credentials revealed (audit: credential.view)');
    setCredRevealed(true);
    toast.info('Credential access logged.');
  };

  const isSent = task.status === 'SENT';
  const ps = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Normal;
  const ss = STATUS_STYLES[task.status] ?? STATUS_STYLES.NOT_SENT;

  return (
    <div className="max-w-lg mx-auto pb-8 space-y-4">
      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/staff-queue')} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-lg text-foreground truncate">Task #{task.id.toUpperCase()}</h1>
        </div>
        <Badge label={task.priority} style={ps} />
        <Badge label={task.status.replace('_', ' ')} style={ss} />
      </div>

      {/* ── Client card ─────────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <h2 className="text-[11px] font-body font-semibold text-muted-foreground tracking-wider uppercase">Client</h2>
        <p className="font-body text-[15px] text-foreground font-medium">
          {task.clientFirstName} {task.clientLastName}
        </p>
        <p className="font-mono text-[13px] text-muted-foreground">{task.clientEmail}</p>
        {task.clientPhone && <p className="font-mono text-[13px] text-muted-foreground">{task.clientPhone}</p>}
        {task.clientNotes && (
          <div className="mt-1 p-2.5 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-[12px] font-body text-warning flex items-start gap-1.5">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              {task.clientNotes}
            </p>
          </div>
        )}
      </section>

      {/* ── Ticket card ─────────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <h2 className="text-[11px] font-body font-semibold text-muted-foreground tracking-wider uppercase">Ticket</h2>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[13px] font-body">
          <div><span className="text-muted-foreground">Match</span></div>
          <div className="text-foreground font-medium">{task.matchCode} {task.matchLabel}</div>
          <div><span className="text-muted-foreground">Category</span></div>
          <div className="text-foreground font-medium">{task.category}</div>
          <div><span className="text-muted-foreground">Sets / Qty</span></div>
          <div className="text-foreground font-medium">{task.sets} / {task.qty}</div>
          <div><span className="text-muted-foreground">Block</span></div>
          <div className="text-foreground font-medium">{task.block || <span className="italic text-muted-foreground">Waiting for venue info</span>}</div>
          <div><span className="text-muted-foreground">Row</span></div>
          <div className="text-foreground font-medium">{task.row || <span className="italic text-muted-foreground">—</span>}</div>
          <div><span className="text-muted-foreground">Seat</span></div>
          <div className="text-foreground font-medium">{task.seat || <span className="italic text-muted-foreground">—</span>}</div>
        </div>
      </section>

      {/* ── Credential card (collapsible) ───────────────── */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setCredOpen(o => !o)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <h2 className="text-[11px] font-body font-semibold text-muted-foreground tracking-wider uppercase">Credentials</h2>
          {credOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>
        {credOpen && (
          <div className="px-4 pb-4">
            {!credRevealed ? (
              <button
                onClick={handleRevealCredentials}
                className="w-full py-3 rounded-xl border border-primary/30 text-primary text-[13px] font-body font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={14} /> Reveal credentials
              </button>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Vendor', value: task.vendor.toUpperCase() },
                  { label: 'Login ID', value: task.vendorLogin },
                  { label: 'Email', value: task.vendorEmail },
                  { label: 'Contract No', value: task.contractNo },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground font-body">{f.label}</p>
                      <p className="text-[13px] font-mono text-foreground">{f.value}</p>
                    </div>
                    <button onClick={() => copyToClipboard(f.value, f.label)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <Copy size={13} className="text-muted-foreground" />
                    </button>
                  </div>
                ))}
                {/* Password field */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-body">Password</p>
                    <p className="text-[13px] font-mono text-foreground">{pwVisible ? task.vendorPassword : '••••••••'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPwVisible(v => !v)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      {pwVisible ? <EyeOff size={13} className="text-muted-foreground" /> : <Eye size={13} className="text-muted-foreground" />}
                    </button>
                    <button onClick={() => copyToClipboard(task.vendorPassword, 'Password')} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <Copy size={13} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
                {pwVisible && (
                  <p className="text-[10px] text-warning font-body italic">Auto-redacts in 15 seconds</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Dispatch actions ────────────────────────────── */}
      {!isSent && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-body font-semibold text-muted-foreground tracking-wider uppercase px-1">Dispatch Actions</h2>

          {/* Mark as SENT */}
          {!sentConfirmOpen ? (
            <button
              onClick={() => setSentConfirmOpen(true)}
              className="w-full py-3 rounded-xl bg-success text-white font-body text-[14px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Send size={16} /> Mark as SENT
            </button>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="font-body text-[13px] text-foreground font-medium">Confirm dispatch</p>

              {/* Proof upload */}
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-[13px] font-body text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                  <Upload size={14} /> {proofFile ? proofFile.name : 'Upload proof'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => setProofFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <label className="flex items-center justify-center w-12 rounded-xl border border-dashed border-border text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                  <Camera size={16} />
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setProofFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>

              {!proofFile && (
                <label className="flex items-center gap-2 text-[12px] font-body text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={legacyNoProof} onChange={e => setLegacyNoProof(e.target.checked)} className="rounded" />
                  <CheckSquare size={13} className="hidden" />
                  Delivered without proof (legacy flow)
                </label>
              )}

              <div className="flex gap-2">
                <button onClick={handleMarkSent} className="flex-1 py-2.5 rounded-xl bg-success text-white font-body text-[13px] font-bold hover:opacity-90 transition-opacity">
                  Confirm SENT
                </button>
                <button onClick={() => { setSentConfirmOpen(false); setProofFile(null); setLegacyNoProof(false); }}
                  className="px-4 py-2.5 rounded-xl border border-border text-[13px] font-body text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload proof standalone */}
          {!sentConfirmOpen && (
            <label className="w-full py-2.5 rounded-xl border border-border text-[13px] font-body text-foreground font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors">
              <Upload size={14} /> Upload Proof
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setProofFile(f); addLog(`Proof uploaded: ${f.name}`); toast.success('Proof uploaded'); }
              }} />
            </label>
          )}

          {/* Log issue */}
          {!issueOpen ? (
            <button
              onClick={() => setIssueOpen(true)}
              className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive text-[13px] font-body font-medium flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors"
            >
              <AlertTriangle size={14} /> Log Issue
            </button>
          ) : (
            <div className="bg-card border border-destructive/20 rounded-2xl p-4 space-y-3">
              <textarea
                value={issueNote}
                onChange={e => setIssueNote(e.target.value)}
                rows={3}
                placeholder="Describe the issue…"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-[13px] font-body focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleIssue} className="flex-1 py-2.5 rounded-xl bg-destructive text-white font-body text-[13px] font-bold hover:opacity-90">
                  Submit Issue
                </button>
                <button onClick={() => { setIssueOpen(false); setIssueNote(''); }}
                  className="px-4 py-2.5 rounded-xl border border-border text-[13px] font-body text-muted-foreground hover:bg-muted">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Staff note */}
          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={2}
              placeholder="Add a staff note…"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-[13px] font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <button onClick={handleSaveNote} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-body font-medium hover:opacity-90 flex items-center gap-2">
              <MessageSquare size={13} /> Save Note
            </button>
          </div>
        </section>
      )}

      {isSent && (
        <div className="bg-success/10 border border-success/20 rounded-2xl p-4 text-center space-y-1">
          <p className="font-body text-[14px] text-success font-semibold">Dispatched ✓</p>
          <p className="font-body text-[12px] text-muted-foreground">{task.dispatchedAt}</p>
        </div>
      )}

      {/* ── Activity log ────────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h2 className="text-[11px] font-body font-semibold text-muted-foreground tracking-wider uppercase">Activity Log</h2>
        <div className="space-y-2.5">
          {[...task.activityLog].reverse().map((entry, i) => (
            <div key={i} className="flex gap-3 text-[12px] font-body">
              <Clock size={13} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-foreground">{entry.action}</p>
                <p className="text-muted-foreground">{entry.actor} · {entry.at}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
