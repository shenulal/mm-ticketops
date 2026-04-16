export type UserRole = 'super_admin' | 'ops_manager' | 'sr_operator' | 'operator' | 'staff' | 'client' | 'supplier';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  vendorGroups?: string[];
}

export const MOCK_USERS: AppUser[] = [
  { id: 'u1', name: 'Alex Rahman', email: 'admin@ticketops.ae', role: 'super_admin', initials: 'AR' },
  { id: 'u2', name: 'Sara Al Mansoori', email: 'manager@ticketops.ae', role: 'ops_manager', initials: 'SM' },
  { id: 'u3', name: 'James Patel', email: 'sroperator@ticketops.ae', role: 'sr_operator', initials: 'JP' },
  { id: 'u4', name: 'Priya Nair', email: 'operator@ticketops.ae', role: 'operator', initials: 'PN' },
  { id: 'u5', name: 'Mohammed Hassan', email: 'staff@ticketops.ae', role: 'staff', initials: 'MH' },
  { id: 'u6', name: 'David Clarke', email: 'client@meridiantravel.ae', role: 'client', initials: 'DC' },
  { id: 'u7', name: 'Clara Dufresne', email: 'supplier@ticketvault.com', role: 'supplier', initials: 'CD', vendorGroups: ['TicketVault'] },
];

export const MOCK_EVENTS = [
  { id: 'evt1', code: 'FIFA-WC-2026', name: 'FIFA World Cup 2026', status: 'SELLING', matches: 64 },
  { id: 'evt2', code: 'F1-SGP-2026', name: 'F1 Singapore GP 2026', status: 'ALLOCATING', matches: 3 },
];

export const MOCK_MATCHES = [
  { id: 'm01', code: 'M01', teams: 'MEX v RSA', date: '21 Jun 2026 15:00', venue: 'Estadio Azteca', city: 'Mexico City', eventId: 'evt1' },
  { id: 'm02', code: 'M02', teams: 'USA v CAN', date: '22 Jun 2026 18:00', venue: 'SoFi Stadium', city: 'Los Angeles', eventId: 'evt1' },
  { id: 'm03', code: 'M03', teams: 'BRA v ARG', date: '23 Jun 2026 20:00', venue: 'MetLife Stadium', city: 'New York', eventId: 'evt1' },
  { id: 'sg-weekend', code: 'SGP-WKD', teams: 'Singapore GP Weekend', date: '19–21 Sep 2026', venue: 'Marina Bay Street Circuit', city: 'Singapore', eventId: 'evt2' },
];

// === SUB-GAMES ===

export interface Category {
  id: string;
  label: string;
  level: number;
  isActive: boolean;
}

export interface SubGame {
  id: string;
  matchId: string;
  name: string;
  sessionType: string;
  startTime: string;
  isDefault: boolean;
  categories: Category[];
}

export const MOCK_SUBGAMES: SubGame[] = [
  {
    id: 'sg-m01-main', matchId: 'm01', name: 'Main Match', sessionType: 'MATCH',
    startTime: '21 Jun 2026 15:00', isDefault: true,
    categories: [
      { id: 'topcat1', label: 'Top Cat 1', level: 1, isActive: true },
      { id: 'cat2', label: 'Cat 2', level: 2, isActive: true },
      { id: 'cat3', label: 'Cat 3', level: 3, isActive: true },
      { id: 'cat4', label: 'Cat 4', level: 4, isActive: true },
    ],
  },
  {
    id: 'sg-m02-main', matchId: 'm02', name: 'Main Match', sessionType: 'MATCH',
    startTime: '22 Jun 2026 18:00', isDefault: true,
    categories: [
      { id: 'topcat1', label: 'Top Cat 1', level: 1, isActive: true },
      { id: 'cat2', label: 'Cat 2', level: 2, isActive: true },
      { id: 'cat3', label: 'Cat 3', level: 3, isActive: true },
    ],
  },
  {
    id: 'sg-f1-fp1', matchId: 'sg-weekend', name: 'Free Practice 1', sessionType: 'FP',
    startTime: '19 Sep 2026 09:00', isDefault: false,
    categories: [
      { id: 'ga', label: 'General Admission', level: 3, isActive: true },
      { id: 'gs-b', label: 'Grandstand B', level: 2, isActive: true },
    ],
  },
  {
    id: 'sg-f1-quali', matchId: 'sg-weekend', name: 'Qualifying Session', sessionType: 'QUALIFYING',
    startTime: '20 Sep 2026 14:00', isDefault: false,
    categories: [
      { id: 'gs-a', label: 'Grandstand A', level: 1, isActive: true },
      { id: 'gs-b', label: 'Grandstand B', level: 2, isActive: true },
      { id: 'ga', label: 'General Admission', level: 3, isActive: true },
    ],
  },
  {
    id: 'sg-f1-sprint', matchId: 'sg-weekend', name: 'Sprint Race', sessionType: 'SPRINT',
    startTime: '21 Sep 2026 11:00', isDefault: false,
    categories: [
      { id: 'gs-a', label: 'Grandstand A', level: 1, isActive: true },
      { id: 'gs-b', label: 'Grandstand B', level: 2, isActive: true },
      { id: 'ga', label: 'General Admission', level: 3, isActive: true },
    ],
  },
  {
    id: 'sg-f1-race', matchId: 'sg-weekend', name: 'Grand Prix (Main Race)', sessionType: 'RACE',
    startTime: '21 Sep 2026 20:00', isDefault: false,
    categories: [
      { id: 'paddock', label: 'Paddock Club', level: 1, isActive: true },
      { id: 'gold-vip', label: 'Gold Hospitality', level: 2, isActive: true },
      { id: 'gs-a', label: 'Grandstand A', level: 3, isActive: true },
      { id: 'gs-b-f', label: 'Grandstand B–F', level: 4, isActive: true },
      { id: 'ga', label: 'General Admission', level: 5, isActive: true },
    ],
  },
];

