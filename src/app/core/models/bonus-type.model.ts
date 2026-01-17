// Bonus type enum from backend
export type BonusTypeType = 
  | 'BASIC_CASHBACK'
  | 'BIRTHDAY_BONUS'
  | 'WELCOME_BONUS'
  | 'REFERRAL_BONUS'
  | 'MILESTONE_BONUS'
  | 'WELCOME'
  | 'BIRTHDAY'
  | 'PAYMENT_MILESTONE'
  | 'REFERRAL';

// Icon type enum from backend
export type BonusIconType = 
  | 'WALLET'
  | 'PARTY'
  | 'CAKE'
  | 'SHARE'
  | 'GIFT'
  | 'PERCENT'
  | 'HEART'
  | 'TROPHY';

// Full bonus type response from API
export interface BonusTypeResponse {
  id: number;
  name: string;
  type: BonusTypeType;
  enabled: boolean;
  bonusPercentage?: number;
  bonusAmount?: number;
  expirationDays: number;
  description: string;
  iconType?: BonusIconType | null;
  createdAt: string;
  updatedAt: string;
}

// Create bonus type request
export interface CreateBonusTypeRequest {
  name: string;
  type: BonusTypeType;
  bonusPercentage?: number;
  bonusAmount?: number;
  expirationDays: number;
  description: string;
  iconType: BonusIconType;
}

// Update bonus type request
export interface UpdateBonusTypeRequest {
  name?: string;
  enabled?: boolean;
  bonusPercentage?: number;
  bonusAmount?: number;
  expirationDays?: number;
  description?: string;
  iconType?: BonusIconType;
}

// Preconfigured bonus type response
export interface PreconfiguredBonusType {
  type: BonusTypeType;
  displayName: string;
}

// Alias for backward compatibility
export type BonusType = BonusTypeResponse;
