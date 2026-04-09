import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ─── INTERFACES ───────────────────────────────────────────

export interface Organisation {
  id: string; name: string; logoUrl: string; address: string;
  timezone: string; defaultCurrency: string; fiscalYearStart: number;
  contactEmail: string; supportEmail: string; website: string;
}

export interface SystemSettings {
  priceChangeApprovalThreshold: number;
  defaultDispatchBufferHours: number;
  defaultPortalTokenExpiryDays: number;
  defaultAllowOversell: boolean;
  autoSuggestAllocation: boolean;
  defaultAllocationStrategy: 'CONSECUTIVE' | 'BEST_FIT' | 'MANUAL';
  portalReminderHours: number;
  sessionTimeoutMinutes: number;
  auditRetentionDays: number;
  defaultCurrency: string;
}

export interface Currency {
  id: string; code: string; name: string; symbol: string;
  exchangeRateToAed: number; isActive: boolean; lastUpdated: string;
}

export interface Venue {
  id: string; name: string; city: string; country: string;
  capacity: number; address: string; timezone: string; mapUrl: string;
  notes: string; isActive: boolean;
}

export interface Vendor {
  id: string; name: string; code: string;
  type: 'MARKETPLACE' | 'DIRECT' | 'AGENCY';
  website: string; primaryContactName: string;
  primaryContactEmail: string; primaryContactPhone: string;
  country: string; notes: string; isActive: boolean; logoUrl: string;
}

export interface VendorEventBridge {
  id: string; vendorId: string; eventId: string;
  platformUrl: string; loginEmail: string; credentialHint: string;
  primaryContactForEvent: string; notes: string; isActive: boolean;
}

export interface Client {
  id: string; companyName: string; code: string;
  type: 'CORPORATE' | 'AGENCY' | 'INDIVIDUAL';
  primaryContactName: string; email: string; phone: string;
  country: string; city: string; address: string;
  taxId: string; paymentTerms: string; creditLimit: number;
  notes: string; isActive: boolean; logoUrl: string;
}

export interface Contract {
  id: string; contractRef: string;
  contractType: 'PURCHASE' | 'SALE';
  partyId: string; partyType: 'VENDOR' | 'CLIENT';
  eventId: string; validFrom: string; validTo: string;
  paymentTerms: string; currency: string; maxValue: number;
  notes: string; status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  documentUrl: string;
}

export interface VendorCredential {
  id: string; vendorId: string; eventId: string | null;
  loginId: string; email: string; passwordHash: string;
  active: boolean; notes: string;
  updatedBy: string; updatedAt: string; createdAt: string;
}

export interface CredentialHistoryEntry {
  id: string; credentialId: string; action: 'CREATED' | 'UPDATED' | 'DEACTIVATED' | 'PASSWORD_VIEWED';
  actor: string; timestamp: string; details: string;
}

export interface NotificationTemplate {
  id: string; triggerEvent: string; label: string;
  subjectTemplate: string; bodyTemplate: string;
  channels: ('EMAIL' | 'IN_APP')[]; recipientRoles: string[];
  isActive: boolean;
}

export interface SubGameCategory {
  id: string; displayName: string; label: string; level: number;
  description: string; seatSectionHint: string; isActive: boolean;
}

export interface SubGameDef {
  id: string; matchId: string; name: string;
  sessionType: 'MATCH' | 'QUALIFYING' | 'SPRINT' | 'FP' | 'RACE' | 'SHOW' | 'DAY' | 'OTHER';
  startTime: string; durationMinutes: number; isDefault: boolean;
  categories: SubGameCategory[];
}

export interface MatchDef {
  id: string; eventId: string; code: string; teamsOrDescription: string;
  teams: string; matchDate: string; matchTime: string; venueId: string;
  venue: string; city: string; date: string;
  groupStage: string; dispatchDeadline: string; isActive: boolean;
  subGames: SubGameDef[];
}

export interface EventDef {
  id: string; code: string; name: string;
  eventType: 'SPORTS_TOURNAMENT' | 'RACING_SEASON' | 'RACING_WEEKEND' | 'CONCERT' | 'CONFERENCE' | 'EXPO' | 'OTHER';
  status: 'PLANNING' | 'PROCUREMENT' | 'SELLING' | 'ALLOCATING' | 'DISPATCHING' | 'COMPLETED' | 'ARCHIVED';
  startDate: string; endDate: string; defaultCurrency: string;
  dispatchBufferHours: number; portalTokenExpiryDays: number;
  allowOversell: boolean; ownerUserId: string;
  logoUrl: string; bannerUrl: string;
  matches: MatchDef[];
}

// ─── INITIAL SEED DATA ───────────────────────────────────

const INITIAL_ORGANISATION: Organisation = {
  id: 'org-1', name: 'MM-DMCC', logoUrl: '',
  address: 'DMCC, Jumeirah Lake Towers, Dubai, UAE',
  timezone: 'Asia/Dubai', defaultCurrency: 'AED',
  fiscalYearStart: 1, contactEmail: 'ops@mm-dmcc.ae',
  supportEmail: 'support@mm-dmcc.ae', website: 'www.mm-dmcc.ae',
};