// Helper functions
export function getSubGamesForMatch(matchId: string): SubGame[] {
  return MOCK_SUBGAMES.filter(sg => sg.matchId === matchId);
}

export function hasMultipleSubGames(matchId: string): boolean {
  return getSubGamesForMatch(matchId).length > 1;
}

export function getCategoriesForSubGame(subGameId: string): Category[] {
  return MOCK_SUBGAMES.find(sg => sg.id === subGameId)?.categories ?? [];
}

export function getHierarchyForSubGame(subGameId: string): Category[] {
  const sg = MOCK_SUBGAMES.find(s => s.id === subGameId);
  if (!sg) return [];
  return [...sg.categories].sort((a, b) => a.level - b.level);
}

export function getInventoryKey(subGameId: string, categoryId: string): string {
  return `${subGameId}::${categoryId}`;
}

// === PURCHASE LINE ITEMS ===

export interface PurchaseLineItem {
  id: string;
  purchaseId: string;
  subGameId: string;
  categoryId: string;
  categoryLabel: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  lineStatus: string;
}

export const MOCK_PURCHASE_LINE_ITEMS: PurchaseLineItem[] = [
  { id: 'pli-1-1', purchaseId: 'pur1', subGameId: 'sg-m01-main', categoryId: 'topcat1', categoryLabel: 'Top Cat 1', qty: 43, unitPrice: 27525, lineTotal: 1183575, lineStatus: 'ACTIVE' },
  { id: 'pli-1-2', purchaseId: 'pur1', subGameId: 'sg-m01-main', categoryId: 'cat2', categoryLabel: 'Cat 2', qty: 100, unitPrice: 11748, lineTotal: 1174800, lineStatus: 'ACTIVE' },
  { id: 'pli-1-3', purchaseId: 'pur1', subGameId: 'sg-m01-main', categoryId: 'cat3', categoryLabel: 'Cat 3', qty: 60, unitPrice: 6612, lineTotal: 396720, lineStatus: 'ACTIVE' },
  { id: 'pli-2-1', purchaseId: 'pur2', subGameId: 'sg-f1-quali', categoryId: 'gs-a', categoryLabel: 'Grandstand A', qty: 30, unitPrice: 9200, lineTotal: 276000, lineStatus: 'ACTIVE' },
  { id: 'pli-2-2', purchaseId: 'pur2', subGameId: 'sg-f1-race', categoryId: 'paddock', categoryLabel: 'Paddock Club', qty: 20, unitPrice: 44000, lineTotal: 880000, lineStatus: 'ACTIVE' },
];

// === PURCHASES ===

export interface Purchase {
  id: string;
  vendor: string;
  contract: string;
  matchId: string;
  date: string;
  notes: string;
  status: string;
  readonly lines: PurchaseLineItem[];
  readonly totalQty: number;
  readonly totalValue: number;
}

export const MOCK_PURCHASES: Purchase[] = [
  {
    id: 'pur1', vendor: 'TicketVault', contract: '2025-100129', matchId: 'm01',
    date: '16 Apr 2026', notes: 'Full block from venue section C', status: 'ACTIVE',
    get lines() { return MOCK_PURCHASE_LINE_ITEMS.filter(l => l.purchaseId === 'pur1'); },
    get totalQty() { return this.lines.reduce((s, l) => s + l.qty, 0); },
    get totalValue() { return this.lines.reduce((s, l) => s + l.lineTotal, 0); },
  },
  {
    id: 'pur2', vendor: 'SeatWave', contract: '2025-100888', matchId: 'sg-weekend',
    date: '16 Apr 2026', notes: 'F1 Singapore block booking', status: 'ACTIVE',
    get lines() { return MOCK_PURCHASE_LINE_ITEMS.filter(l => l.purchaseId === 'pur2'); },
    get totalQty() { return this.lines.reduce((s, l) => s + l.qty, 0); },
    get totalValue() { return this.lines.reduce((s, l) => s + l.lineTotal, 0); },
  },
];

// === SALE LINE ITEMS ===

