import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { ClientsService, ClientDetails, UpdateClientRequest } from '../../../../core/services/clients.service';
import { PaymentsService, PaymentSearchResult } from '../../../../core/services/payments.service';
import { BonusesService, BonusHistoryItem } from '../../../../core/services/bonuses.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { RefundConfirmationModalComponent, Payment } from '../../../../shared/components/refund-confirmation-modal/refund-confirmation-modal.component';
import { PaginatedTableWrapperComponent } from '../../../../shared/components/paginated-table-wrapper/paginated-table-wrapper.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  tags: string[];
  comment: string | null;
  type: 'individual' | 'business';
}

interface PaymentItem {
  id: string;
  amount: number;
  bonusEarned: number;
  bonusUsed: number;
  paymentMethod: 'cash' | 'card' | 'online';
  isRefund: boolean;
  date: string;
  time: string;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, IconButtonComponent, RefundConfirmationModalComponent, RouterModule, PaginatedTableWrapperComponent, LoaderComponent],
  template: `
    <div class="page-wrapper">
      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <app-loader></app-loader>
      </div>

      <div class="profile-container" *ngIf="client && !isLoading">
        
        <!-- Profile Header Card -->
        <div class="profile-header-card">
          <div class="profile-header-content">
            <div class="avatar-wrapper">
              <div class="avatar-large">
                {{ getInitials() }}
              </div>
            </div>
            <div class="profile-main-info">
              <div class="name-row">
                <h1 class="profile-name">{{ getFullName() }}</h1>
                <span class="client-type-badge" [class.business]="client.type === 'business'">
                  <svg *ngIf="client.type === 'business'" viewBox="0 0 24 24" fill="none">
                    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  <svg *ngIf="client.type === 'individual'" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  {{ client.type === 'business' ? 'Бизнес' : 'Индивидуальный' }}
                </span>
              </div>
              <p class="profile-phone">{{ client.phone }}</p>
              <div class="tags-row">
                <div class="tags-container">
                  <span class="client-tag" *ngFor="let tag of client.tags; let i = index">
                    {{ tag }}
                    <button class="remove-tag-btn" *ngIf="isEditingTags" (click)="removeTag(i)">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </button>
                  </span>
                  <div class="add-tag-wrapper" *ngIf="isEditingTags">
                    <input 
                      type="text" 
                      [(ngModel)]="newTagInput" 
                      (keydown.enter)="addTag()"
                      (focus)="showTagsDropdown = true"
                      placeholder="Новый тэг..."
                      class="add-tag-input">
                    <button class="add-tag-confirm-btn" (click)="addTag()" *ngIf="newTagInput.trim()">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <!-- Tags Dropdown -->
                <div class="tags-dropdown" *ngIf="isEditingTags && showTagsDropdown && availableTags.length > 0">
                  <div class="tags-dropdown-header">
                    <span>Популярные тэги</span>
                    <button type="button" class="tags-dropdown-close" (click)="showTagsDropdown = false">×</button>
                  </div>
                  <div class="tags-dropdown-list">
                    <button 
                      type="button"
                      class="tag-option" 
                      *ngFor="let tag of getFilteredTags()"
                      (click)="addTagFromDropdown(tag)">
                      {{ tag }}
                    </button>
                    <div class="tags-dropdown-empty" *ngIf="getFilteredTags().length === 0 && availableTags.length > 0">
                      Все популярные теги уже добавлены
                    </div>
                  </div>
                </div>
                <button class="edit-tags-btn" *ngIf="!isEditingTags" (click)="startEditTags()">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
                <div class="tags-actions" *ngIf="isEditingTags">
                  <button class="save-tags-btn" (click)="saveTags()" [disabled]="isSavingTags">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button class="cancel-tags-btn" (click)="cancelEditTags()" [disabled]="isSavingTags">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Comment Card -->
        <div class="comment-card">
          <div class="comment-header">
            <div class="comment-title">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Комментарий о клиенте</span>
            </div>
            <button class="edit-comment-btn" *ngIf="!isEditingComment" (click)="startEditComment()">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="comment-actions" *ngIf="isEditingComment">
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

        <!-- Stats Cards -->
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

        <!-- Profile Details -->
        <div class="details-grid">
          <!-- Personal Info Card -->
          <div class="details-card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3 class="card-title">Личные данные</h3>
              </div>
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
                <span class="info-label">Имя</span>
                <span class="info-value" *ngIf="!isEditingPersonal">{{ client.firstName }}</span>
                <input class="info-input" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.firstName">
              </div>
              <div class="info-row">
                <span class="info-label">Фамилия</span>
                <span class="info-value" *ngIf="!isEditingPersonal">{{ client.lastName }}</span>
                <input class="info-input" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.lastName">
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

          <!-- Contact Info Card -->
          <div class="details-card">
            <div class="card-header">
              <div class="card-header-left">
                <div class="card-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3 class="card-title">Контакты</h3>
              </div>
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
                <span class="info-value" *ngIf="!isEditingContacts">{{ client.phone }}</span>
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

        <!-- Bonuses Details Card -->
        <div class="bonuses-details-card">
          <div class="card-header" (click)="toggleBonusesExpanded()">
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
            <button class="collapse-btn" [class.collapsed]="!isBonusesExpanded">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="bonuses-content" *ngIf="isBonusesExpanded">
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
                      <th>Сумма</th>
                      <th>Начислено</th>
                      <th>Истекает</th>
                      <th>Осталось</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ng-container *ngFor="let bonus of paginatedBonuses.paginatedData">
                    <tr
                        [class.expired]="getDaysUntilExpiry(bonus.expiresAt) <= 0 && !bonus.used && bonus.type !== 'refund'"
                        [class.expiring-soon]="getDaysUntilExpiry(bonus.expiresAt) <= 7 && getDaysUntilExpiry(bonus.expiresAt) > 0"
                        [class.used]="bonus.used"
                        [class.refund]="bonus.type === 'refund'">
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
                            *ngIf="bonus.type !== 'refund' && !bonus.used && getDaysUntilExpiry(bonus.expiresAt) <= 0"
                            badgeType="bonusExpired"
                            size="medium"
                            icon="expired"
                            class="bonus-badge">
                            {{ formatAmount(bonus.amount) }}
                          </app-badge>
                          <app-badge
                            *ngIf="bonus.type !== 'refund' && !bonus.used && getDaysUntilExpiry(bonus.expiresAt) > 0"
                            badgeType="bonusGranted"
                            size="medium"
                            icon="star"
                            class="bonus-badge">
                            +{{ formatAmount(bonus.amount) }}
                          </app-badge>
                        </div>
                      </td>
                      <td>
                        <span class="bonus-date">{{ formatDate(bonus.issuedAt) }}</span>
                      </td>
                      <td>
                        <span class="bonus-expiry-date">{{ formatDate(bonus.expiresAt) }}</span>
                      </td>
                      <td>
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
                          *ngIf="bonus.type !== 'refund' && !bonus.used && getDaysUntilExpiry(bonus.expiresAt) > 0"
                          [badgeType]="getDaysUntilExpiry(bonus.expiresAt) <= 7 ? 'warning' : 'success'"
                          size="medium">
                          {{ getDaysUntilExpiry(bonus.expiresAt) }} {{ getDaysText(getDaysUntilExpiry(bonus.expiresAt)) }}
                        </app-badge>
                        <app-badge
                          *ngIf="bonus.type !== 'refund' && !bonus.used && getDaysUntilExpiry(bonus.expiresAt) <= 0"
                          badgeType="bonusExpired"
                          size="medium"
                          icon="expired">
                          Истек
                        </app-badge>
                      </td>
                      <td>
                        <div class="actions-cell">
                          <app-icon-button
                            iconButtonType="ghost"
                            size="medium"
                            class = "view-svg-btn"
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
                                {{ bonus.initiatedBy }}
                              </a>
                              <div class="bonus-initiated-by-text" *ngIf="bonus.initiatedBy && !bonus.initiatedById">
                                {{ bonus.initiatedBy }}
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

        <!-- Payments Table Card (Full Width) -->
        <div class="payments-card">
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
                    <span class="payment-id">#{{ formatPaymentId(payment.id) }}</span>
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
    </div>

    <!-- Refund Confirmation Modal -->
    <app-refund-confirmation-modal
      [visible]="showRefundModal"
      [payment]="selectedPaymentForRefund"
      (visibleChange)="closeRefundModal()"
      (confirm)="confirmRefund($event.refundReason || '')">
    </app-refund-confirmation-modal>

  `,
  styles: [`
    .page-wrapper {
      min-height: 100%;
      margin: -2rem;
      padding: 2rem;
      background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 50%, #f8fafc 100%);
    }

    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Profile Header Card */
    .profile-header-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      margin-bottom: 1rem;
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

    /* Bonuses Details Card */
    .bonuses-details-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      margin-bottom: 1rem;
      overflow: hidden;
    }

    .bonuses-details-card .card-header {
      cursor: pointer;
      user-select: none;
      transition: background 0.2s ease;
      padding: 1rem 1.5rem;
      margin-bottom: 0;
      border-bottom: none;
    }

    .bonuses-details-card .card-header:hover {
      background: #f8fafc;
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

    .bonuses-content {
      padding: 0 1.5rem 1.5rem;
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

      .profile-header-content {
        flex-direction: column;
        text-align: center;
        padding: 1.5rem;
      }

      .name-row {
        flex-direction: column;
        gap: 0.5rem;
      }

      .tags-row {
        flex-direction: column;
        align-items: center;
      }

      .tags-container {
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .profile-name {
        font-size: 1.25rem;
      }

      .payments-table {
        font-size: 0.85rem;
      }

      .payments-table th,
      .payments-table td {
        padding: 0.75rem 0.5rem;
      }

      .th-bonuses,
      .td-bonuses,
      .th-method,
      .td-method {
        display: none;
      }
    }
  `]
})
export class ProfilePageComponent implements OnInit, AfterViewInit {
  private pageHeaderService = inject(PageHeaderService);
  private route = inject(ActivatedRoute);
  private clientsService = inject(ClientsService);
  private paymentsService = inject(PaymentsService);
  private bonusesService = inject(BonusesService);
  private analyticsService = inject(AnalyticsService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  clientId: string = '';
  isLoading = true;
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
    type: 'individual' as 'individual' | 'business'
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
    issuedAt: Date;
    expiresAt: Date;
    used?: boolean;
    refundReason?: string;
    initiatedBy?: string;
    initiatedById?: string;
  }> = [];

