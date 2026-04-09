/**
 * Auto-Allocation Engine
 * Ports _ALLOC_suggestPlans_ from the spreadsheet, adds scoring + policy evaluation.
 */

import type { AllocationPolicy, PlanChunk, ScoringWeights } from '@/data/allocationData';
import { DEFAULT_SCORING_WEIGHTS } from '@/data/allocationData';

// ─── TYPES ───────────────────────────────────────────────

export interface CandidatePlan {
  id: string;
  chunks: PlanChunk[];
  total: number;
  strategy: string;
  vendorMix: string[];
  score: number;
  marginDelta: number;
  note: string;
  policyViolations: string[];
  passesPolicy: boolean;
}

export interface SetCountEntry {
  setId: string;
  count: number;
  vendor: string;
  unitCost: number;
}

// ─── 1. suggestPlans — exact port of _ALLOC_suggestPlans_ ─

export function suggestPlans(
  setCounts: SetCountEntry[],
  targetQty: number,
  maxPlans = 6
): CandidatePlan[] {
  const raw: CandidatePlan[] = [];
  let planIdx = 0;

  const makePlan = (chunks: PlanChunk[], strategy: string, note: string): CandidatePlan => ({
    id: `plan-${planIdx++}`,
    chunks,
    total: chunks.reduce((s, c) => s + c.qty, 0),
    strategy,
    vendorMix: [...new Set(chunks.map(c => c.vendor))],
    score: 0,
    marginDelta: 0,
    note,
    policyViolations: [],
    passesPolicy: true,
  });

  // Strategy 1: EXACT — smallest single set with cnt >= targetQty
  const exactCandidates = setCounts
    .filter(s => s.count >= targetQty)
    .sort((a, b) => a.count - b.count);

  if (exactCandidates.length > 0) {
    const best = exactCandidates[0];
    raw.push(makePlan(
      [{ setId: best.setId, qty: targetQty, vendor: best.vendor, unitCost: best.unitCost }],
      'EXACT',
      `Single set ${best.setId} — exact or minimal waste (${best.count - targetQty} spare)`
    ));
  }

  // Strategy 2: GREEDY_LARGEST — sort DESC, take until target met
  {
    const sorted = [...setCounts].sort((a, b) => b.count - a.count);
    const chunks = greedyFill(sorted, targetQty);
    if (chunks.length > 0) {
      raw.push(makePlan(chunks, 'GREEDY_LARGEST', 'Largest sets first'));
    }
  }

  // Strategy 3: GREEDY_SMALLEST — sort ASC, take until target met
  {
    const sorted = [...setCounts].sort((a, b) => a.count - b.count);
    const chunks = greedyFill(sorted, targetQty);
    if (chunks.length > 0) {
      raw.push(makePlan(chunks, 'GREEDY_SMALLEST', 'Smallest sets first'));
    }
  }

  // Strategy 4: ROTATED_DESC — rotate start of DESC ordering, up to 5 rotations
  {
    const sorted = [...setCounts].sort((a, b) => b.count - a.count);
    const maxRotations = Math.min(5, sorted.length);
    for (let r = 1; r <= maxRotations; r++) {
      const rotated = [...sorted.slice(r), ...sorted.slice(0, r)];
      const chunks = greedyFill(rotated, targetQty);
      if (chunks.length > 0) {
        raw.push(makePlan(chunks, 'ROTATED_DESC', `Rotated DESC (offset ${r})`));
      }
    }
  }

  // Dedupe by canonical signature
  const seen = new Set<string>();
  const deduped = raw.filter(plan => {
    const sig = plan.chunks
      .map(c => `${c.setId}:${c.qty}`)
      .sort()
      .join('|');
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });

  // Sort: (a) |target - total| asc, (b) chunk count asc, (c) total desc
  deduped.sort((a, b) => {
    const diffA = Math.abs(targetQty - a.total);
    const diffB = Math.abs(targetQty - b.total);
    if (diffA !== diffB) return diffA - diffB;
    if (a.chunks.length !== b.chunks.length) return a.chunks.length - b.chunks.length;
    return b.total - a.total;
  });

  return deduped.slice(0, maxPlans);
}

