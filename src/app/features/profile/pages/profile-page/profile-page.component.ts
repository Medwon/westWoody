import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { ClientsService, ClientDetails, UpdateClientRequest } from '../../../../core/services/clients.service';
import { PaymentsService, PaymentSearchResult } from '../../../../core/services/payments.service';
import { BonusesService, BonusHistoryItem } from '../../../../core/services/bonuses.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TransactionModalService } from '../../../../core/services/transaction-modal.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { RefundConfirmationModalComponent, Payment } from '../../../../shared/components/refund-confirmation-modal/refund-confirmation-modal.component';
import { PaginatedTableWrapperComponent } from '../../../../shared/components/paginated-table-wrapper/paginated-table-wrapper.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { NotFoundStateComponent } from '../../../../shared/components/not-found-state/not-found-state.component';
import { PaymentViewModalComponent } from '../../../../shared/components/payment-view-modal/payment-view-modal.component';
import { AdjustBonusModalComponent } from '../../../../shared/components/adjust-bonus-modal/adjust-bonus-modal.component';
import { InlineTagsComponent, TagsChangeEvent } from '../../../../shared/components/inline-tags/inline-tags.component';
import { SplitButtonComponent, SplitButtonItem } from '../../../../shared/components/split-button/split-button.component';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format.pipe';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  tags: string[];
  comment: string | null;
  type: 'individual' | 'business';
  dateOfBirth?: string | null;
}

