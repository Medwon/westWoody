import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BonusHistoryItem {
  id: number;
  eventId: string;
  clientId: string;
  clientName: string;
  eventType: 'GRANTED' | 'USED' | 'EXPIRED' | 'REVOKED';
  bonusAmount: number;
  createdAt: string;
  paymentTxId: string | null;
  bonusPercentage: number | null;
  paymentAmount: number | null;
  grantReason: string | null;
  expiresAt: string | null;
  originalPaymentAmount: number | null;
  finalPaymentAmount: number | null;
  revokeReason: string | null;
  originalPaymentTxId: string | null; // Original payment that granted the bonus (for REVOKED events)
  refundTxId: string | null; // Refund transaction that caused the revocation
  revokedAt: string | null; // When the bonus was revoked
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
}
