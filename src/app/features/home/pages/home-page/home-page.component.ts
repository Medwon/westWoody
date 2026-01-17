import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, forkJoin, catchError, of, tap } from 'rxjs';
import { AppState } from '../../../../core/store/app.state';
import { selectUser } from '../../../../core/store/auth/auth.selectors';
import { AuthUser } from '../../../../core/models/user.model';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { TransactionModalService } from '../../../../core/services/transaction-modal.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { PaymentsService, PaymentSearchResult } from '../../../../core/services/payments.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { RefundConfirmationModalComponent, Payment } from '../../../../shared/components/refund-confirmation-modal/refund-confirmation-modal.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';

interface KpiCard {
  iconId: 'revenue' | 'bonus' | 'clients' | 'transactions' | 'refunds' | 'average' | 'today' | 'month';
  iconBg: string;
  value: string;
  label: string;
  change?: string;
  changeType?: 'positive' | 'negative';
}

interface RecentPayment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  amount: number;
  bonusEarned: number;
  bonusUsed: number;
  paymentMethod: 'cash' | 'card' | 'online';
  isRefund: boolean;
  date: string;
  time: string;
  initiatedBy?: string | null;
  refundReason?: string | null;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent, ButtonComponent, RefundConfirmationModalComponent, IconButtonComponent],
  template: `
    <div class="page-wrapper">
      <div class="dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <app-button
          buttonType="primary"
          size="medium"
          (onClick)="openTransactionModal()">
          <svg class="create-icon" viewBox="0 0 24 24" fill="none">
            <path d="M6 12H18M12 6V18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="create-label">Новая транзакция</span>
        </app-button>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" *ngFor="let kpi of kpiCards">
          <div class="kpi-header">
            <div class="kpi-icon" [style.background]="kpi.iconBg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" [ngSwitch]="kpi.iconId">
                <!-- Revenue icon -->
                <g *ngSwitchCase="'revenue'">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5"/>
                </g>
                <!-- Bonus icon -->
                <g *ngSwitchCase="'bonus'">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5"/>
                </g>
                <!-- Clients icon -->
                <g *ngSwitchCase="'clients'">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.5"/>
                </g>
                <!-- Transactions icon -->
                <g *ngSwitchCase="'transactions'">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.5"/>
                  <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </g>
                <!-- Refunds icon -->
                <g class="refunds-icon"  *ngSwitchCase="'refunds'">
                  <path _ngcontent-ng-c4142443301="" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                </g>
                <!-- Average icon -->
                <g *ngSwitchCase="'average'">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                </g>
                <!-- Today icon -->
                <g *ngSwitchCase="'today'">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5"/>
                </g>
                <!-- Month icon -->
                <g *ngSwitchCase="'month'">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </g>
              </svg>
            </div>
            <span class="kpi-change" *ngIf="kpi.change" [class.positive]="kpi.changeType === 'positive'" [class.negative]="kpi.changeType === 'negative'">
              {{ kpi.change }}
            </span>
          </div>
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Line Chart -->
        <div class="chart-card line-chart-card">
          <h3 class="chart-title">Выручка за месяц</h3>
          <div class="chart-container">
            <div class="chart-y-axis">
              <span>30 000</span>
              <span>25 000</span>
              <span>20 000</span>
              <span>15 000</span>
              <span>10 000</span>
              <span>5 000</span>
              <span>0</span>
            </div>
            <div class="chart-area">
              <div class="chart-svg-wrapper">
                <svg viewBox="0 0 600 300" preserveAspectRatio="none" class="line-chart">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.3" />
                      <stop offset="100%" style="stop-color:#22c55e;stop-opacity:0.02" />
                    </linearGradient>
                  </defs>
                  <!-- Grid lines -->
                  <g stroke="#e2e8f0" stroke-width="1" opacity="0.5">
                    <line x1="50" y1="50" x2="550" y2="50" vector-effect="non-scaling-stroke"/>
                    <line x1="50" y1="100" x2="550" y2="100" vector-effect="non-scaling-stroke"/>
                    <line x1="50" y1="150" x2="550" y2="150" vector-effect="non-scaling-stroke"/>
                    <line x1="50" y1="200" x2="550" y2="200" vector-effect="non-scaling-stroke"/>
                    <line x1="50" y1="250" x2="550" y2="250" vector-effect="non-scaling-stroke"/>
                  </g>
                  <!-- Area fill -->
                  <path [attr.d]="getAreaPath()" fill="url(#chartGradient)" />
                  <!-- Line -->
                  <path [attr.d]="getChartPath()" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
                </svg>
                <!-- Data points rendered as HTML for correct circles -->
                <div class="chart-points">
                  <div 
                    *ngFor="let point of getChartData(); let last = last"
                    class="chart-point-wrapper"
                    [style.left.%]="(point.x / 600) * 100"
                    [style.top.%]="(point.y / 300) * 100">
                    <div class="chart-point" [class.last-point]="last"></div>
                    <div class="chart-tooltip">
                      <div class="tooltip-day">{{ point.day }} {{ getMonthName() }}</div>
                      <div class="tooltip-stats">
                        <div class="tooltip-row">
                          <span class="tooltip-label">Выручка:</span>
                          <span class="tooltip-revenue">{{ formatAmount(point.revenue) }} ₸</span>
                        </div>
                        <div class="tooltip-row">
                          <span class="tooltip-label">Транзакций:</span>
                          <span class="tooltip-value">{{ point.transactions }}</span>
                        </div>
                        <div class="tooltip-row">
                          <span class="tooltip-label">Начислено:</span>
                          <span class="tooltip-bonus-earned">+{{ formatAmount(point.bonusEarned) }}</span>
                        </div>
                        <div class="tooltip-row" *ngIf="point.bonusUsed > 0">
                          <span class="tooltip-label">Использовано:</span>
                          <span class="tooltip-bonus-used">-{{ formatAmount(point.bonusUsed) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="chart-x-axis">
                <span *ngFor="let label of getXAxisLabels(); let i = index" [style.left.%]="(getXAxisLabelPositions()[i] / 600) * 100">{{ label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Donut Chart -->
        
      </div>

      <!-- Recent Payments Table -->
      <div class="table-section">
        <div class="table-header">
          <h3 class="table-title">Последние операции</h3>
          <a routerLink="/payments" class="view-all-link">Смотреть все →</a>
        </div>
        <div class="table-container">
          <table class="payments-table">
            <thead>
              <tr>
                <th class="th-id">ID платежа</th>
                <th class="th-client">Клиент</th>
                <th class="th-amount">Сумма</th>
                <th class="th-bonuses">Бонусы</th>
                <th class="th-method">Способ оплаты</th>
                <th class="th-status">Статус</th>
                <th class="th-date">Дата и время</th>
                <th class="th-actions">Действия</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let payment of recentPayments">
              <tr class="payment-row" [class.expanded]="isRowExpanded(payment.id)">
                <td class="td-id">
                  <span class="payment-id">#{{ formatPaymentId(payment.id) }}</span>
                </td>
                <td class="td-client">
                  <div class="client-cell">
                    <div class="client-avatar">
                      {{ getInitials(payment.clientName) }}
                    </div>
                    <div class="client-info">
                      <a [routerLink]="['/clients', payment.clientId]" class="client-name-link">
                        <span class="client-name">{{ payment.clientName }}</span>
                      </a>
                      <span class="client-phone">{{ payment.clientPhone }}</span>
                    </div>
                  </div>
                </td>
                <td class="td-amount">
                  <span class="amount-value">{{ formatAmount(payment.amount) }} ₸</span>
                </td>
                <td class="td-bonuses">
                  <div class="bonus-info">
                    <app-badge 
                      *ngIf="payment.bonusEarned > 0"
                      badgeType="bonusGranted" 
                      size="medium"
                      icon="star"
                      class="bonus-badge">
                      +{{ formatAmount(payment.bonusEarned) }}
                    </app-badge>
                    <app-badge 
                      *ngIf="payment.bonusUsed > 0"
                      badgeType="bonusUsed" 
                      size="medium"
                      icon="check"
                      class="bonus-badge">
                      -{{ formatAmount(payment.bonusUsed) }}
                    </app-badge>
                    <span class="bonus-none" *ngIf="payment.bonusEarned === 0 && payment.bonusUsed === 0">—</span>
                  </div>
                </td>
                <td class="td-method">
                  <span class="method-badge" [class]="'method-' + payment.paymentMethod">
                    {{ getPaymentMethodLabel(payment.paymentMethod) }}
                  </span>
                </td>
                <td class="td-status">
                  <app-badge 
                    [badgeType]="payment.isRefund ? 'refund' : 'payment'" 
                    size="medium"
                    [icon]="payment.isRefund ? 'refund' : 'payment'">
                    {{ payment.isRefund ? 'Возврат' : 'Оплачено' }}
                  </app-badge>
                </td>
                <td class="td-date">
                  <div class="date-info">
                    <span class="date-text">{{ payment.date }}</span>
                    <span class="time-text">{{ payment.time }}</span>
                  </div>
                </td>
                <td class="td-actions">
                  <div class="actions-cell">
                    <a [routerLink]="['/clients', payment.clientId]" class="action-link">
                      <app-icon-button
                        iconButtonType="view"
                        size="small"
                        tooltip="Просмотр клиента">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </app-icon-button>
                    </a>
                    <app-icon-button
                      iconButtonType="refund"
                      size="small"
                      tooltip="Возврат"
                      [disabled]="payment.isRefund"
                      (onClick)="openRefundModal(payment)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                        <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </app-icon-button>
                    <app-icon-button
                      iconButtonType="ghost"
                      size="small"
                      [tooltip]="isRowExpanded(payment.id) ? 'Скрыть детали' : 'Показать детали'"
                      (onClick)="toggleRowExpansion(payment.id)">
                      <svg [class.rotated]="isRowExpanded(payment.id)" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </app-icon-button>
                  </div>
                </td>
              </tr>
              <!-- Expandable row -->
              <tr *ngIf="isRowExpanded(payment.id)" class="payment-details-row">
                <td colspan="9" class="payment-details-cell">
                  <div class="payment-details-content">
                    <div class="refund-details-grid">
                      <div class="refund-reason-section">
                        <span class="refund-label">Причина возврата:</span>
                        <div class="refund-reason-text" *ngIf="payment.refundReason">
                          {{ payment.refundReason }}
                        </div>
                        <div class="refund-reason-empty" *ngIf="!payment.refundReason">
                          Нет причины возврата
                        </div>
                      </div>
                      <div class="refund-by-section">
                        <span class="refund-label">Инициатор платежа:</span>
                        <div class="refund-by-text" *ngIf="payment.initiatedBy">
                          {{ payment.initiatedBy }}
                        </div>
                        <div class="refund-by-empty" *ngIf="!payment.initiatedBy">
                          Не указан
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Refund Confirmation Modal -->
    <app-refund-confirmation-modal
      [visible]="showRefundModal"
      [payment]="selectedPaymentForRefund"
      [isProcessing]="isProcessingRefund"
      (visibleChange)="onRefundModalVisibleChange($event)"
      (confirm)="confirmRefund($event)">
    </app-refund-confirmation-modal>
  </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .page-wrapper {
      min-height: 100%;
      margin: -2rem;
      padding: 2rem;
      background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 50%, #f8fafc 100%);
    }

    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .dashboard-header {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .dashboard-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.25rem 0;
    }

    .refunds-icon {
      color: #dc2626;
    }

    .dashboard-subtitle {
      font-size: 0.9375rem;
      color: #64748b;
      margin: 0;
    }

    .new-transaction-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #16A34A;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .new-transaction-btn:hover {
      background: #15803d;
    }

    .new-transaction-btn .btn-icon {
      width: 18px;
      height: 18px;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 1400px) {
      .kpi-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 1000px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }

    .kpi-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 3px 6px rgba(0, 0, 0, 0.03);
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .kpi-icon svg {
      width: 24px;
      height: 24px;
      color: #16A34A;
      display: block;
    }

    .kpi-change {
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.25rem 0.625rem;
      border-radius: 20px;
      background: #f0fdf4;
      color: #16A34A;
    }

    .kpi-change.positive {
      background: #f0fdf4;
      color: #16A34A;
    }

    .kpi-change.negative {
      background: #fef2f2;
      color: #dc2626;
    }

    .kpi-value {
      font-size: 2rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }

    .kpi-label {
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Charts Section */
    .charts-section {
      display: grid;
      // grid-template-columns: 2fr 1fr;
      // gap: 1.5rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 1024px) {
      .charts-section {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .chart-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 1.5rem 0;
    }

    /* Line Chart */
    .line-chart-card {
      min-height: 350px;
      overflow: visible;
    }

    .chart-container {
      display: flex;
      height: 320px;
      overflow: visible;
    }

    .chart-y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding-right: 1rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .chart-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: visible;
    }

    .chart-svg-wrapper {
      flex: 1;
      position: relative;
      min-height: 280px;
      overflow: visible;
    }

    .line-chart {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
    }

    .chart-points {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .chart-point-wrapper {
      position: absolute;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: 1;
      pointer-events: auto;
      padding: 8px;
    }

    .chart-point-wrapper:hover {
      z-index: 10;
    }

    .chart-point {
      width: 10px;
      height: 10px;
      background: #22c55e;
      border-radius: 50%;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .chart-point-wrapper:hover .chart-point {
      transform: scale(1.3);
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
    }

    .chart-point.last-point {
      width: 12px;
      height: 12px;
      background: white;
      border: 2.5px solid #22c55e;
      box-sizing: border-box;
    }

    .chart-tooltip {
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%) translateY(6px) scale(0.97);
      background: #1f2937;
      color: white;
      padding: 0.625rem 0.875rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: none;
    }

    .chart-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #1f2937;
      transition: opacity 0.3s ease;
    }

    .chart-point-wrapper:hover .chart-tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0) scale(1);
    }

    .tooltip-day {
      font-weight: 600;
      margin-bottom: 0.5rem;
      padding-bottom: 0.375rem;
      border-bottom: 1px solid #374151;
      color: #f3f4f6;
    }

    .tooltip-stats {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .tooltip-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .tooltip-label {
      color: #9ca3af;
      font-size: 0.75rem;
    }

    .tooltip-value {
      color: #f3f4f6;
      font-weight: 500;
    }

    .tooltip-revenue {
      color: #22c55e;
      font-weight: 600;
    }

    .tooltip-bonus-earned {
      color: #fbbf24;
      font-weight: 600;
    }

    .tooltip-bonus-used {
      color: #f472b6;
      font-weight: 600;
    }

    .chart-x-axis {
      position: relative;
      height: 20px;
      padding-top: 0.5rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .chart-x-axis span {
      position: absolute;
      transform: translateX(-50%);
    }

    /* Donut Chart */
    .donut-chart-card {
      display: flex;
      flex-direction: column;
    }

    .donut-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .donut-chart {
      width: 180px;
      height: 180px;
    }

    .donut-legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      padding-top: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .legend-color.active {
      background: #16A34A;
    }

    .legend-color.forecast {
      background: #dcfce7;
    }

    /* Table Section */
    .table-section {
      margin-bottom: 2rem;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .table-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }

    .view-all-link {
      font-size: 0.875rem;
      color: #16A34A;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .view-all-link:hover {
      color: #15803d;
    }

    .table-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }

    .payments-table {
      width: 100%;
      border-collapse: collapse;
    }

    .payments-table th {
      padding: 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
    }

    .payments-table td {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .payment-row {
      transition: background 0.15s;
    }

    .payment-row:hover {
      background: #f8fafc;
    }

    .payment-row:last-child td {
      border-bottom: none;
    }

    /* Payment ID */
    .td-id {
      min-width: 100px;
    }

    .payment-id {
      font-family: monospace;
      font-weight: 600;
      color: #64748b;
      font-size: 0.875rem;
    }

    .client-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .client-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      color: #16A34A;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
      flex-shrink: 0;
      flex-shrink: 0;
    }

    .client-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .client-name-link {
      text-decoration: none;
      color: inherit;
      transition: color 0.15s;
    }

    .client-name-link:hover {
      color: #16A34A;
    }

    .client-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1f2937;
      cursor: pointer;
    }

    .client-name-link:hover .client-name {
      color: #16A34A;
    }

    .client-phone {
      font-size: 0.8rem;
      color: #64748b;
    }

    .amount-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: #16A34A;
    }

    .bonus-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .bonus-badge {
      display: inline-block;
    }

    .bonus-none {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .method-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .method-badge.method-cash {
      background: #dcfce7;
      color: #16A34A;
    }

    .method-badge.method-card {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .method-badge.method-online {
      background: #fef3c7;
      color: #d97706;
    }

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .date-text {
      font-size: 0.85rem;
      color: #1f2937;
      font-weight: 500;
    }

    .time-text {
      font-size: 0.75rem;
      color: #64748b;
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .action-link {
      display: inline-flex;
      text-decoration: none;
      color: inherit;
    }

    /* Expandable row styles */
    .payments-table tbody tr.payment-details-row {
      background: transparent;
    }

    .payments-table tbody tr.payment-details-row td {
      border-top: none;
      padding: 0;
    }

    .payment-details-cell {
      padding: 0 !important;
      background: transparent;
    }

    .payment-details-content {
      padding: 1rem 1.5rem;
      overflow: hidden;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 300px;
      }
    }

    .refund-details-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2rem;
    }

    .refund-reason-section {
      flex: 1;
      text-align: left;
    }

    .refund-by-section {
      flex: 0 0 auto;
      text-align: right;
      min-width: 200px;
    }

    .refund-reason-section,
    .refund-by-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .refund-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }

    .refund-reason-text {
      padding: 0.75rem;
      background: transparent;
      border: none;
      border-radius: 0;
      font-size: 0.875rem;
      color: #1f2937;
      line-height: 1.6;
      white-space: pre-wrap;
      text-align: left;
    }

    .refund-by-text {
      padding: 0.75rem 0;
      background: transparent;
      border: none;
      border-radius: 0;
      font-size: 0.875rem;
      color: #1f2937;
      line-height: 1.6;
      white-space: pre-wrap;
      text-align: right;
    }

    .refund-reason-empty {
      padding: 0.75rem;
      background: transparent;
      border: none;
      border-radius: 0;
      font-size: 0.875rem;
      color: #94a3b8;
      font-style: italic;
      text-align: left;
    }

    .refund-by-empty {
      padding: 0.75rem 0;
      background: transparent;
      border: none;
      border-radius: 0;
      font-size: 0.875rem;
      color: #94a3b8;
      font-style: italic;
      text-align: right;
    }

    .actions-cell svg {
      transition: transform 0.3s ease;
    }

    .actions-cell svg.rotated {
      transform: rotate(180deg);
    }

    /* Стили для SVG внутри app-button */
    :host ::ng-deep app-button svg,
    app-button svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      display: block;
    }

    :host ::ng-deep app-button.size-small svg,
    app-button.size-small svg {
      width: 16px;
      height: 16px;
    }

    .btn-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      display: block;
    }

    :host ::ng-deep .dashboard-header app-button button {
      height: 44px;
      padding: 0 1rem;
    }

    :host ::ng-deep .dashboard-header app-button button svg.create-icon {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    :host ::ng-deep app-button button .create-label {
      display: inline-flex;
      align-items: center;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .page-wrapper {
        margin: -1rem;
        padding: 1rem;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 1rem;
      }

      .new-transaction-btn {
        width: 100%;
        justify-content: center;
      }

      .clients-table {
        display: block;
        overflow-x: auto;
      }
    }
  `]
})
export class HomePageComponent implements OnInit {
  user$: Observable<AuthUser | null>;
  private pageHeaderService = inject(PageHeaderService);
  transactionModalService = inject(TransactionModalService);
  private analyticsService = inject(AnalyticsService);
  private paymentsService = inject(PaymentsService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // Refund modal
  showRefundModal = false;
  selectedPaymentForRefund: Payment | null = null;
  isProcessingRefund = false;
  
  // Expanded rows
  expandedRows = new Set<string>();

  // Loading state
  isLoading = true;
  isChartLoading = true;
  isLoadingPayments = false;

  // KPI Cards Data
  kpiCards: KpiCard[] = [
    {
      iconId: 'month',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '1 245 890 ₸',
      label: 'Выручка за месяц',
      change: '+18%',
      changeType: 'positive'
    },
    {
      iconId: 'revenue',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '35 634 ₸',
      label: 'Выручка за сегодня',
      change: '+24%',
      changeType: 'positive'
    },
    {
      iconId: 'transactions',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '18',
      label: 'Транзакций сегодня',
      change: '+3',
      changeType: 'positive'
    },
   
    {
      iconId: 'clients',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '2',
      label: 'Новых клиентов',
      change: '+5',
      changeType: 'positive'
    },
    
    {
      iconId: 'revenue',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '17 817 ₸',
      label: 'Средний чек',
      change: '+8%',
      changeType: 'positive'
    },
    {
      iconId: 'bonus',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '3 563',
      label: 'Бонусов начислено',
      change: '+12%',
      changeType: 'positive'
    },
    
    
    {
      iconId: 'refunds',
      iconBg: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
      value: '2',
      label: 'Возвратов',
      change: '-1',
      changeType: 'negative'
      
    },
    
    {
      iconId: 'today',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '156',
      label: 'Активных клиентов',
      change: '+12',
      changeType: 'positive'
    }
  ];

  // Recent Payments Data
  recentPayments: RecentPayment[] = [];

  constructor(private store: Store<AppState>) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Быстрый Обзор', [
      { label: 'Главная' }
    ]);
    this.loadAnalyticsData();
    this.loadChartData();
    this.loadRecentPayments();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    forkJoin({
      monthlyRevenue: this.analyticsService.getMonthlyRevenue().pipe(
        catchError((error) => {
          console.error('Error loading monthly revenue:', error);
          return of({ revenue: 0, changePercent: 0 });
        }),
        tap((data) => console.log('Monthly revenue response:', data))
      ),
      dailyRevenue: this.analyticsService.getDailyRevenue().pipe(
        catchError((error) => {
          console.error('Error loading daily revenue:', error);
          return of({ revenue: 0, changePercent: 0 });
        }),
        tap((data) => console.log('Daily revenue response:', data))
      ),
      dailyTransactions: this.analyticsService.getDailyTransactions().pipe(
        catchError((error) => {
          console.error('Error loading daily transactions:', error);
          return of({ count: 0, changeAbsolute: 0 });
        }),
        tap((data) => console.log('Daily transactions response:', data))
      ),
      newClients: this.analyticsService.getNewClients('DAILY').pipe(
        catchError((error) => {
          console.error('Error loading new clients:', error);
          return of({ count: 0, changeAbsolute: 0, type: 'NEW' as const, period: 'DAILY' as const });
        }),
        tap((data) => console.log('New clients response:', data))
      ),
      averageCheck: this.analyticsService.getAverageCheck('MONTHLY').pipe(
        catchError((error) => {
          console.error('Error loading average check:', error);
          return of({ averageCheck: 0, changePercent: 0 });
        }),
        tap((data) => console.log('Average check response:', data))
      ),
      bonusesAccrued: this.analyticsService.getBonusesAccrued('MONTHLY').pipe(
        catchError((error) => {
          console.error('Error loading bonuses accrued:', error);
          return of({ amount: 0, changePercentage: 0 });
        }),
        tap((data) => console.log('Bonuses accrued response:', data))
      ),
      dailyRefunds: this.analyticsService.getDailyRefunds().pipe(
        catchError((error) => {
          console.error('Error loading daily refunds:', error);
          return of({ count: 0, changeAbsolute: 0 });
        }),
        tap((data) => console.log('Daily refunds response:', data))
      ),
      activeClients: this.analyticsService.getActiveClients().pipe(
        catchError((error) => {
          console.error('Error loading active clients:', error);
          return of({ count: 0, changeAbsolute: 0 });
        }),
        tap((data) => console.log('Active clients response:', data))
      )
    }).subscribe({
      next: (data) => {
        console.log('All analytics data received:', data);
        console.log('Monthly revenue:', data.monthlyRevenue);
        console.log('Daily revenue:', data.dailyRevenue);
        console.log('Average check:', data.averageCheck);
        console.log('Bonuses accrued:', data.bonusesAccrued);
        this.updateKpiCards(data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading analytics data:', error);
        this.isLoading = false;
      }
    });
  }

  loadRecentPayments(): void {
    this.isLoadingPayments = true;
    this.paymentsService.searchPayments({
      page: 0,
      size: 5,
      sortBy: 'date',
      sortDirection: 'DESC'
    }).pipe(
      catchError((error) => {
        console.error('Error loading recent payments:', error);
        return of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 5 });
      })
    ).subscribe({
      next: (response) => {
        console.log('Recent payments received:', response);
        this.recentPayments = response.content.map(payment => this.convertPaymentToRecentPayment(payment));
        this.isLoadingPayments = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error in recent payments subscription:', error);
        this.isLoadingPayments = false;
        this.cdr.detectChanges();
      }
    });
  }

  convertPaymentToRecentPayment(payment: PaymentSearchResult): RecentPayment {
    if (!payment.createdAt) {
      const now = new Date();
      return {
        id: payment.txId || '',
        clientId: payment.clientId || '',
        clientName: payment.clientName || '—',
        clientPhone: payment.clientPhone || '—',
        amount: payment.amount || 0,
        bonusEarned: payment.bonusGranted || 0,
        bonusUsed: payment.bonusUsed || 0,
        paymentMethod: 'card',
        isRefund: payment.status === 'REFUNDED' || payment.refundedPaymentTxId !== null,
        date: now.toLocaleDateString('ru-RU'),
        time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        initiatedBy: payment.initiatedBy || null,
        refundReason: payment.refundReason || null
      };
    }
    
    const createdAt = new Date(payment.createdAt);
    // Check if date is valid
    if (isNaN(createdAt.getTime())) {
      const now = new Date();
      createdAt.setTime(now.getTime());
    }
    
    // Format date as DD.MM.YYYY
    const day = String(createdAt.getDate()).padStart(2, '0');
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const year = createdAt.getFullYear();
    const dateStr = `${day}.${month}.${year}`;
    
    // Format time as HH:MM
    const hours = String(createdAt.getHours()).padStart(2, '0');
    const minutes = String(createdAt.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    // Determine payment method from paymentMethod or default
    let paymentMethod: 'cash' | 'card' | 'online' = 'card';
    if (payment.paymentMethod) {
      const method = payment.paymentMethod.toLowerCase();
      if (method.includes('cash') || method.includes('налич')) {
        paymentMethod = 'cash';
      } else if (method.includes('online') || method.includes('онлайн')) {
        paymentMethod = 'online';
      } else {
        paymentMethod = 'card';
      }
    }
    
    return {
      id: payment.txId || '',
      clientId: payment.clientId || '',
      clientName: payment.clientName || '—',
      clientPhone: payment.clientPhone || '—',
      amount: payment.amount || 0,
      bonusEarned: payment.bonusGranted || 0,
      bonusUsed: payment.bonusUsed || 0,
      paymentMethod: paymentMethod,
      isRefund: payment.status === 'REFUNDED' || payment.refundedPaymentTxId !== null,
      date: dateStr,
      time: timeStr,
      initiatedBy: payment.initiatedBy || null,
      refundReason: payment.refundReason || null
    };
  }

  loadChartData(): void {
    this.isChartLoading = true;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    console.log('Loading chart data for:', currentYear, currentMonth);
    
    this.analyticsService.getMonthlyRevenueChart(currentYear, currentMonth).pipe(
      catchError((error) => {
        console.error('Error loading chart data:', error);
        console.error('Error status:', error.status);
        
        // Try previous month if current month fails
        let fallbackYear = currentYear;
        let fallbackMonth = currentMonth - 1;
        
        if (fallbackMonth < 1) {
          fallbackMonth = 12;
          fallbackYear = currentYear - 1;
        }
        
        console.log('Trying fallback date:', fallbackYear, fallbackMonth);
        
        // Retry with fallback date
        return this.analyticsService.getMonthlyRevenueChart(fallbackYear, fallbackMonth).pipe(
          catchError((fallbackError) => {
            console.error('Fallback also failed:', fallbackError);
            // Return empty data if both attempts fail
            return of({ dailyData: [], year: fallbackYear, month: fallbackMonth });
          })
        );
      })
    ).subscribe({
      next: (chartData) => {
        console.log('Chart data received:', chartData);
        console.log('Chart data array length:', chartData.dailyData?.length);
        const dataArray = chartData.dailyData || (chartData as any).data || [];
        this.updateChartData(dataArray);
        this.isChartLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Subscription error:', error);
        this.isChartLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateKpiCards(data: any): void {
    // Extract values with fallback support
    const monthlyRevenue = data.monthlyRevenue?.amount ?? data.monthlyRevenue?.revenue ?? 0;
    const monthlyRevenueChange = data.monthlyRevenue?.changePercentage ?? data.monthlyRevenue?.changePercent;
    
    const dailyRevenue = data.dailyRevenue?.amount ?? data.dailyRevenue?.revenue ?? 0;
    const dailyRevenueChange = data.dailyRevenue?.changePercentage ?? data.dailyRevenue?.changePercent;
    
    const averageCheck = data.averageCheck?.amount ?? data.averageCheck?.averageCheck ?? 0;
    const averageCheckChange = data.averageCheck?.changePercentage ?? data.averageCheck?.changePercent;
    
    const bonusesAccrued = data.bonusesAccrued?.amount ?? data.bonusesAccrued?.count ?? 0;
    const bonusesAccruedChange = data.bonusesAccrued?.changePercentage ?? data.bonusesAccrued?.changePercent;
    
    this.kpiCards = [
      {
        iconId: 'month',
        iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        value: this.formatCurrency(monthlyRevenue),
        label: 'Выручка за месяц',
        change: monthlyRevenueChange != null ? `${monthlyRevenueChange > 0 ? '+' : ''}${monthlyRevenueChange.toFixed(0)}%` : undefined,
        changeType: monthlyRevenueChange != null && monthlyRevenueChange >= 0 ? 'positive' : 'negative'
      },
      {
        iconId: 'revenue',
        iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        value: this.formatCurrency(dailyRevenue),
        label: 'Выручка за сегодня',
        change: dailyRevenueChange != null ? `${dailyRevenueChange > 0 ? '+' : ''}${dailyRevenueChange.toFixed(0)}%` : undefined,
        changeType: dailyRevenueChange != null && dailyRevenueChange >= 0 ? 'positive' : 'negative'
      },
      {
        iconId: 'transactions',
        iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        value: (data.dailyTransactions?.count ?? 0).toString(),
        label: 'Транзакций сегодня',
        change: data.dailyTransactions?.changeAbsolute != null ? `${data.dailyTransactions.changeAbsolute > 0 ? '+' : ''}${data.dailyTransactions.changeAbsolute}` : undefined,
        changeType: data.dailyTransactions?.changeAbsolute != null && data.dailyTransactions.changeAbsolute >= 0 ? 'positive' : 'negative'
      },
      {
        iconId: 'clients',
        iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        value: (data.newClients?.count ?? 0).toString(),
        label: 'Новых клиентов',
        change: data.newClients?.changeAbsolute != null ? `${data.newClients.changeAbsolute > 0 ? '+' : ''}${data.newClients.changeAbsolute}` : undefined,
        changeType: data.newClients?.changeAbsolute != null && data.newClients.changeAbsolute >= 0 ? 'positive' : 'negative'
      },
      {
        iconId: 'revenue',
        iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        value: this.formatCurrency(averageCheck),
        label: 'Средний чек',
        change: averageCheckChange != null ? `${averageCheckChange > 0 ? '+' : ''}${averageCheckChange.toFixed(0)}%` : undefined,
        changeType: averageCheckChange != null && averageCheckChange >= 0 ? 'positive' : 'negative'
      },
      {
        iconId: 'bonus',
        iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        value: this.formatCurrency(bonusesAccrued),
        label: 'Бонусов начислено',
        change: bonusesAccruedChange != null ? `${bonusesAccruedChange > 0 ? '+' : ''}${bonusesAccruedChange.toFixed(0)}%` : undefined,
        changeType: bonusesAccruedChange != null && bonusesAccruedChange >= 0 ? 'positive' : 'negative'
      },
      {
        iconId: 'refunds',
        iconBg: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
        value: (data.dailyRefunds?.count ?? 0).toString(),
        label: 'Возвратов',
        change: data.dailyRefunds?.changeAbsolute != null ? `${data.dailyRefunds.changeAbsolute > 0 ? '+' : ''}${data.dailyRefunds.changeAbsolute}` : undefined,
        changeType: data.dailyRefunds?.changeAbsolute != null && data.dailyRefunds.changeAbsolute >= 0 ? 'positive' : 'negative'
      },
      {
        iconId: 'today',
        iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        value: (data.activeClients?.count ?? 0).toString(),
        label: 'Активных клиентов',
        change: data.activeClients?.changeAbsolute != null ? `${data.activeClients.changeAbsolute > 0 ? '+' : ''}${data.activeClients.changeAbsolute}` : undefined,
        changeType: data.activeClients?.changeAbsolute != null && data.activeClients.changeAbsolute >= 0 ? 'positive' : 'negative'
      }
    ];
  }

  updateChartData(chartData: any[]): void {
    console.log('Updating chart data with:', chartData);
    if (!chartData || chartData.length === 0) {
      console.log('Chart data is empty, clearing cache');
      this._chartDataCache = null;
      return;
    }

    const daysInMonth = this.getDaysInCurrentMonth();
    const svgWidth = 600;
    const svgHeight = 300;
    const padding = 50;
    const chartWidth = svgWidth - padding * 2;
    const chartHeight = svgHeight - padding * 2;

    // Find max revenue for scaling
    const maxRevenue = Math.max(...chartData.map(d => (d.revenue || d.amount || 0)), 1);
    console.log('Max revenue for scaling:', maxRevenue);

    const points = chartData.map((dataPoint) => {
      const day = dataPoint.day || dataPoint.dayNumber || 1;
      const dayRatio = daysInMonth > 1 ? (day - 1) / (daysInMonth - 1) : 0;
      const x = padding + dayRatio * chartWidth;
      const revenue = dataPoint.revenue || dataPoint.amount || 0;
      const y = svgHeight - padding - (revenue / maxRevenue) * chartHeight;
      
      // Use new field names from API (transactionCount, bonusesGranted, bonusesUsed)
      // with fallback to old field names for backward compatibility
      const transactions = dataPoint.transactionCount ?? dataPoint.transactions ?? 0;
      const bonusEarned = dataPoint.bonusesGranted ?? dataPoint.bonusEarned ?? dataPoint.bonusesAccrued ?? 0;
      const bonusUsed = dataPoint.bonusesUsed ?? dataPoint.bonusUsed ?? 0;
      
      return {
        x,
        y,
        day: day,
        revenue: revenue,
        transactions: transactions,
        bonusEarned: bonusEarned,
        bonusUsed: bonusUsed
      };
    });

    console.log('Updated chart cache with', points.length, 'points');
    this._chartDataCache = points;
  }

  formatCurrency(amount: number | null | undefined, showSymbol: boolean = true): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return showSymbol ? '0 ₸' : '0';
    }
    const formatted = amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return showSymbol ? `${formatted} ₸` : formatted;
  }

  getInitials(name: string | null | undefined): string {
    if (!name || name.trim() === '') {
      return '—';
    }
    const parts = name.trim().split(' ').filter(n => n.length > 0);
    if (parts.length === 0) {
      return '—';
    }
    return parts.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  formatPaymentId(id: string): string {
    if (!id) return '—';
    // If id is already in format like "PTX-26-APQTM", return it as is
    if (id.includes('-')) {
      return id;
    }
    // Otherwise, try to parse as number
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return id;
    }
    return `PAY-${String(numId).padStart(3, '0')}`;
  }

  getPaymentMethodLabel(method: 'cash' | 'card' | 'online'): string {
    const labels: Record<string, string> = {
      cash: 'Наличные',
      card: 'Карта',
      online: 'Онлайн'
    };
    return labels[method] || method;
  }

  openTransactionModal(): void {
    this.transactionModalService.open();
  }

  openRefundModal(payment: RecentPayment): void {
    if (payment.isRefund) {
      return;
    }
    // Reset processing state when opening modal
    this.isProcessingRefund = false;
    // Convert RecentPayment to Payment format
    const paymentForModal: Payment = {
      id: payment.id,
      clientId: payment.clientId,
      clientName: payment.clientName,
      clientPhone: payment.clientPhone,
      amount: payment.amount,
      bonusEarned: payment.bonusEarned,
      bonusUsed: payment.bonusUsed,
      paymentMethod: payment.paymentMethod,
      isRefund: payment.isRefund,
      date: payment.date,
      time: payment.time
    };
    this.selectedPaymentForRefund = paymentForModal;
    this.showRefundModal = true;
  }

  closeRefundModal(): void {
    if (!this.isProcessingRefund) {
      this.showRefundModal = false;
      this.selectedPaymentForRefund = null;
      this.isProcessingRefund = false;
    }
  }
  
  onRefundModalVisibleChange(visible: boolean): void {
    if (!visible && !this.isProcessingRefund) {
      this.closeRefundModal();
    }
  }

  confirmRefund(payment: Payment): void {
    if (!payment || this.isProcessingRefund) {
      return;
    }
    
    this.isProcessingRefund = true;
    
    this.paymentsService.refundPayment(payment.id, {
      notes: payment.refundReason || ''
    }).subscribe({
      next: () => {
        this.toastService.success('Возврат успешно выполнен');
        // Reload payments to get updated data
        this.loadRecentPayments();
        this.isProcessingRefund = false;
        this.showRefundModal = false;
        this.selectedPaymentForRefund = null;
      },
      error: (error) => {
        console.error('Error processing refund:', error);
        const errorMessage = error?.error?.message || 'Ошибка при выполнении возврата';
        this.toastService.error(errorMessage);
        // Не сбрасываем isProcessingRefund при ошибке, чтобы кнопка оставалась заблокированной
      }
    });
  }
  
  toggleRowExpansion(paymentId: string): void {
    if (this.expandedRows.has(paymentId)) {
      this.expandedRows.delete(paymentId);
    } else {
      this.expandedRows.add(paymentId);
    }
  }
  
  isRowExpanded(paymentId: string): boolean {
    return this.expandedRows.has(paymentId);
  }

  getDaysInCurrentMonth(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  getChartDataPoints(): Array<{ x: number; y: number; day: number; revenue: number; transactions: number; bonusEarned: number; bonusUsed: number }> {
    // If we have cached chart data from API, use it
    if (this._chartDataCache && this._chartDataCache.length > 0) {
      return this._chartDataCache;
    }

    // Otherwise, generate sample data as fallback
    const daysInMonth = this.getDaysInCurrentMonth();
    const svgWidth = 600;
    const svgHeight = 300;
    const padding = 50;
    const chartWidth = svgWidth - padding * 2;
    const chartHeight = svgHeight - padding * 2;
    
    const points: Array<{ x: number; y: number; day: number; revenue: number; transactions: number; bonusEarned: number; bonusUsed: number }> = [];
    
    if (daysInMonth === 0) return points;
    
    // Generate sample revenue data (increasing trend with some variation)
    for (let day = 1; day <= daysInMonth; day++) {
      const dayRatio = daysInMonth > 1 ? (day - 1) / (daysInMonth - 1) : 0;
      const x = padding + dayRatio * chartWidth;
      // Simulate revenue: starts around 5000, ends around 25000, with some variation
      const baseRevenue = 5000 + (day / daysInMonth) * 20000;
      const variation = Math.sin(day * 0.2) * 2000; // Add some wave pattern
      const revenue = Math.round(baseRevenue + variation);
      // Simulate transactions: 5-25 per day with some variation
      const transactions = Math.floor(5 + Math.random() * 20 + (day / daysInMonth) * 10);
      // Simulate bonuses: ~1% of revenue earned, ~0.5% used
      const bonusEarned = Math.round(revenue * 0.01 * (0.8 + Math.random() * 0.4));
      const bonusUsed = Math.round(revenue * 0.005 * Math.random());
      // Convert revenue to Y coordinate (inverted, as SVG Y increases downward)
      const y = svgHeight - padding - (revenue / 30000) * chartHeight;
      points.push({ x, y, day, revenue, transactions, bonusEarned, bonusUsed });
    }
    
    return points;
  }

  // Cache chart data to avoid recalculating on every hover
  private _chartDataCache: Array<{ x: number; y: number; day: number; revenue: number; transactions: number; bonusEarned: number; bonusUsed: number }> | null = null;
  
  getChartData(): Array<{ x: number; y: number; day: number; revenue: number; transactions: number; bonusEarned: number; bonusUsed: number }> {
    // If we have cached chart data from API, use it
    if (this._chartDataCache && this._chartDataCache.length > 0) {
      return this._chartDataCache;
    }
    // Fallback to generated data if no API data available (only if not loading)
    if (!this.isChartLoading) {
      return this.getChartDataPoints();
    }
    // Return empty array while loading
    return [];
  }

  getMonthName(): string {
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return months[new Date().getMonth()];
  }

  getTransactionsText(count: number): string {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'транзакций';
    }
    if (lastDigit === 1) {
      return 'транзакция';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'транзакции';
    }
    return 'транзакций';
  }

  getChartPath(): string {
    const points = this.getChartData();
    if (points.length === 0) return '';
    
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }
    return path;
  }

  getAreaPath(): string {
    const points = this.getChartData();
    if (points.length === 0) return '';
    
    const svgHeight = 300;
    const padding = 50;
    
    let path = `M${points[0].x},${svgHeight - padding}`;
    path += ` L${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }
    path += ` L${points[points.length - 1].x},${svgHeight - padding} Z`;
    return path;
  }

  getXAxisLabels(): string[] {
    const daysInMonth = this.getDaysInCurrentMonth();
    const labels: string[] = [];
    
    // Show labels at: 1, ~25%, ~50%, ~75%, and last day
    const positions = [
      1,
      Math.ceil(daysInMonth * 0.25),
      Math.ceil(daysInMonth * 0.5),
      Math.ceil(daysInMonth * 0.75),
      daysInMonth
    ];
    
    // Remove duplicates and sort
    const uniquePositions = [...new Set(positions)].sort((a, b) => a - b);
    
    return uniquePositions.map(day => day.toString());
  }

  getXAxisLabelPositions(): number[] {
    const daysInMonth = this.getDaysInCurrentMonth();
    const svgWidth = 600;
    const padding = 50;
    const chartWidth = svgWidth - padding * 2;
    
    const labels = this.getXAxisLabels();
    return labels.map(label => {
      const day = parseInt(label, 10);
      const dayRatio = daysInMonth > 1 ? (day - 1) / (daysInMonth - 1) : 0;
      return padding + dayRatio * chartWidth;
    });
  }
}