interface PaymentItem {
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
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, IconButtonComponent, RefundConfirmationModalComponent, RouterModule, PaginatedTableWrapperComponent, LoaderComponent, NotFoundStateComponent, PaymentViewModalComponent, AdjustBonusModalComponent, InlineTagsComponent, SplitButtonComponent, PhoneFormatPipe],
  template: `
    <div class="page-wrapper">
      <div class="profile-container-wrapper">
        <!-- Loading State -->
        <div class="page-loading-container" *ngIf="isLoading">
          <app-loader [visible]="true" [overlay]="false" type="logo" size="large"></app-loader>
        </div>

        <!-- Not Found State -->
        <app-not-found-state
          *ngIf="!isLoading && clientNotFound"
          title="Клиент не найден"
          description="К сожалению, запрашиваемый клиент не существует или был удален."
          backLink="/clients"
          backText="Вернуться к клиентам">
        </app-not-found-state>

        <div class="profile-layout" *ngIf="client && !isLoading && !clientNotFound">
          <!-- Sidebar -->
          <div class="profile-sidebar">
            <!-- Back Button -->
            <a [routerLink]="['/clients']" class="back-link">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Клиенты</span>
            </a>

            <!-- Client Type Badge -->
            <div class="client-type-badge-sidebar" [class.business]="client.type === 'business'">
              <svg *ngIf="client.type === 'business'" viewBox="0 0 24 24" fill="none">
                <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <svg *ngIf="client.type === 'individual'" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              {{ client.type === 'business' ? 'Бизнес' : 'Индивидуальный' }}
            </div>

            <!-- Client Name -->
            <h1 class="client-name-sidebar">{{ getFullName() }}</h1>
            <p class="client-phone-sidebar">{{ client.phone | phoneFormat }}</p>

            <!-- Tags (inline, auto-save) -->
            <div class="tags-section-sidebar">
              <app-inline-tags
                [tags]="client.tags"
                [availableTags]="availableTags"
                label="Теги"
                (tagsChange)="onInlineTagsChange($event)">
              </app-inline-tags>
            </div>

            <!-- Primary client actions (split button) -->
            <div class="split-button-wrap">
              <app-split-button
                mainLabel="Создать платеж"
                [items]="splitButtonItems"
                (mainClick)="openCreatePayment()"
                (itemSelect)="onSplitButtonItemSelect($event)">
                <svg mainIcon viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </app-split-button>
            </div>

            <!-- Navigation Menu (scrollable, routable) -->
            <nav class="profile-nav profile-nav-scroll">
              <a 
                routerLink="/clients/{{ client.id }}/general"
                class="nav-item" 
                [class.active]="activeView === 'general'"
                routerLinkActive="active">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <span>Общее</span>
              </a>
              <a 
                routerLink="/clients/{{ client.id }}/wallet"
                class="nav-item" 
                [class.active]="activeView === 'wallet'"
                routerLinkActive="active">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M1 10h22" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <span>Кошелек</span>
                <span class="nav-badge nav-badge-soon">Скоро</span>
              </a>
              <a 
                routerLink="/clients/{{ client.id }}/bonus-details"
                class="nav-item" 
                [class.active]="activeView === 'bonus-details'"
                routerLinkActive="active">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <span>Детали бонусов</span>
              </a>
              <a 
                routerLink="/clients/{{ client.id }}/payment-details"
                class="nav-item" 
                [class.active]="activeView === 'payment-details'"
                routerLinkActive="active">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Детали платежей</span>
              </a>
              <a 
                routerLink="/clients/{{ client.id }}/audit-logs"
                class="nav-item" 
                [class.active]="activeView === 'audit-logs'"
                routerLinkActive="active">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <span>Журнал аудита</span>
                <span class="nav-badge nav-badge-soon">Скоро</span>
              </a>
            </nav>

            <button 
              class="nav-item delete-nav-item" 
              (click)="openDeleteModal()">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Удалить клиента</span>
            </button>
          </div>

          <!-- Main Content Area -->
          <div class="profile-content">
            <!-- General View -->
            <div class="view-content" *ngIf="activeView === 'general'">
              <!-- KPIs Section (on top) -->
              <div class="content-card">
                <div class="card-header">
                  <h3 class="card-title">Показатели</h3>
                </div>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-icon transactions">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ clientTotals.totalPayments }}</span>
                      <span class="stat-label">Транзакций</span>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon total-sum">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ formatAmount(clientTotals.totalRevenue) }} ₸</span>
                      <span class="stat-label">Общая сумма</span>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon bonuses-earned">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ formatAmount(clientTotals.totalBonusesGranted) }}</span>
                      <span class="stat-label">Бонусов начислено</span>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon bonuses-used">
                      <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M8 12l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ formatAmount(clientTotals.totalBonusesUsed) }}</span>
                      <span class="stat-label">Бонусов использовано</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Personal Data + Contact in one row -->
              <div class="details-grid details-grid-general">
                <div class="content-card">
                  <div class="card-header">
                    <h3 class="card-title">Личные данные</h3>
                    <button class="card-edit-btn" *ngIf="!isEditingPersonal" (click)="startEditPersonal()">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <div class="card-actions" *ngIf="isEditingPersonal">
                      <button class="save-btn" (click)="savePersonal()" [disabled]="isSavingPersonal">Сохранить</button>
                      <button class="cancel-btn" (click)="cancelEditPersonal()" [disabled]="isSavingPersonal">Отмена</button>
                    </div>
                  </div>
                  <div class="info-list">
                    <div class="info-row">
                      <span class="info-label">{{ ((!isEditingPersonal && client.type === 'business') || (isEditingPersonal && editedPersonal.type === 'business')) ? 'Название' : 'Имя' }}</span>
                      <span class="info-value" *ngIf="!isEditingPersonal">{{ client.firstName }}</span>
                      <input class="info-input" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.firstName">
                    </div>
                    <div class="info-row" *ngIf="((!isEditingPersonal && client.type !== 'business') || (isEditingPersonal && editedPersonal.type !== 'business'))">
                      <span class="info-label">Фамилия</span>
                      <span class="info-value" *ngIf="!isEditingPersonal">{{ client.lastName }}</span>
                      <input class="info-input" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.lastName">
                    </div>
                    <div class="info-row">
                      <span class="info-label">Дата рождения</span>
                      <span class="info-value" *ngIf="!isEditingPersonal">{{ client.dateOfBirth ? formatDate(client.dateOfBirth) : '—' }}</span>
                      <input class="info-input" *ngIf="isEditingPersonal" type="date" [(ngModel)]="editedPersonal.dateOfBirth">
                    </div>
                    <div class="info-row">
                      <span class="info-label">Тип клиента</span>
                      <span class="info-value" *ngIf="!isEditingPersonal">{{ client.type === 'business' ? 'Бизнес' : 'Индивидуальный' }}</span>
                      <select class="info-select" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.type">
                        <option value="individual">Индивидуальный</option>
                        <option value="business">Бизнес</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="content-card">
                  <div class="card-header">
                    <h3 class="card-title">Контакты</h3>
                    <button class="card-edit-btn" *ngIf="!isEditingContacts" (click)="startEditContacts()">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <div class="card-actions" *ngIf="isEditingContacts">
                      <button class="save-btn" (click)="saveContacts()" [disabled]="isSavingContacts">Сохранить</button>
                      <button class="cancel-btn" (click)="cancelEditContacts()" [disabled]="isSavingContacts">Отмена</button>
                    </div>
                  </div>
                  <div class="info-list">
                    <div class="info-row">
                      <span class="info-label">Телефон</span>
                      <span class="info-value" *ngIf="!isEditingContacts">{{ client.phone | phoneFormat }}</span>
                      <input class="info-input" *ngIf="isEditingContacts" [(ngModel)]="editedContacts.phone" type="tel">
                    </div>
                    <div class="info-row">
                      <span class="info-label">Email</span>
                      <span class="info-value email" *ngIf="!isEditingContacts">{{ client.email || '—' }}</span>
                      <input class="info-input" *ngIf="isEditingContacts" [(ngModel)]="editedContacts.email" type="email" [disabled]="true" placeholder="Email недоступен для редактирования">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Comment Section (below) -->
              <div class="content-card">
                <div class="card-header">
                  <h3 class="card-title">Комментарий</h3>
                  <button class="card-edit-btn" *ngIf="!isEditingComment" (click)="startEditComment()">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <div class="card-actions" *ngIf="isEditingComment">
                    <button class="save-btn" (click)="saveComment()" [disabled]="isSavingComment">Сохранить</button>
                    <button class="cancel-btn" (click)="cancelEditComment()" [disabled]="isSavingComment">Отмена</button>
                  </div>
                </div>
                <div class="comment-body">
                  <p *ngIf="!isEditingComment" class="comment-text">{{ client.comment || 'Нет комментария' }}</p>
                  <textarea 
                    *ngIf="isEditingComment" 
                    [(ngModel)]="editedComment" 
                    class="comment-textarea"
                    placeholder="Введите комментарий о клиенте..."
                    rows="3"></textarea>
                </div>
              </div>
            </div>

            <!-- Wallet View (Coming Soon) -->
            <div class="view-content" *ngIf="activeView === 'wallet'">
              <div class="coming-soon-card">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M1 10h22" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <h2>Скоро</h2>
                <p>Раздел "Кошелек" находится в разработке</p>
              </div>
            </div>

            <!-- Bonus Details View -->
            <div class="view-content" *ngIf="activeView === 'bonus-details'">
              <div class="content-card bonuses-details-card">
                <div class="card-header bonuses-card-header">
                  <div class="card-header-left">
                    <div class="card-icon">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div class="card-title-section">
                      <h3 class="card-title">Детали бонусов</h3>
                      <div class="bonuses-stats">
                        <div class="stat-item">
                          <span class="stat-label">Осталось:</span>
                          <span class="stat-value active">{{ formatAmount(bonusBalance) }} ₸</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">Использовано:</span>
                          <span class="stat-value used">{{ formatAmount(getUsedBonusesTotal()) }} ₸</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">Сгорело:</span>
                          <span class="stat-value expired">{{ formatAmount(getExpiredBonusesTotal()) }} ₸</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bonuses-content">
                  <app-paginated-table-wrapper
                    [paginationEnabled]="true"
                    [data]="bonusesDetails"
                    [defaultPageSize]="10"
                    paginationKey="bonuses"
                    #paginatedBonuses>
                    <div class="table-container" *ngIf="bonusesDetails.length > 0">
                      <table class="bonuses-table">
                        <thead>
                          <tr>
                            <th>Тип бонуса</th>
                            <th>Сумма начисления</th>
                            <th>Остаток бонуса</th>
                            <th>Начислено</th>
                            <th>Истекает</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          <ng-container *ngFor="let bonus of paginatedBonuses.paginatedData">
                          <tr
                              [class.expired]="getDaysUntilExpiry(bonus.expiresAt) <= 0 && !bonus.used && bonus.type !== 'refund' && bonus.type !== 'manual_revoke'"
                              [class.expiring-soon]="getDaysUntilExpiry(bonus.expiresAt) <= 7 && getDaysUntilExpiry(bonus.expiresAt) > 0"
                              [class.used]="bonus.used"
                              [class.refund]="bonus.type === 'refund'"
                              [class.manual-revoke]="bonus.type === 'manual_revoke'">
                            <td>
                              <span class="bonus-type-badge" [class]="'bonus-type-' + bonus.type">
                                {{ getBonusTypeLabel(bonus.type) }}
                              </span>
                            </td>
                            <td>
                              <div class="bonus-info">
                                <app-badge
                                  *ngIf="bonus.used"
                                  badgeType="bonusUsed"
                                  size="medium"
                                  icon="check"
                                  class="bonus-badge">
                                  -{{ formatAmount(bonus.amount) }}
                                </app-badge>
                                <app-badge
                                  *ngIf="bonus.type === 'refund'"
                                  badgeType="refund"
                                  size="medium"
                                  icon="refund"
                                  class="bonus-badge">
                                  {{ formatAmount(bonus.amount) }}
                                </app-badge>
                                <app-badge
                                  *ngIf="bonus.type === 'manual_revoke'"
                                  badgeType="refund"
                                  size="medium"
                                  icon="refund"
                                  class="bonus-badge">
                                  -{{ formatAmount(bonus.amount) }} ₸
                                </app-badge>
                                <app-badge
                                  *ngIf="bonus.type !== 'refund' && bonus.type !== 'manual_revoke' && !bonus.used && getDaysUntilExpiry(bonus.expiresAt) <= 0"
                                  badgeType="bonusExpired"
                                  size="medium"
                                  icon="expired"
                                  class="bonus-badge">
                                  {{ formatAmount(bonus.originalAmount ?? bonus.amount) }}
                                </app-badge>
                                <app-badge
                                  *ngIf="bonus.type !== 'refund' && bonus.type !== 'manual_revoke' && !bonus.used && getDaysUntilExpiry(bonus.expiresAt) > 0"
                                  badgeType="bonusGranted"
                                  size="medium"
                                  icon="star"
                                  class="bonus-badge">
                                  +{{ formatAmount(bonus.originalAmount ?? bonus.amount) }}
                                </app-badge>
                              </div>
                            </td>
                            <td>
                              <div class="bonus-remaining-badges">
                                <span *ngIf="bonus.type === 'manual_revoke'" class="bonus-empty-cell">—</span>
                                <app-badge
                                  *ngIf="bonus.used"
                                  badgeType="bonusUsed"
                                  size="medium"
                                  icon="used">
                                  Использовано
                                </app-badge>
                                <app-badge
                                  *ngIf="bonus.type === 'refund'"
                                  badgeType="refund"
                                  size="medium"
                                  icon="refund">
                                  Отозвано
                                </app-badge>
                                <app-badge
                                  *ngIf="bonus.type !== 'refund' && bonus.type !== 'manual_revoke' && !bonus.used && bonus.remainingAmount != null"
                                  [badgeType]="getDaysUntilExpiry(bonus.expiresAt) <= 0 ? 'bonusExpired' : (getDaysUntilExpiry(bonus.expiresAt) <= 7 ? 'warning' : 'success')"
                                  size="medium">
                                  {{ formatAmount(bonus.remainingAmount) }}{{ bonus.originalAmount != null ? ' из ' + formatAmount(bonus.originalAmount) : '' }} ₸
                                </app-badge>
                                <app-badge
                                  *ngIf="bonus.type !== 'refund' && bonus.type !== 'manual_revoke' && !bonus.used && bonus.remainingAmount == null && getDaysUntilExpiry(bonus.expiresAt) <= 0"
                                  badgeType="bonusExpired"
                                  size="medium"
                                  icon="expired">
                                  Истек
                                </app-badge>
                              </div>
                            </td>
                            <td>
                              <span class="bonus-date">{{ (bonus.used || bonus.type === 'refund' || bonus.type === 'manual_revoke') ? '—' : formatDate(bonus.issuedAt) }}</span>
                            </td>
                            <td>
                              <span *ngIf="!(bonus.used || bonus.type === 'refund' || bonus.type === 'manual_revoke')" class="bonus-expiry-cell">
                                <span class="bonus-expiry-date">{{ formatDate(bonus.expiresAt) }}</span>
                                <app-badge
                                  *ngIf="getDaysUntilExpiry(bonus.expiresAt) > 0"
                                  [badgeType]="getDaysUntilExpiry(bonus.expiresAt) <= 7 ? 'warning' : 'success'"
                                  size="medium"
                                  class="expires-in-badge">
                                  {{ getDaysUntilExpiry(bonus.expiresAt) }} {{ getDaysText(getDaysUntilExpiry(bonus.expiresAt)) }}
                                </app-badge>
                              </span>
                              <span *ngIf="bonus.used || bonus.type === 'refund' || bonus.type === 'manual_revoke'" class="bonus-empty-cell">—</span>
                            </td>
                            <td>
                              <div class="actions-cell">
                                <app-icon-button
                                  iconButtonType="ghost"
                                  size="medium"
                                  class="view-svg-btn"
                                  [tooltip]="isBonusRowExpanded(bonus.id) ? 'Скрыть детали' : 'Показать детали'"
                                  (onClick)="toggleBonusRow(bonus.id)">
                                  <svg [class.rotated]="isBonusRowExpanded(bonus.id)" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </app-icon-button>
                              </div>
                            </td>
                          </tr>
                          <tr *ngIf="isBonusRowExpanded(bonus.id)" class="bonus-details-row">
                            <td colspan="6" class="bonus-details-cell">
                              <div class="bonus-details-content">
                                <div class="bonus-details-grid">
                                  <div class="refund-reason-section">
                                    <span class="refund-reason-label">Причина возврата:</span>
                                    <div class="refund-reason-text" *ngIf="bonus.refundReason">
                                      {{ bonus.refundReason }}
                                    </div>
                                    <div class="refund-reason-empty" *ngIf="!bonus.refundReason">
                                      Причина не указана
                                    </div>
                                  </div>
                                  <div class="bonus-initiated-by-section">
                                    <span class="refund-reason-label">Инициатор:</span>
                                    <a *ngIf="bonus.initiatedBy && bonus.initiatedById" 
                                       [routerLink]="['/users', bonus.initiatedById]" 
                                       class="bonus-initiated-by-link">
                                      {{ bonus.initiatedBy === 'SYSTEM' ? 'Система' : bonus.initiatedBy }}
                                    </a>
                                    <div class="bonus-initiated-by-text" *ngIf="bonus.initiatedBy && !bonus.initiatedById">
                                      {{ bonus.initiatedBy === 'SYSTEM' ? 'Система' : bonus.initiatedBy }}
                                    </div>
                                    <div class="bonus-initiated-by-empty" *ngIf="!bonus.initiatedBy">
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
                    <div class="empty-state" *ngIf="bonusesDetails.length === 0">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span>Нет активных бонусов</span>
                    </div>
                  </app-paginated-table-wrapper>
                </div>
              </div>
            </div>

            <!-- Payment Details View -->
            <div class="view-content" *ngIf="activeView === 'payment-details'">
              <div class="content-card payments-card">
                <div class="card-header">
                  <div class="card-header-left">
                    <div class="card-icon">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <h3 class="card-title">История платежей</h3>
                  </div>
                  <span class="payments-count">{{ payments.length }} платежей</span>
                </div>

                <!-- Payments Table with Pagination -->
                <app-paginated-table-wrapper
                  [paginationEnabled]="true"
                  [data]="payments"
                  [defaultPageSize]="15"
                  paginationKey="payments"
                  #paginatedTable>
                  
                  <div class="table-container">
                    <table class="payments-table">
                      <thead>
                        <tr>
                          <th class="th-id">ID платежа</th>
                          <th class="th-amount">Сумма</th>
                          <th class="th-bonuses">Бонусы</th>
                          <th class="th-method">Способ оплаты</th>
                          <th class="th-status">Статус</th>
                          <th class="th-date">Дата и время</th>
                          <th class="th-actions">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let payment of paginatedTable.paginatedData" class="payment-row">
                        <td class="td-id">
                          <span class="payment-id clickable" (click)="openPaymentView(payment.id)">{{ payment.id }}</span>
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
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div class="empty-state" *ngIf="payments.length === 0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.5"/>
                      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <span>Платежи не найдены</span>
                  </div>
                </div>
                </app-paginated-table-wrapper>
              </div>
            </div>

            <!-- Audit Logs View (Coming Soon) -->
            <div class="view-content" *ngIf="activeView === 'audit-logs'">
              <div class="coming-soon-card">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <h2>Скоро</h2>
                <p>Раздел "Журнал аудита" находится в разработке</p>
              </div>
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
      (confirm)="confirmRefund($event.refundReason || '')">
    </app-refund-confirmation-modal>

    <!-- Adjust Bonus Modal -->
    <app-adjust-bonus-modal
      [visible]="showAdjustBonusModal"
      [clientId]="client?.id ?? null"
      [bonusBalance]="bonusBalance"
      (visibleChange)="showAdjustBonusModal = $event"
      (bonusAdjusted)="onBonusAdjusted()">
    </app-adjust-bonus-modal>

    <!-- Payment View Modal -->
    <app-payment-view-modal
      [visible]="showPaymentViewModal"
      [paymentTxId]="selectedPaymentTxId"
      [paymentSearchResult]="selectedPaymentSearchResult"
      (visibleChange)="showPaymentViewModal = $event"
      (paymentUpdated)="onPaymentUpdated()">
    </app-payment-view-modal>

    <!-- Delete Client Confirmation Modal -->
    <div class="delete-modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
      <div class="delete-modal" (click)="$event.stopPropagation()">
        <!-- Step 1: Initial confirmation -->
        <div class="delete-modal-content" *ngIf="deleteStep === 1">
          <div class="delete-modal-icon warning">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="delete-modal-title">Удалить клиента?</h3>
          <p class="delete-modal-description">
            Вы уверены, что хотите удалить клиента <strong>{{ getFullName() }}</strong>?<br>
            Это действие нельзя отменить. Все данные клиента, включая историю платежей и бонусов, будут удалены.
          </p>
          <div class="delete-modal-actions">
            <button class="delete-modal-btn cancel" (click)="closeDeleteModal()">Отмена</button>
            <button class="delete-modal-btn confirm" (click)="proceedToDeleteStep2()">Да, удалить</button>
          </div>
        </div>

        <!-- Step 2: Type confirmation word -->
        <div class="delete-modal-content" *ngIf="deleteStep === 2">
          <div class="delete-modal-icon danger">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="delete-modal-title">Подтвердите удаление</h3>
          <p class="delete-modal-description">
            Для подтверждения удаления введите слово <strong class="confirm-word">удалить</strong>
          </p>
          <input 
            type="text" 
            class="delete-confirm-input"
            [(ngModel)]="deleteConfirmationWord"
            placeholder="Введите слово для подтверждения"
            (keydown.enter)="confirmDelete()">
          <div class="delete-modal-actions">
            <button class="delete-modal-btn cancel" (click)="closeDeleteModal()">Отмена</button>
            <button 
              class="delete-modal-btn delete" 
              [disabled]="deleteConfirmationWord !== 'удалить' || isDeletingClient"
              (click)="confirmDelete()">
              <span *ngIf="!isDeletingClient">Удалить навсегда</span>
              <span *ngIf="isDeletingClient">Удаление...</span>
            </button>
          </div>
        </div>
      </div>
    </div>

  `,
  styles: [`
    

    .profile-container-wrapper {
      position: relative;
      min-height: 400px;
    }

    .profile-layout {
      display: flex;
      gap: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Sidebar Styles */
    .profile-sidebar {
      width: 280px;
      flex-shrink: 0;
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      max-height: calc(100vh - 4rem);
      position: sticky;
      top: 2rem;
      display: flex;
      flex-direction: column;
      z-index: 20;
      isolation: isolate;
    }

    .profile-nav-scroll {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .back-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      text-decoration: none;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .back-link:hover {
      background: #f1f5f9;
      color: #1f2937;
    }

    .back-link svg {
      width: 18px;
      height: 18px;
    }

    .client-type-badge-sidebar {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      background: #f0fdf4;
      color: #16A34A;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .client-type-badge-sidebar.business {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .client-type-badge-sidebar svg {
      width: 16px;
      height: 16px;
    }

    .client-name-sidebar {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.25rem 0;
      line-height: 1.3;
    }

    .client-phone-sidebar {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0 0 1rem 0;
      line-height: 1.3;
    }

    .tags-section-sidebar {
      margin-bottom: 1.5rem;
    }

    .tags-section-sidebar .inline-tags {
      --tag-transition: 0.12s ease;
    }

    .client-tag-sidebar {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.65rem;
      background: #dcfce7;
      color: #16A34A;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .no-tags {
      color: #94a3b8;
      font-size: 0.85rem;
      font-style: italic;
    }

    .split-button-wrap {
      margin-bottom: 1.5rem;
    }

    .profile-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .profile-nav a.nav-item {
      text-decoration: none;
      box-sizing: border-box;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      border-radius: 10px;
      color: #64748b;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .nav-item:hover {
      background: #f1f5f9;
      color: #1f2937;
    }

    .nav-item.active {
      background: #f0fdf4;
      color: #16A34A;
      font-weight: 600;
    }

    .nav-item.delete-nav-item {
      color: #dc2626;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .nav-item.delete-nav-item:hover {
      background: #fef2f2;
      color: #b91c1c;
    }

    .nav-item svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .nav-badge {
      margin-left: auto;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }

    .nav-badge-soon {
      background: #fef08a;
      color: #854d0e;
    }

    /* Content Area Styles */
    .profile-content {
      flex: 1;
      min-width: 0;
    }

    .view-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .details-grid-general {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .content-card {
      position: relative;
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .coming-soon-card {
      background: white;
      border-radius: 16px;
      padding: 4rem 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .coming-soon-card svg {
      width: 64px;
      height: 64px;
      color: #94a3b8;
    }

    .coming-soon-card h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .coming-soon-card p {
      font-size: 1rem;
      color: #64748b;
      margin: 0;
    }

    /* Sidebar responsive: stack on smaller screens */
    @media (max-width: 1024px) {
      .profile-layout {
        flex-direction: column;
        gap: 1.5rem;
      }

      .profile-sidebar {
        width: 100%;
        position: static;
      }
    }

    @media (max-width: 768px) {
      .profile-sidebar {
        padding: 1rem;
        max-height: none;
      }

      .profile-nav-scroll {
        overflow: visible;
        max-height: none;
      }

      .profile-nav {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .nav-item {
        padding: 0.5rem 0.75rem;
        font-size: 0.85rem;
      }

      .nav-item.delete-nav-item {
        width: 100%;
        margin-top: 0.5rem;
        padding-top: 0.75rem;
      }
    }

    .tags-container-content {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      width: 100%;
    }

    /* Profile Header Card */
    .profile-header-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      margin-bottom: 1rem;
      position: relative;
    }

    .profile-header-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem 2rem;
    }

    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .avatar-large {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #16A34A, #22c55e);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .status-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #94a3b8;
      border: 2px solid white;
    }

    .status-indicator.active {
      background: #22c55e;
    }

    .profile-main-info {
      flex: 1;
      min-width: 0;
      position: relative;
    }

    /* Delete Client Button */
    .delete-client-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #dc2626;
      transition: all 0.2s ease;
      z-index: 10;
    }

    .delete-client-btn:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #b91c1c;
    }

    .delete-client-btn svg {
      width: 18px;
      height: 18px;
    }

    .name-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .profile-name {
      font-size: 1.35rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .client-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.6rem;
      background: #f0fdf4;
      color: #16A34A;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .client-type-badge.business {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .client-type-badge svg {
      width: 14px;
      height: 14px;
    }

    .profile-phone {
      font-size: 0.9rem;
      color: #6b7280;
      margin: 0 0 0.75rem;
    }

    .tags-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .tags-container {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .client-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.75rem;
      background: #dcfce7;
      color: #16A34A;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .remove-tag-btn {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: #16A34A;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      transition: all 0.15s;
    }

    .remove-tag-btn:hover {
      background: rgba(21, 128, 61, 0.2);
    }

    .remove-tag-btn svg {
      width: 10px;
      height: 10px;
    }

    .add-tag-wrapper {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .add-tag-input {
      padding: 0.35rem 0.75rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 20px;
      font-size: 0.8rem;
      width: 110px;
      outline: none;
      background: linear-gradient(to bottom, #ffffff, #f8fafc);
      color: #374151;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .add-tag-input:hover {
      border-color: #cbd5e1;
    }

    .add-tag-input:focus {
      border-color: #22c55e;
      background: white;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }

    .add-tag-input::placeholder {
      color: #94a3b8;
      font-weight: 400;
    }

    .add-tag-confirm-btn {
      background: #16A34A;
      border: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
    }

    .add-tag-confirm-btn svg {
      width: 12px;
      height: 12px;
    }

    .edit-tags-btn {
      background: #f0fdf4;
      border: 1px dashed #16A34A;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #16A34A;
      transition: all 0.15s;
    }

    .edit-tags-btn:hover {
      background: #dcfce7;
    }

    .edit-tags-btn svg {
      width: 14px;
      height: 14px;
    }

    .tags-actions {
      display: flex;
      gap: 0.35rem;
    }

    .save-tags-btn, .cancel-tags-btn {
      background: none;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .save-tags-btn {
      background: #16A34A;
      color: white;
    }

    .save-tags-btn:hover {
      background: #14532d;
    }

    .cancel-tags-btn {
      background: #f3f4f6;
      color: #6b7280;
    }

    .cancel-tags-btn:hover {
      background: #e5e7eb;
    }

    .save-tags-btn svg, .cancel-tags-btn svg {
      width: 14px;
      height: 14px;
    }

    /* Tags Dropdown */
    .tags-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 500px;
      margin-top: 6px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      z-index: 100;
      animation: dropdownFadeIn 0.15s ease;
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .tags-dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
    }

    .tags-dropdown-close {
      background: none;
      border: none;
      font-size: 1rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.15s;
    }

    .tags-dropdown-close:hover {
      color: #ef4444;
      background: #fef2f2;
    }

    .tags-dropdown-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px;
      max-height: 80px;
      overflow-y: auto;
    }

    .tag-option {
      padding: 0.25rem 0.6rem;
      background: #dcfce7;
      border: 1px solid #bbf7d0;
      color: #16A34A;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tag-option:hover {
      background: #bbf7d0;
      border-color: #22c55e;
    }

    .tags-row {
      position: relative;
    }

    /* Comment Card */
    .comment-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
      padding: 1.25rem 1.5rem;
    }

    .comment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .comment-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
    }

    .comment-title svg {
      width: 18px;
      height: 18px;
      color: #16A34A;
    }

    .edit-comment-btn {
      background: none;
      border: none;
      padding: 0.4rem;
      cursor: pointer;
      color: #6b7280;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .edit-comment-btn:hover {
      background: #f3f4f6;
      color: #16A34A;
    }

    .edit-comment-btn svg {
      width: 16px;
      height: 16px;
    }

    .comment-actions, .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .save-btn, .cancel-btn {
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
    }

    .save-btn {
      background: #16A34A;
      color: white;
    }

    .save-btn:hover {
      background: #14532d;
    }

    .cancel-btn {
      background: #f3f4f6;
      color: #6b7280;
    }

    .cancel-btn:hover {
      background: #e5e7eb;
    }

    .comment-text {
      font-size: 0.9rem;
      color: #4b5563;
      margin: 0;
      line-height: 1.5;
    }

    .comment-textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.9rem;
      font-family: inherit;
      resize: vertical;
      min-height: 80px;
      background: linear-gradient(to bottom, #ffffff, #f8fafc);
      color: #374151;
      line-height: 1.6;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .comment-textarea:hover {
      border-color: #cbd5e1;
      background: linear-gradient(to bottom, #ffffff, #f1f5f9);
    }

    .comment-textarea:focus {
      outline: none;
      border-color: #22c55e;
      background: white;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .comment-textarea::placeholder {
      color: #94a3b8;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon svg {
      width: 22px;
      height: 22px;
    }

    .stat-icon.transactions {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      color: #16A34A;
    }

    .stat-icon.total-sum {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      color: #1d4ed8;
    }

    .stat-icon.bonuses-earned {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #d97706;
    }

    .stat-icon.bonuses-used {
      background: linear-gradient(135deg, #fce7f3, #fbcfe8);
      color: #db2777;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #64748b;
    }

    /* Bonuses Details Card (same padding/margins as payments card) */
    .bonuses-details-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .bonuses-details-card .bonuses-card-header {
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .bonuses-details-card .bonuses-card-header .card-header-left {
      flex: 1;
    }

    .bonuses-content {
      padding: 0;
    }
    .card-title-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .bonuses-stats {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: #64748b;
      font-weight: 500;
    }

    .stat-value {
      font-size: 0.875rem;
      font-weight: 700;
    }

    .collapse-btn {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #64748b;
      border-radius: 8px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .collapse-btn:hover {
      background: #f1f5f9;
      color: #1f2937;
    }

    .collapse-btn svg {
      width: 20px;
      height: 20px;
      transition: transform 0.2s ease;
    }

    .collapse-btn.collapsed svg {
      transform: rotate(-90deg);
    }

    .bonuses-content .table-container {
      overflow-x: auto;
    }

    .bonuses-table {
      width: 100%;
      border-collapse: collapse;
    }

    .bonuses-table thead {
      background: #f8fafc;
    }

    .bonuses-table th {
      padding: 0.875rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e5e7eb;
    }

    .bonuses-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .bonuses-table th:last-child,
    .bonuses-table td:last-child {
      width: 80px;
      text-align: center;
    }

    .bonuses-table tbody tr {
      transition: background 0.15s;
    }

    .bonuses-table tbody tr:hover {
      background: #f8fafc;
    }

    .bonuses-table tbody tr.expired {
      background: transparent;
    }

    .bonuses-table tbody tr.expired:hover {
      background: transparent;
    }

    .bonuses-table tbody tr.expiring-soon {
      background: transparent;
    }

    .bonuses-table tbody tr.expiring-soon:hover {
      background: transparent;
    }

    .bonuses-table tbody tr.used {
      background: transparent;
      opacity: 1;
    }

    .bonuses-table tbody tr.refund {
      background: transparent;
    }

    .bonuses-table tbody tr.refund:hover {
      background: transparent;
    }

    .bonuses-table tbody tr.manual-revoke {
      background: transparent;
    }

    .bonuses-table tbody tr.manual-revoke:hover {
      background: transparent;
    }

    .manual-revoke-audit,
    .remaining-amount {
      font-size: 0.875rem;
      color: #475569;
    }

    .bonus-expiry-cell {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      align-items: flex-start;
    }

    .bonus-expiry-cell .expires-in-badge {
      flex-shrink: 0;
    }

    .bonus-empty-cell {
      color: #94a3b8;
    }

    .bonus-remaining-badges {
      display: flex;
      align-items: center;
    }

    .bonuses-table tbody tr:last-child td {
      border-bottom: none;
    }

    .bonuses-table tbody tr.bonus-details-row {
      background: transparent;
    }

    .bonuses-table tbody tr.bonus-details-row td {
      border-top: none;
      padding: 0;
    }

    .bonus-details-cell {
      padding: 0 !important;
      background: transparent;
    }

    .bonus-details-content {
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

    .bonus-details-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2rem;
    }

    .refund-reason-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-align: left;
    }

    .bonus-initiated-by-section {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-align: right;
      min-width: 200px;
    }

    .refund-reason-label {
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

    .bonus-initiated-by-link {
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

    .bonus-initiated-by-link:hover {
      color: #16A34A;
    }

    .bonus-initiated-by-text {
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

    .bonus-initiated-by-empty {
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

    .bonus-type-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }

    .bonus-type-badge.bonus-type-welcome {
      // color: #1e40af;
      color: #1f2937;
    }

    .bonus-type-badge.bonus-type-referral {
      // color: #92400e;
      color: #1f2937;

    }

    .bonus-type-badge.bonus-type-purchase {
      // color: #15803d;
      color: #1f2937;
    }

    .bonus-type-badge.bonus-type-promotion {
      // color: #be185d;
      color: #1f2937;
    }

    .bonus-type-badge.bonus-type-loyalty {
      // color: #3730a3;
      color: #1f2937;
    }

    .bonus-type-badge.bonus-type-refund {
    // color: #dc2626;
      color: #1f2937;
    }

    .bonus-amount {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #fbbf24;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bonus-amount.expired-amount {
      color: #94a3b8;
      text-decoration: line-through;
    }

    .bonus-date,
    .bonus-expiry-date {
      font-size: 0.875rem;
      color: #1f2937;
      font-weight: 500;
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .details-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .card-header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #16A34A;
    }

    .card-icon svg {
      width: 20px;
      height: 20px;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .card-edit-btn {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #6b7280;
      border-radius: 8px;
      transition: all 0.15s;
    }

    .card-edit-btn:hover {
      background: #f3f4f6;
      color: #16A34A;
    }

    .card-edit-btn svg {
      width: 18px;
      height: 18px;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-label {
      font-size: 0.9rem;
      color: #64748b;
    }

    .info-value {
      font-size: 0.95rem;
      font-weight: 500;
      color: #1f2937;
    }

    .info-value.email {
      color: #16A34A;
    }

    .info-input {
      padding: 0.625rem 1rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: inherit;
      text-align: right;
      width: 200px;
      background: linear-gradient(to bottom, #ffffff, #f8fafc);
      color: #1f2937;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .info-input:hover {
      border-color: #cbd5e1;
      background: linear-gradient(to bottom, #ffffff, #f1f5f9);
    }

    .info-input:focus {
      outline: none;
      border-color: #22c55e;
      background: white;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .info-input::placeholder {
      color: #94a3b8;
      font-weight: 400;
    }

    .info-input:disabled {
      background: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .info-input:disabled:hover {
      border-color: #e2e8f0;
      background: #f1f5f9;
    }

    .info-select {
      padding: 0.625rem 2.5rem 0.625rem 1rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: inherit;
      width: 200px;
      background: linear-gradient(to bottom, #ffffff, #f8fafc);
      color: #1f2937;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2315803d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 16px;
    }

    .info-select:hover {
      border-color: #22c55e;
      background-color: #f0fdf4;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2315803d' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    }

    .info-select:focus {
      outline: none;
      border-color: #22c55e;
      background-color: white;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .info-select option {
      padding: 0.75rem 1rem;
      background: white;
      color: #1f2937;
      font-weight: 500;
    }

    .info-select option:hover,
    .info-select option:checked {
      background: linear-gradient(to right, #f0fdf4, #dcfce7);
      color: #16A34A;
    }

    /* Payments Card */
    .payments-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .payments-card .card-header {
      margin-bottom: 1rem;
    }

    .payments-count {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Table */
    .table-container {
      overflow-x: auto;
    }

    .payments-table {
      width: 100%;
      border-collapse: collapse;
    }

    .payments-table th {
      padding: 0.875rem 1rem;
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
      padding: 0.875rem 1rem;
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

    .payment-id.clickable {
      cursor: pointer;
      text-decoration: underline;
      transition: color 0.15s ease;
    }

    .payment-id.clickable:hover {
      color: #475569;
    }

    /* Client */
    .td-client {
      min-width: 200px;
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
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #16A34A;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .client-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .client-name-link {
      text-decoration: none;
      color: #1f2937;
      font-weight: 600;
      font-size: 0.9375rem;
      transition: color 0.2s;
      cursor: pointer;
      display: inline-block;
    }

    .client-name-link:hover {
      color: #16A34A;
    }

    .client-phone {
      font-size: 0.8125rem;
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
    .th-actions,
    .td-actions {
      width: 60px;
      text-align: center;
    }

    .actions-cell {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      color: #94a3b8;
    }

    .empty-state svg {
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
    }

    .empty-state span {
      font-size: 0.9rem;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-wrapper {
        margin: -1rem;
        padding: 1rem;
      }

      .profile-header-card {
        border-radius: 12px;
        margin-bottom: 1rem;
      }

      .profile-header-content {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 1.5rem 1rem;
        position: relative;
      }

      .avatar-wrapper {
        margin-bottom: 0.5rem;
      }

      .avatar-large {
        width: 80px;
        height: 80px;
        font-size: 1.5rem;
      }

      .profile-main-info {
        width: 100%;
        padding-right: 0;
        padding-top: 0.5rem;
      }

      /* Delete button already positioned at top right */
      .delete-client-btn {
        top: 1rem;
        right: 1rem;
      }

      .name-row {
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding-right: 0;
        margin-top: 0.5rem;
      }

      .profile-name {
        font-size: 1.25rem;
        word-break: break-word;
        padding-right: 0;
      }

      .profile-phone {
        font-size: 0.9rem;
        margin: 0.5rem 0;
      }

      .tags-row {
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }

      .tags-container {
        justify-content: center;
        width: 100%;
      }

      .comment-card,
      .details-card {
        border-radius: 12px;
        padding: 1.25rem 1rem;
      }

      .card-header {
        margin-bottom: 1rem;
      }

      .card-title {
        font-size: 1.125rem;
      }

      .info-list .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.75rem 0;
      }

      .info-label {
        min-width: auto;
        font-size: 0.875rem;
      }

      .info-value {
        font-size: 0.875rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .details-grid,
      .details-grid-general {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      /* Hide desktop tables on mobile */
      .bonuses-table,
      .payments-table {
        display: none;
      }

      /* Show mobile card views */
      .mobile-bonuses-cards,
      .mobile-payments-cards {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
    }

    /* Hide mobile cards on desktop */
    @media (min-width: 769px) {
      .mobile-bonuses-cards,
      .mobile-payments-cards {
        display: none;
      }
    }

    /* Mobile Bonus Card - styles for when visible on mobile */
    .mobile-bonuses-cards {
      display: none; /* Hidden by default, shown via media query */
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }

    .mobile-bonus-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      width: 100%;
    }

    .mobile-bonus-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }

    .mobile-bonus-card-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .mobile-bonus-type {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }

    .mobile-bonus-amount {
      font-size: 1rem;
      font-weight: 700;
      color: #d97706;
    }

    .mobile-bonus-expand {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: transform 0.2s;
    }

    .mobile-bonus-expand.expanded {
      transform: rotate(180deg);
    }

    .mobile-bonus-details {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;
      display: none;
    }

    .mobile-bonus-details.expanded {
      display: block;
    }

    .mobile-bonus-detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .mobile-bonus-detail-label {
      color: #64748b;
    }

    .mobile-bonus-detail-value {
      color: #1f2937;
      font-weight: 500;
    }

    /* Mobile Payment Card */
    .mobile-payment-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .mobile-payment-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }

    .mobile-payment-card-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .mobile-payment-id {
      font-family: monospace;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
    }

    .mobile-payment-amount {
      font-size: 1rem;
      font-weight: 700;
      color: #16A34A;
    }

    .mobile-payment-expand {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: transform 0.2s;
    }

    .mobile-payment-expand.expanded {
      transform: rotate(180deg);
    }

    .mobile-payment-details {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;
      display: none;
    }

    .mobile-payment-details.expanded {
      display: block;
    }

    .mobile-payment-detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .mobile-payment-detail-label {
      color: #64748b;
    }

    .mobile-payment-detail-value {
      color: #1f2937;
      font-weight: 500;
    }

    .mobile-refund-btn {
      width: 100%;
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      transition: all 0.2s;
    }

    .mobile-refund-btn:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }

    .mobile-refund-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Delete Modal Styles */
    .delete-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .delete-modal {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      max-width: 420px;
      width: 90%;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .delete-modal-content {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .delete-modal-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .delete-modal-icon.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .delete-modal-icon.danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .delete-modal-icon svg {
      width: 32px;
      height: 32px;
    }

    .delete-modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.75rem;
    }

    .delete-modal-description {
      font-size: 0.9rem;
      color: #6b7280;
      line-height: 1.6;
      margin: 0 0 1.5rem;
    }

    .delete-modal-description strong {
      color: #1f2937;
    }

    .confirm-word {
      color: #dc2626;
      background: #fee2e2;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.95rem;
    }

    .delete-confirm-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 1rem;
      font-family: inherit;
      text-align: center;
      margin-bottom: 1.5rem;
      transition: all 0.2s ease;
    }

    .delete-confirm-input:focus {
      outline: none;
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .delete-confirm-input::placeholder {
      color: #9ca3af;
    }

    .delete-modal-actions {
      display: flex;
      gap: 0.75rem;
      width: 100%;
    }

    .delete-modal-btn {
      flex: 1;
      padding: 0.875rem 1.5rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .delete-modal-btn.cancel {
      background: #f3f4f6;
      color: #6b7280;
    }

    .delete-modal-btn.cancel:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .delete-modal-btn.confirm {
      background: #fef3c7;
      color: #d97706;
    }

    .delete-modal-btn.confirm:hover {
      background: #fde68a;
      color: #b45309;
    }

    .delete-modal-btn.delete {
      background: #dc2626;
      color: white;
    }

    .delete-modal-btn.delete:hover:not(:disabled) {
      background: #b91c1c;
    }

    .delete-modal-btn.delete:disabled {
      background: #fca5a5;
      cursor: not-allowed;
    }
  `]
})
export class ProfilePageComponent implements OnInit, AfterViewInit, OnDestroy {
  private pageHeaderService = inject(PageHeaderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private clientsService = inject(ClientsService);
  private paymentsService = inject(PaymentsService);
  private bonusesService = inject(BonusesService);
  private analyticsService = inject(AnalyticsService);
  private toastService = inject(ToastService);
  private transactionModalService = inject(TransactionModalService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  clientId: string = '';
  isLoading = true;
  clientNotFound = false;
  client: Client | null = null;
  clientDetails: ClientDetails | null = null; // Store full client details from API

  // Client totals for dashboard
  clientTotals = {
    totalPayments: 0,
    totalRevenue: 0,
    totalBonusesGranted: 0,
    totalBonusesUsed: 0
  };

  // Bonus balance
  bonusBalance = 0;

  // View management
  activeView: 'general' | 'wallet' | 'bonus-details' | 'payment-details' | 'audit-logs' = 'general';

  isEditingComment = false;
  editedComment = '';
  isSavingComment = false;
  
  isEditingTags = false;
  editedTags: string[] = [];
  newTagInput = '';
  showTagsDropdown = false;
  isSavingTags = false;
  
  // Список доступных тэгов из API
  availableTags: string[] = [];
  
  isEditingPersonal = false;
  isSavingPersonal = false;
  editedPersonal = {
    firstName: '',
    lastName: '',
    type: 'individual' as 'individual' | 'business',
    dateOfBirth: null as string | null
  };
  
  isEditingContacts = false;
  isSavingContacts = false;
  editedContacts = {
    phone: '',
    email: ''
  };

  // Состояние сворачивания бонусов
  isBonusesExpanded = false;

  // Интерфейс для детальной информации о бонусах
  bonusesDetails: Array<{
    id: string;
    type: string;
    amount: number;
    originalAmount?: number;
    remainingAmount?: number;
    issuedAt: Date;
    expiresAt: Date;
    used?: boolean;
    refundReason?: string;
    initiatedBy?: string;
    initiatedById?: string;
    /** For manual revoke: who and when */
    revokedByUserName?: string;
    revokedAt?: Date;
  }> = [];

  // Раскрытые строки бонусов
  expandedBonusRows = new Set<string>();

  // Mobile card expanded states
  expandedMobileBonusCards = new Set<string>();
  expandedMobilePaymentCards = new Set<string>();

  // Payment data
  payments: PaymentItem[] = [];

  // Refund modal
  showRefundModal = false;
  selectedPaymentForRefund: Payment | null = null;

  showAdjustBonusModal = false;

  splitButtonItems: SplitButtonItem[] = [
    { id: 'create-payment', label: 'Создать платеж' },
    { id: 'adjust-bonus', label: 'Регулировать бонус' }
  ];

  // Payment view modal
  showPaymentViewModal = false;
  selectedPaymentTxId: string | null = null;
  selectedPaymentSearchResult: PaymentSearchResult | null = null;

  // Delete client modal
  showDeleteModal = false;
  deleteStep: 1 | 2 = 1;
  deleteConfirmationWord = '';
  isDeletingClient = false;
  
  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Профиль клиента', [
      { label: 'Главная', route: '/home' },
      { label: 'Клиенты', route: '/clients' },
      { label: 'Профиль клиента' }
    ]);

