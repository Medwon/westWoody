import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaymentSearchRequest {
  paymentId?: string;
  clientName?: string;
  phone?: string;
  periodFrom?: string | null;
  periodTo?: string | null;
  paymentMethod?: string | null;
  paymentType?: 'ALL' | 'PAID' | 'REFUND';
  sortBy?: 'date' | 'amount' | 'clientName';
  sortDirection?: 'ASC' | 'DESC';
  page?: number;
  size?: number;
}

export interface PaymentSearchResult {
  txId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  amount: number;
  status: string;
  paymentMethod: string | null;
  initiatedBy: string | null;
  createdAt: string;
  refundedPaymentTxId: string | null;
  bonusGranted: number;
  bonusUsed: number;
  refundReason: string | null;
}

export interface PaymentSearchResponse {
  content: PaymentSearchResult[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface RefundRequest {
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private readonly apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  /**
   * Search payments with filters and pagination
   */
  searchPayments(request: PaymentSearchRequest): Observable<PaymentSearchResponse> {
    return this.http.post<PaymentSearchResponse>(`${this.apiUrl}/search`, request);
  }

  /**
   * Refund a payment
   */
  refundPayment(paymentTxId: string, refundRequest: RefundRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${paymentTxId}/refund`, refundRequest);
  }
}