function greedyFill(sorted: SetCountEntry[], targetQty: number): PlanChunk[] {
  const chunks: PlanChunk[] = [];
  let remaining = targetQty;
  for (const s of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, s.count);
    chunks.push({ setId: s.setId, qty: take, vendor: s.vendor, unitCost: s.unitCost });
    remaining -= take;
  }
  return chunks;
}

// ─── 2. SCORING LAYER ────────────────────────────────────

export function scorePlan(
  plan: CandidatePlan,
  targetQty: number,
  saleUnitPrice: number,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  isUpgrade = false,
  isDowngrade = false,
): number {
  // Exactness: 1 if total == target, drops off linearly
  const exactness = plan.total === targetQty ? 1 : Math.max(0, 1 - Math.abs(plan.total - targetQty) / targetQty);

  // Margin: normalized projected margin %
  const avgCost = plan.chunks.reduce((s, c) => s + c.unitCost * c.qty, 0) / Math.max(plan.total, 1);
  const marginPct = saleUnitPrice > 0 ? (saleUnitPrice - avgCost) / saleUnitPrice : 0;
  plan.marginDelta = Math.round((saleUnitPrice - avgCost) * plan.total);
  const marginScore = Math.max(0, Math.min(1, marginPct));

  // Vendor SLA: mock 0.8 for all vendors
  const vendorSlaScore = 0.8;

  // Set continuity: 1 if single set, decreases with more sets
  const setContinuity = 1 / plan.chunks.length;

  // Freshness: mock 0.7 (FIFO bias based on set creation order)
  const freshness = 0.7;

  // Penalties
  const upgradePenalty = isUpgrade ? 1 : 0;
  const diversityPenalty = plan.vendorMix.length > 1 ? 1 : 0;
  const splitPenalty = plan.chunks.length > 1 ? (plan.chunks.length - 1) / plan.chunks.length : 0;

  const score =
    weights.w1_exactness * exactness +
    weights.w2_margin * marginScore +
    weights.w3_vendorSla * vendorSlaScore +
    weights.w4_setContinuity * setContinuity +
    weights.w5_freshness * freshness -
    weights.p1_categoryUpgrade * upgradePenalty -
    weights.p2_vendorDiversity * diversityPenalty -
    weights.p3_split * splitPenalty;

  plan.score = Math.round(score * 1000) / 1000;
  return plan.score;
}

// ─── 3. POLICY EVALUATION ────────────────────────────────

export function evaluatePolicy(
  plan: CandidatePlan,
  policy: AllocationPolicy,
  context: {
    saleValue: number;
    rankGap: number;
    isUpgrade: boolean;
    isDowngrade: boolean;
    isVipClient: boolean;
    projectedMarginPct: number;
  }
): string[] {
  const violations: string[] = [];

  // Vendor blocklist
  for (const v of plan.vendorMix) {
    if (policy.vendorBlocklist.includes(v)) {
      violations.push(`Vendor "${v}" is blocklisted`);
    }
  }

  // Vendor whitelist
  if (policy.vendorWhitelist.length > 0) {
    for (const v of plan.vendorMix) {
      if (!policy.vendorWhitelist.includes(v)) {
        violations.push(`Vendor "${v}" not in whitelist [${policy.vendorWhitelist.join(', ')}]`);
      }
    }
  }

  // Upgrade rank gap
  if (context.isUpgrade && !policy.allowUpgrade) {
    violations.push('Upgrades not allowed by policy');
  }
  if (context.isUpgrade && Math.abs(context.rankGap) > policy.maxUpgradeRankGap) {
    violations.push(`Upgrade rank gap ${Math.abs(context.rankGap)} exceeds max ${policy.maxUpgradeRankGap}`);
  }

  // Downgrade rank gap
  if (context.isDowngrade && !policy.allowDowngrade) {
    violations.push('Downgrades not allowed by policy');
  }
  if (context.isDowngrade && Math.abs(context.rankGap) > policy.maxDowngradeRankGap) {
    violations.push(`Downgrade rank gap ${Math.abs(context.rankGap)} exceeds max ${policy.maxDowngradeRankGap}`);
  }

  // Margin
  if (context.projectedMarginPct < policy.minMarginPct) {
    violations.push(`Projected margin ${context.projectedMarginPct.toFixed(1)}% below policy min ${policy.minMarginPct}%`);
  }

  // Max auto commit value
  if (policy.mode === 'FULLY_AUTO' && context.saleValue > policy.maxAutoCommitValue) {
    violations.push(`Sale value ${context.saleValue.toLocaleString()} exceeds max auto-commit ${policy.maxAutoCommitValue.toLocaleString()}`);
  }

  // Split policy
  if (policy.splitPolicy === 'SINGLE_SET_ONLY' && plan.chunks.length > 1) {
    violations.push('Multi-set allocation blocked by SINGLE_SET_ONLY policy');
  }

  // Min chunk size
  if (policy.splitPolicy === 'REQUIRE_MIN_CHUNK_SIZE') {
    const tooSmall = plan.chunks.filter(c => c.qty < policy.minChunkSize);
    if (tooSmall.length > 0) {
      violations.push(`Chunk(s) below minimum size ${policy.minChunkSize}: ${tooSmall.map(c => `${c.setId}:${c.qty}`).join(', ')}`);
    }
  }

  // Vendor diversity
  if (policy.requireVendorDiversity && plan.vendorMix.length < 2 && plan.chunks.length > 1) {
    violations.push('Vendor diversity required but all chunks from single vendor');
  }

  // VIP exclusion
  if (policy.excludeVip && context.isVipClient) {
    violations.push('VIP clients excluded from auto-allocation by policy');
  }

  plan.policyViolations = violations;
  plan.passesPolicy = violations.length === 0;
  return violations;
}