export interface SaleLineItem {
  id: string;
  saleId: string;
  subGameId: string;
  categoryId: string;
  categoryLabel: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  status: string;
  oversellFlag: boolean;
}

export const MOCK_SALE_LINE_ITEMS: SaleLineItem[] = [
  { id: 'sli-1-1', saleId: 'sale001', subGameId: 'sg-m01-main', categoryId: 'topcat1', categoryLabel: 'Top Cat 1', qty: 12, unitPrice: 34881, lineTotal: 418572, status: 'ALLOCATED', oversellFlag: false },
  { id: 'sli-1-2', saleId: 'sale001', subGameId: 'sg-m01-main', categoryId: 'cat2', categoryLabel: 'Cat 2', qty: 6, unitPrice: 15420, lineTotal: 92520, status: 'PENDING_APPROVAL', oversellFlag: true },
  { id: 'sli-1-3', saleId: 'sale001', subGameId: 'sg-m01-main', categoryId: 'cat3', categoryLabel: 'Cat 3', qty: 20, unitPrice: 10280, lineTotal: 205600, status: 'UNALLOCATED', oversellFlag: false },
  { id: 'sli-2-1', saleId: 'sale002', subGameId: 'sg-f1-quali', categoryId: 'gs-a', categoryLabel: 'Grandstand A', qty: 8, unitPrice: 13200, lineTotal: 105600, status: 'UNALLOCATED', oversellFlag: false },
  { id: 'sli-2-2', saleId: 'sale002', subGameId: 'sg-f1-race', categoryId: 'paddock', categoryLabel: 'Paddock Club', qty: 4, unitPrice: 58000, lineTotal: 232000, status: 'UNALLOCATED', oversellFlag: false },
];

// === SALES ===

export interface Sale {
  id: string;
  client: string;
  contract: string;
  invoiceNumber: string;
  matchId: string;
  date: string;
  notes: string;
  readonly lines: SaleLineItem[];
  readonly totalQty: number;
  readonly totalValue: number;
  readonly status: string;
}

export const MOCK_SALES: Sale[] = [
  {
    id: 'sale001', client: 'Meridian Travel', contract: '2025-10885', invoiceNumber: 'INV-2026-0401',
    matchId: 'm01', date: '16 Apr 2026', notes: '',
    get lines() { return MOCK_SALE_LINE_ITEMS.filter(l => l.saleId === 'sale001'); },
    get totalQty() { return this.lines.reduce((s, l) => s + l.qty, 0); },
    get totalValue() { return this.lines.reduce((s, l) => s + l.lineTotal, 0); },
    get status() {
      if (this.lines.every(l => l.status === 'FULFILLED')) return 'FULFILLED';
      if (this.lines.some(l => l.oversellFlag)) return 'PARTIAL_PENDING';
      if (this.lines.every(l => l.status === 'ALLOCATED')) return 'ALLOCATED';
      if (this.lines.some(l => l.status === 'ALLOCATED')) return 'PARTIAL_ALLOCATED';
      return 'UNALLOCATED';
    },
  },
  {
    id: 'sale002', client: 'Apex Holdings', contract: '', invoiceNumber: 'INV-2026-0402',
    matchId: 'sg-weekend', date: '16 Apr 2026', notes: 'F1 Singapore package',
    get lines() { return MOCK_SALE_LINE_ITEMS.filter(l => l.saleId === 'sale002'); },
    get totalQty() { return this.lines.reduce((s, l) => s + l.qty, 0); },
    get totalValue() { return this.lines.reduce((s, l) => s + l.lineTotal, 0); },
    get status() { return 'UNALLOCATED'; },
  },
];

// === UNITS ===

export type UnitStatus = 'ALLOCATED' | 'AVAILABLE' | 'CANCELLED' | 'REPLACED';

export interface PurchaseUnit {
  id: string;
  purchaseId: string;
  lineItemId: string;
  subGameId: string;
  categoryId: string;
  categoryLabel: string;
  setId: string;
  setSize: number;
  setPos: number;
  vendor: string;
  contract: string;
  matchId: string;
  block: string;
  row: string;
  seat: string;
  status: UnitStatus;
  allocatedToLineItemId: string | null;
  replacedByUnitId: string | null;
  cancelledReason: string | null;
}

// Generate realistic multi-set units for PUR-001 Line 1 (Top Cat 1 × 43)
// Sets: 12 + 10 + 10 + 6 + 5 = 43
const PUR1_L1_SETS = [
  { setId: 'PR001-L1-S01', size: 12, block: 'C', rowStart: '12', seatStart: 14 },
  { setId: 'PR001-L1-S02', size: 10, block: 'C', rowStart: '13', seatStart: 1 },
  { setId: 'PR001-L1-S03', size: 10, block: 'C', rowStart: '13', seatStart: 11 },
  { setId: 'PR001-L1-S04', size: 6, block: 'D', rowStart: '1', seatStart: 1 },
  { setId: 'PR001-L1-S05', size: 5, block: 'D', rowStart: '1', seatStart: 7 },
];

