import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { PaginatedTableWrapperComponent } from '../../../../shared/components/paginated-table-wrapper/paginated-table-wrapper.component';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  tags: string[];
  type: 'individual' | 'business';
  totalTransactions: number;
  totalAmount: number;
  bonusBalance: number;
  bonusUsed: number;
  lastVisit: string;
  createdAt: string;
  active: boolean;
}

type SortField = 'name' | 'phone' | 'totalAmount' | 'bonusBalance' | 'lastVisit' | 'createdAt' | 'totalTransactions';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BadgeComponent, ButtonComponent, IconButtonComponent, PaginatedTableWrapperComponent],
  template: `
    <div class="page-wrapper">
      <div class="clients-container">
        
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
              <span class="card-value">{{ clients.length }}</span>
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
              <span class="card-value">{{ getClientsThisMonth() }}</span>
              <span class="card-label">Клиентов за месяц</span>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="card-icon total-revenue">
              <svg viewBox="0 0 24 24" fill="none">
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
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-value">{{ formatAmount(getTotalBonuses()) }}</span>
              <span class="card-label">Бонусов в обороте</span>
            </div>
          </div>
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
                  (input)="applyFilters()"
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
                  (input)="applyFilters()"
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
                  (input)="applyFilters()"
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
                  (change)="applyFilters()"
                  placeholder="ДД ММ ГГГГ"
                  class="date-input">
                <span class="date-separator">—</span>
                <input 
                  type="date" 
                  [(ngModel)]="dateTo" 
                  (change)="applyFilters()"
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
              <select [(ngModel)]="sortField" (change)="applyFilters()" class="sort-select">
                <option value="name">По имени</option>
                <option value="phone">По телефону</option>
                <option value="totalAmount">По сумме покупок</option>
                <option value="bonusBalance">По бонусам</option>
                <option value="totalTransactions">По кол-ву транзакций</option>
                <option value="lastVisit">По последнему визиту</option>
                <option value="createdAt">По дате регистрации</option>
              </select>
              <button class="sort-direction-btn" (click)="toggleSortDirection()">
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
                  (click)="setTypeFilter('all')">Все</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterType === 'individual'"
                  (click)="setTypeFilter('individual')">Физ. лица</button>
                <button 
                  class="type-btn" 
                  [class.active]="filterType === 'business'"
                  (click)="setTypeFilter('business')">Бизнес</button>
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

        <!-- Results count -->
        <div class="results-info">
          <span class="results-count">Найдено: {{ filteredClients.length }} клиентов</span>
        </div>

        <!-- Clients Table with Pagination -->
        <app-paginated-table-wrapper
          [paginationEnabled]="true"
          [data]="filteredClients"
          [defaultPageSize]="15"
          #paginatedTable>
          
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
                <tr *ngFor="let client of paginatedTable.paginatedData" class="client-row" [class.inactive]="!client.active">
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
                    <app-icon-button
                      iconButtonType="edit"
                      size="small"
                      tooltip="Редактировать">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                    </app-icon-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="empty-state" *ngIf="filteredClients.length === 0">
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
        </app-paginated-table-wrapper>
      </div>
    </div>
  `,
  styles: [`
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
  `]
})
export class ClientsPageComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);

  // Filters
  searchName = '';
  searchPhone = '';
  searchEmail = '';
  dateFrom = '';
  dateTo = '';
  selectedTags: string[] = [];
  tagSearchInput = '';
  showTagDropdown = false;
  sortField: SortField = 'lastVisit';
  sortDirection: SortDirection = 'desc';
  filterType: 'all' | 'individual' | 'business' = 'all';

  // All available tags
  allTags: string[] = [
    'VIP', 'Постоянный', 'Новый', 'Премиум', 'Скидка 5%', 'Скидка 10%',
    'Скидка 15%', 'Скидка 20%', 'Бизнес', 'Корпоративный', 'Партнёр', 'Оптовик', 'Лояльный'
  ];

  // Mock clients data
  clients: Client[] = [
    {
      id: '1',
      firstName: 'Алексей',
      lastName: 'Петров',
      phone: '+7 (777) 123-45-67',
      email: 'alexey.petrov@mail.kz',
      tags: ['VIP', 'Постоянный', 'Скидка 10%'],
      type: 'individual',
      totalTransactions: 156,
      totalAmount: 485200,
      bonusBalance: 2450,
      bonusUsed: 1820,
      lastVisit: '2 часа назад',
      createdAt: '15.03.2024',
      active: true
    },
    {
      id: '2',
      firstName: 'ТОО «ТехноПлюс»',
      lastName: '',
      phone: '+7 (701) 555-12-34',
      email: 'info@technoplus.kz',
      tags: ['Бизнес', 'Корпоративный', 'Оптовик'],
      type: 'business',
      totalTransactions: 89,
      totalAmount: 1250000,
      bonusBalance: 12500,
      bonusUsed: 8200,
      lastVisit: '1 день назад',
      createdAt: '10.01.2024',
      active: true
    },
    {
      id: '3',
      firstName: 'Мария',
      lastName: 'Иванова',
      phone: '+7 (707) 987-65-43',
      email: 'maria.ivanova@gmail.com',
      tags: ['Новый'],
      type: 'individual',
      totalTransactions: 3,
      totalAmount: 15600,
      bonusBalance: 156,
      bonusUsed: 0,
      lastVisit: '5 дней назад',
      createdAt: '28.12.2025',
      active: true
    },
    {
      id: '4',
      firstName: 'Дмитрий',
      lastName: 'Сидоров',
      phone: '+7 (702) 111-22-33',
      email: 'dmitry.s@yandex.ru',
      tags: ['Постоянный', 'Лояльный'],
      type: 'individual',
      totalTransactions: 45,
      totalAmount: 128900,
      bonusBalance: 890,
      bonusUsed: 2100,
      lastVisit: '3 дня назад',
      createdAt: '05.06.2024',
      active: true
    },
    {
      id: '5',
      firstName: 'ИП «Строй-Мастер»',
      lastName: '',
      phone: '+7 (700) 333-44-55',
      email: 'stroymaster@mail.ru',
      tags: ['Бизнес', 'Партнёр', 'Скидка 15%'],
      type: 'business',
      totalTransactions: 67,
      totalAmount: 890000,
      bonusBalance: 8900,
      bonusUsed: 5600,
      lastVisit: '1 неделю назад',
      createdAt: '20.02.2024',
      active: true
    },
    {
      id: '6',
      firstName: 'Анна',
      lastName: 'Козлова',
      phone: '+7 (778) 444-55-66',
      email: 'anna.k@inbox.ru',
      tags: ['VIP', 'Премиум', 'Скидка 20%'],
      type: 'individual',
      totalTransactions: 98,
      totalAmount: 567000,
      bonusBalance: 5670,
      bonusUsed: 3200,
      lastVisit: 'Сегодня',
      createdAt: '12.11.2023',
      active: true
    },
    {
      id: '7',
      firstName: 'Сергей',
      lastName: 'Николаев',
      phone: '+7 (705) 666-77-88',
      email: '',
      tags: ['Постоянный'],
      type: 'individual',
      totalTransactions: 28,
      totalAmount: 78500,
      bonusBalance: 450,
      bonusUsed: 800,
      lastVisit: '2 недели назад',
      createdAt: '08.08.2024',
      active: false
    },
    {
      id: '8',
      firstName: 'ТОО «АльфаТрейд»',
      lastName: '',
      phone: '+7 (727) 999-88-77',
      email: 'sales@alphatrade.kz',
      tags: ['Бизнес', 'Оптовик', 'Скидка 10%'],
      type: 'business',
      totalTransactions: 134,
      totalAmount: 2340000,
      bonusBalance: 23400,
      bonusUsed: 15600,
      lastVisit: 'Вчера',
      createdAt: '03.04.2023',
      active: true
    }
  ];

  filteredClients: Client[] = [];

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Клиенты', [
      { label: 'Главная', route: '/home' },
      { label: 'Клиенты' }
    ]);
    
    this.applyFilters();
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getClientsThisMonth(): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.clients.filter(c => {
      // Парсим дату из формата DD.MM.YYYY
      const dateParts = c.createdAt.split('.');
      if (dateParts.length !== 3) return false;
      
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // месяцы в JS начинаются с 0
      const year = parseInt(dateParts[2], 10);
      
      return month === currentMonth && year === currentYear;
    }).length;
  }

  getTotalRevenue(): number {
    return this.clients.reduce((sum, c) => sum + c.totalAmount, 0);
  }

  getTotalBonuses(): number {
    return this.clients.reduce((sum, c) => sum + c.bonusBalance, 0);
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

  parseLastVisitDate(lastVisit: string): Date | null {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    lastVisit = lastVisit.toLowerCase().trim();
    
    if (lastVisit === 'сегодня') {
      return today;
    }
    
    if (lastVisit === 'вчера') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
    
    // Парсим "X часа/часов назад"
    const hoursMatch = lastVisit.match(/(\d+)\s*(час|часа|часов)\s*назад/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1], 10);
      const visitDate = new Date(now);
      visitDate.setHours(visitDate.getHours() - hours);
      return visitDate;
    }
    
    // Парсим "X день/дня/дней назад"
    const daysMatch = lastVisit.match(/(\d+)\s*(день|дня|дней)\s*назад/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      const visitDate = new Date(today);
      visitDate.setDate(visitDate.getDate() - days);
      return visitDate;
    }
    
    // Парсим "X неделю/недели/недель назад"
    const weeksMatch = lastVisit.match(/(\d+)\s*(неделю|недели|недель)\s*назад/);
    if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1], 10);
      const visitDate = new Date(today);
      visitDate.setDate(visitDate.getDate() - (weeks * 7));
      return visitDate;
    }
    
    // Парсим "X месяц/месяца/месяцев назад"
    const monthsMatch = lastVisit.match(/(\d+)\s*(месяц|месяца|месяцев)\s*назад/);
    if (monthsMatch) {
      const months = parseInt(monthsMatch[1], 10);
      const visitDate = new Date(today);
      visitDate.setMonth(visitDate.getMonth() - months);
      return visitDate;
    }
    
    return null;
  }

  applyFilters(): void {
    let result = [...this.clients];

    // Filter by name
    if (this.searchName.trim()) {
      const search = this.searchName.toLowerCase();
      result = result.filter(c => 
        c.firstName.toLowerCase().includes(search) || 
        (c.lastName && c.lastName.toLowerCase().includes(search))
      );
    }

    // Filter by phone
    if (this.searchPhone.trim()) {
      const search = this.searchPhone.replace(/\D/g, '');
      result = result.filter(c => c.phone.replace(/\D/g, '').includes(search));
    }

    // Filter by email
    if (this.searchEmail.trim()) {
      const search = this.searchEmail.toLowerCase();
      result = result.filter(c => c.email && c.email.toLowerCase().includes(search));
    }

    // Filter by tags
    if (this.selectedTags.length > 0) {
      result = result.filter(c => 
        this.selectedTags.every(tag => c.tags.includes(tag))
      );
    }

    // Filter by type
    if (this.filterType !== 'all') {
      result = result.filter(c => c.type === this.filterType);
    }

    // Filter by date (last visit)
    if (this.dateFrom || this.dateTo) {
      result = result.filter(c => {
        const visitDate = this.parseLastVisitDate(c.lastVisit);
        if (!visitDate) return false;
        
        if (this.dateFrom) {
          const fromDate = new Date(this.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (visitDate < fromDate) return false;
        }
        
        if (this.dateTo) {
          const toDate = new Date(this.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (visitDate > toDate) return false;
        }
        
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      let compareValue = 0;
      
      switch (this.sortField) {
        case 'name':
          const nameA = `${a.firstName} ${a.lastName || ''}`.trim();
          const nameB = `${b.firstName} ${b.lastName || ''}`.trim();
          compareValue = nameA.localeCompare(nameB);
          break;
        case 'phone':
          compareValue = a.phone.localeCompare(b.phone);
          break;
        case 'totalAmount':
          compareValue = a.totalAmount - b.totalAmount;
          break;
        case 'bonusBalance':
          compareValue = a.bonusBalance - b.bonusBalance;
          break;
        case 'totalTransactions':
          compareValue = a.totalTransactions - b.totalTransactions;
          break;
        case 'lastVisit':
          compareValue = a.lastVisit.localeCompare(b.lastVisit);
          break;
        case 'createdAt':
          compareValue = a.createdAt.localeCompare(b.createdAt);
          break;
      }

      return this.sortDirection === 'asc' ? compareValue : -compareValue;
    });

    this.filteredClients = result;
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  setTypeFilter(type: 'all' | 'individual' | 'business'): void {
    this.filterType = type;
    this.applyFilters();
  }

  addTagFilter(tag: string): void {
    if (!this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
      this.applyFilters();
    }
    this.tagSearchInput = '';
    this.showTagDropdown = false;
  }

  removeTagFilter(index: number): void {
    this.selectedTags.splice(index, 1);
    this.applyFilters();
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
    this.applyFilters();
  }
}