// ─── 4. FULL ENGINE RUN ──────────────────────────────────

export interface EngineInput {
  saleLineId: string;
  saleId: string;
  subGameId: string;
  categoryId: string;
  targetQty: number;
  unitPrice: number;
  saleValue: number;
  setCounts: SetCountEntry[];
  soldCategoryLevel: number;
  effectiveCategoryLevel: number;
  isVipClient: boolean;
}

export interface EngineResult {
  saleLineId: string;
  saleId: string;
  plans: CandidatePlan[];
  bestPlan: CandidatePlan | null;
  status: 'COMMITTED' | 'SHORTAGE' | 'BLOCKED_BY_POLICY' | 'SKIPPED';
  reason: string;
}

export function runEngine(
  inputs: EngineInput[],
  policy: AllocationPolicy,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
): EngineResult[] {
  return inputs.map(input => {
    const plans = suggestPlans(input.setCounts, input.targetQty);

    if (plans.length === 0) {
      return {
        saleLineId: input.saleLineId,
        saleId: input.saleId,
        plans: [],
        bestPlan: null,
        status: 'SHORTAGE' as const,
        reason: `No inventory available: short by ${input.targetQty} tickets`,
      };
    }

    const isUpgrade = input.effectiveCategoryLevel < input.soldCategoryLevel;
    const isDowngrade = input.effectiveCategoryLevel > input.soldCategoryLevel;
    const rankGap = input.effectiveCategoryLevel - input.soldCategoryLevel;

    // Score all plans
    for (const plan of plans) {
      scorePlan(plan, input.targetQty, input.unitPrice, weights, isUpgrade, isDowngrade);

      const avgCost = plan.chunks.reduce((s, c) => s + c.unitCost * c.qty, 0) / Math.max(plan.total, 1);
      const projectedMarginPct = input.unitPrice > 0 ? ((input.unitPrice - avgCost) / input.unitPrice) * 100 : 0;

      evaluatePolicy(plan, policy, {
        saleValue: input.saleValue,
        rankGap,
        isUpgrade,
        isDowngrade,
        isVipClient: input.isVipClient,
        projectedMarginPct,
      });
    }

    // Sort by score descending
    plans.sort((a, b) => b.score - a.score);

    // Pick best plan that passes policy
    const bestPlan = plans.find(p => p.passesPolicy) ?? null;

    if (!bestPlan) {
      const allViolations = plans[0]?.policyViolations ?? [];
      return {
        saleLineId: input.saleLineId,
        saleId: input.saleId,
        plans,
        bestPlan: null,
        status: 'BLOCKED_BY_POLICY' as const,
        reason: allViolations.join('; '),
      };
    }

    return {
      saleLineId: input.saleLineId,
      saleId: input.saleId,
      plans,
      bestPlan,
      status: 'COMMITTED' as const,
      reason: bestPlan.note,
    };
  });
}
