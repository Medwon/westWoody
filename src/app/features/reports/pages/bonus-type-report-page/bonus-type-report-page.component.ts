import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { BonusTypesService } from '../../../../core/services/bonus-types.service';
import { AnalyticsService, BonusTypeReportResponse, MonthlyReportPoint } from '../../../../core/services/analytics.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import type { BonusTypeResponse } from '../../../../core/models/bonus-type.model';
import { catchError, of } from 'rxjs';

type PeriodKey = '1m' | '3m' | '6m' | '1y' | 'all';

@Component({
  selector: 'app-bonus-type-report-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './bonus-type-report-page.component.html',
  styleUrls: ['./bonus-type-report-page.component.scss']
})
export class BonusTypeReportPageComponent implements OnInit {
  private pageHeader = inject(PageHeaderService);
  private bonusTypesService = inject(BonusTypesService);
  private analyticsService = inject(AnalyticsService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  bonusTypes: BonusTypeResponse[] = [];
  selectedBonusTypeId: number | null = null;
  period: PeriodKey = '1m';
  report: BonusTypeReportResponse | null = null;
  /** Monthly data for the chart block only (always 12 months of chartYear). */
  monthlyChartData: MonthlyReportPoint[] | null = null;
  isLoading = false;
  isMonthlyChartLoading = false;
  errorMessage: string | null = null;
  /** Selected month from monthly chart (click); main report then shows that month's data. */
  selectedMonthForBar: string | null = null;
  /** Year for monthly chart; only affects the "Средний чек и выручка по месяцам" block. */
  chartYear: number = new Date().getFullYear();
  private _initialLoadDone = false;

  get showRetention(): boolean {
    if (!this.report) return false;
    const type = this.getSelectedBonusType();
    return type != null && (type.type === 'WELCOME' || type.type === 'BIRTHDAY');
  }

  get showReferral(): boolean {
    const type = this.getSelectedBonusType();
    return type != null && type.type === 'REFERRAL';
  }

  /** Для "Общая статистика" — все транзакции за период (как в главном меню). Для выбранного типа бонуса — только транзакции с этим бонусом. */
  get displayTransactionCount(): number {
    if (!this.report) return 0;
    if (this.selectedBonusTypeId == null) {
      return this.report.transactionCount + (this.report.transactionCountWithoutBonus ?? 0);
    }
    return this.report.transactionCount;
  }

  private getSelectedBonusType(): BonusTypeResponse | undefined {
    if (this.selectedBonusTypeId == null) return undefined;
    return this.bonusTypes.find(bt => bt.id === this.selectedBonusTypeId);
  }

  ngOnInit(): void {
    this.pageHeader.setPageHeader('Отчёт по типам бонусов', [
      { label: 'Главная', route: '/home' },
      { label: 'Отчёт по типам бонусов' }
    ]);
    this.applyStateFromQueryParams(this.route.snapshot.queryParams);
    this.loadBonusTypes();
  }

  private applyStateFromQueryParams(params: Record<string, string | undefined>): void {
    const period = params['period'];
    if (period && ['1m', '3m', '6m', '1y', 'all'].includes(period)) {
      this.period = period as PeriodKey;
    }
    const bonusType = params['bonusType'];
    if (bonusType !== undefined) {
      if (bonusType === 'all' || bonusType === '') {
        this.selectedBonusTypeId = null;
      } else {
        const id = Number(bonusType);
        if (!isNaN(id)) this.selectedBonusTypeId = id;
      }
    }
    const month = params['month'];
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      this.selectedMonthForBar = month;
    }
    const year = params['year'];
    if (year) {
      const y = parseInt(year, 10);
      if (!isNaN(y) && y >= 2000 && y <= 2100) this.chartYear = y;
    }
  }

