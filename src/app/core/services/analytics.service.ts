import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MonthlyRevenueResponse {
  revenue: number;
  period?: string;
}

export interface AverageCheckResponse {
  averageCheck: number;
  period?: string;
}

export interface OverallTotalsResponse {
  totalPayments: number;
  totalRevenue: number;
  totalBonusesGranted: number;
  totalClients: number;
}

export interface DailyTransactionsResponse {
  count: number;
  date?: string;
}

export interface ActiveClientsResponse {
  count: number;
  period?: string;
}

export interface ClientTotalsResponse {
  totalPayments: number;
  totalRevenue: number;
  totalBonusesGranted: number;
  totalBonusesUsed: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  /**
   * Get monthly revenue
   * @returns Observable with monthly revenue data
   */
  getMonthlyRevenue(): Observable<MonthlyRevenueResponse> {
    return this.http.get<MonthlyRevenueResponse>(`${this.apiUrl}/revenue/monthly`);
  }

  /**
   * Get average check for a specific period
   * @param period - Period type: 'DAILY' or 'MONTHLY'
   * @returns Observable with average check data
   */
  getAverageCheck(period: 'DAILY' | 'MONTHLY' = 'MONTHLY'): Observable<AverageCheckResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<AverageCheckResponse>(`${this.apiUrl}/average-check`, { params });
  }

  /**
   * Get overall totals (total payments, total revenue, total bonuses granted)
   * @returns Observable with overall totals data
   */
  getOverallTotals(): Observable<OverallTotalsResponse> {
    return this.http.get<OverallTotalsResponse>(`${this.apiUrl}/totals/overall`);
  }

  /**
   * Get daily transaction count
   * @returns Observable with daily transactions data
   */
  getDailyTransactions(): Observable<DailyTransactionsResponse> {
    return this.http.get<DailyTransactionsResponse>(`${this.apiUrl}/transactions/daily`);
  }

  /**
   * Get active clients count (monthly)
   * @returns Observable with active clients data
   */
  getActiveClients(): Observable<ActiveClientsResponse> {
    return this.http.get<ActiveClientsResponse>(`${this.apiUrl}/clients/active`);
  }

  /**
   * Get client totals for dashboard
   * @param clientId - Client ID
   * @returns Observable with client totals data
   */
  getClientTotals(clientId: string): Observable<ClientTotalsResponse> {
    return this.http.get<ClientTotalsResponse>(`${this.apiUrl}/clients/${clientId}/totals`);
  }
}
