/* ═══════════════════════════════════════════════════
   AUDIT LOG — Shared store & mock seed data
   ═══════════════════════════════════════════════════ */

export interface AuditEntry {
  id: string;
  when: string;
  actor: string;
  actorRole: string;
  entity: string;
  entityId: string;
  action: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  ip: string;
  eventId: string | null;
  eventName: string | null;
}

let _auditCounter = 5000;
const auid = () => `aud-${++_auditCounter}`;

const SEED: AuditEntry[] = [
  { id: 'aud-1', when: '2026-04-08T09:12:00Z', actor: 'Alex Rahman', actorRole: 'super_admin', entity: 'purchase', entityId: 'pur1', action: 'purchase.created', before: null, after: { vendor: 'TicketVault', lines: 3, totalQty: 203 }, ip: '10.0.1.12', eventId: 'evt1', eventName: 'FIFA World Cup 2026' },
  { id: 'aud-2', when: '2026-04-08T10:30:00Z', actor: 'Sara Al Mansoori', actorRole: 'ops_manager', entity: 'sale', entityId: 'sale001', action: 'sale.created', before: null, after: { client: 'Meridian Travel', lines: 3, totalQty: 38 }, ip: '10.0.1.15', eventId: 'evt1', eventName: 'FIFA World Cup 2026' },
  { id: 'aud-3', when: '2026-04-08T11:00:00Z', actor: 'James Patel', actorRole: 'sr_operator', entity: 'allocation', entityId: 'run-001', action: 'allocation.commit', before: { unitsAllocated: 0 }, after: { unitsAllocated: 12, runId: 'run-001' }, ip: '10.0.1.20', eventId: 'evt1', eventName: 'FIFA World Cup 2026' },
  { id: 'aud-4', when: '2026-04-08T14:22:00Z', actor: 'Alex Rahman', actorRole: 'super_admin', entity: 'credential', entityId: 'vc1', action: 'credential.view', before: null, after: { vendorId: 'vnd1' }, ip: '10.0.1.12', eventId: 'evt1', eventName: 'FIFA World Cup 2026' },
  { id: 'aud-5', when: '2026-04-08T15:00:00Z', actor: 'Mohammed Hassan', actorRole: 'staff', entity: 'dispatch', entityId: 'SALE001-L1-1', action: 'dispatch.status_change', before: { status: 'NOT_SENT' }, after: { status: 'SENT' }, ip: '10.0.2.5', eventId: 'evt1', eventName: 'FIFA World Cup 2026' },
  { id: 'aud-6', when: '2026-04-09T08:00:00Z', actor: 'Alex Rahman', actorRole: 'super_admin', entity: 'user', entityId: 'u5', action: 'user.role_change', before: { role: 'operator' }, after: { role: 'staff' }, ip: '10.0.1.12', eventId: null, eventName: null },
  { id: 'aud-7', when: '2026-04-09T08:15:00Z', actor: 'Sara Al Mansoori', actorRole: 'ops_manager', entity: 'event', entityId: 'evt1', action: 'event.transition', before: { status: 'BUYING' }, after: { status: 'SELLING' }, ip: '10.0.1.15', eventId: 'evt1', eventName: 'FIFA World Cup 2026' },
  { id: 'aud-8', when: '2026-04-09T09:00:00Z', actor: 'James Patel', actorRole: 'sr_operator', entity: 'credential', entityId: 'vc3', action: 'credential.create', before: null, after: { vendorId: 'vnd2', loginId: 'SeatWave.f1sgp' }, ip: '10.0.1.20', eventId: 'evt2', eventName: 'F1 Singapore GP 2026' },
  { id: 'aud-9', when: '2026-04-09T09:30:00Z', actor: 'Priya Nair', actorRole: 'operator', entity: 'purchase', entityId: 'pur2', action: 'purchase.created', before: null, after: { vendor: 'SeatWave', lines: 2, totalQty: 50 }, ip: '10.0.1.25', eventId: 'evt2', eventName: 'F1 Singapore GP 2026' },
  { id: 'aud-10', when: '2026-04-09T10:00:00Z', actor: 'Alex Rahman', actorRole: 'super_admin', entity: 'oversell', entityId: 'sli-1-2', action: 'oversell.resolved', before: { oversellFlag: true }, after: { oversellFlag: false, resolution: 'APPROVED' }, ip: '10.0.1.12', eventId: 'evt1', eventName: 'FIFA World Cup 2026' },
  { id: 'aud-11', when: '2026-04-09T10:15:00Z', actor: 'Mohammed Hassan', actorRole: 'staff', entity: 'dispatch', entityId: 'SALE001-L1-2', action: 'dispatch.proof_upload', before: null, after: { proofFile: 'IMG_2026.jpg' }, ip: '10.0.2.5', eventId: 'evt1', eventName: 'FIFA World Cup 2026' },
  { id: 'aud-12', when: '2026-04-09T11:00:00Z', actor: 'Sara Al Mansoori', actorRole: 'ops_manager', entity: 'credential', entityId: 'vc4', action: 'credential.deactivate', before: { active: true }, after: { active: false }, ip: '10.0.1.15', eventId: 'evt1', eventName: 'FIFA World Cup 2026' },
  { id: 'aud-13', when: '2026-04-09T12:00:00Z', actor: 'Alex Rahman', actorRole: 'super_admin', entity: 'user', entityId: 'u4', action: 'user.login', before: null, after: { success: true }, ip: '10.0.1.12', eventId: null, eventName: null },
  { id: 'aud-14', when: '2026-04-08T08:00:00Z', actor: 'James Patel', actorRole: 'sr_operator', entity: 'allocation', entityId: 'run-preview-001', action: 'allocation.preview', before: null, after: { salesInvolved: 1, setsUsed: 2, plan: '12 Top Cat 1 → sale001' }, ip: '10.0.1.20', eventId: 'evt1', eventName: 'FIFA World Cup 2026' },
];