  private updateUrlFromState(): void {
    const queryParams: Record<string, string | number | null> = {
      period: this.period,
      bonusType: this.selectedBonusTypeId ?? 'all',
      year: this.chartYear
    };
    if (this.selectedMonthForBar) {
      queryParams['month'] = this.selectedMonthForBar;
    } else {
      queryParams['month'] = null;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: Object.fromEntries(
        Object.entries(queryParams).filter(([, v]) => v != null && v !== '')
      ) as Record<string, string>,
      replaceUrl: true
    });
  }

  private loadBonusTypes(): void {
    this.bonusTypesService.getActiveBonusTypes().pipe(
      catchError(() => of([]))
    ).subscribe(list => {
      this.bonusTypes = list;
      if (!this._initialLoadDone) {
        this._initialLoadDone = true;
        this.selectedBonusTypeId = this.selectedBonusTypeId ?? null;
        if (this.selectedMonthForBar) {
          const [y, m] = this.selectedMonthForBar.split('-').map(Number);
          const from = new Date(y, m - 1, 1, 0, 0, 0);
          const to = new Date(y, m, 0, 23, 59, 59);
          this.loadReportForRange(from.toISOString().slice(0, 19), to.toISOString().slice(0, 19));
        } else {
          this.loadReport();
        }
        this.loadMonthlyChartData();
      }
      this.cdr.markForCheck();
    });
  }

  onBonusTypeChange(id: number | string): void {
    const num = id === '' || id === 'all' ? null : Number(id);
    this.selectedBonusTypeId = num;
    this.updateUrlFromState();
    this.loadReport();
    this.loadMonthlyChartData();
  }

  onPeriodChange(p: PeriodKey): void {
    this.period = p;
    this.updateUrlFromState();
    this.loadReport();
    // Monthly chart is unchanged — still shows chartYear
  }

  onChartYearChange(year: number | string): void {
    const y = typeof year === 'string' ? parseInt(year, 10) : year;
    if (!isNaN(y)) {
      this.chartYear = y;
      this.updateUrlFromState();
      this.loadMonthlyChartData();
    }
  }

  get availableChartYears(): number[] {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = current; y >= current - 5; y--) years.push(y);
    return years;
  }

  /** Click on a month bar: load report for that month and update cards + charts. */
  selectMonth(yearMonth: string): void {
    this.selectedMonthForBar = yearMonth;
    this.updateUrlFromState();
    const [y, m] = yearMonth.split('-').map(Number);
    const from = new Date(y, m - 1, 1, 0, 0, 0);
    const to = new Date(y, m, 0, 23, 59, 59);
    this.loadReportForRange(from.toISOString().slice(0, 19), to.toISOString().slice(0, 19));
  }

  private loadReportForRange(from: string, to: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.analyticsService.getBonusTypeReport(this.selectedBonusTypeId, from, to).pipe(
      catchError(err => {
        this.errorMessage = err?.error?.message || 'Не удалось загрузить отчёт';
        return of(null);
      })
    ).subscribe(data => {
      this.report = data ?? null;
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  private getPeriodRange(): { from: string; to: string } {
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let from: Date;
    switch (this.period) {
      case '3m':
        from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), 0, 0, 0);
        break;
      case '6m':
        from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate(), 0, 0, 0);
        break;
      case '1y':
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'all':
        from = new Date(2000, 0, 1, 0, 0, 0);
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }
    return {
      from: from.toISOString().slice(0, 19),
      to: to.toISOString().slice(0, 19)
    };
  }

  private loadReport(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.selectedMonthForBar = null;
    this.updateUrlFromState();
    const { from, to } = this.getPeriodRange();
    this.analyticsService.getBonusTypeReport(this.selectedBonusTypeId, from, to).pipe(
      catchError(err => {
        this.errorMessage = err?.error?.message || 'Не удалось загрузить отчёт';
        return of(null);
      })
    ).subscribe(data => {
      this.report = data ?? null;
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  /** Load only monthly chart data (12 months of chartYear); does not change report. */
  private loadMonthlyChartData(): void {
    this.isMonthlyChartLoading = true;
    const from = `${this.chartYear}-01-01T00:00:00`;
    const to = `${this.chartYear}-12-31T23:59:59`;
    this.analyticsService.getBonusTypeReport(this.selectedBonusTypeId, from, to).pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      this.monthlyChartData = data?.monthlyData ?? null;
      this.isMonthlyChartLoading = false;
      this.cdr.markForCheck();
    });
  }

  get donutSalesWithPercent(): number {
    if (!this.report) return 0;
    const t = this.report.transactionCount + (this.report.transactionCountWithoutBonus ?? 0);
    return t === 0 ? 0 : (this.report.transactionCount / t) * 100;
  }

  get donutSalesWithoutPercent(): number {
    if (!this.report) return 100 - this.donutSalesWithPercent;
    const t = this.report.transactionCount + (this.report.transactionCountWithoutBonus ?? 0);
    return t === 0 ? 100 : ((this.report.transactionCountWithoutBonus ?? 0) / t) * 100;
  }

  getDonutSalesDash(): string {
    const c = 2 * Math.PI * 40;
    const len = (this.donutSalesWithPercent / 100) * c;
    return `${len} ${c}`;
  }

  getDonutSalesOffset(): number {
    const c = 2 * Math.PI * 40;
    const len = (this.donutSalesWithPercent / 100) * c;
    return -len;
  }

  get donutBonusInCirculationPercent(): number {
    if (!this.report) return 0;
    const total = Number(this.report.inCirculation) + Number(this.report.spentAmount);
    return total === 0 ? 0 : (Number(this.report.inCirculation) / total) * 100;
  }

  getDonutBonusDash(): string {
    const c = 2 * Math.PI * 40;
    const len = (this.donutBonusInCirculationPercent / 100) * c;
    return `${len} ${c}`;
  }

  getDonutBonusSpentDash(): string {
    const c = 2 * Math.PI * 40;
    const spent = 100 - this.donutBonusInCirculationPercent;
    const len = (spent / 100) * c;
    return `${len} ${c}`;
  }

  getDonutBonusOffset(): number {
    const c = 2 * Math.PI * 40;
    const len = (this.donutBonusInCirculationPercent / 100) * c;
    return -len;
  }

  get maxAvgForBar(): number {
    if (!this.report) return 100;
    return Math.max(Number(this.report.avgCheckWithBonus) || 0, Number(this.report.avgCheckWithoutBonus) || 0, 1);
  }

  get maxAvgForBarRounded(): number {
    return this.niceRoundMax(this.maxAvgForBar) || 100;
  }

  getAvgCheckAxisLabels(): string[] {
    const max = this.maxAvgForBarRounded || 100;
    const labels: string[] = [];
    for (let i = 4; i >= 0; i--) {
      const v = Math.round((max * i) / 4);
      labels.push(this.formatYAxisValue(v) + ' ₸');
    }
    return labels;
  }

  /** Rounded max for axis scale (like main menu). */
  niceRoundMax(value: number): number {
    if (value <= 0) return 100;
    const order = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / order;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return Math.ceil((nice * order) / 1000) * 1000 || 100;
  }

  get monthlyChartMax(): number {
    if (!this.monthlyChartData?.length) return 100;
    let m = 0;
    for (const d of this.monthlyChartData) {
      m = Math.max(m, d.avgCheckWithBonus ?? 0, d.avgCheckWithoutBonus ?? 0);
    }
    return this.niceRoundMax(m) || 100;
  }

  get monthlyRevenueMax(): number {
    if (!this.monthlyChartData?.length) return 1;
    let m = 0;
    for (const d of this.monthlyChartData) {
      m = Math.max(m, d.revenue ?? 0);
    }
    return this.niceRoundMax(m) || 1;
  }

  /** Axis labels for left (avg check) - dynamic rounded like main menu. */
  getMonthlyLeftAxisLabels(): string[] {
    const max = this.monthlyChartMax || 100;
    const labels: string[] = [];
    for (let i = 4; i >= 0; i--) {
      const v = Math.round((max * i) / 4);
      labels.push(this.formatYAxisValue(v) + ' ₸');
    }
    return labels;
  }

  getMonthlyRightAxisLabels(): string[] {
    const max = this.monthlyRevenueMax || 1;
    const labels: string[] = [];
    for (let i = 4; i >= 0; i--) {
      const v = Math.round((max * i) / 4);
      labels.push(this.formatYAxisValue(v) + ' ₸');
    }
    return labels;
  }

  formatYAxisValue(value: number): string {
    if (value >= 1_000_000) {
      const millions = value / 1_000_000;
      const str = millions % 1 === 0 ? `${millions}` : millions.toFixed(1);
      return `${str.replace('.', ',')} млн`;
    }
    if (value >= 1_000) {
      const thousands = value / 1_000;
      const str = thousands % 1 === 0 ? `${thousands}` : thousands.toFixed(1);
      return `${str.replace('.', ',')} тыс`;
    }
    return value.toLocaleString('ru-RU');
  }

  formatMoney(value: number | undefined | null): string {
    if (value == null || isNaN(value)) return '0';
    return value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  /** Rounded short format for tooltips (like main menu). */
  formatMoneyShort(value: number | undefined | null): string {
    if (value == null || isNaN(value)) return '0';
    if (value >= 1_000_000) {
      const m = value / 1_000_000;
      return (m % 1 === 0 ? m : m.toFixed(1)) + ' млн ₸';
    }
    if (value >= 1_000) {
      const t = value / 1_000;
      return (t % 1 === 0 ? t : t.toFixed(1)) + ' тыс ₸';
    }
    return value.toLocaleString('ru-RU') + ' ₸';
  }

  formatPct(value: number | undefined | null): string {
    if (value == null || isNaN(value)) return '—';
    return value.toFixed(1);
  }

  formatPeriod(from: string, to: string): string {
    if (!from || !to) return '';
    const d1 = new Date(from);
    const d2 = new Date(to);
    return `${d1.toLocaleDateString('ru-RU')} — ${d2.toLocaleDateString('ru-RU')}`;
  }

  isMonthSelected(point: MonthlyReportPoint): boolean {
    return this.selectedMonthForBar === point.yearMonth;
  }
}
