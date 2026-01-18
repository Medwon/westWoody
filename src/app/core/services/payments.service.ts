import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface CreateDraftPaymentRequest {
  clientId: string;
}

export interface DraftPaymentResponse {
  txId: string;
  clientId: string;
  clientName: string;
  enteredByUserId: string;
  enteredByUsername: string;
  amount: number;
  notes: string | null;
  status: string;
  refundedPaymentTxId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompletePaymentRequest {
  originalAmount: number;
  bonusAmountUsed: number | null;
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

  /**
   * Get client payment history with pagination
   */
  getClientPayments(clientId: string, page: number = 0, size: number = 100): Observable<PaymentSearchResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PaymentSearchResponse>(`${this.apiUrl}/client/${clientId}`, { params });
  }

  /**
   * Create a draft payment
   */
  createDraftPayment(request: CreateDraftPaymentRequest): Observable<DraftPaymentResponse> {
    console.log('=== CREATE DRAFT PAYMENT REQUEST ===');
    console.log('URL:', `${this.apiUrl}/draft`);
    console.log('Method: POST');
    console.log('Full Request Payload:', JSON.stringify(request, null, 2));
    console.log('Request Payload (object):', request);
    console.log('====================================');
    return this.http.post<DraftPaymentResponse>(`${this.apiUrl}/draft`, request);
  }

  /**
   * Complete a payment
   */
  completePayment(paymentTxId: string, request: CompletePaymentRequest): Observable<void> {
    console.log('=== COMPLETE PAYMENT REQUEST ===');
    console.log('URL:', `${this.apiUrl}/${paymentTxId}/complete`);
    console.log('Method: POST');
    console.log('Payment TX ID:', paymentTxId);
    console.log('Full Request Payload:', JSON.stringify(request, null, 2));
    console.log('Request Payload (object):', request);
    console.log('================================');
    return this.http.post<void>(`${this.apiUrl}/${paymentTxId}/complete`, request);
  }

  /**
   * Delete a draft payment
   */
  deleteDraftPayment(paymentTxId: string): Observable<void> {
    console.log('=== DELETE DRAFT PAYMENT REQUEST ===');
    console.log('URL:', `${this.apiUrl}/draft/${paymentTxId}`);
    console.log('Method: DELETE');
    console.log('Payment TX ID:', paymentTxId);
    console.log('=====================================');
    return this.http.delete<void>(`${this.apiUrl}/draft/${paymentTxId}`);
  }
}
