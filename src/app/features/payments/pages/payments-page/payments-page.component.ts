import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { PaymentsService, PaymentSearchResult } from '../../../../core/services/payments.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TransactionModalService } from '../../../../core/services/transaction-modal.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { RefundConfirmationModalComponent } from '../../../../shared/components/refund-confirmation-modal/refund-confirmation-modal.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { PaymentViewModalComponent } from '../../../../shared/components/payment-view-modal/payment-view-modal.component';

interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  amount: number;
  bonusEarned: number;
  bonusUsed: number;
  bonusRevoked: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  isRefund: boolean;
  date: string;
  time: string;
  comment?: string;
  refundReason?: string;
  refundBy?: string;
  initiatedBy?: string;
  initiatedById?: string;
}

type SortField = 'clientName' | 'amount' | 'date' | 'paymentMethod';
type SortDirection = 'asc' | 'desc';

function clampPaymentPageSize(size: number): number {
  const valid = [15, 30, 50, 100];
  return valid.includes(size) ? size : 15;
}

@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BadgeComponent, RefundConfirmationModalComponent, IconButtonComponent, ButtonComponent, LoaderComponent, PaginationComponent, PaymentViewModalComponent],
  template: `
    <div class="page-wrapper">
      <div class="payments-container">
        <!-- Loading State -->
        <div class="page-loading-container" *ngIf="isLoadingDashboard || isLoading">
          <app-loader [visible]="true" [overlay]="false" type="logo" size="large"></app-loader>
        </div>
        
        <div *ngIf="!isLoadingDashboard && !isLoading">
        
        <!-- Header with Create Button -->
        <div class="page-header-actions">
          <app-button 
            buttonType="primary" 
            size="medium" 
            (onClick)="openTransactionModal()">
            <svg viewBox="0 0 24 24" fill="none" class="create-payment-icon">
              <path d="M6 12H18M12 6V18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Новая транзакция
          </app-button>
        </div>
        
        <!-- Dashboard Cards -->
        <div class="dashboard-grid">
          <div class="dashboard-card">
            <div class="card-icon total-payments">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.5"/>
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <path d="M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-value">{{ totalPayments }}</span>
              <span class="card-label">Всего платежей</span>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="card-icon today-payments">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-value">{{ paymentsToday }}</span>
              <span class="card-label">Платежей сегодня</span>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="card-icon total-revenue">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-value">{{ formatAmount(totalRevenue) }} ₸</span>
              <span class="card-label">Общий доход</span>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="card-icon total-bonuses">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-value">{{ formatAmount(totalBonusesGranted) }}</span>
              <span class="card-label">Бонусов начислено</span>
            </div>
          </div>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
          <div class="filters-row">
            <!-- Search by payment ID -->
            <div class="filter-group search-group">
              <div class="search-input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="search-icon">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <input 
                  type="text" 
                  [(ngModel)]="searchPaymentId"
                  (keydown.enter)="applyFilters()"
                  placeholder="Поиск по ID платежа..."
                  class="filter-input">
              </div>
            </div>

            <!-- Search by client name -->
            <div class="filter-group">
              <div class="search-input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="search-icon">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <input 
                  type="text" 
                  [(ngModel)]="searchClientName" 
                  (keydown.enter)="applyFilters()"
                  placeholder="Поиск по клиенту..."
                  class="filter-input">
              </div>
            </div>

            <!-- Search by phone -->
            <div class="filter-group">
              <div class="search-input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="search-icon">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <input 
                  type="text" 
                  [(ngModel)]="searchPhone"
                  (keydown.enter)="applyFilters()"
                  placeholder="Поиск по телефону..."
                  class="filter-input">
              </div>
            </div>

            <!-- Date filter -->
            <div class="filter-group date-filter">
              <label class="filter-label">Период:</label>
              <div class="date-inputs">
                <input 
                  type="date" 
                  [(ngModel)]="dateFrom" 
                  placeholder="ДД ММ ГГГГ"
                  class="date-input">
                <span class="date-separator">—</span>
                <input 
                  type="date" 
                  [(ngModel)]="dateTo" 
                  placeholder="ДД ММ ГГГГ"
                  class="date-input">
              </div>
            </div>
          </div>

          <div class="filters-row">
            <!-- Payment method filter -->
            <div class="filter-group type-filter">
              <label class="filter-label">Способ оплаты:</label>
              <div class="type-buttons">
                <button 
                  class="type-btn" 
                  [class.active]="filterPaymentMethod === 'all'"
                  (click)="filterPaymentMethod = 'all'">Все</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterPaymentMethod === 'cash'"
                  (click)="filterPaymentMethod = 'cash'">Наличные</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterPaymentMethod === 'card'"
                  (click)="filterPaymentMethod = 'card'">Карта</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterPaymentMethod === 'transfer'"
                  (click)="filterPaymentMethod = 'transfer'">Перевод</button>
              </div>
            </div>

            <!-- Refund filter -->
            <div class="filter-group type-filter">
              <label class="filter-label">Тип:</label>
              <div class="type-buttons">
                <button 
                  class="type-btn" 
                  [class.active]="filterRefund === 'all'"
                  (click)="filterRefund = 'all'">Все</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterRefund === 'paid'"
                  (click)="filterRefund = 'paid'">Оплачено</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterRefund === 'refund'"
                  (click)="filterRefund = 'refund'">Возврат</button>
              </div>
            </div>

            <!-- Sort -->
            <div class="filter-group sort-group">
              <label class="filter-label">Сортировка:</label>
              <select [(ngModel)]="sortField" class="sort-select">
                <option value="date">По дате</option>
                <option value="clientName">По клиенту</option>
                <option value="amount">По сумме</option>
                <option value="paymentMethod">По способу оплаты</option>
              </select>
              <button class="sort-direction-btn" (click)="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" [class.desc]="sortDirection === 'desc'">
                  <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>

          </div>

          <!-- Filter Actions Footer -->
          <div class="filters-footer">
            <div class="button-group">
              <app-button 
                buttonType="danger-outline" 
                size="medium" 
                (onClick)="clearFilters()"
                *ngIf="hasActiveFilters()">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Сбросить
              </app-button>
              <app-button 
                buttonType="primary-outline" 
                size="medium" 
                (onClick)="applyFilters()">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                Поиск
              </app-button>
            </div>
          </div>
        </div>

        <!-- Results count -->
        <div class="results-info">
          <span class="results-count">Найдено: {{ totalPaymentsFound }} платежей</span>
        </div>

        <!-- Payments Table with Pagination -->
        <div>
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
                <ng-container *ngFor="let payment of payments">
                  <tr class="payment-row">
                    <td class="td-id">
                      <span class="payment-id clickable" (click)="openPaymentView(payment.id)">{{ payment.id }}</span>
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
                        <app-badge 
                          *ngIf="payment.bonusRevoked > 0"
                          badgeType="refund" 
                          size="medium"
                          icon="refund"
                          class="bonus-badge">
                          -{{ formatAmount(payment.bonusRevoked) }}
                        </app-badge>
                        <span class="bonus-none" *ngIf="payment.bonusEarned === 0 && payment.bonusUsed === 0 && payment.bonusRevoked === 0">—</span>
                      </div>
                    </td>
                    <td class="td-method">
                    <app-badge 
                      badgeType="paymentMethod" 
                      size="medium"
                      [paymentMethod]="getPaymentMethodForBadge(payment.paymentMethod)">
                    </app-badge>
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
                          [tooltip]="isPaymentRowExpanded(payment.id) ? 'Скрыть детали' : 'Показать детали'"
                          (onClick)="togglePaymentRow(payment.id)">
                          <svg [class.rotated]="isPaymentRowExpanded(payment.id)" viewBox="0 0 24 24" fill="none">
                            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </app-icon-button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="isPaymentRowExpanded(payment.id)" class="payment-details-row">
                    <td colspan="8" class="payment-details-cell">
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
                            <a *ngIf="payment.initiatedBy && payment.initiatedById" 
                               [routerLink]="['/users', payment.initiatedById]" 
                               class="refund-by-link">
                              {{ payment.initiatedBy }}
                            </a>
                            <div class="refund-by-text" *ngIf="payment.initiatedBy && !payment.initiatedById">
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

          <div class="empty-state" *ngIf="payments.length === 0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>Платежи не найдены</span>
            <button class="reset-btn" (click)="clearFilters()">Сбросить фильтры</button>
          </div>
        </div>

        <!-- Backend Pagination -->
        <div class="pagination-container" *ngIf="totalPaymentsFound > 0">
          <div class="pagination-left">
            <div class="pagination-info">
              <span>Показано {{ (currentPage * pageSize) + 1 }}-{{ Math.min((currentPage + 1) * pageSize, totalPaymentsFound) }} из {{ totalPaymentsFound }}</span>
            </div>
            <div class="page-size-filter-section">
              <label class="page-size-label">Строк на странице:</label>
              <select [(ngModel)]="pageSize" (change)="onPageSizeChange()" class="page-size-select">
                <option [value]="15">15</option>
                <option [value]="30">30</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
            </div>
          </div>
          <div class="pagination-right" *ngIf="getTotalPages() > 1">
            <app-pagination
              [currentPage]="currentPage + 1"
              [totalPages]="getTotalPages()"
              (pageChange)="onPageChange($event)">
            </app-pagination>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- Refund Confirmation Modal -->
    <app-refund-confirmation-modal
      [visible]="showRefundModal"
      [payment]="selectedPaymentForRefund"
      (visibleChange)="closeRefundModal()"
      (confirm)="confirmRefund($event)">
    </app-refund-confirmation-modal>

    <!-- Payment View Modal -->
    <app-payment-view-modal
      [visible]="showPaymentViewModal"
      [paymentTxId]="selectedPaymentTxId"
      [paymentSearchResult]="selectedPaymentSearchResult"
      (visibleChange)="closePaymentView()"
      (paymentUpdated)="onPaymentUpdated()"
      (refundedPaymentClick)="openPaymentView($event)">
    </app-payment-view-modal>
  `,
  styles: [`
    .page-wrapper {
      min-height: 100%;
      margin: -2rem;
      padding: 2rem;
    }

    .payments-container {
      max-width: 1400px;
      margin: 0 auto;
      position: relative;
      min-height: 400px;
    }

    .page-loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      width: 100%;
    }

    /* Header with Create Button */
    .page-header-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }

    .page-header-actions app-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .page-header-actions .create-payment-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    /* Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .dashboard-card {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
    }

    .card-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon svg {
      width: 24px;
      height: 24px;
    }

    .card-icon.total-payments {
      color: rgb(0, 0, 0);
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .card-icon.today-payments {
      color: rgb(0, 0, 0);
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .card-icon.total-revenue {
      color: rgb(0, 0, 0);
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .card-icon.total-bonuses {
      color: rgb(0, 0, 0);
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .card-info {
      display: flex;
      flex-direction: column;
    }

    .card-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: #1f2937;
    }

    .card-label {
      font-size: 0.8rem;
      color: #64748b;
    }

    /* Filters Section */
    .filters-section {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
    }

    .filters-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filters-row + .filters-row {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .search-group {
      flex: 1;
      min-width: 200px;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      width: 18px;
      height: 18px;
      color: #94a3b8;
      pointer-events: none;
    }

    .filter-input {
      width: 100%;
      padding: 0.625rem 0.875rem 0.625rem 2.5rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
      background: #f8fafc;
      color: #1f2937;
      transition: all 0.2s;
    }

    .filter-input:hover {
      border-color: #cbd5e1;
    }

    .filter-input:focus {
      outline: none;
      border-color: #22c55e;
      background: white;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }

    .filter-input::placeholder {
      color: #94a3b8;
    }

    /* Date Filter */
    .date-filter {
      min-width: 280px;
    }

    .date-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-input {
      flex: 1;
      padding: 0.625rem 0.875rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
      background: #f8fafc;
      color: #1f2937;
      transition: all 0.2s;
    }

    .date-input:hover {
      border-color: #cbd5e1;
    }

    .date-input:focus {
      outline: none;
      border-color: #22c55e;
      background: white;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }

    .date-separator {
      color: #94a3b8;
      font-weight: 500;
      font-size: 0.9rem;
    }

    /* Type Filter */
    .type-filter {
      flex-direction: row;
      align-items: center;
    }

    .type-buttons {
      display: flex;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .type-btn {
      padding: 0.5rem 0.875rem;
      border: none;
      background: #f8fafc;
      color: #64748b;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .type-btn:not(:last-child) {
      border-right: 1px solid #e2e8f0;
    }

    .type-btn.active {
      background: #16A34A;
      color: white;
    }

    .type-btn:hover:not(.active) {
      background: #f1f5f9;
    }

    /* Sort */
    .sort-group {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
    }

    .sort-group .filter-label {
      margin-bottom: 0;
    }

    .sort-select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.85rem;
      background: #f8fafc;
      color: #1f2937;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
    }

    .sort-select:focus {
      outline: none;
      border-color: #22c55e;
    }

    .sort-direction-btn {
      width: 36px;
      height: 36px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .sort-direction-btn svg {
      width: 18px;
      height: 18px;
      transition: transform 0.2s;
    }

    .sort-direction-btn svg.desc {
      transform: rotate(180deg);
    }

    .sort-direction-btn:hover {
      border-color: #22c55e;
      color: #16A34A;
    }

    /* Clear Filters */
    /* Filter Actions Footer */
    .filters-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .button-group {
      display: flex;
      gap: 2rem;
    }

    .button-group app-button {
      width: 110px;
    }

    .button-group app-button svg {
      width: 14px;
      height: 14px;
    }

    /* Results Info */
    .results-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .results-count {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Table Container */
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

    .refund-by-link {
      display: inline-block;
      padding: 0.75rem 0;
      background: transparent;
      border: none;
      border-radius: 0;
      font-size: 0.875rem;
      color: #1f2937;
      line-height: 1.6;
      white-space: pre-wrap;
      text-align: right;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .refund-by-link:hover {
      color: #16A34A;
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

    .payment-id.clickable {
      color: #64748b;
      cursor: pointer;
      text-decoration: underline;
      transition: color 0.2s;
    }

    .payment-id.clickable:hover {
      color: #475569;
    }

    /* Client Cell */
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

    /* Amount */
    .amount-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: #16A34A;
    }

    /* Bonuses */
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


    /* Date Info */
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

    /* Actions */
    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .action-link {
      display: inline-flex;
      text-decoration: none;
      color: inherit;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: #94a3b8;
    }

    .empty-state svg {
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
    }

    .empty-state span {
      font-size: 1rem;
      margin-bottom: 1rem;
    }

    .reset-btn {
      padding: 0.5rem 1rem;
      background: #16A34A;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
    }

    .reset-btn:hover {
      background: #14532d;
    }

    /* Pagination Container */
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      gap: 1rem;
      margin-top: 1rem;
    }

    .pagination-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .pagination-right {
      display: flex;
      align-items: center;
    }

    .pagination-info {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .page-size-filter-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-size-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }

    .page-size-select {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      color: #1f2937;
      cursor: pointer;
      outline: none;
      transition: all 0.2s;
    }

    .page-size-select:hover {
      border-color: #94a3b8;
    }

    .page-size-select:focus {
      border-color: #16A34A;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .dashboard-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-wrapper {
        margin: -1rem;
        padding: 1rem;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      .filters-row {
        flex-direction: column;
      }

      .filter-group {
        width: 100%;
      }

      .table-container {
        overflow-x: auto;
      }

      .payments-table {
        min-width: 900px;
      }
    }

  `]
})
export class PaymentsPageComponent implements OnInit, OnDestroy {
  private pageHeaderService = inject(PageHeaderService);
  private analyticsService = inject(AnalyticsService);
  private paymentsService = inject(PaymentsService);
  private toastService = inject(ToastService);
  private transactionModalService = inject(TransactionModalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Dashboard data
  totalPayments = 0;
  paymentsToday = 0;
  totalRevenue = 0;
  totalBonusesGranted = 0;
  isLoadingDashboard = true;

  // Filters
  searchPaymentId = '';
  searchClientName = '';
  searchPhone = '';
  dateFrom = '';
  dateTo = '';
  filterPaymentMethod: 'all' | 'cash' | 'card' | 'transfer' = 'all';
  filterRefund: 'all' | 'paid' | 'refund' = 'all';
  sortField: SortField = 'date';
  sortDirection: SortDirection = 'desc';

  // Refund modal
  showRefundModal = false;
  selectedPaymentForRefund: Payment | null = null;

  // Payment view modal
  showPaymentViewModal = false;
  selectedPaymentTxId: string | null = null;
  selectedPaymentSearchResult: PaymentSearchResult | null = null;

  // Payments data
  isLoading = false;
  payments: Payment[] = [];
  totalPaymentsFound = 0;
  currentPage = 0;
  pageSize = 15;

  // Раскрытые строки платежей
  expandedPaymentRows = new Set<string>();

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Платежи', [
      { label: 'Главная', route: '/home' },
      { label: 'Платежи' }
    ]);

    this.applyStateFromQueryParams(this.route.snapshot.queryParams);

    this.loadDashboardData();
    this.loadPayments();

    // React to query param changes (browser back/forward or programmatic navigate)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.applyStateFromQueryParams(params);
      this.loadPayments();
    });

    // Subscribe to transaction completion events
    this.transactionModalService.transactionComplete$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const currentUrl = this.router.url;
        if (currentUrl === '/payments' || currentUrl.startsWith('/payments')) {
          this.loadDashboardData();
          this.loadPayments();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyStateFromQueryParams(params: Record<string, string | undefined>): void {
    this.searchPaymentId = params['paymentId'] ?? '';
    this.searchClientName = params['clientName'] ?? '';
    this.searchPhone = params['phone'] ?? '';
    this.dateFrom = params['dateFrom'] ?? '';
    this.dateTo = params['dateTo'] ?? '';
    const methodParam = params['method'];
    this.filterPaymentMethod = (methodParam === 'cash' || methodParam === 'card' || methodParam === 'transfer') ? methodParam : 'all';
    const refundParam = params['refund'];
    this.filterRefund = (refundParam === 'paid' || refundParam === 'refund') ? refundParam : 'all';
    const sortParam = params['sort'];
    this.sortField = (sortParam === 'clientName' || sortParam === 'amount' || sortParam === 'date' || sortParam === 'paymentMethod') ? sortParam : 'date';
    const orderParam = params['order'];
    this.sortDirection = (orderParam === 'asc' || orderParam === 'desc') ? orderParam : 'desc';
    const pageFromUrl = Math.max(1, +(params['page'] ?? 1) || 1);
    const sizeFromUrl = clampPaymentPageSize(+(params['size'] ?? 0) || 15);
    this.currentPage = pageFromUrl - 1;
    this.pageSize = sizeFromUrl;
  }

  private updateUrlFromState(): void {
    const queryParams: Record<string, string | number> = {
      page: this.currentPage + 1,
      size: this.pageSize,
      sort: this.sortField,
      order: this.sortDirection,
      method: this.filterPaymentMethod,
      refund: this.filterRefund
    };
    if (this.searchPaymentId.trim()) queryParams['paymentId'] = this.searchPaymentId.trim();
    if (this.searchClientName.trim()) queryParams['clientName'] = this.searchClientName.trim();
    if (this.searchPhone.trim()) queryParams['phone'] = this.searchPhone.trim();
    if (this.dateFrom) queryParams['dateFrom'] = this.dateFrom;
    if (this.dateTo) queryParams['dateTo'] = this.dateTo;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  loadDashboardData(): void {
    this.isLoadingDashboard = true;
    forkJoin({
      totals: this.analyticsService.getOverallTotals(),
      daily: this.analyticsService.getDailyTransactions()
    }).subscribe({
      next: ({ totals, daily }) => {
        this.totalPayments = totals.totalPayments;
        this.totalRevenue = totals.totalRevenue;
        this.totalBonusesGranted = totals.totalBonusesGranted;
        this.paymentsToday = daily.count;
        this.isLoadingDashboard = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка загрузки данных';
        this.toastService.error(errorMessage);
        this.isLoadingDashboard = false;
      }
    });
  }

  loadPayments(): void {
    this.isLoading = true;
    const searchRequest = this.buildSearchRequest();
    
    this.paymentsService.searchPayments(searchRequest).subscribe({
      next: (response) => {
        this.payments = response.content.map(result => this.mapSearchResultToPayment(result));
        this.totalPaymentsFound = response.totalElements;
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка загрузки платежей';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  buildSearchRequest() {
    const request: any = {
      paymentId: this.searchPaymentId.trim() || '',
      clientName: this.searchClientName.trim() || '',
      phone: this.searchPhone.trim() || '',
      periodFrom: this.dateFrom ? `${this.dateFrom}T00:00:00` : null,
      periodTo: this.dateTo ? `${this.dateTo}T23:59:59` : null,
      paymentMethod: this.filterPaymentMethod !== 'all' ? this.filterPaymentMethod.toUpperCase() : null,
      paymentType: this.filterRefund === 'all' ? 'ALL' : (this.filterRefund === 'paid' ? 'PAID' : 'REFUND'),
      sortBy: this.mapSortField(this.sortField),
      sortDirection: this.sortDirection.toUpperCase() as 'ASC' | 'DESC',
      page: this.currentPage,
      size: this.pageSize
    };
    return request;
  }

  mapSortField(field: SortField): 'date' | 'amount' | 'clientName' {
    switch (field) {
      case 'date':
        return 'date';
      case 'amount':
        return 'amount';
      case 'clientName':
        return 'clientName';
      default:
        return 'date';
    }
  }

  mapSearchResultToPayment(result: PaymentSearchResult): Payment {
    const createdAt = new Date(result.createdAt);
    const dateStr = this.formatDate(createdAt);
    const timeStr = this.formatTime(createdAt);
    
    return {
      id: result.txId,
      clientId: result.clientId,
      clientName: result.clientName,
      clientPhone: result.clientPhone,
      amount: result.amount,
      bonusEarned: result.bonusGranted,
      bonusUsed: result.bonusUsed,
      bonusRevoked: result.bonusRevoked || 0,
      paymentMethod: (result.paymentMethod?.toLowerCase() as 'cash' | 'card' | 'transfer') || 'cash',
      isRefund: result.status === 'REFUNDED' || !!result.refundedPaymentTxId,
      date: dateStr,
      time: timeStr,
      refundReason: result.refundReason || undefined,
      initiatedBy: result.initiatedBy || undefined
    };
  }

  formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  formatPaymentId(id: string): string {
    // Remove PTX- prefix if present
    return id.replace(/^PTX-/, '');
  }

  getPaymentMethodForBadge(method: string | undefined): 'CASH' | 'CARD' | 'TRANSFER' | null {
    if (!method) return null;
    const upperMethod = method.toUpperCase();
    if (upperMethod === 'CASH' || upperMethod === 'CARD' || upperMethod === 'TRANSFER') {
      return upperMethod as 'CASH' | 'CARD' | 'TRANSFER';
    }
    return null;
  }

  togglePaymentRow(paymentId: string): void {
    if (this.expandedPaymentRows.has(paymentId)) {
      this.expandedPaymentRows.delete(paymentId);
    } else {
      this.expandedPaymentRows.add(paymentId);
    }
  }

  isPaymentRowExpanded(paymentId: string): boolean {
    return this.expandedPaymentRows.has(paymentId);
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('ru-RU');
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Наличные',
      card: 'Карта',
      transfer: 'Перевод'
    };
    return labels[method] || method;
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.updateUrlFromState();
    // loadPayments() will run from queryParams subscription
  }

  onPageChange(page: number): void {
    this.currentPage = page - 1;
    this.updateUrlFromState();
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.updateUrlFromState();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalPaymentsFound / this.pageSize);
  }

  get Math() {
    return Math;
  }

  hasActiveFilters(): boolean {
    return this.searchPaymentId.trim() !== '' ||
           this.searchClientName.trim() !== '' ||
           this.searchPhone.trim() !== '' ||
           this.dateFrom !== '' ||
           this.dateTo !== '' ||
           this.filterPaymentMethod !== 'all' ||
           this.filterRefund !== 'all';
  }

  clearFilters(): void {
    this.searchPaymentId = '';
    this.searchClientName = '';
    this.searchPhone = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.filterPaymentMethod = 'all';
    this.filterRefund = 'all';
    this.sortField = 'date';
    this.sortDirection = 'desc';
    this.currentPage = 0;
    this.updateUrlFromState();
    // loadPayments() will run from queryParams subscription
  }

  openRefundModal(payment: Payment): void {
    if (payment.isRefund) {
      return;
    }
    this.selectedPaymentForRefund = payment;
    this.showRefundModal = true;
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
    this.selectedPaymentForRefund = null;
  }

  confirmRefund(payment: Payment): void {
    if (!payment) {
      return;
    }
    
    const refundRequest = {
      notes: payment.refundReason || 'Возврат платежа'
    };

    this.paymentsService.refundPayment(payment.id, refundRequest).subscribe({
      next: () => {
        this.toastService.success('Платеж успешно возвращен');
        this.closeRefundModal();
        this.loadPayments();
        this.loadDashboardData();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при возврате платежа';
        this.toastService.error(errorMessage);
      }
    });
  }

  openPaymentView(paymentId: string): void {
    // Find payment in the list to get search result data
    const payment = this.payments.find(p => p.id === paymentId);
    if (payment) {
      // Convert Payment to PaymentSearchResult format
      this.selectedPaymentSearchResult = {
        txId: payment.id,
        clientId: payment.clientId,
        clientName: payment.clientName,
        clientPhone: payment.clientPhone,
        clientEmail: null,
        amount: payment.amount,
        status: payment.isRefund ? 'REFUNDED' : 'COMPLETED',
        paymentMethod: payment.paymentMethod?.toUpperCase() as 'CASH' | 'CARD' | 'TRANSFER' | null,
        initiatedBy: payment.initiatedBy || null,
        createdAt: payment.date + 'T' + payment.time,
        refundedPaymentTxId: null,
        bonusGranted: payment.bonusEarned,
        bonusUsed: payment.bonusUsed,
        bonusRevoked: payment.bonusRevoked,
        refundReason: payment.refundReason || null
      };
    }
    this.selectedPaymentTxId = paymentId;
    this.showPaymentViewModal = true;
  }

  closePaymentView(): void {
    this.showPaymentViewModal = false;
    this.selectedPaymentTxId = null;
    this.selectedPaymentSearchResult = null;
  }

  onPaymentUpdated(): void {
    // Reload payments after update
    this.loadPayments();
  }

  openTransactionModal(): void {
    this.transactionModalService.open();
  }
}