  // Раскрытые строки бонусов
  expandedBonusRows = new Set<string>();

  // Payment data
  payments: PaymentItem[] = [];

  // Refund modal
  showRefundModal = false;
  selectedPaymentForRefund: Payment | null = null;
  
  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Профиль клиента', [
      { label: 'Главная', route: '/home' },
      { label: 'Клиенты', route: '/clients' },
      { label: 'Профиль клиента' }
    ]);

    this.route.params.subscribe(params => {
      this.clientId = params['id'];
      if (this.clientId) {
        this.loadClientData();
      }
    });
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
        
        // Map client data for UI
        this.client = {
          id: client.id,
          firstName: client.name,
          lastName: client.surname || '',
          phone: client.phone,
          email: client.email,
          tags: client.tags || [],
          comment: client.notes,
          type: client.clientType === 'BUSINESS' ? 'business' : 'individual'
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
            // Map eventType to type for UI
            let type = 'purchase';
            if (b.grantReason === 'WELCOME') type = 'welcome';
            else if (b.eventType === 'GRANTED') type = 'purchase';
            else if (b.eventType === 'USED') type = 'purchase';
            else if (b.eventType === 'REVOKED') type = 'refund';
            else if (b.eventType === 'EXPIRED') type = 'loyalty';

            return {
              id: String(b.id),
              type: type,
              amount: b.bonusAmount,
              issuedAt: new Date(b.createdAt),
              expiresAt: b.expiresAt ? new Date(b.expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days if no expiry
              used: b.eventType === 'USED',
              refundReason: b.revokeReason || undefined,
              initiatedBy: undefined, // Not available in API response
              initiatedById: undefined // Not available in API response
            };
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
        
        // Map client data for UI
        this.client = {
          id: client.id,
          firstName: client.name,
          lastName: client.surname || '',
          phone: client.phone,
          email: client.email,
          tags: client.tags || [],
          comment: client.notes,
          type: client.clientType === 'BUSINESS' ? 'business' : 'individual'
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading client:', err);
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
            if (b.grantReason === 'WELCOME') type = 'welcome';
            else if (b.eventType === 'GRANTED') type = 'purchase';
            else if (b.eventType === 'USED') type = 'purchase';
            else if (b.eventType === 'REVOKED') type = 'refund';
            else if (b.eventType === 'EXPIRED') type = 'loyalty';

            return {
              id: String(b.id),
              type: type,
              amount: b.bonusAmount,
              issuedAt: new Date(b.createdAt),
              expiresAt: b.expiresAt ? new Date(b.expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              used: b.eventType === 'USED',
              refundReason: b.revokeReason || undefined,
              initiatedBy: undefined,
              initiatedById: undefined
            };
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
        amount: payment.amount || 0,
        bonusEarned: payment.bonusGranted || 0,
        bonusUsed: payment.bonusUsed || 0,
        paymentMethod: (payment.paymentMethod?.toLowerCase() as 'cash' | 'card' | 'online') || 'cash',
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
          amount: payment.amount || 0,
          bonusEarned: payment.bonusGranted || 0,
          bonusUsed: payment.bonusUsed || 0,
          paymentMethod: (payment.paymentMethod?.toLowerCase() as 'cash' | 'card' | 'online') || 'cash',
          isRefund: payment.status === 'REFUNDED' || !!payment.refundedPaymentTxId,
          date: this.formatDate(now),
          time: this.formatTime(now)
        };
      }
      
      const dateStr = this.formatDate(createdAt);
      const timeStr = this.formatTime(createdAt);
      
      return {
        id: payment.txId,
        amount: payment.amount || 0,
        bonusEarned: payment.bonusGranted || 0,
        bonusUsed: payment.bonusUsed || 0,
        paymentMethod: (payment.paymentMethod?.toLowerCase() as 'cash' | 'card' | 'online') || 'cash',
        isRefund: payment.status === 'REFUNDED' || !!payment.refundedPaymentTxId,
        date: dateStr,
        time: timeStr
      };
    } catch (error) {
      console.error('Error mapping payment:', error, payment);
      const now = new Date();
      return {
        id: payment.txId || 'unknown',
        amount: payment.amount || 0,
        bonusEarned: payment.bonusGranted || 0,
        bonusUsed: payment.bonusUsed || 0,
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

  getInitials(): string {
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
      type: this.client.type
    };
    this.isEditingPersonal = true;
  }

  savePersonal(): void {
    if (!this.client || !this.clientDetails) return;
    this.isSavingPersonal = true;
    
    // Build complete payload with all fields, only changing edited ones
    const requestPayload: UpdateClientRequest = {
      phone: this.clientDetails.phone,
      name: this.editedPersonal.firstName, // Changed field
      surname: this.editedPersonal.lastName, // Changed field
      dateOfBirth: this.clientDetails.dateOfBirth,
      notes: this.clientDetails.notes,
      tags: this.clientDetails.tags || [],
      clientType: this.editedPersonal.type === 'business' ? 'BUSINESS' : 'INDIVIDUAL', // Changed field
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

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Наличные',
      card: 'Карта',
      online: 'Онлайн'
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
      granted: 'Начислено'
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
}
