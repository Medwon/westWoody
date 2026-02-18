import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MonthlyRevenueResponse {
  amount: number;
  changePercentage?: number;
  period?: string;
  // Fallback for backward compatibility
  revenue?: number;
  changePercent?: number;
}

export interface DailyRevenueResponse {
  amount: number;
  changePercentage?: number;
  period?: string;
  date?: string;
  // Fallback for backward compatibility
  revenue?: number;
  changePercent?: number;
}

export interface AverageCheckResponse {
  amount: number;
  changePercentage?: number;
  period?: string;
  // Fallback for backward compatibility
  averageCheck?: number;
  changePercent?: number;
}

export interface OverallTotalsResponse {
  totalPayments: number;
  totalRevenue: number;
  totalBonusesGranted: number;
  totalClients: number;
}

export interface DailyTransactionsResponse {
  count: number;
  changeAbsolute?: number;
  date?: string;
}

export interface NewClientsResponse {
  count: number;
  changeAbsolute: number;
  type: 'NEW';
  period: 'DAILY' | 'MONTHLY';
}

export interface BonusesAccruedResponse {
  amount: number;
  changePercentage?: number;
  period?: string;
  // Fallback for backward compatibility
  count?: number;
  changePercent?: number;
}

export interface DailyRefundsResponse {
  count: number;
  changeAbsolute?: number;
  date?: string;
}

export interface ActiveClientsResponse {
  count: number;
  changeAbsolute?: number;
  period?: string;
}

export interface ChartDataPoint {
  day: number;
  revenue: number;
  transactionCount: number;
  bonusesGranted: number;
  bonusesUsed: number;
  // Fallback fields for backward compatibility
  transactions?: number;
  bonusEarned?: number;
  bonusUsed?: number;
}

export interface MonthlyRevenueChartResponse {
  dailyData: ChartDataPoint[];
  year: number;
  month: number;
  // Fallback for backward compatibility
  data?: ChartDataPoint[];
}

export interface ClientTotalsResponse {
  totalPayments: number;
  totalRevenue: number;
  totalBonusesGranted: number;
  totalBonusesUsed: number;
}

/** KPI Dashboard (kpi-analytics) */
export interface KpiDashboardResponse {
  period: { from: string; to: string };
  revenue: {
    totalRevenue: number;
    incrementalRevenue: number;
    incrementalRevenuePercentage: number;
  };
  uplift: {
    aovUplift: number;
    avgCheckWithBonus: number;
    avgCheckRegular: number;
  };
  retention: {
    retentionRate: number;
    returningClientsCount: number;
    totalActiveClients: number;
  };
  efficiency: {
    redemptionRate: number;
    effectiveDiscount: number;
    burnRate: number;
    burnedAmount: number;
  };
}

export interface TopCustomerResponse {
  id: number;
  clientId: string;
  name: string;
  totalSpent: number;
  paymentsCount: number;
  averageOrderValue: number;
}

export interface BonusesInCirculationResponse {
  amount: number;
}