let _store = [...SEED];

export function getAuditLog(): AuditEntry[] {
  return [..._store].sort((a, b) => b.when.localeCompare(a.when));
}

export function addAuditEntry(entry: Omit<AuditEntry, 'id'>): AuditEntry {
  const row = { ...entry, id: auid() };
  _store = [row, ..._store];
  return row;
}

/* ═══════════════════════════════════════════════════
   RECONCILIATION — Mock data
   ═══════════════════════════════════════════════════ */

export interface SalesParentReconRow {
  id: string;
  sourceSaleId: string;
  wantedCount: number;
  actualCount: number;
  distRow: string;
  salesLineKey: string;
  touched: boolean;
  action: 'KEEP' | 'PROTECTED_EXCESS' | 'DELETE_CANDIDATE' | 'MISSING_IN_DIST';
}

export const MOCK_SALES_PARENT_RECON: SalesParentReconRow[] = [
  { id: 'spr-1', sourceSaleId: 'sale001', wantedCount: 12, actualCount: 12, distRow: 'SALE001-L1-*', salesLineKey: 'sli-1-1', touched: true, action: 'KEEP' },
  { id: 'spr-2', sourceSaleId: 'sale001', wantedCount: 6, actualCount: 8, distRow: 'SALE001-L2-*', salesLineKey: 'sli-1-2', touched: true, action: 'PROTECTED_EXCESS' },
  { id: 'spr-3', sourceSaleId: 'sale001', wantedCount: 20, actualCount: 20, distRow: 'SALE001-L3-*', salesLineKey: 'sli-1-3', touched: false, action: 'KEEP' },
  { id: 'spr-4', sourceSaleId: 'sale001', wantedCount: 5, actualCount: 0, distRow: '—', salesLineKey: 'sli-orphan-1', touched: false, action: 'MISSING_IN_DIST' },
  { id: 'spr-5', sourceSaleId: 'sale002', wantedCount: 8, actualCount: 10, distRow: 'SALE002-L1-*', salesLineKey: 'sli-2-1', touched: true, action: 'DELETE_CANDIDATE' },
  { id: 'spr-6', sourceSaleId: 'sale002', wantedCount: 4, actualCount: 4, distRow: 'SALE002-L2-*', salesLineKey: 'sli-2-2', touched: false, action: 'KEEP' },
];

