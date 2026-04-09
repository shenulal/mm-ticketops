export type UserRole = 'super_admin' | 'ops_manager' | 'sr_operator' | 'operator' | 'staff' | 'client';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
}

export const MOCK_USERS: AppUser[] = [
  { id: 'u1', name: 'Alex Rahman', email: 'admin@ticketops.ae', role: 'super_admin', initials: 'AR' },
  { id: 'u2', name: 'Sara Al Mansoori', email: 'manager@ticketops.ae', role: 'ops_manager', initials: 'SM' },
  { id: 'u3', name: 'James Patel', email: 'sroperator@ticketops.ae', role: 'sr_operator', initials: 'JP' },
  { id: 'u4', name: 'Priya Nair', email: 'operator@ticketops.ae', role: 'operator', initials: 'PN' },
  { id: 'u5', name: 'Mohammed Hassan', email: 'staff@ticketops.ae', role: 'staff', initials: 'MH' },
  { id: 'u6', name: 'David Clarke', email: 'client@roadtrips.ae', role: 'client', initials: 'DC' },
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
    id: 'pur1', vendor: 'poxami', contract: '2025-100129', matchId: 'm01',
    date: '16 Apr 2026', notes: 'Full block from venue section C', status: 'ACTIVE',
    get lines() { return MOCK_PURCHASE_LINE_ITEMS.filter(l => l.purchaseId === 'pur1'); },
    get totalQty() { return this.lines.reduce((s, l) => s + l.qty, 0); },
    get totalValue() { return this.lines.reduce((s, l) => s + l.lineTotal, 0); },
  },
  {
    id: 'pur2', vendor: 'viagogo', contract: '2025-100888', matchId: 'sg-weekend',
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
    id: 'sale001', client: 'Roadtrips', contract: '2025-10885', matchId: 'm01',
    date: '16 Apr 2026', notes: '',
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
    id: 'sale002', client: 'Blend Group', contract: '2025-20001', matchId: 'sg-weekend',
    date: '16 Apr 2026', notes: 'F1 Singapore package',
    get lines() { return MOCK_SALE_LINE_ITEMS.filter(l => l.saleId === 'sale002'); },
    get totalQty() { return this.lines.reduce((s, l) => s + l.qty, 0); },
    get totalValue() { return this.lines.reduce((s, l) => s + l.lineTotal, 0); },
    get status() { return 'UNALLOCATED'; },
  },
];

// === UNITS ===

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
  status: 'ALLOCATED' | 'AVAILABLE';
  allocatedToLineItemId: string | null;
}

export const MOCK_UNITS: PurchaseUnit[] = [
  // PUR-001, Line 1: Top Cat 1 × 43
  ...Array.from({ length: 43 }, (_, i) => ({
    id: `P${String(i + 1).padStart(5, '0')}`,
    purchaseId: 'pur1', lineItemId: 'pli-1-1',
    subGameId: 'sg-m01-main', categoryId: 'topcat1', categoryLabel: 'Top Cat 1',
    setId: 'PR001-L1-S01', setSize: 43, setPos: i + 1,
    vendor: 'poxami', contract: '2025-100129', matchId: 'm01',
    status: (i < 12 ? 'ALLOCATED' : 'AVAILABLE') as 'ALLOCATED' | 'AVAILABLE',
    allocatedToLineItemId: i < 12 ? 'sli-1-1' : null,
  })),
  // PUR-001, Line 2: Cat 2 × 100
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `P${String(i + 44).padStart(5, '0')}`,
    purchaseId: 'pur1', lineItemId: 'pli-1-2',
    subGameId: 'sg-m01-main', categoryId: 'cat2', categoryLabel: 'Cat 2',
    setId: 'PR001-L2-S01', setSize: 100, setPos: i + 1,
    vendor: 'poxami', contract: '2025-100129', matchId: 'm01',
    status: (i < 6 ? 'ALLOCATED' : 'AVAILABLE') as 'ALLOCATED' | 'AVAILABLE',
    allocatedToLineItemId: i < 6 ? 'sli-1-2' : null,
  })),
  // PUR-001, Line 3: Cat 3 × 60
  ...Array.from({ length: 60 }, (_, i) => ({
    id: `P${String(i + 144).padStart(5, '0')}`,
    purchaseId: 'pur1', lineItemId: 'pli-1-3',
    subGameId: 'sg-m01-main', categoryId: 'cat3', categoryLabel: 'Cat 3',
    setId: 'PR001-L3-S01', setSize: 60, setPos: i + 1,
    vendor: 'poxami', contract: '2025-100129', matchId: 'm01',
    status: (i < 20 ? 'ALLOCATED' : 'AVAILABLE') as 'ALLOCATED' | 'AVAILABLE',
    allocatedToLineItemId: i < 20 ? 'sli-1-3' : null,
  })),
];

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
    clientEmail: i === 0 ? 'john.smith@roadtrips.ae' : '',
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

// === STAFF TASKS (kept for StaffQueuePage / SupplierPortalPage) ===

export const MOCK_STAFF_TASKS = [
  { id: 'tq1', saleChildId: 's250132-1', unitId: 'P00001', vendor: 'poxami', invNo: '630679135', vendorLogin: 'clara@cc.WC#20', clientName: 'John Smith', clientEmail: 'john.smith@roadtrips.ae', assignedTo: 'u5', status: 'SENT', dispatchedAt: '17 Apr 2026 14:32' },
  { id: 'tq2', saleChildId: 's250132-2', unitId: 'P00002', vendor: 'poxami', invNo: '630679136', vendorLogin: 'clara@cc.WC#20', clientName: 'Emma Watson', clientEmail: 'emma.w@roadtrips.ae', assignedTo: 'u5', status: 'NOT_SENT', dispatchedAt: null },
  { id: 'tq3', saleChildId: 's250132-3', unitId: 'P00003', vendor: 'poxami', invNo: '630679137', vendorLogin: 'clara@cc.WC#20', clientName: 'Robert Chen', clientEmail: 'r.chen@roadtrips.ae', assignedTo: 'u5', status: 'NOT_SENT', dispatchedAt: null },
  { id: 'tq4', saleChildId: 's250132-4', unitId: 'P00004', vendor: 'poxami', invNo: '630679138', vendorLogin: 'clara@cc.WC#20', clientName: 'Aisha Al Kabi', clientEmail: 'aisha@roadtrips.ae', assignedTo: 'u5', status: 'NOT_SENT', dispatchedAt: null },
  { id: 'tq5', saleChildId: 's250132-5', unitId: 'P00005', vendor: 'poxami', invNo: '630679139', vendorLogin: 'clara@cc.WC#20', clientName: 'Tom Williams', clientEmail: 'tom.w@roadtrips.ae', assignedTo: 'u5', status: 'NOT_SENT', dispatchedAt: null },
];