// PUR-001 Line 2 (Cat 2 × 100): Sets of 20+20+20+20+10+10 = 100
const PUR1_L2_SETS = [
  { setId: 'PR001-L2-S01', size: 20, block: 'E', rowStart: '1', seatStart: 1 },
  { setId: 'PR001-L2-S02', size: 20, block: 'E', rowStart: '1', seatStart: 21 },
  { setId: 'PR001-L2-S03', size: 20, block: 'E', rowStart: '2', seatStart: 1 },
  { setId: 'PR001-L2-S04', size: 20, block: 'E', rowStart: '2', seatStart: 21 },
  { setId: 'PR001-L2-S05', size: 10, block: 'F', rowStart: '1', seatStart: 1 },
  { setId: 'PR001-L2-S06', size: 10, block: 'F', rowStart: '1', seatStart: 11 },
];

// PUR-001 Line 3 (Cat 3 × 60): Sets of 20+20+10+10 = 60
const PUR1_L3_SETS = [
  { setId: 'PR001-L3-S01', size: 20, block: 'G', rowStart: '1', seatStart: 1 },
  { setId: 'PR001-L3-S02', size: 20, block: 'G', rowStart: '1', seatStart: 21 },
  { setId: 'PR001-L3-S03', size: 10, block: 'G', rowStart: '2', seatStart: 1 },
  { setId: 'PR001-L3-S04', size: 10, block: 'G', rowStart: '2', seatStart: 11 },
];

function generateUnits(
  lineId: string, purchaseId: string, subGameId: string, categoryId: string, categoryLabel: string,
  vendor: string, contract: string, matchId: string,
  sets: { setId: string; size: number; block: string; rowStart: string; seatStart: number }[],
  startIdx: number,
  allocations: { lineItemId: string; count: number }[] = [],
): PurchaseUnit[] {
  const units: PurchaseUnit[] = [];
  let globalIdx = startIdx;
  let allocRemaining = [...allocations];

  for (const set of sets) {
    for (let pos = 0; pos < set.size; pos++) {
      let allocTo: string | null = null;
      for (const alloc of allocRemaining) {
        if (alloc.count > 0) {
          allocTo = alloc.lineItemId;
          alloc.count--;
          break;
        }
      }
      units.push({
        id: `P${String(globalIdx).padStart(5, '0')}`,
        purchaseId, lineItemId: lineId, subGameId, categoryId, categoryLabel,
        setId: set.setId, setSize: set.size, setPos: pos + 1,
        vendor, contract, matchId,
        block: set.block, row: set.rowStart, seat: String(set.seatStart + pos),
        status: allocTo ? 'ALLOCATED' : 'AVAILABLE',
        allocatedToLineItemId: allocTo,
        replacedByUnitId: null,
        cancelledReason: null,
      });
      globalIdx++;
    }
  }
  return units;
}

export const MOCK_UNITS: PurchaseUnit[] = [
  // PUR-001, Line 1: Top Cat 1 × 43 (12 allocated to sli-1-1)
  ...generateUnits('pli-1-1', 'pur1', 'sg-m01-main', 'topcat1', 'Top Cat 1',
    'TicketVault', '2025-100129', 'm01', PUR1_L1_SETS, 1,
    [{ lineItemId: 'sli-1-1', count: 12 }]),
  // PUR-001, Line 2: Cat 2 × 100 (6 allocated to sli-1-2)
  ...generateUnits('pli-1-2', 'pur1', 'sg-m01-main', 'cat2', 'Cat 2',
    'TicketVault', '2025-100129', 'm01', PUR1_L2_SETS, 44,
    [{ lineItemId: 'sli-1-2', count: 6 }]),
  // PUR-001, Line 3: Cat 3 × 60 (20 allocated to sli-1-3)
  ...generateUnits('pli-1-3', 'pur1', 'sg-m01-main', 'cat3', 'Cat 3',
    'TicketVault', '2025-100129', 'm01', PUR1_L3_SETS, 144,
    [{ lineItemId: 'sli-1-3', count: 20 }]),
];

// === TICKET SET HELPERS ===

export interface TicketSet {
  setId: string;
  vendor: string;
  purchaseId: string;
  lineItemId: string;
  subGameId: string;
  categoryId: string;
  categoryLabel: string;
  block: string;
  row: string;
  totalSize: number;
  available: number;
  allocated: number;
  cancelled: number;
  units: PurchaseUnit[];
}

export function getTicketSets(subGameId?: string, categoryId?: string): TicketSet[] {
  const filtered = MOCK_UNITS.filter(u =>
    (!subGameId || u.subGameId === subGameId) &&
    (!categoryId || u.categoryId === categoryId)
  );
  const grouped: Record<string, PurchaseUnit[]> = {};
  for (const u of filtered) {
    (grouped[u.setId] = grouped[u.setId] || []).push(u);
  }
  return Object.entries(grouped).map(([setId, units]) => {
    const first = units[0];
    return {
      setId,
      vendor: first.vendor,
      purchaseId: first.purchaseId,
      lineItemId: first.lineItemId,
      subGameId: first.subGameId,
      categoryId: first.categoryId,
      categoryLabel: first.categoryLabel,
      block: first.block,
      row: first.row,
      totalSize: units.length,
      available: units.filter(u => u.status === 'AVAILABLE').length,
      allocated: units.filter(u => u.status === 'ALLOCATED').length,
      cancelled: units.filter(u => u.status === 'CANCELLED' || u.status === 'REPLACED').length,
      units,
    };
  });
}

