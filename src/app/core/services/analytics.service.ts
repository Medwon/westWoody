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
}
