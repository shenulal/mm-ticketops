import { useState, useMemo } from 'react';
import { useAppContext, type NotificationTemplate, type NotificationTrigger, type NotificationLogEntry, type NotificationEventType, type NotificationChannel } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Bell, Plus, Trash2, RefreshCw, Eye, X, Check, AlertTriangle, ChevronDown,
} from 'lucide-react';

/* ── Constants ── */
const ALL_EVENT_TYPES: NotificationEventType[] = [
  'oversell.raised', 'oversell.resolved',
  'sale.created', 'sale.unallocated_72h',
  'allocation.committed', 'allocation.upgrade_approved',
  'portal.generated', 'portal.fully_submitted',
  'dispatch.ticket_unsent_T_minus_65d', 'dispatch.issue_raised', 'sale.fully_dispatched',
  'credential.updated',
  'event.transition',
];

const CHANNEL_STYLES: Record<NotificationChannel, { bg: string; text: string }> = {
  email: { bg: 'bg-blue-100', text: 'text-blue-700' },
  whatsapp: { bg: 'bg-green-100', text: 'text-green-700' },
  slack: { bg: 'bg-purple-100', text: 'text-purple-700' },
  in_app: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-emerald-100 text-emerald-700',
  queued: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

/* ── Toggle ── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-muted'}`}>
      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

/* ── Variable extractor ── */
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))];
}

/* ── Preview renderer ── */
function renderPreview(body: string, variables: Record<string, string>): string {
  const samplePayload: Record<string, string> = {};
  Object.entries(variables).forEach(([k, desc]) => {
    samplePayload[k] = `[${desc}]`;
  });
  let result = body;
  Object.entries(samplePayload).forEach(([k, v]) => {
    result = result.replace(new RegExp(`\\{\\{${k.replace('.', '\\.')}\\}\\}`, 'g'), v);
  });
  // Simple markdown → html
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-accent underline">$1</a>');
  result = result.replace(/\n/g, '<br/>');
  return result;
}