    this.route.params.subscribe(params => {
      this.clientId = params['id'];
      const section = params['section'] as string | undefined;
      const validSections = ['general', 'wallet', 'bonus-details', 'payment-details', 'audit-logs'];
      if (section && validSections.includes(section)) {
        this.activeView = section as typeof this.activeView;
      } else if (this.clientId && !section) {
        this.router.navigate(['/clients', this.clientId, 'general'], { replaceUrl: true });
      }
      if (this.clientId) {
        this.loadClientData();
      }
    });

    // Subscribe to transaction completion events
    this.transactionModalService.transactionComplete$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload client data, payments, and bonuses when on client profile route
        const currentUrl = this.router.url;
        if (currentUrl.startsWith('/clients/') && this.clientId) {
          this.loadClientData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClientData(): void {
    this.isLoading = true;
    
    // Make individual calls to better handle errors
    const client$ = this.clientsService.getClientById(this.clientId);
    const payments$ = this.paymentsService.getClientPayments(this.clientId, 0, 100);
    const bonusHistory$ = this.bonusesService.getClientBonusHistory(this.clientId, 0, 100);
    const bonusBalance$ = this.bonusesService.getClientBonusBalance(this.clientId);
    const totals$ = this.analyticsService.getClientTotals(this.clientId);
    const tags$ = this.clientsService.getTags();
    
    forkJoin({
      client: client$,
      payments: payments$,
      bonusHistory: bonusHistory$,
      bonusBalance: bonusBalance$,
      totals: totals$,
      tags: tags$
    }).subscribe({
      next: ({ client, payments, bonusHistory, bonusBalance, totals, tags }) => {
        // Store full client details from API
        this.clientDetails = client;
        
        // Update page title with client name
        const clientName = `${client.name}${client.surname ? ' ' + client.surname : ''}`.trim();
        this.titleService.setTitle(`Tinta - Client - ${clientName}`);
        
        // Map client data for UI
        this.client = {
          id: client.id,
          firstName: client.name,
          lastName: client.surname || '',
          phone: client.phone,
          email: client.email,
          tags: client.tags || [],
          comment: client.notes,
          type: client.clientType === 'BUSINESS' ? 'business' : 'individual',
          dateOfBirth: client.dateOfBirth ?? null
        };

        // Map payments - extract content from paginated response
        const paymentsArray = payments?.content || [];
        this.payments = paymentsArray
          .map(p => {
            try {
              return this.mapPaymentToItem(p);
            } catch (error) {
              console.error('Error mapping payment:', p, error);
              return null;
            }
          })
          .filter(p => p !== null)
          .sort((a, b) => {
            try {
              const dateA = new Date(`${a.date} ${a.time}`);
              const dateB = new Date(`${b.date} ${b.time}`);
              return dateB.getTime() - dateA.getTime();
            } catch (error) {
              console.error('Error sorting payments:', error);
              return 0;
            }
          });

        // Map bonus history - extract content from paginated response and transform to match UI
        const bonusHistoryArray = bonusHistory?.content || [];
        this.bonusesDetails = bonusHistoryArray.map(b => {
          try {
            let type = 'purchase';
            if (b.eventType === 'MANUAL_REVOKE') type = 'manual_revoke';
            else if (b.grantReason === 'WELCOME') type = 'welcome';
            else if (b.eventType === 'GRANTED') type = 'purchase';
            else if (b.eventType === 'USED') type = 'purchase';
            else if (b.eventType === 'REVOKED') type = 'refund';
            else if (b.eventType === 'EXPIRED') type = 'loyalty';

            const base: typeof this.bonusesDetails[0] = {
              id: String(b.id),
              type,
              amount: b.bonusAmount,
              issuedAt: new Date(b.createdAt),
              expiresAt: b.expiresAt ? new Date(b.expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              used: b.eventType === 'USED',
              refundReason: b.revokeReason || undefined,
              initiatedBy: b.initiatedByUserName ?? b.revokedByUserName ?? undefined,
              initiatedById: b.initiatedByUserId != null ? String(b.initiatedByUserId) : undefined
            };
            if (b.originalAmount != null) base.originalAmount = b.originalAmount;
            if (b.remainingAmount != null) base.remainingAmount = b.remainingAmount;
            if (b.eventType === 'MANUAL_REVOKE') {
              base.revokedByUserName = b.revokedByUserName ?? undefined;
              base.revokedAt = b.revokedAt ? new Date(b.revokedAt) : new Date(b.createdAt);
            }
            return base;
          } catch (error) {
            console.error('Error mapping bonus:', b, error);
            return null;
          }
        }).filter(b => b !== null);

        // Set bonus balance - use currentBalance from API
        this.bonusBalance = bonusBalance?.currentBalance ?? 0;

        // Set totals
        this.clientTotals = totals || {
          totalPayments: 0,
          totalRevenue: 0,
          totalBonusesGranted: 0,
          totalBonusesUsed: 0
        };

        // Set available tags
        this.availableTags = Array.isArray(tags) ? tags : [];
        console.log('Loaded available tags:', this.availableTags);

        this.isLoading = false;
        
        // Force change detection to update paginated tables
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading client data:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          error: err.error,
          clientId: this.clientId
        });
        
        // Check if it's a 404 error (client not found)
        if (err.status === 404) {
          this.clientNotFound = true;
          this.isLoading = false;
          return;
        }
        
        // Try to load data individually to see which request fails
        this.loadClientDataIndividually();
        
        const errorMessage = err.error?.message || `Ошибка загрузки данных клиента (${err.status || 'unknown'})`;
        this.toastService.error(errorMessage);
      }
    });
  }