export interface VendorInventory {
  vendor: string;
  subGameId: string;
  categoryId: string;
  categoryLabel: string;
  totalUnits: number;
  availableUnits: number;
  sets: TicketSet[];
  setBreakdown: string; // e.g. "4 + 4 + 2"
}

export function getInventoryByVendor(subGameId: string, categoryId: string): VendorInventory[] {
  const sets = getTicketSets(subGameId, categoryId);
  const byVendor: Record<string, TicketSet[]> = {};
  for (const s of sets) {
    (byVendor[s.vendor] = byVendor[s.vendor] || []).push(s);
  }
  return Object.entries(byVendor).map(([vendor, vendorSets]) => {
    const availSets = vendorSets.filter(s => s.available > 0);
    return {
      vendor,
      subGameId,
      categoryId,
      categoryLabel: vendorSets[0].categoryLabel,
      totalUnits: vendorSets.reduce((s, ts) => s + ts.totalSize, 0),
      availableUnits: vendorSets.reduce((s, ts) => s + ts.available, 0),
      sets: vendorSets,
      setBreakdown: availSets.map(s => String(s.available)).join(' + ') || '0',
    };
  });
}

export function getAvailableUnitsFromSet(setId: string): PurchaseUnit[] {
  return MOCK_UNITS.filter(u => u.setId === setId && u.status === 'AVAILABLE')
    .sort((a, b) => a.setPos - b.setPos);
}

export function getAllocatedUnitsForSaleLine(saleLineId: string): PurchaseUnit[] {
  return MOCK_UNITS.filter(u => u.allocatedToLineItemId === saleLineId);
}

// === DISTRIBUTION ROWS ===

export interface DistRow {
  id: string;
  saleId: string;
  lineItemId: string;
  subGameId: string;
  categoryId: string;
  categoryLabel: string;
  unitId: string | null;
  status: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  dispatchStatus: string;
}

export const MOCK_DIST_ROWS: DistRow[] = [
  // SALE-001, Line 1: Top Cat 1 × 12
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `SALE001-L1-${i + 1}`,
    saleId: 'sale001', lineItemId: 'sli-1-1',
    subGameId: 'sg-m01-main', categoryId: 'topcat1', categoryLabel: 'Top Cat 1',
    unitId: `P${String(i + 1).padStart(5, '0')}`,
    status: i === 0 ? 'SENT' : 'NOT_SENT',
    clientFirstName: i === 0 ? 'John' : '',
    clientLastName: i === 0 ? 'Smith' : '',
    clientEmail: i === 0 ? 'john.smith@meridiantravel.ae' : '',
    dispatchStatus: i === 0 ? 'SENT' : 'NOT_SENT',
  })),
  // SALE-001, Line 2: Cat 2 × 6 (oversold)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `SALE001-L2-${i + 1}`,
    saleId: 'sale001', lineItemId: 'sli-1-2',
    subGameId: 'sg-m01-main', categoryId: 'cat2', categoryLabel: 'Cat 2',
    unitId: null, status: 'PENDING_APPROVAL',
    clientFirstName: '', clientLastName: '', clientEmail: '', dispatchStatus: 'NOT_SENT',
  })),
  // SALE-001, Line 3: Cat 3 × 20
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `SALE001-L3-${i + 1}`,
    saleId: 'sale001', lineItemId: 'sli-1-3',
    subGameId: 'sg-m01-main', categoryId: 'cat3', categoryLabel: 'Cat 3',
    unitId: `P${String(i + 144).padStart(5, '0')}`,
    status: 'ALLOCATED',
    clientFirstName: '', clientLastName: '', clientEmail: '', dispatchStatus: 'NOT_SENT',
  })),
];

// === INVENTORY LOOKUP ===

export function getInventoryAvailable(subGameId: string, categoryId: string): number {
  return MOCK_UNITS.filter(
    u => u.subGameId === subGameId && u.categoryId === categoryId && u.status === 'AVAILABLE'
  ).length;
}

// ─── INVENTORY ANALYTICS ───────────────────────────────

export function getInventorySummary(subGameId?: string, categoryId?: string) {
  const units = MOCK_UNITS.filter(u =>
    (!subGameId || u.subGameId === subGameId) &&
    (!categoryId || u.categoryId === categoryId)
  );
  return {
    total:      units.length,
    available:  units.filter(u => u.status === 'AVAILABLE').length,
    allocated:  units.filter(u => u.status === 'ALLOCATED').length,
    cancelled:  units.filter(u => u.status === 'CANCELLED' || u.status === 'REPLACED').length,
    dispatched: MOCK_DIST_ROWS.filter(r =>
      r.dispatchStatus === 'SENT' &&
      (!subGameId || r.subGameId === subGameId) &&
      (!categoryId || r.categoryId === categoryId)
    ).length,
  };
}