export interface SalesByLoyaltyResponse {
  loyaltyCount: number;
  nonLoyaltyCount: number;
  loyaltyPercent: number;
  nonLoyaltyPercent: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/analytics`;
  private readonly kpiApiUrl = `${environment.apiUrl}/kpi-analytics`;

  constructor(private http: HttpClient) {}

  /**
   * Get monthly revenue
   * @returns Observable with monthly revenue data
   */
  getMonthlyRevenue(): Observable<MonthlyRevenueResponse> {
    return this.http.get<MonthlyRevenueResponse>(`${this.apiUrl}/revenue/monthly`);
  }

  /**
   * Get daily revenue
   * @returns Observable with daily revenue data
   */
  getDailyRevenue(): Observable<DailyRevenueResponse> {
    return this.http.get<DailyRevenueResponse>(`${this.apiUrl}/revenue/daily`);
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
   * Get new clients count
   * @param period - Period type: 'DAILY' or 'MONTHLY'
   * @returns Observable with new clients data
   */
  getNewClients(period: 'DAILY' | 'MONTHLY' = 'DAILY'): Observable<NewClientsResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<NewClientsResponse>(`${this.apiUrl}/clients/new/daily`, { params });
  }

  /**
   * Get bonuses accrued
   * @param period - Period type: 'DAILY' or 'MONTHLY'
   * @returns Observable with bonuses accrued data
   */
  getBonusesAccrued(period: 'DAILY' | 'MONTHLY' = 'MONTHLY'): Observable<BonusesAccruedResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<BonusesAccruedResponse>(`${this.apiUrl}/bonuses/accrued`, { params });
  }

  /**
   * Get daily refunds count
   * @returns Observable with daily refunds data
   */
  getDailyRefunds(): Observable<DailyRefundsResponse> {
    return this.http.get<DailyRefundsResponse>(`${this.apiUrl}/refunds/daily`);
  }

  /**
   * Get active clients count
   * @returns Observable with active clients data
   */
  getActiveClients(): Observable<ActiveClientsResponse> {
    return this.http.get<ActiveClientsResponse>(`${this.apiUrl}/clients/active`);
  }

  /**
   * Get monthly revenue chart data
   * @param year - Year (optional, defaults to current year)
   * @param month - Month 1-12 (optional, defaults to current month)
   * @returns Observable with chart data
   */
  getMonthlyRevenueChart(year?: number, month?: number): Observable<MonthlyRevenueChartResponse> {
    const now = new Date();
    const currentYear = year ?? now.getFullYear();
    const currentMonth = month ?? now.getMonth() + 1;
    
    const params = new HttpParams()
      .set('year', currentYear.toString())
      .set('month', currentMonth.toString());
    
    return this.http.get<MonthlyRevenueChartResponse>(`${this.apiUrl}/revenue/monthly/chart`, { params });
  }
  /**
   * Get client totals for dashboard
   * @param clientId - Client ID
   * @returns Observable with client totals data
  */
  getClientTotals(clientId: string): Observable<ClientTotalsResponse> {
    return this.http.get<ClientTotalsResponse>(`${this.apiUrl}/clients/${clientId}/totals`);
  }

  /**
   * Get KPI dashboard metrics for period [from, to] (ISO-8601).
   */
  getKpiDashboard(from: string, to: string): Observable<KpiDashboardResponse> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<KpiDashboardResponse>(`${this.kpiApiUrl}/dashboard-metrics`, { params });
  }

  /**
   * Get top 10 customers by total spent.
   */
  getTopCustomers(): Observable<TopCustomerResponse[]> {
    return this.http.get<TopCustomerResponse[]>(`${this.apiUrl}/top-customers`);
  }

  /**
   * Get total bonuses in circulation (active, usable by clients).
   */
  getBonusesInCirculation(): Observable<BonusesInCirculationResponse> {
    return this.http.get<BonusesInCirculationResponse>(`${this.apiUrl}/bonuses/in-circulation`);
  }

  /**
   * Get all-time sales split: loyalty (bonus used) vs non-loyalty.
   */
  getSalesByLoyalty(): Observable<SalesByLoyaltyResponse> {
    return this.http.get<SalesByLoyaltyResponse>(`${this.apiUrl}/bonuses/sales-by-loyalty`);
  }

  /**
   * Get KPI report for a bonus type (or all when bonusTypeId is null) in period [from, to] (ISO-8601).
   */
  getBonusTypeReport(bonusTypeId: number | null, from: string, to: string): Observable<BonusTypeReportResponse> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (bonusTypeId != null) {
      params = params.set('bonusTypeId', bonusTypeId.toString());
    }
    return this.http.get<BonusTypeReportResponse>(`${this.apiUrl}/bonus-type-report`, { params });
  }
}

export interface MonthlyReportPoint {
  month: string;
  yearMonth: string;
  avgCheckWithBonus: number;
  avgCheckWithoutBonus: number;
  transactionCountWithBonus: number;
  transactionCountWithoutBonus: number;
  /** Total revenue for the month (optional for backward compatibility). */
  revenue?: number;
}

export interface BonusTypeReportResponse {
  bonusTypeId: number | null;
  bonusTypeName: string;
  periodFrom: string;
  periodTo: string;
  transactionCount: number;
  transactionCountWithoutBonus: number;
  avgCheckWithBonus: number;
  avgCheckWithoutBonus: number;
  totalGranted: number;
  inCirculation: number;
  burnedAmount: number;
  spentAmount: number;
  redemptionRatePercent: number;
  effectiveDiscountPercent: number;
  burnRatePercent: number;
  aovUpliftPercent: number;
  incrementalRevenuePercent: number;
  retentionRatePercent: number;
  conversionRatePercent: number;
  cac: number;
  monthlyData: MonthlyReportPoint[] | null;
}
