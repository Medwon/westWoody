import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BonusHistoryItem {
  id: number;
  eventId: string | null;
  clientId: string;
  clientName: string;
  eventType: 'GRANTED' | 'USED' | 'EXPIRED' | 'REVOKED' | 'MANUAL_REVOKE';
  bonusAmount: number;
  createdAt: string;
  /** For GRANTED: original grant amount */
  originalAmount?: number | null;
  /** For GRANTED: remaining after consumptions */
  remainingAmount?: number | null;
  paymentTxId: string | null;
  bonusPercentage: number | null;
  paymentAmount: number | null;
  grantReason: string | null;
  expiresAt: string | null;
  originalPaymentAmount: number | null;
  finalPaymentAmount: number | null;
  revokeReason: string | null;
  originalPaymentTxId: string | null;
  refundTxId: string | null;
  revokedAt: string | null;
  /** For MANUAL_REVOKE: who performed the revoke */
  revokedByUserId?: number | null;
  revokedByUserName?: string | null;
  /** Initiator for any event: who performed the action */
  initiatedByUserId?: number | null;
  initiatedByUserName?: string | null;
}

export interface BonusHistoryResponse {
  content: BonusHistoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface BonusBalance {
  clientId: string;
  clientName: string;
  totalAccumulated: number;
  totalUsed: number;
  currentBalance: number;
}

export interface ManualBonusGrantRequest {
  amount: number;
  reason?: string;
}

export interface ManualBonusRevokeRequest {
  amount: number;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BonusesService {
  private readonly apiUrl = `${environment.apiUrl}/bonuses`;

  constructor(private http: HttpClient) {}

  /**
   * Get client bonus history with pagination
   */
  getClientBonusHistory(clientId: string, page: number = 0, size: number = 100): Observable<BonusHistoryResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<BonusHistoryResponse>(`${this.apiUrl}/client/${clientId}/history`, { params });
  }

  /**
   * Get client bonus balance
   */
  getClientBonusBalance(clientId: string): Observable<BonusBalance> {
    return this.http.get<BonusBalance>(`${this.apiUrl}/client/${clientId}/balance`);
  }

  /**
   * Manually grant bonus to a client
   */
  grantBonus(clientId: string, request: ManualBonusGrantRequest): Observable<BonusBalance> {
    return this.http.post<BonusBalance>(`${this.apiUrl}/client/${clientId}/grant`, request);
  }

  /**
   * Manually revoke bonus from a client
   */
  revokeBonus(clientId: string, request: ManualBonusRevokeRequest): Observable<BonusBalance> {
    return this.http.post<BonusBalance>(`${this.apiUrl}/client/${clientId}/revoke`, request);
  }
}