// ─── REVENUE ANALYTICS ────────────────────────────────

export function getRevenueSummary(eventId?: string, matchId?: string, subGameId?: string) {
  const lines = MOCK_SALE_LINE_ITEMS.filter(l => {
    if (subGameId && l.subGameId !== subGameId) return false;
    if (matchId) {
      const sg = MOCK_SUBGAMES.find(s => s.id === l.subGameId);
      if (sg && sg.matchId !== matchId) return false;
    }
    return true;
  });
  const purchaseLines = MOCK_PURCHASE_LINE_ITEMS.filter(l => {
    if (subGameId && l.subGameId !== subGameId) return false;
    if (matchId) {
      const sg = MOCK_SUBGAMES.find(s => s.id === l.subGameId);
      if (sg && sg.matchId !== matchId) return false;
    }
    return true;
  });
  const totalSaleRevenue  = lines.reduce((s, l) => s + l.lineTotal, 0);
  const totalPurchaseCost = purchaseLines.reduce((s, l) => s + l.lineTotal, 0);
  const realisedRevenue   = lines
    .filter(l => l.status === 'ALLOCATED')
    .reduce((s, l) => {
      const dispatched = MOCK_DIST_ROWS.filter(r =>
        r.lineItemId === l.id && r.dispatchStatus === 'SENT'
      ).length;
      return s + dispatched * l.unitPrice;
    }, 0);
  const committedRevenue = lines
    .filter(l => l.status === 'ALLOCATED')
    .reduce((s, l) => s + l.lineTotal, 0) - realisedRevenue;
  const pipelineRevenue = lines
    .filter(l => l.status === 'UNALLOCATED')
    .reduce((s, l) => s + l.lineTotal, 0);
  const atRiskRevenue = lines
    .filter(l => l.status === 'PENDING_APPROVAL')
    .reduce((s, l) => s + l.lineTotal, 0);
  const grossMargin = totalSaleRevenue - totalPurchaseCost;
  const marginPct   = totalPurchaseCost > 0
    ? ((grossMargin / totalPurchaseCost) * 100).toFixed(1)
    : '0.0';
  const unsoldInventoryValue = MOCK_PURCHASE_LINE_ITEMS
    .reduce((s, pl) => {
      const avail = getInventoryAvailable(pl.subGameId, pl.categoryId);
      return s + avail * pl.unitPrice;
    }, 0);
  return { totalSaleRevenue, totalPurchaseCost, grossMargin, marginPct,
    realisedRevenue, committedRevenue, pipelineRevenue, atRiskRevenue,
    unsoldInventoryValue };
}

// ─── SELL-THROUGH BY CATEGORY ───────────────────────────

export function getSellThroughByCat(subGameId: string) {
  const sg = MOCK_SUBGAMES.find(s => s.id === subGameId);
  if (!sg) return [];
  return sg.categories.map(cat => {
    const purchased = MOCK_PURCHASE_LINE_ITEMS
      .filter(l => l.subGameId === subGameId && l.categoryId === cat.id)
      .reduce((s, l) => s + l.qty, 0);
    const sold = MOCK_SALE_LINE_ITEMS
      .filter(l => l.subGameId === subGameId && l.categoryId === cat.id)
      .reduce((s, l) => s + l.qty, 0);
    const dispatched = MOCK_DIST_ROWS
      .filter(r => r.subGameId === subGameId && r.categoryId === cat.id && r.dispatchStatus === 'SENT')
      .length;
    const pct = purchased > 0 ? Math.round((sold / purchased) * 100) : 0;
    const revSold = MOCK_SALE_LINE_ITEMS
      .filter(l => l.subGameId === subGameId && l.categoryId === cat.id)
      .reduce((s, l) => s + l.lineTotal, 0);
    const costPurch = MOCK_PURCHASE_LINE_ITEMS
      .filter(l => l.subGameId === subGameId && l.categoryId === cat.id)
      .reduce((s, l) => s + l.lineTotal, 0);
    return { ...cat, purchased, sold, dispatched, sellThroughPct: pct,
      revenueFromSales: revSold, purchaseCost: costPurch,
      margin: revSold - costPurch };
  });
}

// ─── CLIENT REVENUE BREAKDOWN ────────────────────────────

