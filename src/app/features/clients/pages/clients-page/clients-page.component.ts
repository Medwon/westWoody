import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ClientsService, ClientSearchResult } from '../../../../core/services/clients.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { CreateClientModalComponent } from '../../../../shared/components/create-client-modal/create-client-modal.component';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  tags: string[];
  type: 'individual' | 'business';
  totalTransactions: number;
  totalAmount: number;
  bonusBalance: number;
  bonusUsed: number;
  lastVisit: string;
  createdAt: string;
}

type SortField = 'name' | 'phone' | 'totalAmount' | 'bonusBalance' | 'lastVisit' | 'createdAt' | 'totalTransactions';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BadgeComponent, ButtonComponent, IconButtonComponent, PaginationComponent, LoaderComponent, CreateClientModalComponent],
  template: `
    <div class="page-wrapper">
      <div class="clients-container">
        
        <!-- Header with Create Button -->
        <div class="page-header-actions">
          <app-button 
            buttonType="primary" 
            size="medium" 
            (onClick)="openCreateClientModal()">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Новый клиент
          </app-button>
        </div>

        <!-- Dashboard Cards -->
        <div class="dashboard-grid">
          <div class="dashboard-card">
            <div class="card-icon total-clients">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-value">{{ totalClients }}</span>
              <span class="card-label">Всего клиентов</span>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="card-icon active-clients">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-value">{{ activeClientsThisMonth }}</span>
              <span class="card-label">Активных клиентов за месяц</span>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="card-icon total-revenue">
              <svg viewBox="0 0 24 24" fill="none">
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
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-value">{{ formatAmount(totalBonusesGranted) }}</span>
              <span class="card-label">Бонусов в обороте</span>
            </div>
          </div>
        </div>
        <div class="loading-container" *ngIf="isLoadingDashboard">
          <app-loader></app-loader>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
          <div class="filters-row">
            <!-- Search by name -->
            <div class="filter-group search-group">
              <div class="search-input-wrapper">
                <svg viewBox="0 0 24 24" fill="none" class="search-icon">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <input 
                  type="text" 
                  [(ngModel)]="searchName" 
                  placeholder="Поиск по имени..."
                  class="filter-input">
              </div>
            </div>

            <!-- Search by phone -->
            <div class="filter-group">
              <div class="search-input-wrapper">
                <svg viewBox="0 0 24 24" fill="none" class="search-icon">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <input 
                  type="text" 
                  [(ngModel)]="searchPhone" 
                  placeholder="Поиск по телефону..."
                  class="filter-input">
              </div>
            </div>

            <!-- Search by email -->
            <div class="filter-group">
              <div class="search-input-wrapper">
                <svg viewBox="0 0 24 24" fill="none" class="search-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <input 
                  type="text" 
                  [(ngModel)]="searchEmail" 
                  placeholder="Поиск по email..."
                  class="filter-input">
              </div>
            </div>

            <!-- Date filter -->
            <div class="filter-group date-filter">
              <label class="filter-label">Период последнего визита:</label>
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
            <!-- Tags filter -->
            <div class="filter-group tags-filter">
              <label class="filter-label">Фильтр по тэгам:</label>
              <div class="tags-select-wrapper">
                <div class="selected-tags">
                  <span class="selected-tag" *ngFor="let tag of selectedTags; let i = index">
                    {{ tag }}
                    <button class="remove-tag" (click)="removeTagFilter(i)">×</button>
                  </span>
                  <input 
                    type="text" 
                    [(ngModel)]="tagSearchInput"
                    (focus)="showTagDropdown = true"
                    (input)="filterAvailableTags()"
                    placeholder="Добавить тэг..."
                    class="tag-input">
                </div>
                <div class="tag-dropdown" *ngIf="showTagDropdown && getAvailableTagsForFilter().length > 0">
                  <button 
                    class="tag-option" 
                    *ngFor="let tag of getAvailableTagsForFilter()"
                    (click)="addTagFilter(tag)">
                    {{ tag }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Sort -->
            <div class="filter-group sort-group">
              <label class="filter-label">Сортировка:</label>
              <select [(ngModel)]="sortField" class="sort-select">
                <option value="name">По имени</option>
                <option value="lastVisit">По последнему визиту</option>
                <option value="createdAt">По дате регистрации</option>
              </select>
              <button class="sort-direction-btn" (click)="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'">
                <svg viewBox="0 0 24 24" fill="none" [class.desc]="sortDirection === 'desc'">
                  <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>

            <!-- Client type filter -->
            <div class="filter-group type-filter">
              <label class="filter-label">Тип:</label>
              <div class="type-buttons">
                <button 
                  class="type-btn" 
                  [class.active]="filterType === 'all'"
                  (click)="filterType = 'all'">Все</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterType === 'individual'"
                  (click)="filterType = 'individual'">Физ. лица</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterType === 'business'"
                  (click)="filterType = 'business'">Бизнес</button>
              </div>
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

        <!-- Loading State -->
        <div class="loading-container" *ngIf="isLoading">
          <app-loader></app-loader>
        </div>

        <!-- Results count -->
        <div class="results-info" *ngIf="!isLoading">
          <span class="results-count">Найдено: {{ totalClientsFound }} клиентов</span>
        </div>

        <!-- Clients Table with Pagination -->
        <div *ngIf="!isLoading">
          <div class="table-container">
            <table class="clients-table">
              <thead>
                <tr>
                  <th class="th-client">Клиент</th>
                  <th class="th-contact">Контакты</th>
                  <th class="th-tags">Тэги</th>
                  <th class="th-stats">Статистика</th>
                  <th class="th-bonuses">Бонусы</th>
                  <th class="th-date">Последний визит</th>
                  <th class="th-actions">Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let client of clients" class="client-row">
                <td class="td-client">
                  <div class="client-cell">
                    <div class="client-avatar" [class.business]="client.type === 'business'">
                      {{ getInitials(client) }}
                    </div>
                    <div class="client-info">
                      <a [routerLink]="['/clients', client.id]" class="client-name-link">
                        <span class="client-name">{{ client.firstName }}{{ client.lastName ? ' ' + client.lastName : '' }}</span>
                      </a>
                      <span class="client-type">
                        <svg viewBox="0 0 24 24" fill="none" *ngIf="client.type === 'business'">
                          <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.5"/>
                          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        <svg viewBox="0 0 24 24" fill="none" *ngIf="client.type === 'individual'">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        {{ client.type === 'business' ? 'Бизнес' : 'Физ. лицо' }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="td-contact">
                  <div class="contact-info">
                    <span class="contact-phone">{{ client.phone }}</span>
                    <span class="contact-email">{{ client.email || '—' }}</span>
                  </div>
                </td>
                <td class="td-tags">
                  <div class="tags-list">
                    <span class="tag" *ngFor="let tag of client.tags.slice(0, 2)">{{ tag }}</span>
                    <span class="tag more" *ngIf="client.tags.length > 2">+{{ client.tags.length - 2 }}</span>
                  </div>
                </td>
                <td class="td-stats">
                  <div class="stats-info">
                    <span class="stat-main">{{ formatAmount(client.totalAmount) }} ₸</span>
                    <span class="stat-secondary">{{ client.totalTransactions }} транзакций</span>
                  </div>
                </td>
                <td class="td-bonuses">
                  <div class="bonus-info">
                    <span class="bonus-balance">{{ formatAmount(client.bonusBalance) }}</span>
                    <span class="bonus-used">−{{ formatAmount(client.bonusUsed) }} исп.</span>
                  </div>
                </td>
                <td class="td-date">
                  <span class="date-text">{{ client.lastVisit }}</span>
                </td>
                <td class="td-actions">
                  <div class="actions-cell">
                    <a [routerLink]="['/clients', client.id]" class="action-link">
                      <app-icon-button
                        iconButtonType="view"
                        size="small"
                        tooltip="Просмотр">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </app-icon-button>
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="empty-state" *ngIf="clients.length === 0">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>Клиенты не найдены</span>
            <app-button buttonType="primary" size="small" (onClick)="clearFilters()">
              Сбросить фильтры
            </app-button>
          </div>
        </div>

        <!-- Backend Pagination -->
        <div class="pagination-container" *ngIf="!isLoading && totalClientsFound > 0">
          <div class="pagination-left">
            <div class="pagination-info">
              <span>Показано {{ (currentPage * pageSize) + 1 }}-{{ Math.min((currentPage + 1) * pageSize, totalClientsFound) }} из {{ totalClientsFound }}</span>
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

    <!-- Create Client Modal -->
    <app-create-client-modal
      [(visible)]="showCreateClientModal"
      (clientCreated)="onClientCreated($event)">
    </app-create-client-modal>
  `,
  styles: [`
    .page-header-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }

    .page-header-actions app-button svg {
      width: 16px;
      height: 16px;
    }

    .page-wrapper {
      min-height: 100%;
      margin: -2rem;
      padding: 2rem;
    }

    .clients-container {
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
.card-icon.total-clients {
  // background-color:rgba(37, 99, 235, 0.1); 
  color:rgb(0, 0, 0); 
    background-color: #f3f4f6; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px;
}

.card-icon.active-clients {
  // background-color: rgba(5, 150, 105, 0.1);
  color:rgb(0, 0, 0); 
   background-color: #f3f4f6; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px;
}

.card-icon.total-revenue {
  // background-color: rgba(217, 119, 6, 0.1);
  color: rgb(0, 0, 0); 
   background-color: #f3f4f6; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px;
}

.card-icon.total-bonuses {
  // background-color: rgba(219, 39, 119, 0.1);
  color:rgb(0, 0, 0); 
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

    /* Tags Filter */
    .tags-filter {
      flex: 1;
      min-width: 250px;
    }

    .tags-select-wrapper {
      position: relative;
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 6px 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      min-height: 38px;
      align-items: center;
    }

    .selected-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: #dcfce7;
      color: #16A34A;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .remove-tag {
      background: none;
      border: none;
      color: #16A34A;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0;
    }

    .remove-tag:hover {
      color: #dc2626;
    }

    .tag-input {
      flex: 1;
      min-width: 100px;
      border: none;
      background: transparent;
      font-size: 0.85rem;
      outline: none;
      color: #1f2937;
    }

    .tag-input::placeholder {
      color: #94a3b8;
    }

    .tag-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 120px;
      overflow-y: auto;
      z-index: 50;
    }

    .tag-option {
      padding: 4px 10px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tag-option:hover {
      background: #dcfce7;
      border-color: #bbf7d0;
      color: #16A34A;
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

    .clients-table {
      width: 100%;
      border-collapse: collapse;
    }

    .clients-table th {
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

    .clients-table td {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .client-row {
      transition: background 0.15s;
    }

    .client-row:hover {
      background: #f8fafc;
    }

    .client-row.inactive {
      opacity: 0.6;
    }

    .client-row:last-child td {
      border-bottom: none;
    }

    /* Client Cell */
    .client-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .client-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #16A34A, #22c55e);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .client-avatar.business {
      background: linear-gradient(135deg, #1d4ed8, #3b82f6);
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

    .client-type {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .client-type svg {
      width: 12px;
      height: 12px;
    }

    /* Contact Info */
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .contact-phone {
      font-size: 0.85rem;
      color: #1f2937;
      font-weight: 500;
    }

    .contact-email {
      font-size: 0.8rem;
      color: #64748b;
    }

    /* Tags */
    .tags-list {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .tag {
      padding: 2px 8px;
      background: #dcfce7;
      color: #16A34A;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .tag.more {
      background: #f1f5f9;
      color: #64748b;
    }

    /* Stats */
    .stats-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .stat-main {
      font-size: 0.9rem;
      font-weight: 600;
      color: #16A34A;
    }

    .stat-secondary {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Bonuses */
    .bonus-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .bonus-balance {
      font-size: 0.9rem;
      font-weight: 600;
      color: #d97706;
    }

    .bonus-used {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Date */
    .date-text {
      font-size: 0.85rem;
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

      .clients-table {
        min-width: 900px;
      }
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

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3rem;
    }
  `]
})
export class ClientsPageComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);
  private analyticsService = inject(AnalyticsService);
  private clientsService = inject(ClientsService);
  private toastService = inject(ToastService);

  // Dashboard data
  totalClients = 0;
  activeClientsThisMonth = 0;
  totalRevenue = 0;
  totalBonusesGranted = 0;
  isLoadingDashboard = true;

  // Filters
  searchName = '';
  searchPhone = '';
  searchEmail = '';
  dateFrom = '';
  dateTo = '';
  selectedTags: string[] = [];
  tagSearchInput = '';
  showTagDropdown = false;
  sortField: 'name' | 'createdAt' | 'lastVisit' = 'lastVisit';
  sortDirection: SortDirection = 'desc';
  filterType: 'all' | 'individual' | 'business' = 'all';

  // Available tags from API
  allTags: string[] = [];

  // Clients data
  isLoading = false;
  clients: Client[] = [];
  totalClientsFound = 0;
  currentPage = 0;
  pageSize = 15;

  // Create client modal
  showCreateClientModal = false;

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Клиенты', [
      { label: 'Главная', route: '/home' },
      { label: 'Клиенты' }
    ]);
    
    this.loadDashboardData();
    this.loadClients();
    this.loadTags();
  }

  loadTags(): void {
    this.clientsService.getTags().subscribe({
      next: (tags) => {
        this.allTags = tags;
      },
      error: (err) => {
        // Silently fail - tags are optional
        console.error('Failed to load tags:', err);
      }
    });
  }

  loadDashboardData(): void {
    this.isLoadingDashboard = true;
    forkJoin({
      totals: this.analyticsService.getOverallTotals(),
      active: this.analyticsService.getActiveClients()
    }).subscribe({
      next: ({ totals, active }) => {
        this.totalClients = totals.totalClients;
        this.totalRevenue = totals.totalRevenue;
        this.totalBonusesGranted = totals.totalBonusesGranted;
        this.activeClientsThisMonth = active.count;
        this.isLoadingDashboard = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка загрузки данных';
        this.toastService.error(errorMessage);
        this.isLoadingDashboard = false;
      }
    });
  }

  loadClients(): void {
    this.isLoading = true;
    const searchRequest = this.buildSearchRequest();
    
    this.clientsService.searchClients(searchRequest).subscribe({
      next: (response) => {
        this.clients = response.content.map(result => this.mapSearchResultToClient(result));
        this.totalClientsFound = response.totalElements;
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка загрузки клиентов';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  buildSearchRequest() {
    const request: any = {
      name: this.searchName.trim() || '',
      phone: this.searchPhone.trim() || '',
      email: this.searchEmail.trim() || '',
      lastVisitFrom: this.dateFrom ? `${this.dateFrom}T00:00:00` : null,
      lastVisitTo: this.dateTo ? `${this.dateTo}T23:59:59` : null,
      tags: this.selectedTags.length > 0 ? this.selectedTags : [],
      clientType: this.filterType !== 'all' ? (this.filterType === 'individual' ? 'INDIVIDUAL' : 'BUSINESS') : null,
      sortBy: this.mapSortField(this.sortField),
      sortDirection: this.sortDirection.toUpperCase() as 'ASC' | 'DESC',
      page: this.currentPage,
      size: this.pageSize
    };
    return request;
  }

  mapSortField(field: 'name' | 'createdAt' | 'lastVisit'): 'name' | 'createdAt' | 'lastVisit' {
    return field;
  }

  mapSearchResultToClient(result: ClientSearchResult): Client {
    const lastVisitDate = result.lastVisit ? new Date(result.lastVisit) : null;
    const createdAtDate = result.createdAt ? new Date(result.createdAt) : null;
    
    return {
      id: result.id,
      firstName: result.name,
      lastName: result.surname || '',
      phone: result.phone,
      email: result.email,
      tags: result.tags || [],
      type: result.clientType === 'BUSINESS' ? 'business' : 'individual',
      totalTransactions: result.transactionCount,
      totalAmount: result.totalSpent,
      bonusBalance: result.bonusBalance,
      bonusUsed: result.bonusUsed,
      lastVisit: lastVisitDate ? this.formatLastVisit(lastVisitDate) : '—',
      createdAt: createdAtDate ? this.formatDate(createdAtDate) : '—'
    };
  }

  formatLastVisit(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} мин. назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ч. назад`;
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дн. назад`;
    } else {
      return this.formatDate(date);
    }
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  applyFilters(): void {
    this.currentPage = 0; // Reset to first page when filters change
    this.loadClients();
  }

  onPageChange(page: number): void {
    this.currentPage = page - 1; // Pagination component uses 1-based, API uses 0-based
    this.loadClients();
    // Scroll to top of table
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 0; // Reset to first page when changing page size
    this.loadClients();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalClientsFound / this.pageSize);
  }

  get Math() {
    return Math;
  }

  // Legacy methods kept for compatibility but not used
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('ru-RU');
  }

  getInitials(client: Client): string {
    if (client.type === 'business') {
      return client.firstName.substring(0, 2).toUpperCase();
    }
    const firstInitial = client.firstName.charAt(0) || '';
    const lastInitial = client.lastName ? client.lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  addTagFilter(tag: string): void {
    if (!this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    }
    this.tagSearchInput = '';
    this.showTagDropdown = false;
  }

  removeTagFilter(index: number): void {
    this.selectedTags.splice(index, 1);
  }

  filterAvailableTags(): void {
    // Just trigger change detection
  }

  getAvailableTagsForFilter(): string[] {
    const search = this.tagSearchInput.toLowerCase();
    return this.allTags.filter(tag => 
      !this.selectedTags.includes(tag) && 
      (search === '' || tag.toLowerCase().includes(search))
    );
  }

  hasActiveFilters(): boolean {
    return this.searchName.trim() !== '' ||
           this.searchPhone.trim() !== '' ||
           this.searchEmail.trim() !== '' ||
           this.dateFrom !== '' ||
           this.dateTo !== '' ||
           this.selectedTags.length > 0 ||
           this.filterType !== 'all';
  }

  clearFilters(): void {
    this.searchName = '';
    this.searchPhone = '';
    this.searchEmail = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedTags = [];
    this.tagSearchInput = '';
    this.filterType = 'all';
    this.sortField = 'lastVisit';
    this.sortDirection = 'desc';
    this.currentPage = 0;
    this.loadClients();
  }

  // Create client modal methods
  openCreateClientModal(): void {
    this.showCreateClientModal = true;
  }

  onClientCreated(client: any): void {
    this.toastService.success(`Клиент ${client.name} успешно создан!`);
    // Reload dashboard and clients list
    this.loadDashboardData();
    this.loadClients();
  }
}