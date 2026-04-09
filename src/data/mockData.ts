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
];

export const MOCK_PURCHASES = [
  { id: 'pur1', matchId: 'm01', vendor: 'poxami', contract: '2025-100129', category: 'Top Cat 1', qty: 43, unitPrice: 7500, total: 322500, date: '15 Apr 2026' },
  { id: 'pur2', matchId: 'm01', vendor: 'viagogo', contract: '2025-100888', category: 'Cat 2', qty: 100, unitPrice: 3200, total: 320000, date: '15 Apr 2026' },
  { id: 'pur3', matchId: 'm01', vendor: 'poxami', contract: '2025-100129', category: 'Cat 3', qty: 60, unitPrice: 1800, total: 108000, date: '16 Apr 2026' },
];

export const MOCK_SALES = [
  { id: 's250132', client: 'Roadtrips', contract: '2025-10885', category: 'Top Cat 1', qty: 12, unitPrice: 9500, total: 114000, status: 'ALLOCATED', matchId: 'm01' },
  { id: 's250145', client: 'Blend Group', contract: '2025-20001', category: 'Cat 2', qty: 6, unitPrice: 4200, total: 25200, status: 'PENDING_APPROVAL', matchId: 'm01', oversell: true },
  { id: 's250156', client: 'One2Travel', contract: '2025-30002', category: 'Cat 3', qty: 20, unitPrice: 2800, total: 56000, status: 'UNALLOCATED', matchId: 'm01' },
];

export const MOCK_UNITS = Array.from({ length: 43 }, (_, i) => ({
  id: `P${String(i + 1).padStart(5, '0')}`,
  setId: 'PR0002-S01',
  setSize: 43,
  setPos: i + 1,
  vendor: 'poxami',
  contract: '2025-100129',
  matchId: 'm01',
  category: 'Top Cat 1',
  status: i < 12 ? 'ALLOCATED' as const : 'AVAILABLE' as const,
  allocatedToSaleId: i < 12 ? 's250132' : null,
}));

export const MOCK_STAFF_TASKS = [
  { id: 'tq1', saleChildId: 's250132-1', unitId: 'P00001', vendor: 'poxami', invNo: '630679135', vendorLogin: 'clara@cc.WC#20', clientName: 'John Smith', clientEmail: 'john.smith@roadtrips.ae', assignedTo: 'u5', status: 'SENT', dispatchedAt: '17 Apr 2026 14:32' },
  { id: 'tq2', saleChildId: 's250132-2', unitId: 'P00002', vendor: 'poxami', invNo: '630679136', vendorLogin: 'clara@cc.WC#20', clientName: 'Emma Watson', clientEmail: 'emma.w@roadtrips.ae', assignedTo: 'u5', status: 'NOT_SENT', dispatchedAt: null },
  { id: 'tq3', saleChildId: 's250132-3', unitId: 'P00003', vendor: 'poxami', invNo: '630679137', vendorLogin: 'clara@cc.WC#20', clientName: 'Robert Chen', clientEmail: 'r.chen@roadtrips.ae', assignedTo: 'u5', status: 'NOT_SENT', dispatchedAt: null },
  { id: 'tq4', saleChildId: 's250132-4', unitId: 'P00004', vendor: 'poxami', invNo: '630679138', vendorLogin: 'clara@cc.WC#20', clientName: 'Aisha Al Kabi', clientEmail: 'aisha@roadtrips.ae', assignedTo: 'u5', status: 'NOT_SENT', dispatchedAt: null },
  { id: 'tq5', saleChildId: 's250132-5', unitId: 'P00005', vendor: 'poxami', invNo: '630679139', vendorLogin: 'clara@cc.WC#20', clientName: 'Tom Williams', clientEmail: 'tom.w@roadtrips.ae', assignedTo: 'u5', status: 'NOT_SENT', dispatchedAt: null },
];