export function getRevenueByClient() {
  const clients = [...new Set(MOCK_SALES.map(s => s.client))];
  return clients.map(client => {
    const sales = MOCK_SALES.filter(s => s.client === client);
    const total = sales.reduce((s, sale) => s + sale.totalValue, 0);
    const lineCount = sales.reduce((s, sale) => s + sale.lines.length, 0);
    return { client, totalRevenue: total, saleCount: sales.length, lineCount };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// ─── DISPATCH URGENCY ────────────────────────────────────

export function getDispatchUrgency(matchId: string) {
  const match = MOCK_MATCHES.find(m => m.id === matchId);
  if (!match) return { daysToEvent: 0, totalTickets: 0, sent: 0, pending: 0, urgent: false };
  const eventDate = new Date('2026-06-21');
  const today = new Date('2026-04-17');
  const daysToEvent = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 86400));
  const allRows = MOCK_DIST_ROWS.filter(r => {
    const sg = MOCK_SUBGAMES.find(s => s.id === r.subGameId);
    return sg && sg.matchId === matchId;
  });
  const sent = allRows.filter(r => r.dispatchStatus === 'SENT').length;
  const pending = allRows.length - sent;
  return { daysToEvent, totalTickets: allRows.length, sent, pending,
    urgent: daysToEvent <= 7 && pending > 0 };
}

// ─── PORTAL COMPLETION ───────────────────────────────────

export function getPortalFunnel(saleId: string) {
  const sale = MOCK_SALES.find(s => s.id === saleId);
  if (!sale) return null;
  const rows = MOCK_DIST_ROWS.filter(r => r.saleId === saleId);
  const total = rows.length;
  const hasName = rows.filter(r => r.clientFirstName && r.clientLastName).length;
  const hasEmail = rows.filter(r => r.clientEmail).length;
  const fullyFilled = rows.filter(r => r.clientFirstName && r.clientLastName && r.clientEmail).length;
  return { total, hasName, hasEmail, fullyFilled,
    completionPct: total > 0 ? Math.round((fullyFilled / total) * 100) : 0 };
}

// ─── STAFF PERFORMANCE (simplified mock) ────────────────

export function getStaffPerformance() {
  return MOCK_USERS.filter(u => u.role === 'staff').map(u => {
    const tasks = MOCK_STAFF_TASKS.filter(t => t.assignedTo === u.id);
    const sent = tasks.filter(t => t.status === 'SENT').length;
    return { name: u.name, total: tasks.length, sent, pending: tasks.length - sent,
      completionRate: tasks.length > 0 ? Math.round((sent / tasks.length) * 100) : 0 };
  });
}

// ─── REVENUE OVER TIME (mock daily data) ─────────────────

export const MOCK_REVENUE_TIMELINE = [
  { date: 'Apr 10', saleRevenue: 0,      purchaseCost: 0,      margin: 0 },
  { date: 'Apr 12', saleRevenue: 0,      purchaseCost: 750795, margin: -750795 },
  { date: 'Apr 14', saleRevenue: 0,      purchaseCost: 750795, margin: -750795 },
  { date: 'Apr 16', saleRevenue: 716692, purchaseCost: 750795, margin: -34103 },
  { date: 'Apr 17', saleRevenue: 716692, purchaseCost: 750795, margin: -34103 },
  { date: 'Apr 20', saleRevenue: 716692, purchaseCost: 750795, margin: -34103 },
];

// === STAFF TASKS ===

export type TaskPriority = 'High' | 'Normal' | 'Low';
export type TaskStatus = 'NOT_SENT' | 'SENT' | 'PENDING' | 'ACCEPTED' | 'ISSUE';

export interface StaffTask {
  id: string;
  saleChildId: string;
  unitId: string;
  vendor: string;
  invNo: string;
  vendorLogin: string;
  vendorEmail: string;
  vendorPassword: string;
  contractNo: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes: string;
  matchCode: string;
  matchLabel: string;
  category: string;
  sets: number;
  qty: number;
  block: string;
  row: string;
  seat: string;
  assignedTo: string;
  status: TaskStatus;
  priority: TaskPriority;
  dispatchedAt: string | null;
  proofUrl: string | null;
  staffNote: string;
  activityLog: { action: string; actor: string; at: string }[];
}

export const MOCK_STAFF_TASKS: StaffTask[] = [
  {
    id: 'tq1', saleChildId: 's250132-1', unitId: 'P00001', vendor: 'TicketVault', invNo: '630679135',
    vendorLogin: 'clara@cc.WC#20', vendorEmail: 'clara@ticketvault.com', vendorPassword: 'X!k9Lm#2q', contractNo: '2025-100129',
    clientFirstName: 'John', clientLastName: 'Smith', clientEmail: 'john.smith@meridiantravel.ae', clientPhone: '+971 50 123 4567', clientNotes: 'VIP – ensure early delivery',
    matchCode: 'M01', matchLabel: 'MEX v RSA', category: 'Top Cat 1', sets: 1, qty: 1,
    block: 'C', row: '12', seat: '14',
    assignedTo: 'u5', status: 'SENT', priority: 'High', dispatchedAt: '17 Apr 2026 14:32', proofUrl: '/proof/tq1.pdf', staffNote: '',
    activityLog: [
      { action: 'CREATED', actor: 'Sara Al Mansoori', at: '16 Apr 2026 09:00' },
      { action: 'ASSIGNED → Mohammed Hassan', actor: 'Sara Al Mansoori', at: '16 Apr 2026 09:05' },
      { action: 'Status → SENT', actor: 'Mohammed Hassan', at: '17 Apr 2026 14:32' },
    ],
  },
  {
    id: 'tq2', saleChildId: 's250132-2', unitId: 'P00002', vendor: 'TicketVault', invNo: '630679136',
    vendorLogin: 'clara@cc.WC#20', vendorEmail: 'clara@ticketvault.com', vendorPassword: 'X!k9Lm#2q', contractNo: '2025-100129',
    clientFirstName: 'Emma', clientLastName: 'Watson', clientEmail: 'emma.w@meridiantravel.ae', clientPhone: '+971 50 234 5678', clientNotes: '',
    matchCode: 'M01', matchLabel: 'MEX v RSA', category: 'Top Cat 1', sets: 1, qty: 1,
    block: 'C', row: '12', seat: '15',
    assignedTo: 'u5', status: 'NOT_SENT', priority: 'Normal', dispatchedAt: null, proofUrl: null, staffNote: '',
    activityLog: [
      { action: 'CREATED', actor: 'Sara Al Mansoori', at: '16 Apr 2026 09:00' },
      { action: 'ASSIGNED → Mohammed Hassan', actor: 'Sara Al Mansoori', at: '16 Apr 2026 09:05' },
    ],
  },
  {
    id: 'tq3', saleChildId: 's250132-3', unitId: 'P00003', vendor: 'TicketVault', invNo: '630679137',
    vendorLogin: 'clara@cc.WC#20', vendorEmail: 'clara@ticketvault.com', vendorPassword: 'X!k9Lm#2q', contractNo: '2025-100129',
    clientFirstName: 'Robert', clientLastName: 'Chen', clientEmail: 'r.chen@meridiantravel.ae', clientPhone: '', clientNotes: 'Wheelchair accessible required',
    matchCode: 'M01', matchLabel: 'MEX v RSA', category: 'Top Cat 1', sets: 1, qty: 1,
    block: 'C', row: '12', seat: '16',
    assignedTo: 'u5', status: 'NOT_SENT', priority: 'High', dispatchedAt: null, proofUrl: null, staffNote: '',
    activityLog: [
      { action: 'CREATED', actor: 'Sara Al Mansoori', at: '16 Apr 2026 09:00' },
      { action: 'ASSIGNED → Mohammed Hassan', actor: 'Sara Al Mansoori', at: '16 Apr 2026 09:05' },
    ],
  },
  {
    id: 'tq4', saleChildId: 's250132-4', unitId: 'P00004', vendor: 'TicketVault', invNo: '630679138',
    vendorLogin: 'clara@cc.WC#20', vendorEmail: 'clara@ticketvault.com', vendorPassword: 'X!k9Lm#2q', contractNo: '2025-100129',
    clientFirstName: 'Aisha', clientLastName: 'Al Kabi', clientEmail: 'aisha@meridiantravel.ae', clientPhone: '+971 55 987 6543', clientNotes: '',
    matchCode: 'M01', matchLabel: 'MEX v RSA', category: 'Top Cat 1', sets: 1, qty: 1,
    block: 'C', row: '12', seat: '17',
    assignedTo: 'u5', status: 'PENDING', priority: 'Normal', dispatchedAt: null, proofUrl: null, staffNote: '',
    activityLog: [
      { action: 'CREATED', actor: 'Sara Al Mansoori', at: '16 Apr 2026 09:00' },
      { action: 'ASSIGNED → Mohammed Hassan', actor: 'Sara Al Mansoori', at: '16 Apr 2026 09:05' },
      { action: 'Status → PENDING', actor: 'Mohammed Hassan', at: '17 Apr 2026 10:00' },
    ],
  },
  {
    id: 'tq5', saleChildId: 's250132-5', unitId: 'P00005', vendor: 'TicketVault', invNo: '630679139',
    vendorLogin: 'clara@cc.WC#20', vendorEmail: 'clara@ticketvault.com', vendorPassword: 'X!k9Lm#2q', contractNo: '2025-100129',
    clientFirstName: 'Tom', clientLastName: 'Williams', clientEmail: 'tom.w@meridiantravel.ae', clientPhone: '', clientNotes: '',
    matchCode: 'M01', matchLabel: 'MEX v RSA', category: 'Top Cat 1', sets: 1, qty: 1,
    block: 'C', row: '13', seat: '1',
    assignedTo: 'u5', status: 'ISSUE', priority: 'High', dispatchedAt: null, proofUrl: null, staffNote: 'Vendor site showing sold out — escalated',
    activityLog: [
      { action: 'CREATED', actor: 'Sara Al Mansoori', at: '16 Apr 2026 09:00' },
      { action: 'ASSIGNED → Mohammed Hassan', actor: 'Sara Al Mansoori', at: '16 Apr 2026 09:05' },
      { action: 'Status → ISSUE: Vendor site showing sold out', actor: 'Mohammed Hassan', at: '17 Apr 2026 11:15' },
    ],
  },
];
