// ─── Enums / Types ───────────────────────────────────────────────────

export type RewardProgramType = 'WELCOME' | 'BIRTHDAY' | 'REFERRAL' | 'CASHBACK';

export type RewardProgramStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type CashbackType = 'PERCENTAGE' | 'BONUS_POINTS';

export type EligibilityType = 'ALL' | 'SPECIFIC_ITEMS' | 'SPECIFIC_CATEGORIES' | 'SPECIFIC_SERVICES';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// ─── Slot (program type selection screen) ────────────────────────────

export interface RewardProgramSlot {
  type: RewardProgramType;
  status: 'NOT_CREATED' | RewardProgramStatus;
  uuid: string | null;
  name?: string;
}

export interface CreateDraftResponse {
  uuid: string;
  type: RewardProgramType;
  status: RewardProgramStatus;
}

// ─── Weekly Schedule ─────────────────────────────────────────────────

export interface WeeklyScheduleEntry {
  dayOfWeek: DayOfWeek;
  enabled: boolean;
  startTime: string | null; // "HH:mm"
  endTime: string | null;   // "HH:mm"
}

// ─── Cashback Tier ───────────────────────────────────────────────────

export interface CashbackTierEntry {
  name: string;
  minAmount: number;
  maxAmount: number | null;
  extraEarningPercent: number;
  sortOrder: number;
}

// ─── Save Cashback Draft Request ─────────────────────────────────────

export interface SaveCashbackDraftRequest {
  name?: string;
  description?: string;
  cashbackType?: CashbackType;
  cashbackValue?: number;
  minSpendAmount?: number;
  eligibilityType?: EligibilityType;
  redeemLimitPercent?: number;
  bonusLifespanDays?: number;
  pointsSpendThreshold?: number;
  startDate?: string;  // ISO datetime
  endDate?: string | null;
  weeklySchedules?: WeeklyScheduleEntry[];
  tiers?: CashbackTierEntry[];
}

// ─── Launch Request ──────────────────────────────────────────────────

export interface LaunchCashbackProgramRequest {
  immediate: boolean;
  name?: string | null;
  description?: string | null;
  cashbackType?: CashbackType | null;
  cashbackValue?: number | null;
  minSpendAmount?: number | null;
  eligibilityType?: EligibilityType | null;
  redeemLimitPercent?: number | null;
  bonusLifespanDays?: number | null;
  pointsSpendThreshold?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  weeklySchedules?: WeeklyScheduleEntry[] | null;
  tiers?: CashbackTierEntry[] | null;
}

// ─── Response DTOs ───────────────────────────────────────────────────

export interface WeeklyScheduleResponse {
  dayOfWeek: DayOfWeek;
  enabled: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface CashbackProgramRuleResponse {
  cashbackType: CashbackType;
  cashbackValue: number;
  minSpendAmount: number;
  eligibilityType: EligibilityType;
  redeemLimitPercent: number;
  bonusLifespanDays: number | null;
  pointsSpendThreshold: number | null;
}

export interface CashbackTierResponse {
  name: string;
  minAmount: number;
  maxAmount: number | null;
  extraEarningPercent: number;
  sortOrder: number;
}

export interface RewardProgramResponse {
  uuid: string;
  type: RewardProgramType;
  status: RewardProgramStatus;
  name: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdByUserId: number | null;
  weeklySchedules: WeeklyScheduleResponse[];
  cashbackRule: CashbackProgramRuleResponse | null;
  cashbackTiers: CashbackTierResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface RewardProgramListItem {
  uuid: string;
  type: RewardProgramType;
  status: RewardProgramStatus;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  /** Only for type CASHBACK */
  cashbackType?: CashbackType | null;
  cashbackValue?: number | null;
  minSpendAmount?: number | null;
  pointsSpendThreshold?: number | null;
}

// ─── Tiered clients (program-period spend, paginated) ──────────────────

export interface TieredClientDto {
  clientUuid: string;
  clientName: string;
  phone: string | null;
  tierName: string;
  tierSortOrder: number;
  programPeriodSpend: number;
  /** 0–100, null if top tier */
  percentToNextTier: number | null;
  nextTierName: string | null;
}

export interface PagedTieredClientsResponse {
  content: TieredClientDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
