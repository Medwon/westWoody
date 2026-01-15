import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { RefundConfirmationModalComponent, Payment } from '../../../../shared/components/refund-confirmation-modal/refund-confirmation-modal.component';
import { PaginatedTableWrapperComponent } from '../../../../shared/components/paginated-table-wrapper/paginated-table-wrapper.component';

interface MockClient {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  tags: string[];
  comment: string;
  active: boolean;
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
  imports: [CommonModule, FormsModule, BadgeComponent, IconButtonComponent, RefundConfirmationModalComponent, RouterModule, PaginatedTableWrapperComponent],
  template: `
    <div class="page-wrapper">
      <div class="profile-container">
        
        <!-- Profile Header Card -->
        <div class="profile-header-card">
          <div class="profile-header-content">
            <div class="avatar-wrapper">
              <div class="avatar-large">
                {{ getInitials() }}
              </div>
              <div class="status-indicator" [class.active]="mockClient.active"></div>
            </div>
            <div class="profile-main-info">
              <div class="name-row">
                <h1 class="profile-name">{{ getFullName() }}</h1>
                <span class="client-type-badge" [class.business]="mockClient.type === 'business'">
                  <svg *ngIf="mockClient.type === 'business'" viewBox="0 0 24 24" fill="none">
                    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  <svg *ngIf="mockClient.type === 'individual'" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  {{ mockClient.type === 'business' ? 'Бизнес' : 'Индивидуальный' }}
                </span>
              </div>
              <p class="profile-phone">{{ mockClient.phone }}</p>
              <div class="tags-row">
                <div class="tags-container">
                  <span class="client-tag" *ngFor="let tag of mockClient.tags; let i = index">
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
                <div class="tags-dropdown" *ngIf="isEditingTags && showTagsDropdown && getFilteredTags().length > 0">
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
                  </div>
                </div>
                <button class="edit-tags-btn" *ngIf="!isEditingTags" (click)="startEditTags()">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
                <div class="tags-actions" *ngIf="isEditingTags">
                  <button class="save-tags-btn" (click)="saveTags()">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button class="cancel-tags-btn" (click)="cancelEditTags()">
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
              <button class="save-btn" (click)="saveComment()">Сохранить</button>
              <button class="cancel-btn" (click)="cancelEditComment()">Отмена</button>
            </div>
          </div>
          <div class="comment-body">
            <p *ngIf="!isEditingComment" class="comment-text">{{ mockClient.comment || 'Нет комментария' }}</p>
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
              <span class="stat-value">156</span>
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
              <span class="stat-value">485,200 ₸</span>
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
              <span class="stat-value">2,450</span>
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
              <span class="stat-value">1,820</span>
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
                <button class="save-btn" (click)="savePersonal()">Сохранить</button>
                <button class="cancel-btn" (click)="cancelEditPersonal()">Отмена</button>
              </div>
            </div>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">Имя</span>
                <span class="info-value" *ngIf="!isEditingPersonal">{{ mockClient.firstName }}</span>
                <input class="info-input" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.firstName">
              </div>
              <div class="info-row">
                <span class="info-label">Фамилия</span>
                <span class="info-value" *ngIf="!isEditingPersonal">{{ mockClient.lastName }}</span>
                <input class="info-input" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.lastName">
              </div>
              <div class="info-row">
                <span class="info-label">Тип клиента</span>
                <span class="info-value" *ngIf="!isEditingPersonal">{{ mockClient.type === 'business' ? 'Бизнес' : 'Индивидуальный' }}</span>
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
                <button class="save-btn" (click)="saveContacts()">Сохранить</button>
                <button class="cancel-btn" (click)="cancelEditContacts()">Отмена</button>
              </div>
            </div>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">Телефон</span>
                <span class="info-value" *ngIf="!isEditingContacts">{{ mockClient.phone }}</span>
                <input class="info-input" *ngIf="isEditingContacts" [(ngModel)]="editedContacts.phone" type="tel">
              </div>
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value email" *ngIf="!isEditingContacts">{{ mockClient.email || 'Не указан' }}</span>
                <input class="info-input" *ngIf="isEditingContacts" [(ngModel)]="editedContacts.email" type="email">
              </div>
            </div>
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
      (confirm)="confirmRefund($event)">
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

  isEditingComment = false;
  editedComment = '';
  
  isEditingTags = false;
  editedTags: string[] = [];
  newTagInput = '';
  showTagsDropdown = false;
  
  // Список доступных тэгов
  availableTags: string[] = [
    'VIP',
    'Постоянный',
    'Новый',
    'Премиум',
    'Скидка 5%',
    'Скидка 10%',
    'Скидка 15%',
    'Скидка 20%',
    'Бизнес',
    'Корпоративный',
    'Партнёр',
    'Оптовик',
    'Лояльный'
  ];
  
  isEditingPersonal = false;
  editedPersonal = {
    firstName: '',
    lastName: '',
    type: 'individual' as 'individual' | 'business'
  };
  
  isEditingContacts = false;
  editedContacts = {
    phone: '',
    email: ''
  };

  // Мок данные клиента
  mockClient: MockClient = {
    firstName: 'Алексей',
    lastName: 'Петров',
    phone: '+7 (777) 123-45-67',
    email: 'alexey.petrov@mail.kz',
    tags: ['VIP', 'Постоянный', 'Скидка 10%'],
    comment: 'Постоянный клиент, предпочитает премиум услуги. Обычно приходит по выходным. Любит получать бонусы.',
    active: true,
    type: 'individual'
  };

  // Мок данные платежей
  payments: PaymentItem[] = [
    { id: 'PAY-156', amount: 12500, bonusEarned: 1250, bonusUsed: 0, paymentMethod: 'card', isRefund: false, date: '13.01.2026', time: '14:32' },
    { id: 'PAY-155', amount: 8750, bonusEarned: 0, bonusUsed: 500, paymentMethod: 'cash', isRefund: false, date: '10.01.2026', time: '11:15' },
    { id: 'PAY-154', amount: 25000, bonusEarned: 2500, bonusUsed: 0, paymentMethod: 'online', isRefund: false, date: '06.01.2026', time: '16:48' },
    { id: 'PAY-153', amount: 15300, bonusEarned: 0, bonusUsed: 2800, paymentMethod: 'card', isRefund: false, date: '30.12.2025', time: '09:22' },
    { id: 'PAY-152', amount: 5000, bonusEarned: 0, bonusUsed: 0, paymentMethod: 'cash', isRefund: true, date: '28.12.2025', time: '15:10' },
    { id: 'PAY-151', amount: 42000, bonusEarned: 4200, bonusUsed: 0, paymentMethod: 'online', isRefund: false, date: '15.12.2025', time: '12:05' },
  ];

  // Refund modal
  showRefundModal = false;
  selectedPaymentForRefund: Payment | null = null;
  
  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Профиль клиента', [
      { label: 'Главная', route: '/home' },
      { label: 'Клиенты', route: '/clients' },
      { label: 'Профиль клиента' }
    ]);
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
    return `${this.mockClient.firstName} ${this.mockClient.lastName}`;
  }

  getInitials(): string {
    return `${this.mockClient.firstName.charAt(0)}${this.mockClient.lastName.charAt(0)}`.toUpperCase();
  }

  // Tags editing
  startEditTags(): void {
    this.editedTags = [...this.mockClient.tags];
    this.isEditingTags = true;
    this.newTagInput = '';
  }

  addTag(): void {
    if (this.newTagInput.trim()) {
      this.mockClient.tags.push(this.newTagInput.trim());
      this.newTagInput = '';
    }
  }

  addTagFromDropdown(tag: string): void {
    if (!this.mockClient.tags.includes(tag)) {
      this.mockClient.tags.push(tag);
    }
    this.showTagsDropdown = false;
  }

  getFilteredTags(): string[] {
    const searchTerm = this.newTagInput.toLowerCase();
    return this.availableTags.filter(tag => 
      !this.mockClient.tags.includes(tag) && 
      (searchTerm === '' || tag.toLowerCase().includes(searchTerm))
    );
  }

  removeTag(index: number): void {
    this.mockClient.tags.splice(index, 1);
  }

  saveTags(): void {
    this.isEditingTags = false;
    this.newTagInput = '';
    this.showTagsDropdown = false;
  }

  cancelEditTags(): void {
    this.mockClient.tags = [...this.editedTags];
    this.isEditingTags = false;
    this.newTagInput = '';
    this.showTagsDropdown = false;
  }

  // Comment editing
  startEditComment(): void {
    this.editedComment = this.mockClient.comment;
    this.isEditingComment = true;
  }

  saveComment(): void {
    this.mockClient.comment = this.editedComment;
    this.isEditingComment = false;
  }

  cancelEditComment(): void {
    this.isEditingComment = false;
    this.editedComment = '';
  }

  // Personal data editing
  startEditPersonal(): void {
    this.editedPersonal = {
      firstName: this.mockClient.firstName,
      lastName: this.mockClient.lastName,
      type: this.mockClient.type
    };
    this.isEditingPersonal = true;
  }

  savePersonal(): void {
    this.mockClient.firstName = this.editedPersonal.firstName;
    this.mockClient.lastName = this.editedPersonal.lastName;
    this.mockClient.type = this.editedPersonal.type;
    this.isEditingPersonal = false;
  }

  cancelEditPersonal(): void {
    this.isEditingPersonal = false;
  }

  // Contacts editing
  startEditContacts(): void {
    this.editedContacts = {
      phone: this.mockClient.phone,
      email: this.mockClient.email
    };
    this.isEditingContacts = true;
  }

  saveContacts(): void {
    this.mockClient.phone = this.editedContacts.phone;
    this.mockClient.email = this.editedContacts.email;
    this.isEditingContacts = false;
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
    this.selectedPaymentForRefund = {
      id: payment.id,
      clientId: this.mockClient.phone.replace(/\D/g, ''), // Use phone as clientId
      clientName: this.getFullName(),
      clientPhone: this.mockClient.phone,
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

  confirmRefund(payment: Payment): void {
    const paymentIndex = this.payments.findIndex(p => p.id === payment.id);
    if (paymentIndex !== -1) {
      this.payments[paymentIndex].isRefund = true;
    }
    this.closeRefundModal();
  }
}
