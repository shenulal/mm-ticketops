// ─── ALLOCATION ENGINE DATA MODEL ─────────────────────────

export type AllocationMode = 'SUGGEST' | 'SEMI_AUTO' | 'FULLY_AUTO';
export type SplitPolicy = 'SINGLE_SET_ONLY' | 'ALLOW_MULTI_SET' | 'REQUIRE_MIN_CHUNK_SIZE';
export type RunTrigger = 'MANUAL' | 'SCHEDULED' | 'ON_SALE_CREATE';
export type RunItemStatus = 'COMMITTED' | 'SKIPPED' | 'SHORTAGE' | 'BLOCKED_BY_POLICY' | 'ERROR';

export interface AllocationPolicy {
  id: string;
  eventId: string | null;
  name: string;
  active: boolean;
  priority: number;
  scopeFilter: Record<string, any>;
  mode: AllocationMode;
  allowUpgrade: boolean;
  maxUpgradeRankGap: number;
  allowDowngrade: boolean;
  maxDowngradeRankGap: number;
  vendorWhitelist: string[];
  vendorBlocklist: string[];
  minMarginPct: number;
  maxAutoCommitValue: number;
  splitPolicy: SplitPolicy;
  minChunkSize: number;
  requireVendorDiversity: boolean;
  excludeVip: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AllocationRun {
  id: string;
  runCode: string;
  mode: AllocationMode;
  trigger: RunTrigger;
  startedAt: string;
  finishedAt: string | null;
  startedBy: string;
  policySnapshot: AllocationPolicy;
  scope: { eventId?: string; saleIds?: string[] };
  dryRun: boolean;
  summary: {
    committed: number;
    skipped: number;
    shortages: number;
    blockedByPolicy: number;
    marginDelta: number;
  };
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface PlanChunk {
  setId: string;
  qty: number;
  vendor: string;
  unitCost: number;
}

export interface AllocationRunItem {
  id: string;
  runId: string;
  saleId: string;
  saleLineId: string;
  status: RunItemStatus;
  chosenPlan: PlanChunk[];
  effectiveCategory: string;
  rankGap: number;
  projectedMargin: number;
  reason: string;
  rolledBackAt: string | null;
  rolledBackBy: string | null;
}

export interface UnitReservation {
  unitId: string;
  runId: string;
  reservedBy: string;
  reservedAt: string;
  expiresAt: string;
}

// ─── SCORING WEIGHTS ─────────────────────────────────────

export interface ScoringWeights {
  w1_exactness: number;
  w2_margin: number;
  w3_vendorSla: number;
  w4_setContinuity: number;
  w5_freshness: number;
  p1_categoryUpgrade: number;
  p2_vendorDiversity: number;
  p3_split: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  w1_exactness: 0.35,
  w2_margin: 0.25,
  w3_vendorSla: 0.15,
  w4_setContinuity: 0.10,
  w5_freshness: 0.05,
  p1_categoryUpgrade: 0.15,
  p2_vendorDiversity: 0.10,
  p3_split: 0.10,
};

// ─── GLOBAL SAFETY RAILS ─────────────────────────────────

export interface SafetyRails {
  maxConcurrentRuns: number;
  defaultReservationTtlSeconds: number;
  maxAutoCommitValueCap: number;
  maxSaleLinesPerRun: number;
  rollbackWindowHours: number;
}

export const DEFAULT_SAFETY_RAILS: SafetyRails = {
  maxConcurrentRuns: 1,
  defaultReservationTtlSeconds: 120,
  maxAutoCommitValueCap: 500000,
  maxSaleLinesPerRun: 500,
  rollbackWindowHours: 24,
};

// ─── SCHEDULER CONFIG ────────────────────────────────────

export interface SchedulerConfig {
  enabled: boolean;
  cronExpression: string;
  scopeFilter: Record<string, any>;
  onSaleCreateEnabled: boolean;
  onSaleCreatePolicyId: string | null;
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  enabled: false,
  cronExpression: '*/15 9-18 * * 1-5',
  scopeFilter: { eventStatus: 'ALLOCATING' },
  onSaleCreateEnabled: false,
  onSaleCreatePolicyId: null,
};

// ─── MOCK POLICIES ───────────────────────────────────────

export const MOCK_POLICIES: AllocationPolicy[] = [
  {
    id: 'pol-1',
    eventId: null,
    name: 'Default — Best Fit',
    active: true,
    priority: 1,
    scopeFilter: {},
    mode: 'SEMI_AUTO',
    allowUpgrade: true,
    maxUpgradeRankGap: 1,
    allowDowngrade: false,
    maxDowngradeRankGap: 0,
    vendorWhitelist: [],
    vendorBlocklist: [],
    minMarginPct: 5,
    maxAutoCommitValue: 200000,
    splitPolicy: 'ALLOW_MULTI_SET',
    minChunkSize: 1,
    requireVendorDiversity: false,
    excludeVip: false,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-04-01T14:00:00Z',
    updatedBy: 'Alex Rahman',
  },
  {
    id: 'pol-2',
    eventId: 'evt1',
    name: 'FIFA WC — Single Set Strict',
    active: true,
    priority: 2,
    scopeFilter: { eventId: 'evt1' },
    mode: 'FULLY_AUTO',
    allowUpgrade: false,
    maxUpgradeRankGap: 0,
    allowDowngrade: false,
    maxDowngradeRankGap: 0,
    vendorWhitelist: ['poxami'],
    vendorBlocklist: [],
    minMarginPct: 10,
    maxAutoCommitValue: 500000,
    splitPolicy: 'SINGLE_SET_ONLY',
    minChunkSize: 1,
    requireVendorDiversity: false,
    excludeVip: true,
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-04-05T16:00:00Z',
    updatedBy: 'Sara Al Mansoori',
  },
  {
    id: 'pol-3',
    eventId: 'evt2',
    name: 'F1 SGP — Agency Priority',
    active: false,
    priority: 3,
    scopeFilter: { clientType: 'AGENCY' },
    mode: 'SUGGEST',
    allowUpgrade: true,
    maxUpgradeRankGap: 2,
    allowDowngrade: true,
    maxDowngradeRankGap: 1,
    vendorWhitelist: [],
    vendorBlocklist: ['StubHub'],
    minMarginPct: 0,
    maxAutoCommitValue: 100000,
    splitPolicy: 'REQUIRE_MIN_CHUNK_SIZE',
    minChunkSize: 4,
    requireVendorDiversity: true,
    excludeVip: false,
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-01T08:00:00Z',
    updatedBy: 'Alex Rahman',
  },
];

// ─── MOCK RUNS ───────────────────────────────────────────

export const MOCK_ALLOCATION_RUNS: AllocationRun[] = [
  {
    id: 'run-001',
    runCode: 'ALLOC-RUN-001',
    mode: 'SEMI_AUTO',
    trigger: 'MANUAL',
    startedAt: '2026-04-17T09:00:00Z',
    finishedAt: '2026-04-17T09:00:12Z',
    startedBy: 'Alex Rahman',
    policySnapshot: MOCK_POLICIES[0],
    scope: { saleIds: ['sale001'] },
    dryRun: false,
    summary: { committed: 1, skipped: 0, shortages: 0, blockedByPolicy: 1, marginDelta: 2400 },
    status: 'COMPLETED',
  },
];

export const MOCK_RUN_ITEMS: AllocationRunItem[] = [
  {
    id: 'ri-001',
    runId: 'run-001',
    saleId: 'sale001',
    saleLineId: 'sli-1-1',
    status: 'COMMITTED',
    chosenPlan: [{ setId: 'PR001-L1-S01', qty: 12, vendor: 'poxami', unitCost: 27525 }],
    effectiveCategory: 'topcat1',
    rankGap: 0,
    projectedMargin: 26.7,
    reason: 'Full coverage from single set',
    rolledBackAt: null,
    rolledBackBy: null,
  },
  {
    id: 'ri-002',
    runId: 'run-001',
    saleId: 'sale001',
    saleLineId: 'sli-1-2',
    status: 'BLOCKED_BY_POLICY',
    chosenPlan: [],
    effectiveCategory: 'cat2',
    rankGap: 0,
    projectedMargin: -12,
    reason: 'Oversell flag present; Projected margin -12% below policy min 5%',
    rolledBackAt: null,
    rolledBackBy: null,
  },
];