/* ── Template Drawer ── */
function TemplateDrawer({ template, onClose }: { template: NotificationTemplate; onClose: () => void }) {
  const ctx = useAppContext();
  const { currentUser } = useAuth();
  const canEdit = currentUser && ['super_admin', 'ops_manager'].includes(currentUser.role);
  const isStaff = currentUser?.role === 'staff';

  const [tab, setTab] = useState('template');
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.bodyMarkdown);
  const [channels, setChannels] = useState<NotificationChannel[]>([...template.channels]);

  // Triggers
  const triggers = ctx.getTriggersForTemplate(template.id);
  const [addingTrigger, setAddingTrigger] = useState(false);
  const [newEventType, setNewEventType] = useState<NotificationEventType>('oversell.raised');
  const [newRecipients, setNewRecipients] = useState('role:ops_manager');
  const [newConditions, setNewConditions] = useState('');

  // Log
  const log = ctx.getLogForTemplate(template.id).slice(0, 200);

  const detectedVars = useMemo(() => extractVariables(subject + ' ' + body), [subject, body]);

  const toggleChannel = (ch: NotificationChannel) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleSave = () => {
    const vars: Record<string, string> = {};
    detectedVars.forEach(v => { vars[v] = template.variables[v] || v; });
    ctx.updateNotificationTemplate(template.id, { name, subject, bodyMarkdown: body, channels, variables: vars });
    toast.success(`Template "${name}" saved`);
  };

  const handleAddTrigger = () => {
    let conditions: Record<string, any> = {};
    if (newConditions.trim()) {
      try {
        // Simple parse: "field > value" or "field <= value"
        const match = newConditions.match(/^([a-zA-Z_.]+)\s*(>=|<=|>|<|=)\s*(.+)$/);
        if (match) {
          conditions = { [match[1]]: { [match[2]]: isNaN(Number(match[3])) ? match[3] : Number(match[3]) } };
        }
      } catch { /* ignore */ }
    }
    ctx.addNotificationTrigger({
      templateId: template.id,
      eventType: newEventType,
      conditions,
      recipients: newRecipients,
      active: true,
    });
    setAddingTrigger(false);
    setNewConditions('');
    toast.success('Trigger added');
  };

  const handleRetry = (entry: NotificationLogEntry) => {
    ctx.addNotificationLogEntry({
      templateId: entry.templateId,
      triggerId: entry.triggerId,
      eventType: entry.eventType,
      payload: entry.payload,
      recipients: entry.recipients,
      channel: entry.channel,
      sentAt: new Date().toISOString(),
      status: 'queued',
      retryCount: entry.retryCount + 1,
    });
    toast.success('Retry queued');
  };

  // Staff cannot see customer-facing templates
  if (isStaff && template.channels.includes('email')) {
    return (
      <Sheet open onOpenChange={() => onClose()}>
        <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{template.name}</SheetTitle>
            <SheetDescription>You do not have permission to view customer-facing templates.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-primary">{template.name}</SheetTitle>
          <SheetDescription>Code: <span className="font-mono text-xs">{template.code}</span></SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="template" className="flex-1">Template</TabsTrigger>
            <TabsTrigger value="triggers" className="flex-1">Triggers ({triggers.length})</TabsTrigger>
            <TabsTrigger value="log" className="flex-1">Log ({log.length})</TabsTrigger>
          </TabsList>

          {/* ── Template Tab ── */}
          <TabsContent value="template" className="space-y-4 mt-4">
            <div>
              <label className="block font-body text-xs font-medium text-foreground mb-1">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} disabled={!canEdit} />
            </div>

            <div>
              <label className="block font-body text-xs font-medium text-foreground mb-1">Channels</label>
              <div className="flex gap-2">
                {(['email', 'whatsapp', 'slack', 'in_app'] as NotificationChannel[]).map(ch => (
                  <button key={ch} onClick={() => canEdit && toggleChannel(ch)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium font-body border transition-colors ${
                      channels.includes(ch) ? `${CHANNEL_STYLES[ch].bg} ${CHANNEL_STYLES[ch].text} border-transparent` : 'border-border text-muted-foreground'
                    } ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-body text-xs font-medium text-foreground mb-1">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} disabled={!canEdit} className="font-mono text-sm" />
            </div>

            <div>
              <label className="block font-body text-xs font-medium text-foreground mb-1">Body (Markdown)</label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} disabled={!canEdit}
                rows={6} className="font-mono text-sm" />
            </div>

            <div>
              <label className="block font-body text-xs font-medium text-foreground mb-1">Detected Variables</label>
              <div className="flex flex-wrap gap-1.5">
                {detectedVars.length === 0 && <span className="text-xs text-muted-foreground">No variables detected</span>}
                {detectedVars.map(v => (
                  <span key={v} className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px]">
                    {'{{' + v + '}}'}
                  </span>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-muted px-4 py-2 flex items-center gap-2">
                <Eye size={14} className="text-muted-foreground" />
                <span className="font-body text-xs font-medium text-foreground">Preview</span>
              </div>
              <div className="p-4 space-y-3">
                {/* Email preview */}
                {channels.includes('email') && (
                  <div>
                    <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Email</span>
                    <div className="mt-1 border border-border rounded-lg p-3 bg-card">
                      <p className="font-body text-xs font-medium text-foreground mb-2">
                        Subject: {subject.replace(/\{\{([^}]+)\}\}/g, (_, k) => `[${template.variables[k] || k}]`)}
                      </p>
                      <div className="font-body text-xs text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: renderPreview(body, template.variables) }} />
                    </div>
                  </div>
                )}
                {/* WhatsApp preview */}
                {channels.includes('whatsapp') && (
                  <div>
                    <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">WhatsApp (max 4096 chars)</span>
                    <div className="mt-1 bg-[#DCF8C6] rounded-lg p-3 max-w-[300px]">
                      <p className="font-body text-xs text-[#111B21]">
                        {body.replace(/\*\*(.+?)\*\*/g, '*$1*').replace(/\{\{([^}]+)\}\}/g, (_, k) => `[${template.variables[k] || k}]`).slice(0, 4096)}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{body.length}/4096 chars</p>
                  </div>
                )}
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleSave}>Save Template</Button>
                <Button size="sm" variant="outline" onClick={() => toast.success('Test notification sent (demo)')}>
                  Send Test
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Triggers Tab ── */}
          <TabsContent value="triggers" className="mt-4">
            <div className="space-y-3">
              {triggers.length === 0 && (
                <p className="text-sm text-muted-foreground font-body text-center py-4">No triggers configured.</p>
              )}
              {triggers.map(trg => (
                <div key={trg.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-primary">{trg.eventType}</span>
                    <div className="flex items-center gap-2">
                      <Toggle value={trg.active} onChange={v => ctx.updateNotificationTrigger(trg.id, { active: v })} />
                      {canEdit && (
                        <button onClick={() => { ctx.deleteNotificationTrigger(trg.id); toast.success('Trigger deleted'); }}
                          className="text-destructive hover:text-destructive/80">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    Recipients: <span className="font-mono">{trg.recipients}</span>
                  </p>
                  {Object.keys(trg.conditions).length > 0 && (
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      Conditions: <span className="font-mono">{JSON.stringify(trg.conditions)}</span>
                    </p>
                  )}
                </div>
              ))}

              {canEdit && !addingTrigger && (
                <Button size="sm" variant="outline" onClick={() => setAddingTrigger(true)}>
                  <Plus size={14} className="mr-1" /> Add Trigger
                </Button>
              )}

              {addingTrigger && (
                <div className="border border-accent/30 rounded-lg p-3 space-y-3 bg-accent/5">
                  <div>
                    <label className="block font-body text-xs font-medium text-foreground mb-1">Event Type</label>
                    <select value={newEventType} onChange={e => setNewEventType(e.target.value as NotificationEventType)}
                      className="w-full h-9 px-3 rounded-lg font-body text-sm border border-border bg-card">
                      {ALL_EVENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-body text-xs font-medium text-foreground mb-1">Recipients Expression</label>
                    <Input value={newRecipients} onChange={e => setNewRecipients(e.target.value)}
                      placeholder="role:ops_manager, sale.assigned_operator" className="font-mono text-sm" />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Examples: role:ops_manager, sale.assigned_operator, client.primary_contact
                    </p>
                  </div>
                  <div>
                    <label className="block font-body text-xs font-medium text-foreground mb-1">Conditions (optional)</label>
                    <Input value={newConditions} onChange={e => setNewConditions(e.target.value)}
                      placeholder="sale.totalValue > 100000" className="font-mono text-sm" />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Simple rule: field operator value (e.g. dispatch.daysToMatch {'<='} 65)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddTrigger}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddingTrigger(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Log Tab ── */}
          <TabsContent value="log" className="mt-4">
            {log.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body text-center py-8">No sends recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">When</TableHead>
                      <TableHead className="text-xs">Channel</TableHead>
                      <TableHead className="text-xs">Recipients</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {log.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {format(new Date(entry.sentAt), 'dd MMM HH:mm')}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CHANNEL_STYLES[entry.channel]?.bg} ${CHANNEL_STYLES[entry.channel]?.text}`}>
                            {entry.channel}
                          </span>
                        </TableCell>
                        <TableCell className="font-body text-xs">{entry.recipients.join(', ')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[entry.status]}`}>
                            {entry.status}
                          </span>
                          {entry.error && (
                            <span className="block text-[10px] text-destructive mt-0.5">{entry.error}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.status === 'failed' && canEdit && (
                            <button onClick={() => handleRetry(entry)} className="text-accent hover:text-accent/80" title="Retry">
                              <RefreshCw size={13} />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/* ── Main Page ── */
export default function NotificationTemplatesPage() {
  const ctx = useAppContext();
  const { currentUser } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const templates = ctx.notificationTemplates;
  const selectedTemplate = templates.find(t => t.id === selectedId);

  // Compute last sent per template
  const lastSentMap = useMemo(() => {
    const map: Record<string, string> = {};
    ctx.notificationLog.forEach(l => {
      if (!map[l.templateId] || l.sentAt > map[l.templateId]) {
        map[l.templateId] = l.sentAt;
      }
    });
    return map;
  }, [ctx.notificationLog]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] text-primary">Notification Templates</h1>
          <p className="font-body text-sm text-muted-foreground">Manage templates, triggers, and delivery channels.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Channels</TableHead>
              <TableHead className="text-xs text-center">Triggers</TableHead>
              <TableHead className="text-xs">Last Sent</TableHead>
              <TableHead className="text-xs text-center">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map(t => {
              const triggerCount = ctx.getTriggersForTemplate(t.id).length;
              const lastSent = lastSentMap[t.id];
              return (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(t.id)}>
                  <TableCell className="font-body text-sm font-medium text-foreground">{t.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.code}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {t.channels.map(ch => (
                        <span key={ch} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CHANNEL_STYLES[ch].bg} ${CHANNEL_STYLES[ch].text}`}>
                          {ch}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">{triggerCount}</TableCell>
                  <TableCell className="font-body text-xs text-muted-foreground">
                    {lastSent ? format(new Date(lastSent), 'dd MMM HH:mm') : '—'}
                  </TableCell>
                  <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                    <Toggle value={t.active} onChange={v => ctx.updateNotificationTemplate(t.id, { active: v })} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedTemplate && (
        <TemplateDrawer template={selectedTemplate} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