const INITIAL_SETTINGS: SystemSettings = {
  priceChangeApprovalThreshold: 20,
  defaultDispatchBufferHours: 48,
  defaultPortalTokenExpiryDays: 14,
  defaultAllowOversell: false,
  autoSuggestAllocation: true,
  defaultAllocationStrategy: 'CONSECUTIVE',
  portalReminderHours: 72,
  sessionTimeoutMinutes: 480,
  auditRetentionDays: 365,
  defaultCurrency: 'AED',
};

const INITIAL_CURRENCIES: Currency[] = [
  { id: 'c1', code: 'AED', name: 'UAE Dirham', symbol: 'AED', exchangeRateToAed: 1, isActive: true, lastUpdated: '2026-04-17' },
  { id: 'c2', code: 'USD', name: 'US Dollar', symbol: '$', exchangeRateToAed: 3.67, isActive: true, lastUpdated: '2026-04-17' },
  { id: 'c3', code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', exchangeRateToAed: 0.98, isActive: true, lastUpdated: '2026-04-17' },
  { id: 'c4', code: 'EUR', name: 'Euro', symbol: '€', exchangeRateToAed: 4.02, isActive: true, lastUpdated: '2026-04-17' },
  { id: 'c5', code: 'GBP', name: 'British Pound', symbol: '£', exchangeRateToAed: 4.68, isActive: false, lastUpdated: '2026-04-17' },
];

const INITIAL_VENUES: Venue[] = [
  { id: 'v1', name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', capacity: 87523, address: 'Calzada de Tlalpan 3465', timezone: 'America/Mexico_City', mapUrl: '', notes: '', isActive: true },
  { id: 'v2', name: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', capacity: 70240, address: '1001 Stadium Dr, Inglewood', timezone: 'America/Los_Angeles', mapUrl: '', notes: '', isActive: true },
  { id: 'v3', name: 'MetLife Stadium', city: 'New York', country: 'USA', capacity: 82500, address: '1 MetLife Stadium Drive', timezone: 'America/New_York', mapUrl: '', notes: '', isActive: true },
  { id: 'v4', name: 'Marina Bay Street Circuit', city: 'Singapore', country: 'Singapore', capacity: 250000, address: 'Marina Bay', timezone: 'Asia/Singapore', mapUrl: '', notes: 'F1 circuit', isActive: true },
];

const INITIAL_VENDORS: Vendor[] = [
  { id: 'vnd1', name: 'poxami', code: 'POXAMI', type: 'MARKETPLACE', website: 'poxami.com', primaryContactName: 'Clara Dufresne', primaryContactEmail: 'clara@poxami.com', primaryContactPhone: '+33 1 2345 6789', country: 'France', notes: 'Primary vendor for FIFA WC', isActive: true, logoUrl: '' },
  { id: 'vnd2', name: 'viagogo', code: 'VIAGOGO', type: 'MARKETPLACE', website: 'viagogo.com', primaryContactName: 'J. Meester', primaryContactEmail: 'j.meester@viagogo.com', primaryContactPhone: '+41 22 345 6789', country: 'Switzerland', notes: 'Secondary vendor', isActive: true, logoUrl: '' },
  { id: 'vnd3', name: 'StubHub', code: 'STUBHUB', type: 'MARKETPLACE', website: 'stubhub.com', primaryContactName: 'Account Manager', primaryContactEmail: 'accounts@stubhub.com', primaryContactPhone: '+1 415 555 0100', country: 'USA', notes: '', isActive: true, logoUrl: '' },
];

const INITIAL_CLIENTS: Client[] = [
  { id: 'cl1', companyName: 'Roadtrips', code: 'RDTRP', type: 'AGENCY', primaryContactName: 'David Clarke', email: 'david@roadtrips.ae', phone: '+971 4 111 2233', country: 'UAE', city: 'Dubai', address: 'Business Bay, Dubai', taxId: 'TRN100001', paymentTerms: 'Net 30', creditLimit: 500000, notes: 'Long-term client', isActive: true, logoUrl: '' },
  { id: 'cl2', companyName: 'Blend Group', code: 'BLEND', type: 'CORPORATE', primaryContactName: 'Sarah Mills', email: 'sarah@blendgroup.com', phone: '+971 4 222 3344', country: 'UAE', city: 'Abu Dhabi', address: 'Corniche Road, Abu Dhabi', taxId: 'TRN100002', paymentTerms: 'Net 15', creditLimit: 300000, notes: '', isActive: true, logoUrl: '' },
  { id: 'cl3', companyName: 'One2Travel', code: 'O2T', type: 'AGENCY', primaryContactName: 'Ahmed Al Farsi', email: 'ahmed@one2travel.ae', phone: '+971 4 333 4455', country: 'UAE', city: 'Dubai', address: 'DIFC, Dubai', taxId: 'TRN100003', paymentTerms: 'Net 30', creditLimit: 200000, notes: '', isActive: true, logoUrl: '' },
  { id: 'cl4', companyName: 'Al Habtoor Group', code: 'AHG', type: 'CORPORATE', primaryContactName: 'Layla Al Habtoor', email: 'layla@alhabtoor.ae', phone: '+971 4 444 5566', country: 'UAE', city: 'Dubai', address: 'Al Habtoor City, Dubai', taxId: 'TRN100004', paymentTerms: 'Net 45', creditLimit: 1000000, notes: 'VIP client', isActive: true, logoUrl: '' },
];

const INITIAL_CONTRACTS: Contract[] = [
  { id: 'ctr1', contractRef: '2025-100129', contractType: 'PURCHASE', partyId: 'vnd1', partyType: 'VENDOR', eventId: 'evt1', validFrom: '2025-01-01', validTo: '2026-12-31', paymentTerms: 'Net 30', currency: 'AED', maxValue: 5000000, notes: '', status: 'ACTIVE', documentUrl: '' },
  { id: 'ctr2', contractRef: '2025-100888', contractType: 'PURCHASE', partyId: 'vnd2', partyType: 'VENDOR', eventId: 'evt2', validFrom: '2025-06-01', validTo: '2026-12-31', paymentTerms: 'Net 30', currency: 'AED', maxValue: 2000000, notes: '', status: 'ACTIVE', documentUrl: '' },
  { id: 'ctr3', contractRef: '2025-10885', contractType: 'SALE', partyId: 'cl1', partyType: 'CLIENT', eventId: 'evt1', validFrom: '2025-01-01', validTo: '2026-12-31', paymentTerms: 'Net 30', currency: 'AED', maxValue: 1000000, notes: '', status: 'ACTIVE', documentUrl: '' },
  { id: 'ctr4', contractRef: '2025-20001', contractType: 'SALE', partyId: 'cl2', partyType: 'CLIENT', eventId: 'evt2', validFrom: '2025-06-01', validTo: '2026-12-31', paymentTerms: 'Net 15', currency: 'AED', maxValue: 500000, notes: '', status: 'ACTIVE', documentUrl: '' },
];

const INITIAL_VENDOR_EVENT_BRIDGES: VendorEventBridge[] = [
  { id: 'veb1', vendorId: 'vnd1', eventId: 'evt1', platformUrl: 'https://poxami.com/wc2026', loginEmail: 'clara@cc.WC#20', credentialHint: 'FIFA vendor portal', primaryContactForEvent: 'Clara Dufresne', notes: '', isActive: true },
  { id: 'veb2', vendorId: 'vnd2', eventId: 'evt2', platformUrl: 'https://viagogo.com/f1sgp', loginEmail: 'j.meester@viagogo.com', credentialHint: 'F1 vendor login', primaryContactForEvent: 'J. Meester', notes: '', isActive: true },
];

const INITIAL_VENDOR_CREDENTIALS: VendorCredential[] = [
  { id: 'vc1', vendorId: 'vnd1', eventId: 'evt1', loginId: 'clara.wc2026', email: 'clara@poxami.com', passwordHash: 'P@ssw0rd!2026', active: true, notes: 'FIFA WC 2026 portal', updatedBy: 'Alex Thompson', updatedAt: '2026-03-15T10:30:00Z', createdAt: '2026-01-10T09:00:00Z' },
  { id: 'vc2', vendorId: 'vnd1', eventId: null, loginId: 'poxami.global', email: 'ops@poxami.com', passwordHash: 'Gl0b@lAcc#99', active: true, notes: 'Global account for all events', updatedBy: 'Alex Thompson', updatedAt: '2026-02-20T14:00:00Z', createdAt: '2025-11-01T08:00:00Z' },
  { id: 'vc3', vendorId: 'vnd2', eventId: 'evt2', loginId: 'viagogo.f1sgp', email: 'j.meester@viagogo.com', passwordHash: 'F1Sgp#2026!', active: true, notes: 'F1 Singapore GP credentials', updatedBy: 'Sara Chen', updatedAt: '2026-04-01T11:00:00Z', createdAt: '2026-03-01T10:00:00Z' },
  { id: 'vc4', vendorId: 'vnd3', eventId: 'evt1', loginId: 'stubhub.fifa', email: 'accounts@stubhub.com', passwordHash: 'StUb#Fifa26', active: false, notes: 'Deactivated — contract ended', updatedBy: 'Sara Chen', updatedAt: '2026-03-30T16:00:00Z', createdAt: '2025-12-15T09:00:00Z' },
];

const INITIAL_CREDENTIAL_HISTORY: CredentialHistoryEntry[] = [
  { id: 'ch1', credentialId: 'vc1', action: 'CREATED', actor: 'Alex Thompson', timestamp: '2026-01-10T09:00:00Z', details: 'Credential created for FIFA WC 2026' },
  { id: 'ch2', credentialId: 'vc1', action: 'UPDATED', actor: 'Alex Thompson', timestamp: '2026-03-15T10:30:00Z', details: 'Password updated' },
  { id: 'ch3', credentialId: 'vc2', action: 'CREATED', actor: 'Alex Thompson', timestamp: '2025-11-01T08:00:00Z', details: 'Global credential created' },
  { id: 'ch4', credentialId: 'vc3', action: 'CREATED', actor: 'Sara Chen', timestamp: '2026-03-01T10:00:00Z', details: 'F1 Singapore credential created' },
  { id: 'ch5', credentialId: 'vc4', action: 'CREATED', actor: 'Sara Chen', timestamp: '2025-12-15T09:00:00Z', details: 'StubHub FIFA credential created' },
  { id: 'ch6', credentialId: 'vc4', action: 'DEACTIVATED', actor: 'Sara Chen', timestamp: '2026-03-30T16:00:00Z', details: 'Contract ended — credential deactivated' },
];

const INITIAL_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  { id: 'nt1', triggerEvent: 'OVERSELL_DETECTED', label: 'Oversell Alert', subjectTemplate: '[TicketOps] Oversell detected — {{sale_id}}', bodyTemplate: 'A sale ({{sale_id}}) for {{client_name}} has exceeded available inventory for {{category}} on {{match_name}}. Please review and approve or reject.', channels: ['EMAIL', 'IN_APP'], recipientRoles: ['ops_manager', 'event_admin'], isActive: true },
  { id: 'nt2', triggerEvent: 'PORTAL_GENERATED', label: 'Client Portal Generated', subjectTemplate: 'Your ticket portal is ready — {{event_name}}', bodyTemplate: 'Dear {{client_name}}, your secure ticket portal for {{match_name}} is ready. Please visit {{portal_url}} to submit guest details before {{deadline}}.', channels: ['EMAIL'], recipientRoles: ['client'], isActive: true },
  { id: 'nt3', triggerEvent: 'PORTAL_REMINDER', label: 'Portal Reminder', subjectTemplate: 'Reminder: Guest details needed — {{match_name}}', bodyTemplate: 'Dear {{client_name}}, we have not yet received all guest details for your tickets to {{match_name}}. Deadline: {{deadline}}. Portal: {{portal_url}}.', channels: ['EMAIL'], recipientRoles: ['client'], isActive: true },
  { id: 'nt4', triggerEvent: 'TICKET_DISPATCHED', label: 'Ticket Dispatched', subjectTemplate: 'Your ticket has been sent — {{inv_no}}', bodyTemplate: 'Dear {{guest_name}}, your ticket ({{inv_no}}) for {{match_name}} — {{category}} has been dispatched to {{email}}.', channels: ['EMAIL', 'IN_APP'], recipientRoles: ['client'], isActive: true },
  { id: 'nt5', triggerEvent: 'DISPATCH_OVERDUE', label: 'Dispatch Overdue Alert', subjectTemplate: '[URGENT] Dispatch overdue — {{match_name}}', bodyTemplate: '{{count}} tickets for {{match_name}} have not been dispatched. Event is in {{days}} days. Immediate action required.', channels: ['EMAIL', 'IN_APP'], recipientRoles: ['ops_manager', 'sr_operator'], isActive: true },
  { id: 'nt6', triggerEvent: 'ALLOCATION_COMPLETE', label: 'Allocation Complete', subjectTemplate: 'Allocation confirmed — {{sale_id}}', bodyTemplate: '{{count}} tickets for {{client_name}} ({{sale_id}}) have been allocated successfully. AllocNote: {{alloc_note}}.', channels: ['IN_APP'], recipientRoles: ['sr_operator', 'ops_manager'], isActive: true },
  { id: 'nt7', triggerEvent: 'SALE_CANCELLED', label: 'Sale Cancellation', subjectTemplate: 'Sale {{sale_id}} has been cancelled', bodyTemplate: 'Sale {{sale_id}} for {{client_name}} has been cancelled by {{cancelled_by}}. Reason: {{reason}}.', channels: ['EMAIL', 'IN_APP'], recipientRoles: ['ops_manager', 'sr_operator'], isActive: true },
  { id: 'nt8', triggerEvent: 'PRICE_CHANGE_APPROVAL', label: 'Price Change Approval', subjectTemplate: 'Price change requires your approval — {{sale_id}}', bodyTemplate: '{{requested_by}} has requested a price change on {{sale_id}} ({{category}}) from {{old_price}} to {{new_price}} (+{{pct}}%). Please review.', channels: ['EMAIL', 'IN_APP'], recipientRoles: ['ops_manager'], isActive: true },
];

function cat(id: string, displayName: string, level: number, hint = ''): SubGameCategory {
  return { id, displayName, label: displayName, level, description: '', seatSectionHint: hint, isActive: true };
}

const INITIAL_EVENTS: EventDef[] = [
  {
    id: 'evt1', code: 'FIFA-WC-2026', name: 'FIFA World Cup 2026',
    eventType: 'SPORTS_TOURNAMENT', status: 'SELLING',
    startDate: '2026-06-11', endDate: '2026-07-19', defaultCurrency: 'AED',
    dispatchBufferHours: 48, portalTokenExpiryDays: 14, allowOversell: false,
    ownerUserId: 'u2', logoUrl: '', bannerUrl: '',
    matches: [
      {
        id: 'm01', eventId: 'evt1', code: 'M01', teamsOrDescription: 'MEX v RSA', teams: 'MEX v RSA',
        matchDate: '2026-06-21', matchTime: '15:00', venueId: 'v1',
        venue: 'Estadio Azteca', city: 'Mexico City', date: '21 Jun 2026 15:00',
        groupStage: 'Group A', dispatchDeadline: '2026-06-19', isActive: true,
        subGames: [{
          id: 'sg-m01-main', matchId: 'm01', name: 'Main Match', sessionType: 'MATCH',
          startTime: '21 Jun 2026 15:00', durationMinutes: 120, isDefault: true,
          categories: [cat('topcat1', 'Top Cat 1', 1, 'Premium seating'), cat('cat2', 'Cat 2', 2), cat('cat3', 'Cat 3', 3), cat('cat4', 'Cat 4', 4)],
        }],
      },
      {
        id: 'm02', eventId: 'evt1', code: 'M02', teamsOrDescription: 'USA v CAN', teams: 'USA v CAN',
        matchDate: '2026-06-22', matchTime: '18:00', venueId: 'v2',
        venue: 'SoFi Stadium', city: 'Los Angeles', date: '22 Jun 2026 18:00',
        groupStage: 'Group A', dispatchDeadline: '2026-06-20', isActive: true,
        subGames: [{
          id: 'sg-m02-main', matchId: 'm02', name: 'Main Match', sessionType: 'MATCH',
          startTime: '22 Jun 2026 18:00', durationMinutes: 120, isDefault: true,
          categories: [cat('topcat1', 'Top Cat 1', 1), cat('cat2', 'Cat 2', 2), cat('cat3', 'Cat 3', 3)],
        }],
      },
      {
        id: 'm03', eventId: 'evt1', code: 'M03', teamsOrDescription: 'BRA v ARG', teams: 'BRA v ARG',
        matchDate: '2026-06-23', matchTime: '20:00', venueId: 'v3',
        venue: 'MetLife Stadium', city: 'New York', date: '23 Jun 2026 20:00',
        groupStage: 'Group B', dispatchDeadline: '2026-06-21', isActive: true,
        subGames: [{
          id: 'sg-m03-main', matchId: 'm03', name: 'Main Match', sessionType: 'MATCH',
          startTime: '23 Jun 2026 20:00', durationMinutes: 120, isDefault: true,
          categories: [cat('topcat1', 'Top Cat 1', 1), cat('cat2', 'Cat 2', 2), cat('cat3', 'Cat 3', 3)],
        }],
      },
    ],
  },
  {
    id: 'evt2', code: 'F1-SGP-2026', name: 'F1 Singapore GP 2026',
    eventType: 'RACING_WEEKEND', status: 'ALLOCATING',
    startDate: '2026-09-19', endDate: '2026-09-21', defaultCurrency: 'AED',
    dispatchBufferHours: 72, portalTokenExpiryDays: 14, allowOversell: false,
    ownerUserId: 'u2', logoUrl: '', bannerUrl: '',
    matches: [
      {
        id: 'sg-weekend', eventId: 'evt2', code: 'SGP-WKD', teamsOrDescription: 'Singapore GP Weekend', teams: 'Singapore GP Weekend',
        matchDate: '2026-09-19', matchTime: '09:00', venueId: 'v4',
        venue: 'Marina Bay Street Circuit', city: 'Singapore', date: '19–21 Sep 2026',
        groupStage: '', dispatchDeadline: '2026-09-17', isActive: true,
        subGames: [
          {
            id: 'sg-f1-fp1', matchId: 'sg-weekend', name: 'Free Practice 1', sessionType: 'FP',
            startTime: '19 Sep 2026 09:00', durationMinutes: 90, isDefault: false,
            categories: [cat('ga', 'General Admission', 3), cat('gs-b', 'Grandstand B', 2)],
          },
          {
            id: 'sg-f1-quali', matchId: 'sg-weekend', name: 'Qualifying Session', sessionType: 'QUALIFYING',
            startTime: '20 Sep 2026 14:00', durationMinutes: 90, isDefault: false,
            categories: [cat('gs-a', 'Grandstand A', 1), cat('gs-b', 'Grandstand B', 2), cat('ga', 'General Admission', 3)],
          },
          {
            id: 'sg-f1-sprint', matchId: 'sg-weekend', name: 'Sprint Race', sessionType: 'SPRINT',
            startTime: '21 Sep 2026 11:00', durationMinutes: 60, isDefault: false,
            categories: [cat('gs-a', 'Grandstand A', 1), cat('gs-b', 'Grandstand B', 2), cat('ga', 'General Admission', 3)],
          },
          {
            id: 'sg-f1-race', matchId: 'sg-weekend', name: 'Grand Prix (Main Race)', sessionType: 'RACE',
            startTime: '21 Sep 2026 20:00', durationMinutes: 120, isDefault: false,
            categories: [cat('paddock', 'Paddock Club', 1), cat('gold-vip', 'Gold Hospitality', 2), cat('gs-a', 'Grandstand A', 3), cat('gs-b-f', 'Grandstand B–F', 4), cat('ga', 'General Admission', 5)],
          },
        ],
      },
    ],
  },
];

// ─── CONTEXT TYPE ─────────────────────────────────────────

interface AppContextType {
  organisation: Organisation;
  settings: SystemSettings;
  currencies: Currency[];
  venues: Venue[];
  vendors: Vendor[];
  vendorEventBridges: VendorEventBridge[];
  clients: Client[];
  contracts: Contract[];
  notificationTemplates: NotificationTemplate[];
  events: EventDef[];
  vendorCredentials: VendorCredential[];
  credentialHistory: CredentialHistoryEntry[];

  // Derived flat arrays (backward-compat with old MOCK_MATCHES / MOCK_SUBGAMES)
  matches: MatchDef[];
  subGames: SubGameDef[];

  // Helpers
  getEvent(id: string): EventDef | undefined;
  getMatch(id: string): MatchDef | undefined;
  getSubGame(id: string): SubGameDef | undefined;
  getSubGamesForMatch(matchId: string): SubGameDef[];
  hasMultipleSubGames(matchId: string): boolean;
  getCategoriesForSubGame(subGameId: string): SubGameCategory[];
  getHierarchyForSubGame(subGameId: string): SubGameCategory[];
  getVendor(id: string): Vendor | undefined;
  getClient(id: string): Client | undefined;
  getContract(id: string): Contract | undefined;
  getVenue(id: string): Venue | undefined;
  getCurrency(code: string): Currency | undefined;
  formatCurrency(amount: number, currencyCode?: string): string;
  getActiveContracts(partyId: string, eventId: string): Contract[];
  getVendorBridge(vendorId: string, eventId: string): VendorEventBridge | undefined;
  getNotificationTemplate(triggerEvent: string): NotificationTemplate | undefined;
  getMatchesForEvent(eventId: string): MatchDef[];

  // Mutators
  updateOrganisation(data: Partial<Organisation>): void;
  updateSettings(data: Partial<SystemSettings>): void;
  addVendor(vendor: Omit<Vendor, 'id'>): void;
  updateVendor(id: string, data: Partial<Vendor>): void;
  addClient(client: Omit<Client, 'id'>): void;
  updateClient(id: string, data: Partial<Client>): void;
  addContract(contract: Omit<Contract, 'id'>): void;
  updateContract(id: string, data: Partial<Contract>): void;
  addVenue(venue: Omit<Venue, 'id'>): void;
  updateVenue(id: string, data: Partial<Venue>): void;
  addCurrency(currency: Omit<Currency, 'id'>): void;
  updateCurrency(id: string, data: Partial<Currency>): void;
  addEvent(event: Omit<EventDef, 'id' | 'matches'>): void;
  updateEvent(id: string, data: Partial<EventDef>): void;
  addMatchToEvent(eventId: string, match: Omit<MatchDef, 'id' | 'subGames'>): void;
  updateMatch(id: string, data: Partial<MatchDef>): void;
  addSubGameToMatch(matchId: string, subGame: Omit<SubGameDef, 'id'>): void;
  updateSubGame(id: string, data: Partial<SubGameDef>): void;
  addCategoryToSubGame(subGameId: string, category: Omit<SubGameCategory, 'id'>): void;
  updateCategory(subGameId: string, categoryId: string, data: Partial<SubGameCategory>): void;
  updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>): void;
  setVendorEventBridge(bridge: VendorEventBridge): void;
  addVendorCredential(cred: Omit<VendorCredential, 'id'>): void;
  updateVendorCredential(id: string, data: Partial<VendorCredential>): void;
  addCredentialHistoryEntry(entry: Omit<CredentialHistoryEntry, 'id'>): void;
  getCredentialsForVendor(vendorId: string): VendorCredential[];
  getCredentialHistory(credentialId: string): CredentialHistoryEntry[];
  getBestCredential(vendorId: string, eventId: string): VendorCredential | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── PROVIDER ─────────────────────────────────────────────

let _counter = 1000;
const uid = () => `auto-${++_counter}`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organisation, setOrganisation] = useState<Organisation>(INITIAL_ORGANISATION);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [currencies, setCurrencies] = useState<Currency[]>(INITIAL_CURRENCIES);
  const [venues, setVenues] = useState<Venue[]>(INITIAL_VENUES);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [vendorEventBridges, setVendorEventBridges] = useState<VendorEventBridge[]>(INITIAL_VENDOR_EVENT_BRIDGES);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>(INITIAL_NOTIFICATION_TEMPLATES);
  const [events, setEvents] = useState<EventDef[]>(INITIAL_EVENTS);
  const [vendorCredentials, setVendorCredentials] = useState<VendorCredential[]>(INITIAL_VENDOR_CREDENTIALS);
  const [credentialHistory, setCredentialHistory] = useState<CredentialHistoryEntry[]>(INITIAL_CREDENTIAL_HISTORY);

  // Derived flat arrays
  const matches = useMemo(() => events.flatMap(e => e.matches), [events]);
  const subGames = useMemo(() => matches.flatMap(m => m.subGames), [matches]);

  // ── Helpers ──
  const getEvent = useCallback((id: string) => events.find(e => e.id === id), [events]);
  const getMatch = useCallback((id: string) => matches.find(m => m.id === id), [matches]);
  const getSubGame = useCallback((id: string) => subGames.find(sg => sg.id === id), [subGames]);
  const getSubGamesForMatch = useCallback((matchId: string) => subGames.filter(sg => sg.matchId === matchId), [subGames]);
  const hasMultipleSubGames = useCallback((matchId: string) => subGames.filter(sg => sg.matchId === matchId).length > 1, [subGames]);
  const getCategoriesForSubGame = useCallback((subGameId: string) => subGames.find(sg => sg.id === subGameId)?.categories ?? [], [subGames]);
  const getHierarchyForSubGame = useCallback((subGameId: string) => {
    const sg = subGames.find(s => s.id === subGameId);
    if (!sg) return [];
    return [...sg.categories].sort((a, b) => a.level - b.level);
  }, [subGames]);
  const getMatchesForEvent = useCallback((eventId: string) => matches.filter(m => {
    const ev = events.find(e => e.matches.some(mm => mm.id === m.id));
    return ev?.id === eventId;
  }), [matches, events]);

  const getVendor = useCallback((id: string) => vendors.find(v => v.id === id), [vendors]);
  const getClient = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getContract = useCallback((id: string) => contracts.find(c => c.id === id), [contracts]);
  const getVenue = useCallback((id: string) => venues.find(v => v.id === id), [venues]);
  const getCurrency = useCallback((code: string) => currencies.find(c => c.code === code), [currencies]);
  const getActiveContracts = useCallback((partyId: string, eventId: string) =>
    contracts.filter(c => c.partyId === partyId && c.eventId === eventId && c.status === 'ACTIVE'),
  [contracts]);
  const getVendorBridge = useCallback((vendorId: string, eventId: string) =>
    vendorEventBridges.find(b => b.vendorId === vendorId && b.eventId === eventId),
  [vendorEventBridges]);
  const getNotificationTemplate = useCallback((triggerEvent: string) =>
    notificationTemplates.find(t => t.triggerEvent === triggerEvent),
  [notificationTemplates]);

  const formatCurrency = useCallback((amount: number, currencyCode?: string) => {
    const code = currencyCode ?? settings.defaultCurrency;
    const curr = currencies.find(c => c.code === code);
    const converted = code === 'AED' ? amount : amount / (curr?.exchangeRateToAed ?? 1);
    const sym = curr?.symbol ?? 'AED';
    if (Math.abs(converted) >= 1_000_000) return `${sym} ${(converted / 1_000_000).toFixed(2)}M`;
    if (Math.abs(converted) >= 1_000) return `${sym} ${(converted / 1_000).toFixed(1)}K`;
    return `${sym} ${converted.toLocaleString('en-AE', { minimumFractionDigits: 0 })}`;
  }, [settings.defaultCurrency, currencies]);

  // ── Mutators ──
  const updateOrganisation = useCallback((data: Partial<Organisation>) => setOrganisation(prev => ({ ...prev, ...data })), []);
  const updateSettings = useCallback((data: Partial<SystemSettings>) => setSettings(prev => ({ ...prev, ...data })), []);

  const addVendor = useCallback((v: Omit<Vendor, 'id'>) => setVendors(prev => [...prev, { ...v, id: uid() }]), []);
  const updateVendor = useCallback((id: string, data: Partial<Vendor>) => setVendors(prev => prev.map(v => v.id === id ? { ...v, ...data } : v)), []);
  const addClient = useCallback((c: Omit<Client, 'id'>) => setClients(prev => [...prev, { ...c, id: uid() }]), []);
  const updateClient = useCallback((id: string, data: Partial<Client>) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)), []);
  const addContract = useCallback((c: Omit<Contract, 'id'>) => setContracts(prev => [...prev, { ...c, id: uid() }]), []);
  const updateContract = useCallback((id: string, data: Partial<Contract>) => setContracts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)), []);
  const addVenue = useCallback((v: Omit<Venue, 'id'>) => setVenues(prev => [...prev, { ...v, id: uid() }]), []);
  const updateVenue = useCallback((id: string, data: Partial<Venue>) => setVenues(prev => prev.map(v => v.id === id ? { ...v, ...data } : v)), []);
  const addCurrency = useCallback((c: Omit<Currency, 'id'>) => setCurrencies(prev => [...prev, { ...c, id: uid() }]), []);
  const updateCurrency = useCallback((id: string, data: Partial<Currency>) => setCurrencies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)), []);

  const addEvent = useCallback((e: Omit<EventDef, 'id' | 'matches'>) => setEvents(prev => [...prev, { ...e, id: uid(), matches: [] }]), []);
  const updateEvent = useCallback((id: string, data: Partial<EventDef>) => setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e)), []);

  const addMatchToEvent = useCallback((eventId: string, match: Omit<MatchDef, 'id' | 'subGames'>) => {
    setEvents(prev => prev.map(e => e.id === eventId
      ? { ...e, matches: [...e.matches, { ...match, id: uid(), subGames: [] }] }
      : e));
  }, []);
  const updateMatch = useCallback((id: string, data: Partial<MatchDef>) => {
    setEvents(prev => prev.map(e => ({
      ...e, matches: e.matches.map(m => m.id === id ? { ...m, ...data } : m),
    })));
  }, []);

  const addSubGameToMatch = useCallback((matchId: string, subGame: Omit<SubGameDef, 'id'>) => {
    setEvents(prev => prev.map(e => ({
      ...e, matches: e.matches.map(m => m.id === matchId
        ? { ...m, subGames: [...m.subGames, { ...subGame, id: uid() }] }
        : m),
    })));
  }, []);
  const updateSubGame = useCallback((id: string, data: Partial<SubGameDef>) => {
    setEvents(prev => prev.map(e => ({
      ...e, matches: e.matches.map(m => ({
        ...m, subGames: m.subGames.map(sg => sg.id === id ? { ...sg, ...data } : sg),
      })),
    })));
  }, []);

  const addCategoryToSubGame = useCallback((subGameId: string, category: Omit<SubGameCategory, 'id'>) => {
    setEvents(prev => prev.map(e => ({
      ...e, matches: e.matches.map(m => ({
        ...m, subGames: m.subGames.map(sg => sg.id === subGameId
          ? { ...sg, categories: [...sg.categories, { ...category, id: uid() }] }
          : sg),
      })),
    })));
  }, []);
  const updateCategory = useCallback((subGameId: string, categoryId: string, data: Partial<SubGameCategory>) => {
    setEvents(prev => prev.map(e => ({
      ...e, matches: e.matches.map(m => ({
        ...m, subGames: m.subGames.map(sg => sg.id === subGameId
          ? { ...sg, categories: sg.categories.map(c => c.id === categoryId ? { ...c, ...data } : c) }
          : sg),
      })),
    })));
  }, []);

  const updateNotificationTemplate = useCallback((id: string, data: Partial<NotificationTemplate>) =>
    setNotificationTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t)), []);
  const setVendorEventBridge = useCallback((bridge: VendorEventBridge) =>
    setVendorEventBridges(prev => {
      const idx = prev.findIndex(b => b.id === bridge.id);
      return idx >= 0 ? prev.map((b, i) => i === idx ? bridge : b) : [...prev, bridge];
    }), []);

  const value = useMemo<AppContextType>(() => ({
    organisation, settings, currencies, venues, vendors, vendorEventBridges,
    clients, contracts, notificationTemplates, events, matches, subGames,
    getEvent, getMatch, getSubGame, getSubGamesForMatch, hasMultipleSubGames,
    getCategoriesForSubGame, getHierarchyForSubGame, getMatchesForEvent,
    getVendor, getClient, getContract, getVenue, getCurrency, formatCurrency,
    getActiveContracts, getVendorBridge, getNotificationTemplate,
    updateOrganisation, updateSettings,
    addVendor, updateVendor, addClient, updateClient,
    addContract, updateContract, addVenue, updateVenue,
    addCurrency, updateCurrency,
    addEvent, updateEvent, addMatchToEvent, updateMatch,
    addSubGameToMatch, updateSubGame, addCategoryToSubGame, updateCategory,
    updateNotificationTemplate, setVendorEventBridge,
  }), [
    organisation, settings, currencies, venues, vendors, vendorEventBridges,
    clients, contracts, notificationTemplates, events, matches, subGames,
    getEvent, getMatch, getSubGame, getSubGamesForMatch, hasMultipleSubGames,
    getCategoriesForSubGame, getHierarchyForSubGame, getMatchesForEvent,
    getVendor, getClient, getContract, getVenue, getCurrency, formatCurrency,
    getActiveContracts, getVendorBridge, getNotificationTemplate,
    updateOrganisation, updateSettings,
    addVendor, updateVendor, addClient, updateClient,
    addContract, updateContract, addVenue, updateVenue,
    addCurrency, updateCurrency,
    addEvent, updateEvent, addMatchToEvent, updateMatch,
    addSubGameToMatch, updateSubGame, addCategoryToSubGame, updateCategory,
    updateNotificationTemplate, setVendorEventBridge,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ─── HOOK ─────────────────────────────────────────────────

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
