import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

interface Payment {
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
  comment?: string;
}

type SortField = 'clientName' | 'amount' | 'date' | 'paymentMethod';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="payments-container">
        
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
              <span class="card-value">{{ payments.length }}</span>
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
              <span class="card-value">{{ getPaymentsToday() }}</span>
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
              <span class="card-value">{{ formatAmount(getTotalRevenue()) }} ₸</span>
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
              <span class="card-value">{{ formatAmount(getTotalBonusesEarned()) }}</span>
              <span class="card-label">Бонусов начислено</span>
            </div>
          </div>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
          <div class="filters-row">
            <!-- Search by client name -->
            <div class="filter-group search-group">
              <div class="search-input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="search-icon">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <input 
                  type="text" 
                  [(ngModel)]="searchClientName" 
                  (input)="applyFilters()"
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
                  (input)="applyFilters()"
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
                  (change)="applyFilters()"
                  placeholder="От"
                  class="date-input">
                <span class="date-separator">—</span>
                <input 
                  type="date" 
                  [(ngModel)]="dateTo" 
                  (change)="applyFilters()"
                  placeholder="До"
                  class="date-input">
              </div>
            </div>

            <!-- Payment method filter -->
            <div class="filter-group type-filter">
              <label class="filter-label">Способ оплаты:</label>
              <div class="type-buttons">
                <button 
                  class="type-btn" 
                  [class.active]="filterPaymentMethod === 'all'"
                  (click)="setPaymentMethodFilter('all')">Все</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterPaymentMethod === 'cash'"
                  (click)="setPaymentMethodFilter('cash')">Наличные</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterPaymentMethod === 'card'"
                  (click)="setPaymentMethodFilter('card')">Карта</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterPaymentMethod === 'online'"
                  (click)="setPaymentMethodFilter('online')">Онлайн</button>
              </div>
            </div>

            <!-- Refund filter -->
            <div class="filter-group type-filter">
              <label class="filter-label">Тип:</label>
              <div class="type-buttons">
                <button 
                  class="type-btn" 
                  [class.active]="filterRefund === 'all'"
                  (click)="setRefundFilter('all')">Все</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterRefund === 'paid'"
                  (click)="setRefundFilter('paid')">Оплачено</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterRefund === 'refund'"
                  (click)="setRefundFilter('refund')">Возврат</button>
              </div>
            </div>

            <!-- Sort -->
            <div class="filter-group sort-group">
              <label class="filter-label">Сортировка:</label>
              <select [(ngModel)]="sortField" (change)="applyFilters()" class="sort-select">
                <option value="date">По дате</option>
                <option value="clientName">По клиенту</option>
                <option value="amount">По сумме</option>
                <option value="paymentMethod">По способу оплаты</option>
              </select>
              <button class="sort-direction-btn" (click)="toggleSortDirection()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" [class.desc]="sortDirection === 'desc'">
                  <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>

            <!-- Clear filters -->
            <button class="clear-filters-btn" (click)="clearFilters()" *ngIf="hasActiveFilters()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Сбросить
            </button>
          </div>
        </div>

        <!-- Results count -->
        <div class="results-info">
          <span class="results-count">Найдено: {{ filteredPayments.length }} платежей</span>
        </div>

        <!-- Payments Table -->
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
              <tr *ngFor="let payment of filteredPayments" class="payment-row">
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
                    <button class="action-btn view" [routerLink]="['/clients', payment.clientId]" title="Просмотр клиента">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                    </button>
                    <button class="action-btn edit" title="Редактировать">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="empty-state" *ngIf="filteredPayments.length === 0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>Платежи не найдены</span>
            <button class="reset-btn" (click)="clearFilters()">Сбросить фильтры</button>
          </div>
        </div>

      </div>
    </div>
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
    .clear-filters-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.875rem;
      border: 1.5px solid #fecaca;
      border-radius: 8px;
      background: #fef2f2;
      color: #dc2626;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      margin-left: auto;
    }

    .clear-filters-btn svg {
      width: 14px;
      height: 14px;
    }

    .clear-filters-btn:hover {
      background: #fee2e2;
      border-color: #fca5a5;
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

    /* Payment Method */
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

    .action-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
    }

    .action-btn.view:hover {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #16A34A;
    }

    .action-btn.edit:hover {
      background: #dbeafe;
      border-color: #bfdbfe;
      color: #1d4ed8;
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
export class PaymentsPageComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);

  // Filters
  searchClientName = '';
  searchPhone = '';
  dateFrom = '';
  dateTo = '';
  filterPaymentMethod: 'all' | 'cash' | 'card' | 'online' = 'all';
  filterRefund: 'all' | 'paid' | 'refund' = 'all';
  sortField: SortField = 'date';
  sortDirection: SortDirection = 'desc';

  // Mock payments data
  payments: Payment[] = [
    {
      id: '1',
      clientId: '1',
      clientName: 'Алексей Петров',
      clientPhone: '+7 (777) 123-45-67',
      amount: 12500,
      bonusEarned: 125,
      bonusUsed: 0,
      paymentMethod: 'card',
      isRefund: false,
      date: '15.01.2025',
      time: '14:30'
    },
    {
      id: '2',
      clientId: '2',
      clientName: 'ТОО «ТехноПлюс»',
      clientPhone: '+7 (701) 555-12-34',
      amount: 45000,
      bonusEarned: 450,
      bonusUsed: 200,
      paymentMethod: 'online',
      isRefund: false,
      date: '15.01.2025',
      time: '12:15'
    },
    {
      id: '3',
      clientId: '3',
      clientName: 'Мария Иванова',
      clientPhone: '+7 (707) 987-65-43',
      amount: 5600,
      bonusEarned: 56,
      bonusUsed: 0,
      paymentMethod: 'cash',
      isRefund: false,
      date: '14.01.2025',
      time: '18:45'
    },
    {
      id: '4',
      clientId: '4',
      clientName: 'Дмитрий Сидоров',
      clientPhone: '+7 (702) 111-22-33',
      amount: 8900,
      bonusEarned: 0,
      bonusUsed: 89,
      paymentMethod: 'card',
      isRefund: false,
      date: '14.01.2025',
      time: '16:20'
    },
    {
      id: '5',
      clientId: '5',
      clientName: 'ИП «Строй-Мастер»',
      clientPhone: '+7 (700) 333-44-55',
      amount: 125000,
      bonusEarned: 1250,
      bonusUsed: 500,
      paymentMethod: 'online',
      isRefund: false,
      date: '14.01.2025',
      time: '10:00'
    },
    {
      id: '6',
      clientId: '6',
      clientName: 'Анна Козлова',
      clientPhone: '+7 (778) 444-55-66',
      amount: 23400,
      bonusEarned: 234,
      bonusUsed: 0,
      paymentMethod: 'card',
      isRefund: false,
      date: '13.01.2025',
      time: '15:30'
    },
    {
      id: '7',
      clientId: '1',
      clientName: 'Алексей Петров',
      clientPhone: '+7 (777) 123-45-67',
      amount: 15600,
      bonusEarned: 156,
      bonusUsed: 50,
      paymentMethod: 'card',
      isRefund: false,
      date: '13.01.2025',
      time: '11:20'
    },
    {
      id: '8',
      clientId: '8',
      clientName: 'ТОО «АльфаТрейд»',
      clientPhone: '+7 (727) 999-88-77',
      amount: 78000,
      bonusEarned: 780,
      bonusUsed: 0,
      paymentMethod: 'online',
      isRefund: true,
      date: '12.01.2025',
      time: '09:15'
    },
    {
      id: '9',
      clientId: '1',
      clientName: 'Алексей Петров',
      clientPhone: '+7 (777) 123-45-67',
      amount: 18900,
      bonusEarned: 189,
      bonusUsed: 100,
      paymentMethod: 'card',
      isRefund: false,
      date: '12.01.2025',
      time: '16:45'
    },
    {
      id: '10',
      clientId: '4',
      clientName: 'Дмитрий Сидоров',
      clientPhone: '+7 (702) 111-22-33',
      amount: 12300,
      bonusEarned: 123,
      bonusUsed: 0,
      paymentMethod: 'cash',
      isRefund: false,
      date: '12.01.2025',
      time: '13:20'
    },
    {
      id: '11',
      clientId: '6',
      clientName: 'Анна Козлова',
      clientPhone: '+7 (778) 444-55-66',
      amount: 45600,
      bonusEarned: 456,
      bonusUsed: 200,
      paymentMethod: 'card',
      isRefund: false,
      date: '11.01.2025',
      time: '17:30'
    },
    {
      id: '12',
      clientId: '2',
      clientName: 'ТОО «ТехноПлюс»',
      clientPhone: '+7 (701) 555-12-34',
      amount: 98000,
      bonusEarned: 980,
      bonusUsed: 0,
      paymentMethod: 'online',
      isRefund: false,
      date: '11.01.2025',
      time: '10:00'
    },
    {
      id: '13',
      clientId: '3',
      clientName: 'Мария Иванова',
      clientPhone: '+7 (707) 987-65-43',
      amount: 7800,
      bonusEarned: 78,
      bonusUsed: 0,
      paymentMethod: 'cash',
      isRefund: false,
      date: '11.01.2025',
      time: '19:15'
    },
    {
      id: '14',
      clientId: '5',
      clientName: 'ИП «Строй-Мастер»',
      clientPhone: '+7 (700) 333-44-55',
      amount: 156000,
      bonusEarned: 1560,
      bonusUsed: 800,
      paymentMethod: 'online',
      isRefund: false,
      date: '10.01.2025',
      time: '14:00'
    },
    {
      id: '15',
      clientId: '7',
      clientName: 'Сергей Николаев',
      clientPhone: '+7 (705) 666-77-88',
      amount: 11200,
      bonusEarned: 112,
      bonusUsed: 0,
      paymentMethod: 'card',
      isRefund: false,
      date: '10.01.2025',
      time: '11:30'
    },
    {
      id: '16',
      clientId: '1',
      clientName: 'Алексей Петров',
      clientPhone: '+7 (777) 123-45-67',
      amount: 23400,
      bonusEarned: 234,
      bonusUsed: 150,
      paymentMethod: 'card',
      isRefund: false,
      date: '10.01.2025',
      time: '15:45'
    },
    {
      id: '17',
      clientId: '6',
      clientName: 'Анна Козлова',
      clientPhone: '+7 (778) 444-55-66',
      amount: 34500,
      bonusEarned: 345,
      bonusUsed: 0,
      paymentMethod: 'card',
      isRefund: false,
      date: '09.01.2025',
      time: '12:20'
    },
    {
      id: '18',
      clientId: '8',
      clientName: 'ТОО «АльфаТрейд»',
      clientPhone: '+7 (727) 999-88-77',
      amount: 89000,
      bonusEarned: 890,
      bonusUsed: 400,
      paymentMethod: 'online',
      isRefund: false,
      date: '09.01.2025',
      time: '09:30'
    },
    {
      id: '19',
      clientId: '4',
      clientName: 'Дмитрий Сидоров',
      clientPhone: '+7 (702) 111-22-33',
      amount: 16700,
      bonusEarned: 167,
      bonusUsed: 0,
      paymentMethod: 'cash',
      isRefund: false,
      date: '09.01.2025',
      time: '18:00'
    },
    {
      id: '20',
      clientId: '2',
      clientName: 'ТОО «ТехноПлюс»',
      clientPhone: '+7 (701) 555-12-34',
      amount: 67000,
      bonusEarned: 670,
      bonusUsed: 300,
      paymentMethod: 'online',
      isRefund: false,
      date: '08.01.2025',
      time: '11:15'
    },
    {
      id: '21',
      clientId: '3',
      clientName: 'Мария Иванова',
      clientPhone: '+7 (707) 987-65-43',
      amount: 9900,
      bonusEarned: 99,
      bonusUsed: 0,
      paymentMethod: 'card',
      isRefund: false,
      date: '08.01.2025',
      time: '16:40'
    },
    {
      id: '22',
      clientId: '5',
      clientName: 'ИП «Строй-Мастер»',
      clientPhone: '+7 (700) 333-44-55',
      amount: 145000,
      bonusEarned: 1450,
      bonusUsed: 600,
      paymentMethod: 'online',
      isRefund: true,
      date: '08.01.2025',
      time: '08:00'
    },
    {
      id: '29',
      clientId: '3',
      clientName: 'Мария Иванова',
      clientPhone: '+7 (707) 987-65-43',
      amount: 5600,
      bonusEarned: 0,
      bonusUsed: 56,
      paymentMethod: 'card',
      isRefund: true,
      date: '06.01.2025',
      time: '14:30'
    },
    {
      id: '30',
      clientId: '1',
      clientName: 'Алексей Петров',
      clientPhone: '+7 (777) 123-45-67',
      amount: 8900,
      bonusEarned: 0,
      bonusUsed: 89,
      paymentMethod: 'card',
      isRefund: true,
      date: '05.01.2025',
      time: '16:15'
    },
    {
      id: '23',
      clientId: '1',
      clientName: 'Алексей Петров',
      clientPhone: '+7 (777) 123-45-67',
      amount: 27800,
      bonusEarned: 278,
      bonusUsed: 0,
      paymentMethod: 'card',
      isRefund: false,
      date: '07.01.2025',
      time: '14:25'
    },
    {
      id: '24',
      clientId: '6',
      clientName: 'Анна Козлова',
      clientPhone: '+7 (778) 444-55-66',
      amount: 38900,
      bonusEarned: 389,
      bonusUsed: 250,
      paymentMethod: 'card',
      isRefund: false,
      date: '07.01.2025',
      time: '13:10'
    },
    {
      id: '25',
      clientId: '7',
      clientName: 'Сергей Николаев',
      clientPhone: '+7 (705) 666-77-88',
      amount: 14500,
      bonusEarned: 145,
      bonusUsed: 0,
      paymentMethod: 'cash',
      isRefund: false,
      date: '07.01.2025',
      time: '10:50'
    },
    {
      id: '26',
      clientId: '8',
      clientName: 'ТОО «АльфаТрейд»',
      clientPhone: '+7 (727) 999-88-77',
      amount: 112000,
      bonusEarned: 1120,
      bonusUsed: 500,
      paymentMethod: 'online',
      isRefund: false,
      date: '06.01.2025',
      time: '15:00'
    },
    {
      id: '27',
      clientId: '4',
      clientName: 'Дмитрий Сидоров',
      clientPhone: '+7 (702) 111-22-33',
      amount: 20100,
      bonusEarned: 201,
      bonusUsed: 100,
      paymentMethod: 'card',
      isRefund: false,
      date: '06.01.2025',
      time: '17:20'
    },
    {
      id: '28',
      clientId: '2',
      clientName: 'ТОО «ТехноПлюс»',
      clientPhone: '+7 (701) 555-12-34',
      amount: 56000,
      bonusEarned: 560,
      bonusUsed: 0,
      paymentMethod: 'online',
      isRefund: false,
      date: '05.01.2025',
      time: '12:45'
    }
  ];

  filteredPayments: Payment[] = [];

  ngOnInit(): void {
    const date30DaysAgo = new Date();
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
    this.dateFrom = this.formatDateForInput(date30DaysAgo);
    
    this.pageHeaderService.setPageHeader('Платежи', [
      { label: 'Главная', route: '/home' },
      { label: 'Платежи' }
    ]);
    this.applyFilters();
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getPaymentsToday(): number {
    const today = new Date();
    const todayStr = this.formatDate(today);
    return this.payments.filter(p => p.date === todayStr && !p.isRefund).length;
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  getTotalRevenue(): number {
    return this.payments
      .filter(p => !p.isRefund)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  getTotalBonusesEarned(): number {
    return this.payments
      .filter(p => !p.isRefund)
      .reduce((sum, p) => sum + p.bonusEarned, 0);
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('ru-RU');
  }

  formatPaymentId(id: string): string {
    const numId = parseInt(id, 10);
    return `PAY-${String(numId).padStart(3, '0')}`;
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
      online: 'Онлайн'
    };
    return labels[method] || method;
  }


  parseDate(dateStr: string): Date | null {
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  applyFilters(): void {
    let result = [...this.payments];

    // Filter by client name
    if (this.searchClientName.trim()) {
      const search = this.searchClientName.toLowerCase();
      result = result.filter(p => 
        p.clientName.toLowerCase().includes(search)
      );
    }

    // Filter by phone
    if (this.searchPhone.trim()) {
      const search = this.searchPhone.replace(/\D/g, '');
      result = result.filter(p => p.clientPhone.replace(/\D/g, '').includes(search));
    }

    // Filter by payment method
    if (this.filterPaymentMethod !== 'all') {
      result = result.filter(p => p.paymentMethod === this.filterPaymentMethod);
    }

    // Filter by refund
    if (this.filterRefund !== 'all') {
      if (this.filterRefund === 'paid') {
        result = result.filter(p => !p.isRefund);
      } else if (this.filterRefund === 'refund') {
        result = result.filter(p => p.isRefund);
      }
    }

    // Filter by date
    if (this.dateFrom || this.dateTo) {
      result = result.filter(p => {
        const paymentDate = this.parseDate(p.date);
        if (!paymentDate) return false;
        
        if (this.dateFrom) {
          const fromDate = new Date(this.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (paymentDate < fromDate) return false;
        }
        
        if (this.dateTo) {
          const toDate = new Date(this.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (paymentDate > toDate) return false;
        }
        
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      let compareValue = 0;
      
      switch (this.sortField) {
        case 'clientName':
          compareValue = a.clientName.localeCompare(b.clientName);
          break;
        case 'amount':
          compareValue = a.amount - b.amount;
          break;
        case 'date':
          const dateA = this.parseDate(a.date);
          const dateB = this.parseDate(b.date);
          if (!dateA || !dateB) compareValue = 0;
          else compareValue = dateA.getTime() - dateB.getTime();
          if (compareValue === 0) {
            compareValue = a.time.localeCompare(b.time);
          }
          break;
        case 'paymentMethod':
          compareValue = a.paymentMethod.localeCompare(b.paymentMethod);
          break;
      }

      return this.sortDirection === 'asc' ? compareValue : -compareValue;
    });

    this.filteredPayments = result;
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  setPaymentMethodFilter(method: 'all' | 'cash' | 'card' | 'online'): void {
    this.filterPaymentMethod = method;
    this.applyFilters();
  }

  setRefundFilter(refund: 'all' | 'paid' | 'refund'): void {
    this.filterRefund = refund;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.searchClientName.trim() !== '' ||
           this.searchPhone.trim() !== '' ||
           this.dateFrom !== '' ||
           this.dateTo !== '' ||
           this.filterPaymentMethod !== 'all' ||
           this.filterRefund !== 'all';
  }

  clearFilters(): void {
    this.searchClientName = '';
    this.searchPhone = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.filterPaymentMethod = 'all';
    this.filterRefund = 'all';
    const date30DaysAgo = new Date();
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
    this.dateFrom = this.formatDateForInput(date30DaysAgo);
    this.applyFilters();
  }
}

