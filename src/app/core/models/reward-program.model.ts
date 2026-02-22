// ─── Enums / Types ───────────────────────────────────────────────────

export type RewardProgramType = 'WELCOME' | 'BIRTHDAY' | 'REFERRAL' | 'CASHBACK';

export type RewardProgramStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type CashbackType = 'PERCENTAGE' | 'BONUS_POINTS';

export type EligibilityType = 'ALL' | 'SPECIFIC_ITEMS' | 'SPECIFIC_CATEGORIES' | 'SPECIFIC_SERVICES';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type WelcomeGrantType = 'POINTS' | 'FIXED_MONEY_KZT';
export type GrantTrigger = 'ON_JOIN' | 'ON_FIRST_PAY';
export type FirstPayMode = 'WELCOME_ONLY' | 'WELCOME_AND_CASHBACK';

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

// ─── Welcome Draft / Launch ───────────────────────────────────────────

export interface SaveWelcomeProgramDraftRequest {
  name?: string;
  description?: string;
  grantType?: WelcomeGrantType;
  grantValue?: number;
  bonusLifespanDays?: number;
  grantTrigger?: GrantTrigger;
  firstPayMode?: FirstPayMode;
  startDate?: string;
  endDate?: string | null;
}

export interface LaunchWelcomeProgramRequest {
  immediate: boolean;
  name?: string | null;
  description?: string | null;
  grantType?: WelcomeGrantType | null;
  grantValue?: number | null;
  bonusLifespanDays?: number | null;
  grantTrigger?: GrantTrigger | null;
  firstPayMode?: FirstPayMode | null;
  startDate?: string | null;
  endDate?: string | null;
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

export interface WelcomeProgramRuleResponse {
  grantType: WelcomeGrantType;
  grantValue: number;
  bonusLifespanDays: number | null;
  grantTrigger: GrantTrigger;
  firstPayMode: FirstPayMode | null;
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
  welcomeRule: WelcomeProgramRuleResponse | null;
  createdAt: string;
  updatedAt: string;
  /** When this program has an end date and an always-on program of same type exists. */
  alwaysOnProgramName?: string | null;
  /** When this program is always-on and a dated program of same type exists. */
  ignoredDuringProgramName?: string | null;
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
  /** Only for type WELCOME: POINTS or FIXED_MONEY_KZT */
  welcomeGrantType?: WelcomeGrantType | null;
  /** Only for type WELCOME: grant value (points or KZT amount) */
  welcomeGrantValue?: number | null;
  /** When this program has an end date and an always-on program of same type exists. */
  alwaysOnProgramName?: string | null;
  /** When this program is always-on and a dated program of same type exists: that program's name (this program is not applied during that period). */
  ignoredDuringProgramName?: string | null;
}

export interface ScheduleOverlapCheckResponse {
  overlaps: boolean;
  overlappingProgramName?: string | null;
  alwaysOnProgramName?: string | null;
  /** When true, conflict is because an always-on program already exists (only one always-on allowed). */
  alwaysOnConflict?: boolean | null;
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