  loadClientDataIndividually(): void {
    // Load client data individually to handle partial failures
    this.clientsService.getClientById(this.clientId).subscribe({
      next: (client) => {
        // Store full client details from API
        this.clientDetails = client;
        
        // Update page title with client name
        const clientName = `${client.name}${client.surname ? ' ' + client.surname : ''}`.trim();
        this.titleService.setTitle(`Tinta - Client - ${clientName}`);
        
        // Map client data for UI
        this.client = {
          id: client.id,
          firstName: client.name,
          lastName: client.surname || '',
          phone: client.phone,
          email: client.email,
          tags: client.tags || [],
          comment: client.notes,
          type: client.clientType === 'BUSINESS' ? 'business' : 'individual',
          dateOfBirth: client.dateOfBirth ?? null
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading client:', err);
        if (err.status === 404) {
          this.clientNotFound = true;
        }
        this.isLoading = false;
      }
    });

    this.paymentsService.getClientPayments(this.clientId, 0, 100).subscribe({
      next: (payments) => {
        const paymentsArray = payments?.content || [];
        this.payments = paymentsArray
          .map(p => {
            try {
              return this.mapPaymentToItem(p);
            } catch (error) {
              console.error('Error mapping payment:', p, error);
              return null;
            }
          })
          .filter(p => p !== null)
          .sort((a, b) => {
            try {
              const dateA = new Date(`${a.date} ${a.time}`);
              const dateB = new Date(`${b.date} ${b.time}`);
              return dateB.getTime() - dateA.getTime();
            } catch (error) {
              return 0;
            }
          });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.payments = [];
      }
    });

    this.bonusesService.getClientBonusHistory(this.clientId, 0, 100).subscribe({
      next: (bonusHistory) => {
        const bonusHistoryArray = bonusHistory?.content || [];
        this.bonusesDetails = bonusHistoryArray.map(b => {
          try {
            let type = 'purchase';
            if (b.eventType === 'MANUAL_REVOKE') type = 'manual_revoke';
            else if (b.grantReason === 'WELCOME') type = 'welcome';
            else if (b.eventType === 'GRANTED') type = 'purchase';
            else if (b.eventType === 'USED') type = 'purchase';
            else if (b.eventType === 'REVOKED') type = 'refund';
            else if (b.eventType === 'EXPIRED') type = 'loyalty';

            const base: typeof this.bonusesDetails[0] = {
              id: String(b.id),
              type,
              amount: b.bonusAmount,
              issuedAt: new Date(b.createdAt),
              expiresAt: b.expiresAt ? new Date(b.expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              used: b.eventType === 'USED',
              refundReason: b.revokeReason || undefined,
              initiatedBy: b.initiatedByUserName ?? b.revokedByUserName ?? undefined,
              initiatedById: b.initiatedByUserId != null ? String(b.initiatedByUserId) : undefined
            };
            if (b.originalAmount != null) base.originalAmount = b.originalAmount;
            if (b.remainingAmount != null) base.remainingAmount = b.remainingAmount;
            if (b.eventType === 'MANUAL_REVOKE') {
              base.revokedByUserName = b.revokedByUserName ?? undefined;
              base.revokedAt = b.revokedAt ? new Date(b.revokedAt) : new Date(b.createdAt);
            }
            return base;
          } catch (error) {
            console.error('Error mapping bonus:', b, error);
            return null;
          }
        }).filter(b => b !== null);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading bonus history:', err);
        this.bonusesDetails = [];
      }
    });

    this.bonusesService.getClientBonusBalance(this.clientId).subscribe({
      next: (bonusBalance) => {
        this.bonusBalance = bonusBalance?.currentBalance ?? 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading bonus balance:', err);
        this.bonusBalance = 0;
      }
    });

    this.analyticsService.getClientTotals(this.clientId).subscribe({
      next: (totals) => {
        this.clientTotals = totals || {
          totalPayments: 0,
          totalRevenue: 0,
          totalBonusesGranted: 0,
          totalBonusesUsed: 0
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading client totals:', err);
        this.clientTotals = {
          totalPayments: 0,
          totalRevenue: 0,
          totalBonusesGranted: 0,
          totalBonusesUsed: 0
        };
      }
    });

    this.clientsService.getTags().subscribe({
      next: (tags) => {
        this.availableTags = Array.isArray(tags) ? tags : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tags:', err);
        this.availableTags = [];
      }
    });
  }

  mapPaymentToItem(payment: PaymentSearchResult): PaymentItem {
    if (!payment) {
      console.warn('Invalid payment data: payment is null/undefined');
      return null as any;
    }
    
    if (!payment.createdAt) {
      console.warn('Invalid payment data: missing createdAt', payment);
      // Return a default payment item with current date
      const now = new Date();
      return {
        id: payment.txId || 'unknown',
        clientId: payment.clientId || '',
        clientName: payment.clientName || '—',
        clientPhone: payment.clientPhone || '—',
        amount: payment.amount || 0,
        bonusEarned: payment.bonusGranted || 0,
        bonusUsed: payment.bonusUsed || 0,
        bonusRevoked: payment.bonusRevoked || 0,
        paymentMethod: (payment.paymentMethod?.toLowerCase() as 'cash' | 'card' | 'transfer') || 'cash',
        isRefund: payment.status === 'REFUNDED' || !!payment.refundedPaymentTxId,
        date: this.formatDate(now),
        time: this.formatTime(now)
      };
    }
    
    try {
      const createdAt = new Date(payment.createdAt);
      if (isNaN(createdAt.getTime())) {
        console.warn('Invalid date format:', payment.createdAt);
        const now = new Date();
        return {
          id: payment.txId,
          clientId: payment.clientId || '',
          clientName: payment.clientName || '—',
          clientPhone: payment.clientPhone || '—',
          amount: payment.amount || 0,
          bonusEarned: payment.bonusGranted || 0,
          bonusUsed: payment.bonusUsed || 0,
          bonusRevoked: payment.bonusRevoked || 0,
          paymentMethod: (payment.paymentMethod?.toLowerCase() as 'cash' | 'card' | 'transfer') || 'cash',
          isRefund: payment.status === 'REFUNDED' || !!payment.refundedPaymentTxId,
          date: this.formatDate(now),
          time: this.formatTime(now)
        };
      }
      
      const dateStr = this.formatDate(createdAt);
      const timeStr = this.formatTime(createdAt);
      
      return {
        id: payment.txId,
        clientId: payment.clientId || '',
        clientName: payment.clientName || '—',
        clientPhone: payment.clientPhone || '—',
        amount: payment.amount || 0,
        bonusEarned: payment.bonusGranted || 0,
        bonusUsed: payment.bonusUsed || 0,
        bonusRevoked: payment.bonusRevoked || 0,
        paymentMethod: (payment.paymentMethod?.toLowerCase() as 'cash' | 'card' | 'transfer') || 'cash',
        isRefund: payment.status === 'REFUNDED' || !!payment.refundedPaymentTxId,
        date: dateStr,
        time: timeStr
      };
    } catch (error) {
      console.error('Error mapping payment:', error, payment);
      const now = new Date();
      return {
        id: payment.txId || 'unknown',
        clientId: payment.clientId || '',
        clientName: payment.clientName || '—',
        clientPhone: payment.clientPhone || '—',
        amount: payment.amount || 0,
        bonusEarned: payment.bonusGranted || 0,
        bonusUsed: payment.bonusUsed || 0,
        bonusRevoked: payment.bonusRevoked || 0,
        paymentMethod: 'cash',
        isRefund: false,
        date: this.formatDate(now),
        time: this.formatTime(now)
      };
    }
  }

  ngAfterViewInit(): void {
    // Прокручиваем страницу в начало после полной загрузки DOM
    const sidebarContent = document.querySelector('.sidebar-content');
    if (sidebarContent) {
      sidebarContent.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }

  getFullName(): string {
    if (!this.client) return '';
    return `${this.client.firstName} ${this.client.lastName}`.trim();
  }

  getInitials(name?: string): string {
    if (name) {
      const parts = name.split(' ');
      return parts.map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    if (!this.client) return '';
    const first = this.client.firstName.charAt(0).toUpperCase();
    const last = this.client.lastName ? this.client.lastName.charAt(0).toUpperCase() : '';
    return first + last;
  }

  // Tags editing
  startEditTags(): void {
    if (!this.client) return;
    this.editedTags = [...this.client.tags];
    this.isEditingTags = true;
    this.newTagInput = '';
    this.showTagsDropdown = false;
    console.log('Started editing tags. Available tags:', this.availableTags);
  }

  addTag(): void {
    if (!this.client || !this.newTagInput.trim()) return;
    if (!this.client.tags.includes(this.newTagInput.trim())) {
      this.client.tags.push(this.newTagInput.trim());
    }
    this.newTagInput = '';
  }

  addTagFromDropdown(tag: string): void {
    if (!this.client) return;
    if (!this.client.tags.includes(tag)) {
      this.client.tags.push(tag);
    }
    this.showTagsDropdown = false;
  }

  getFilteredTags(): string[] {
    if (!this.client) return [];
    if (!this.availableTags || this.availableTags.length === 0) {
      console.warn('Available tags is empty:', this.availableTags);
      return [];
    }
    const searchTerm = this.newTagInput.toLowerCase();
    const filtered = this.availableTags.filter(tag => 
      !this.client!.tags.includes(tag) && 
      (searchTerm === '' || tag.toLowerCase().includes(searchTerm))
    );
    console.log('Filtered tags:', {
      availableTags: this.availableTags,
      clientTags: this.client.tags,
      searchTerm: searchTerm,
      filtered: filtered
    });
    return filtered;
  }

  removeTag(index: number): void {
    if (!this.client) return;
    this.client.tags.splice(index, 1);
  }

  saveTags(): void {
    if (!this.client) return;
    this.isSavingTags = true;
    const requestPayload = { tags: this.client.tags };
    console.log('Update Client Tags - Request Payload:', {
      clientId: this.clientId,
      payload: requestPayload
    });
    this.clientsService.updateClientTags(this.clientId, requestPayload).subscribe({
      next: () => {
        this.toastService.success('Теги успешно обновлены');
        this.isEditingTags = false;
        this.newTagInput = '';
        this.showTagsDropdown = false;
        this.isSavingTags = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при обновлении тегов';
        this.toastService.error(errorMessage);
        this.cancelEditTags();
        this.isSavingTags = false;
      }
    });
  }

  cancelEditTags(): void {
    if (!this.client) return;
    this.client.tags = [...this.editedTags];
    this.isEditingTags = false;
    this.newTagInput = '';
    this.showTagsDropdown = false;
  }

  // Comment editing
  startEditComment(): void {
    if (!this.client) return;
    this.editedComment = this.client.comment || '';
    this.isEditingComment = true;
  }

  saveComment(): void {
    if (!this.client) return;
    this.isSavingComment = true;
    const requestPayload = { notes: this.editedComment };
    console.log('Update Client Notes - Request Payload:', {
      clientId: this.clientId,
      payload: requestPayload
    });
    this.clientsService.updateClientNotes(this.clientId, requestPayload).subscribe({
      next: () => {
        this.client!.comment = this.editedComment;
        this.toastService.success('Комментарий успешно обновлен');
        this.isEditingComment = false;
        this.isSavingComment = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при обновлении комментария';
        this.toastService.error(errorMessage);
        this.isSavingComment = false;
      }
    });
  }

  cancelEditComment(): void {
    this.isEditingComment = false;
    this.editedComment = '';
  }

  // Personal data editing
  startEditPersonal(): void {
    if (!this.client) return;
    this.editedPersonal = {
      firstName: this.client.firstName,
      lastName: this.client.lastName,
      type: this.client.type,
      dateOfBirth: this.client.dateOfBirth ?? null
    };
    this.isEditingPersonal = true;
  }

  savePersonal(): void {
    if (!this.client || !this.clientDetails) return;
    this.isSavingPersonal = true;
    
    // Build complete payload with all fields, only changing edited ones
    const dateOfBirth = this.editedPersonal.dateOfBirth ?? this.clientDetails.dateOfBirth;
    const requestPayload: UpdateClientRequest = {
      phone: this.clientDetails.phone,
      name: this.editedPersonal.firstName,
      surname: this.editedPersonal.type === 'business' ? null : (this.editedPersonal.lastName?.trim() || undefined),
      dateOfBirth: (dateOfBirth != null && String(dateOfBirth).trim() !== '') ? String(dateOfBirth).trim() : (null as string | null),
      notes: this.clientDetails.notes,
      tags: this.clientDetails.tags || [],
      clientType: this.editedPersonal.type === 'business' ? 'BUSINESS' : 'INDIVIDUAL',
      referrerId: this.clientDetails.referrerId
    };

    console.log('Update Client (Personal Data) - Request Payload:', {
      clientId: this.clientId,
      payload: requestPayload
    });
    this.clientsService.updateClient(this.clientId, requestPayload).subscribe({
      next: (updatedClient) => {
        // Update stored client details
        this.clientDetails = updatedClient;
        
        // Update UI client data
        this.client!.firstName = updatedClient.name;
        this.client!.lastName = updatedClient.surname || '';
        this.client!.type = updatedClient.clientType === 'BUSINESS' ? 'business' : 'individual';
        this.client!.dateOfBirth = updatedClient.dateOfBirth ?? null;
        this.toastService.success('Личные данные успешно обновлены');
        this.isEditingPersonal = false;
        this.isSavingPersonal = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при обновлении личных данных';
        this.toastService.error(errorMessage);
        this.isSavingPersonal = false;
      }
    });
  }

  cancelEditPersonal(): void {
    this.isEditingPersonal = false;
  }

  // Contacts editing
  startEditContacts(): void {
    if (!this.client) return;
    this.editedContacts = {
      phone: this.client.phone,
      email: this.client.email || ''
    };
    this.isEditingContacts = true;
  }

  saveContacts(): void {
    if (!this.client || !this.clientDetails) return;
    this.isSavingContacts = true;
    
    // Build complete payload with all fields, only changing phone
    const requestPayload: UpdateClientRequest = {
      phone: this.editedContacts.phone, // Changed field
      name: this.clientDetails.name,
      surname: this.clientDetails.surname || '',
      dateOfBirth: this.clientDetails.dateOfBirth,
      notes: this.clientDetails.notes,
      tags: this.clientDetails.tags || [],
      clientType: this.clientDetails.clientType,
      referrerId: this.clientDetails.referrerId
    };
    
    // Note: email is not included as it's not editable
    
    console.log('Update Client (Contacts) - Request Payload:', {
      clientId: this.clientId,
      payload: requestPayload
    });
    this.clientsService.updateClient(this.clientId, requestPayload).subscribe({
      next: (updatedClient) => {
        // Update stored client details
        this.clientDetails = updatedClient;
        
        // Update UI client data
        this.client!.phone = updatedClient.phone;
        this.toastService.success('Контактные данные успешно обновлены');
        this.isEditingContacts = false;
        this.isSavingContacts = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при обновлении контактных данных';
        this.toastService.error(errorMessage);
        this.isSavingContacts = false;
      }
    });
  }

  cancelEditContacts(): void {
    this.isEditingContacts = false;
  }

  // Payment helpers
  formatPaymentId(id: string): string {
    return id;
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('ru-RU');
  }

  getPaymentMethodForBadge(method: string | undefined): 'CASH' | 'CARD' | 'TRANSFER' | null {
    if (!method) return null;
    const upperMethod = method.toUpperCase();
    if (upperMethod === 'CASH' || upperMethod === 'CARD' || upperMethod === 'TRANSFER') {
      return upperMethod as 'CASH' | 'CARD' | 'TRANSFER';
    }
    return null;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Наличные',
      card: 'Карта',
      transfer: 'Перевод'
    };
    return labels[method] || method;
  }

  // Refund methods
  openRefundModal(payment: PaymentItem): void {
    if (!this.client) return;
    this.selectedPaymentForRefund = {
      id: payment.id,
      clientId: this.clientId,
      clientName: this.getFullName(),
      clientPhone: this.client.phone,
      amount: payment.amount,
      bonusEarned: payment.bonusEarned,
      bonusUsed: payment.bonusUsed,
      bonusRevoked: payment.bonusRevoked,
      paymentMethod: payment.paymentMethod,
      isRefund: payment.isRefund,
      date: payment.date,
      time: payment.time
    };
    this.showRefundModal = true;
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
    this.selectedPaymentForRefund = null;
  }

  // Payment view modal methods
  openPaymentView(paymentId: string): void {
    const payment = this.payments.find(p => p.id === paymentId);
    if (payment) {
      this.selectedPaymentSearchResult = {
        txId: payment.id,
        clientId: this.clientId,
        clientName: this.getFullName(),
        clientPhone: this.client?.phone || '',
        clientEmail: this.client?.email || null,
        amount: payment.amount,
        status: payment.isRefund ? 'REFUNDED' : 'COMPLETED',
        paymentMethod: payment.paymentMethod?.toUpperCase() as 'CASH' | 'CARD' | 'TRANSFER' | null,
        initiatedBy: null,
        createdAt: payment.date + 'T' + payment.time,
        refundedPaymentTxId: null,
        bonusGranted: payment.bonusEarned,
        bonusUsed: payment.bonusUsed,
        bonusRevoked: payment.bonusRevoked,
        refundReason: null
      };
    }
    this.selectedPaymentTxId = paymentId;
    this.showPaymentViewModal = true;
  }

  onPaymentUpdated(): void {
    this.loadClientData();
  }

  confirmRefund(notes: string): void {
    if (!this.selectedPaymentForRefund) return;
    this.paymentsService.refundPayment(this.selectedPaymentForRefund.id, { notes }).subscribe({
      next: () => {
        this.toastService.success('Возврат успешно оформлен');
        this.closeRefundModal();
        // Reload client data to refresh payments
        this.loadClientData();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при оформлении возврата';
        this.toastService.error(errorMessage);
      }
    });
  }

  formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Bonus helpers
  getBonusTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      welcome: 'Приветственный',
      referral: 'Реферальный',
      purchase: 'За покупку',
      promotion: 'Акция',
      loyalty: 'Лояльность',
      refund: 'Отозвано',
      used: 'Использовано',
      granted: 'Начислено',
      manual_revoke: 'Списано вручную'
    };
    return labels[type] || type;
  }

  getDaysUntilExpiry(expiresAt: Date): number {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getDaysText(days: number): string {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  toggleBonusesExpanded(): void {
    this.isBonusesExpanded = !this.isBonusesExpanded;
  }

  getActiveBonusesTotal(): number {
    const now = new Date();
    return this.bonusesDetails
      .filter(bonus => !bonus.used && new Date(bonus.expiresAt) > now)
      .reduce((sum, bonus) => sum + bonus.amount, 0);
  }

  getUsedBonusesTotal(): number {
    return this.bonusesDetails
      .filter(bonus => bonus.used)
      .reduce((sum, bonus) => sum + bonus.amount, 0);
  }

  getExpiredBonusesTotal(): number {
    const now = new Date();
    return this.bonusesDetails
      .filter(bonus => !bonus.used && bonus.type !== 'refund' && new Date(bonus.expiresAt) <= now)
      .reduce((sum, bonus) => sum + bonus.amount, 0);
  }

  toggleBonusRow(bonusId: string): void {
    if (this.expandedBonusRows.has(bonusId)) {
      this.expandedBonusRows.delete(bonusId);
    } else {
      this.expandedBonusRows.add(bonusId);
    }
  }

  isBonusRowExpanded(bonusId: string): boolean {
    return this.expandedBonusRows.has(bonusId);
  }

  // Mobile card methods
  toggleMobileBonusCard(bonusId: string): void {
    if (this.expandedMobileBonusCards.has(bonusId)) {
      this.expandedMobileBonusCards.delete(bonusId);
    } else {
      this.expandedMobileBonusCards.add(bonusId);
    }
  }

  isMobileBonusExpanded(bonusId: string): boolean {
    return this.expandedMobileBonusCards.has(bonusId);
  }

  toggleMobilePaymentCard(paymentId: string): void {
    if (this.expandedMobilePaymentCards.has(paymentId)) {
      this.expandedMobilePaymentCards.delete(paymentId);
    } else {
      this.expandedMobilePaymentCards.add(paymentId);
    }
  }

  isMobilePaymentExpanded(paymentId: string): boolean {
    return this.expandedMobilePaymentCards.has(paymentId);
  }

  // Delete client methods
  openCreatePayment(): void {
    if (this.client) {
      this.transactionModalService.open(this.client.phone);
    }
  }

  openAdjustBonusModal(): void {
    this.showAdjustBonusModal = true;
  }

  onSplitButtonItemSelect(id: string): void {
    if (id === 'create-payment') this.openCreatePayment();
    else if (id === 'adjust-bonus') this.openAdjustBonusModal();
  }

  onInlineTagsChange(ev: TagsChangeEvent): void {
    if (!this.client || !this.clientId) return;
    const previousTags = [...this.client.tags];
    this.client.tags = ev.tags;
    this.clientsService.updateClientTags(this.clientId, { tags: ev.tags }).subscribe({
      next: () => {
        if (ev.removedTag) {
          const removedTag = ev.removedTag;
          this.toastService.showWithAction(
            'Тег удалён',
            {
              label: 'Отмена',
              callback: () => {
                const restored = [...this.client!.tags, removedTag];
                this.client!.tags = restored;
                this.clientsService.updateClientTags(this.clientId!, { tags: restored }).subscribe({
                  next: () => {},
                  error: () => this.toastService.error('Не удалось восстановить тег')
                });
              }
            },
            'success',
            4000
          );
        }
      },
      error: (err) => {
        if (this.client) this.client.tags = previousTags;
        this.toastService.error(err?.error?.message || 'Ошибка при обновлении тегов');
      }
    });
  }

  onBonusAdjusted(): void {
    this.loadClientData();
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
    this.deleteStep = 1;
    this.deleteConfirmationWord = '';
    this.isDeletingClient = false;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteStep = 1;
    this.deleteConfirmationWord = '';
    this.isDeletingClient = false;
  }

  proceedToDeleteStep2(): void {
    this.deleteStep = 2;
  }

  confirmDelete(): void {
    if (this.deleteConfirmationWord !== 'удалить') {
      this.toastService.error('Введите слово "удалить" для подтверждения');
      return;
    }

    this.isDeletingClient = true;
    this.clientsService.deleteClient(this.clientId).subscribe({
      next: () => {
        this.toastService.success('Клиент успешно удален');
        this.closeDeleteModal();
        // Navigate back to clients list
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при удалении клиента';
        this.toastService.error(errorMessage);
        this.isDeletingClient = false;
      }
    });
  }
}