export interface PurchaseUnitsAuditRow {
  id: string;
  checkedAt: string;
  source: string;
  match: string;
  game: string;
  vendor: string;
  contract: string;
  category: string;
  purchaseQty: number;
  unitsBefore: number;
  allocated: number;
  finalCount: number;
  issue: 'NONE' | 'ALLOCATED_EXCEEDS_PURCHASES_QTY' | 'EXTRA_AVAILABLE_ROWS_REMOVED' | 'MISSING_ROWS_ADDED' | 'ORPHAN_ALLOCATED_ROW_PRESERVED';
}

export const MOCK_PURCHASE_UNITS_AUDIT: PurchaseUnitsAuditRow[] = [
  { id: 'pua-1', checkedAt: '2026-04-09T08:00:00Z', source: 'pur1', match: 'M01', game: 'Main Match', vendor: 'TicketVault', contract: '2025-100129', category: 'Top Cat 1', purchaseQty: 43, unitsBefore: 43, allocated: 12, finalCount: 43, issue: 'NONE' },
  { id: 'pua-2', checkedAt: '2026-04-09T08:00:00Z', source: 'pur1', match: 'M01', game: 'Main Match', vendor: 'TicketVault', contract: '2025-100129', category: 'Cat 2', purchaseQty: 100, unitsBefore: 102, allocated: 6, finalCount: 100, issue: 'EXTRA_AVAILABLE_ROWS_REMOVED' },
  { id: 'pua-3', checkedAt: '2026-04-09T08:00:00Z', source: 'pur1', match: 'M01', game: 'Main Match', vendor: 'TicketVault', contract: '2025-100129', category: 'Cat 3', purchaseQty: 60, unitsBefore: 58, allocated: 20, finalCount: 60, issue: 'MISSING_ROWS_ADDED' },
  { id: 'pua-4', checkedAt: '2026-04-09T08:01:00Z', source: 'pur2', match: 'SGP-WKD', game: 'Qualifying', vendor: 'SeatWave', contract: '2025-100888', category: 'Grandstand A', purchaseQty: 30, unitsBefore: 30, allocated: 0, finalCount: 30, issue: 'NONE' },
  { id: 'pua-5', checkedAt: '2026-04-09T08:01:00Z', source: 'pur2', match: 'SGP-WKD', game: 'Grand Prix', vendor: 'SeatWave', contract: '2025-100888', category: 'Paddock Club', purchaseQty: 20, unitsBefore: 22, allocated: 0, finalCount: 20, issue: 'EXTRA_AVAILABLE_ROWS_REMOVED' },
];

export interface AllocationAuditRun {
  id: string;
  runId: string;
  startedAt: string;
  operator: string;
  salesInvolved: number;
  setsUsed: number;
  committed: boolean;
  rolledBack: boolean;
  unitFlips: { unitId: string; from: string; to: string; saleLineId: string }[];
}

export const MOCK_ALLOCATION_AUDIT: AllocationAuditRun[] = [
  {
    id: 'aar-1', runId: 'run-001', startedAt: '2026-04-08T11:00:00Z', operator: 'James Patel',
    salesInvolved: 1, setsUsed: 1, committed: true, rolledBack: false,
    unitFlips: [
      { unitId: 'P00001', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00002', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00003', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00004', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00005', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00006', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00007', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00008', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00009', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00010', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00011', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00012', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
    ],
  },
  {
    id: 'aar-2', runId: 'run-preview-001', startedAt: '2026-04-08T08:00:00Z', operator: 'James Patel',
    salesInvolved: 1, setsUsed: 2, committed: false, rolledBack: true,
    unitFlips: [
      { unitId: 'P00001', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
      { unitId: 'P00002', from: 'AVAILABLE', to: 'ALLOCATED', saleLineId: 'sli-1-1' },
    ],
  },
];
