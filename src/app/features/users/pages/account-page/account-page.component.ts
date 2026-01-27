import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { ProfileService, UserTransaction } from '../../../../core/services/profile.service';
import { PaymentSearchResult } from '../../../../core/services/payments.service';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../../../../core/models/user.model';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { ToastService } from '../../../../core/services/toast.service';
import { PaymentViewModalComponent } from '../../../../shared/components/payment-view-modal/payment-view-modal.component';
import { TransactionModalService } from '../../../../core/services/transaction-modal.service';
import { Subject, takeUntil } from 'rxjs';

interface UserPayment {
  id: string;
  txId: string; // Full transaction ID for API calls
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
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BadgeComponent, ButtonComponent, IconButtonComponent, LoaderComponent, PaymentViewModalComponent],
  template: `
    <div class="page-wrapper">
      <div class="profile-container-wrapper">
        <!-- Loading State -->
        <div class="page-loading-container" *ngIf="isLoading">
          <app-loader [visible]="true" [overlay]="false" type="logo" size="large"></app-loader>
        </div>
        
        <div class="profile-container" *ngIf="profile && !isLoading">
        
        <!-- Profile Header Card -->
        <div class="profile-header-card">
          <div class="profile-header-content">
            <div class="avatar-wrapper">
              <div class="avatar-large">
                {{ getInitials() }}
              </div>
              <div class="status-indicator" [class.active]="profile.active"></div>
            </div>
            <div class="profile-main-info">
              <div class="name-row">
                <h1 class="profile-name">{{ getFullName() }}</h1>
                <app-badge 
                  [badgeType]="getStatusBadgeType(profile.active)" 
                  size="medium">
                  {{ getStatusLabel(profile.active) }}
                </app-badge>
              </div>
              <p class="profile-email">{{ profile.email }}</p>
              <p class="profile-phone" *ngIf="profile.phone">{{ profile.phone }}</p>
              <div class="role-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ getRoleLabel(profile.roles) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal Data Card -->
        <div class="info-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </div>
              <h3 class="card-title">Личные данные</h3>
            </div>
            <app-icon-button
              *ngIf="!isEditingPersonal"
              iconButtonType="edit"
              size="large"
              tooltip="Редактировать"
              (onClick)="startEditPersonal()">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </app-icon-button>
            <div class="card-actions" *ngIf="isEditingPersonal">
              <app-button buttonType="ghost" size="medium" (onClick)="cancelEditPersonal()" [disabled]="isSavingPersonal">
                Отмена
              </app-button>
              <app-button buttonType="primary" size="medium" (onClick)="savePersonal()" [loading]="isSavingPersonal">
                Сохранить
              </app-button>
            </div>
          </div>
          <div class="info-content">
            <div class="info-row">
              <span class="info-label">Имя:</span>
              <span class="info-value" *ngIf="!isEditingPersonal">{{ profile.firstName }}</span>
              <input class="info-input" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.firstName" placeholder="Введите имя">
            </div>
            <div class="info-row">
              <span class="info-label">Фамилия:</span>
              <span class="info-value" *ngIf="!isEditingPersonal">{{ profile.lastName }}</span>
              <input class="info-input" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.lastName" placeholder="Введите фамилию">
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value" *ngIf="!isEditingPersonal">{{ profile.email }}</span>
              <input class="info-input" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.email" type="email" placeholder="Введите email">
            </div>
            <div class="info-row">
              <span class="info-label">Телефон:</span>
              <span class="info-value" *ngIf="!isEditingPersonal">{{ profile.phone || '—' }}</span>
              <input class="info-input" *ngIf="isEditingPersonal" [(ngModel)]="editedPersonal.phone" type="tel" placeholder="Введите телефон">
            </div>
            <div class="info-row">
              <span class="info-label">Роль:</span>
              <span class="info-value">{{ getRoleLabel(profile.roles) }}</span>
            </div>
            <div class="info-row readonly">
              <span class="info-label">Дата регистрации:</span>
              <span class="info-value">{{ formatDate(profile.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Password Change Card -->
        <div class="info-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </div>
              <h3 class="card-title">Безопасность</h3>
            </div>
            <app-icon-button
              *ngIf="!isEditingPassword"
              iconButtonType="edit"
              size="large"
              tooltip="Изменить пароль"
              (onClick)="startEditPassword()">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </app-icon-button>
            <div class="card-actions" *ngIf="isEditingPassword">
              <app-button buttonType="ghost" size="medium" (onClick)="cancelEditPassword()" [disabled]="isSavingPassword">
                Отмена
              </app-button>
              <app-button buttonType="primary" size="medium" (onClick)="savePassword()" [disabled]="!isPasswordFormValid()" [loading]="isSavingPassword">
                Сохранить
              </app-button>
            </div>
          </div>
          <div class="info-content" *ngIf="!isEditingPassword">
            <div class="info-row">
              <span class="info-label">Пароль:</span>
              <span class="info-value">••••••••</span>
            </div>
          </div>
          <div class="password-form" *ngIf="isEditingPassword">
            <div class="error-message server-error" *ngIf="passwordError">
              {{ passwordError }}
            </div>
            <div class="form-group">
              <label class="form-label">Текущий пароль</label>
              <input 
                type="password" 
                class="form-input" 
                [(ngModel)]="passwordData.currentPassword"
                placeholder="Введите текущий пароль">
            </div>
            <div class="form-group">
              <label class="form-label">Новый пароль</label>
              <input 
                type="password" 
                class="form-input" 
                [(ngModel)]="passwordData.newPassword"
                placeholder="Введите новый пароль (минимум 6 символов)">
            </div>
            <div class="form-group">
              <label class="form-label">Подтвердите новый пароль</label>
              <input 
                type="password" 
                class="form-input" 
                [(ngModel)]="passwordData.confirmPassword"
                placeholder="Повторите новый пароль">
              <div class="error-message" *ngIf="passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword">
                Пароли не совпадают
              </div>
            </div>
          </div>
        </div>

        <!-- Payments History Card -->
        <div class="activity-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h3 class="card-title">История операций</h3>
            </div>
          </div>
          <!-- Desktop Table View -->
          <div class="payments-table-container desktop-view">
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
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let payment of userPayments" class="payment-row">
                  <td class="td-id">
                    <span class="payment-id clickable" (click)="openPaymentView(payment.txId)">#{{ payment.txId }}</span>
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
                </tr>
              </tbody>
            </table>
            <div class="empty-state" *ngIf="userPayments.length === 0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.5"/>
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <path d="M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>Нет операций</span>
            </div>
          </div>

          <!-- Mobile Card View -->
          <div class="mobile-payments-cards mobile-view">
            <div class="mobile-payment-card" *ngFor="let payment of userPayments">
              <div class="mobile-payment-card-header" (click)="toggleMobilePaymentCard(payment.id)">
                <div class="mobile-payment-card-main">
                  <div>
                    <div class="mobile-payment-id clickable" (click)="openPaymentView(payment.txId); $event.stopPropagation()">#{{ payment.txId }}</div>
                    <div class="mobile-payment-amount">{{ formatAmount(payment.amount) }} ₸</div>
                  </div>
                </div>
                <div class="mobile-payment-expand" [class.expanded]="isMobilePaymentExpanded(payment.id)">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <div class="mobile-payment-details" [class.expanded]="isMobilePaymentExpanded(payment.id)">
                <div class="detail-row">
                  <span class="detail-label">Клиент:</span>
                  <a [routerLink]="['/clients', payment.clientId]" class="detail-value link">
                    {{ payment.clientName }}
                  </a>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Телефон:</span>
                  <span class="detail-value">{{ payment.clientPhone }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Бонусы:</span>
                  <div class="detail-value bonus-info">
                    <app-badge *ngIf="payment.bonusEarned > 0" badgeType="bonusGranted" size="small">+{{ formatAmount(payment.bonusEarned) }}</app-badge>
                    <app-badge *ngIf="payment.bonusUsed > 0" badgeType="bonusUsed" size="small">-{{ formatAmount(payment.bonusUsed) }}</app-badge>
                    <app-badge *ngIf="payment.bonusRevoked > 0" badgeType="refund" size="small">-{{ formatAmount(payment.bonusRevoked) }}</app-badge>
                    <span *ngIf="payment.bonusEarned === 0 && payment.bonusUsed === 0 && payment.bonusRevoked === 0">—</span>
                  </div>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Способ оплаты:</span>
                  <span class="detail-value">
                    <app-badge 
                      badgeType="paymentMethod" 
                      size="small"
                      [paymentMethod]="getPaymentMethodForBadge(payment.paymentMethod)">
                    </app-badge>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Дата:</span>
                  <span class="detail-value">{{ payment.date }} {{ payment.time }}</span>
                </div>
              </div>
            </div>
            <div class="empty-state mobile-view" *ngIf="userPayments.length === 0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.5"/>
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <path d="M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>Нет операций</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>

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
      background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 50%, #f8fafc 100%);
    }

    .profile-container-wrapper {
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

    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Profile Header Card */
    .profile-header-card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .profile-header-content {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }

    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .avatar-large {
      width: 100px;
      height: 100px;
      border-radius: 20px;
      background: linear-gradient(135deg, #16A34A 0%, #22c55e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
      color: white;
    }

    .status-indicator {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #94a3b8;
      border: 3px solid white;
    }

    .status-indicator.active {
      background: #22c55e;
    }

    .profile-main-info {
      flex: 1;
    }

    .name-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .profile-name {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .profile-email {
      font-size: 1rem;
      color: #64748b;
      margin: 0.5rem 0;
    }

    .profile-phone {
      font-size: 1rem;
      color: #64748b;
      margin: 0.5rem 0;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #f0fdf4;
      color: #16A34A;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9375rem;
      margin-top: 0.75rem;
    }

    .role-badge svg {
      width: 18px;
      height: 18px;
    }

    /* Info Card */
    .info-card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .card-header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .card-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
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
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }


    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .info-row.readonly {
      opacity: 0.7;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #64748b;
      min-width: 150px;
      font-size: 0.9375rem;
    }

    .info-value {
      color: #1f2937;
      font-size: 0.9375rem;
    }

    .info-input {
      flex: 1;
      max-width: 300px;
      padding: 0.625rem 1rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-family: inherit;
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

    /* Password Form */
    .password-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
    }

    .form-input {
      width: 100%;
      max-width: 400px;
      padding: 0.75rem 1rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-family: inherit;
      background: linear-gradient(to bottom, #ffffff, #f8fafc);
      color: #1f2937;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .form-input:hover {
      border-color: #cbd5e1;
      background: linear-gradient(to bottom, #ffffff, #f1f5f9);
    }

    .form-input:focus {
      outline: none;
      border-color: #22c55e;
      background: white;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .form-input::placeholder {
      color: #94a3b8;
      font-weight: 400;
    }

    .error-message {
      font-size: 0.8rem;
      color: #dc2626;
      margin-top: 0.25rem;
    }

    .error-message.server-error {
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    /* Activity Card */
    .activity-card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .payments-table-container {
      overflow-x: auto;
    }

    .payments-table {
      width: 100%;
      border-collapse: collapse;
    }

    .payments-table thead {
      background: #f8fafc;
    }

    .payments-table th {
      padding: 1rem;
      text-align: left;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    .payments-table td {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .payments-table tbody tr:hover {
      background: #f8fafc;
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

    .mobile-payment-id.clickable {
      color: #64748b;
      cursor: pointer;
      text-decoration: underline;
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

    .client-name-link .client-name {
      cursor: pointer;
    }

    .client-phone {
      font-size: 0.8125rem;
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
      color: #94a3b8;
      font-size: 0.875rem;
    }


    .date-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .date-text {
      font-size: 0.875rem;
      color: #1f2937;
      font-weight: 500;
    }

    .time-text {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: #94a3b8;
      gap: 1rem;
    }

    .empty-state svg {
      width: 48px;
      height: 48px;
    }

    .empty-state span {
      font-size: 0.9375rem;
    }

    /* Mobile Card View for Payments */
    .mobile-payments-cards {
      display: none;
      flex-direction: column;
      gap: 1rem;
    }

    .mobile-payment-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
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
      flex-direction: column;
      gap: 0.75rem;
    }

    .mobile-payment-details.expanded {
      display: flex;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .detail-label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
      flex-shrink: 0;
    }

    .detail-value {
      font-size: 0.875rem;
      color: #1f2937;
      font-weight: 500;
      text-align: right;
      flex: 1;
    }

    .detail-value.link {
      color: #16A34A;
      text-decoration: none;
    }

    .detail-value.link:hover {
      text-decoration: underline;
    }

    .detail-value.bonus-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: flex-end;
      flex-wrap: wrap;
    }


    /* Responsive */
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
      }

      .avatar-large {
        width: 80px;
        height: 80px;
        font-size: 1.5rem;
      }

      .profile-main-info {
        width: 100%;
        text-align: center;
      }

      .name-row {
        justify-content: center;
        flex-wrap: wrap;
      }

      .profile-name {
        font-size: 1.25rem;
      }

      .info-card,
      .activity-card {
        border-radius: 12px;
        padding: 1.25rem 1rem;
      }

      .card-header {
        margin-bottom: 1rem;
      }

      .card-title {
        font-size: 1.125rem;
      }

      .info-row {
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

      .info-input {
        max-width: 100%;
      }

      .form-input {
        max-width: 100%;
      }

      /* Hide desktop table on mobile */
      .desktop-view {
        display: none !important;
      }

      /* Show mobile cards */
      .mobile-view {
        display: flex !important;
      }

      .payments-table-container {
        padding: 0;
      }
    }

    /* Hide mobile view on desktop */
    @media (min-width: 769px) {
      .mobile-view {
        display: none !important;
      }

      .desktop-view {
        display: block !important;
      }
    }
  `]
})
export class AccountPageComponent implements OnInit, OnDestroy {
  private pageHeaderService = inject(PageHeaderService);
  private profileService = inject(ProfileService);
  private toastService = inject(ToastService);
  private transactionModalService = inject(TransactionModalService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Profile data
  profile: UserProfile | null = null;
  isLoading = true;

  // User payments (mock data for now)
  userPayments: UserPayment[] = [];
  expandedMobilePaymentCards = new Set<string>();

  // Edit states
  isEditingPersonal = false;
  isSavingPersonal = false;
  editedPersonal = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  isEditingPassword = false;
  isSavingPassword = false;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordError: string | null = null;

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Личный кабинет', [
      { label: 'Главная', route: '/home' },
      { label: 'Профиль' }
    ]);
    this.loadProfile();

    // Subscribe to transaction completion events
    this.transactionModalService.transactionComplete$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload profile and transactions when on /profile route
        const currentUrl = this.router.url;
        if (currentUrl === '/profile' || currentUrl.startsWith('/profile')) {
          this.loadProfile();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile(): void {
    this.isLoading = true;
    
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        console.log('[AccountPage] Profile loaded:', profile);
        console.log('[AccountPage] Profile firstName:', profile.firstName);
        console.log('[AccountPage] Profile lastName:', profile.lastName);
        console.log('[AccountPage] Profile email:', profile.email);
        this.profile = profile;
        this.isLoading = false;
        // Load user transactions after profile is loaded
        this.loadUserTransactions();
      },
      error: (err) => {
        console.error('[AccountPage] Error loading profile:', err);
        const errorMessage = err.error?.message || 'Ошибка загрузки профиля';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  getFullName(): string {
    if (!this.profile) return '';
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }

  getInitials(name?: string): string {
    if (name) {
      const parts = name.split(' ');
      return parts.map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    if (!this.profile) return '';
    return `${this.profile.firstName.charAt(0)}${this.profile.lastName.charAt(0)}`.toUpperCase();
  }

  getStatusBadgeType(active: boolean): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
    return active ? 'success' : 'danger';
  }

  getStatusLabel(active: boolean): string {
    return active ? 'Активный' : 'Неактивный';
  }

  getRoleLabel(roles: string[]): string {
    if (roles.includes('ADMIN')) return 'Администратор';
    if (roles.includes('MANAGER')) return 'Менеджер';
    return 'Пользователь';
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
    switch (method) {
      case 'cash':
        return 'Наличные';
      case 'card':
        return 'Карта';
      case 'transfer':
        return 'Перевод';
      default:
        return method;
    }
  }

  // Personal Data Editing
  startEditPersonal(): void {
    if (!this.profile) return;
    this.editedPersonal = {
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      email: this.profile.email,
      phone: this.profile.phone || ''
    };
    this.isEditingPersonal = true;
  }

  savePersonal(): void {
    if (!this.profile) return;
    
    this.isSavingPersonal = true;
    
    const updateData: UpdateProfileRequest = {
      email: this.editedPersonal.email,
      firstName: this.editedPersonal.firstName,
      lastName: this.editedPersonal.lastName,
      phone: this.editedPersonal.phone || undefined
    };

    this.profileService.updateProfile(updateData).subscribe({
      next: (updatedProfile) => {
        this.profile = updatedProfile;
        this.isEditingPersonal = false;
        this.isSavingPersonal = false;
        this.toastService.success('Профиль успешно обновлен');
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка сохранения профиля';
        this.toastService.error(errorMessage);
        this.isSavingPersonal = false;
      }
    });
  }

  cancelEditPersonal(): void {
    this.isEditingPersonal = false;
    this.editedPersonal = {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    };
  }

  // Password Editing
  startEditPassword(): void {
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.isEditingPassword = true;
    this.passwordError = null;
  }

  savePassword(): void {
    if (!this.isPasswordFormValid()) return;
    
    this.isSavingPassword = true;
    this.passwordError = null;
    
    const passwordRequest: ChangePasswordRequest = {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword,
      confirmPassword: this.passwordData.confirmPassword
    };

    this.profileService.changePassword(passwordRequest).subscribe({
      next: () => {
        this.isEditingPassword = false;
        this.isSavingPassword = false;
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.toastService.success('Пароль успешно изменен');
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка смены пароля';
        this.passwordError = errorMessage;
        this.toastService.error(errorMessage);
        this.isSavingPassword = false;
      }
    });
  }

  cancelEditPassword(): void {
    this.isEditingPassword = false;
    this.passwordError = null;
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  isPasswordFormValid(): boolean {
    return !!(
      this.passwordData.currentPassword &&
      this.passwordData.newPassword &&
      this.passwordData.confirmPassword &&
      this.passwordData.newPassword === this.passwordData.confirmPassword &&
      this.passwordData.newPassword.length >= 6
    );
  }

  loadUserTransactions(): void {
    this.profileService.getUserTransactions().subscribe({
      next: (transactions) => {
        console.log('[AccountPage] User transactions loaded:', transactions);
        this.userPayments = transactions.map(t => this.mapTransactionToPayment(t));
      },
      error: (err) => {
        console.error('[AccountPage] Error loading user transactions:', err);
        // Don't show error toast, just log it - transactions are not critical
        this.userPayments = [];
      }
    });
  }

  mapTransactionToPayment(transaction: UserTransaction): UserPayment {
    const date = new Date(transaction.createdAt);
    const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Parse payment method
    let paymentMethod: 'cash' | 'card' | 'transfer' = 'cash';
    if (transaction.paymentMethod) {
      const method = transaction.paymentMethod.toLowerCase();
      if (method.includes('card') || method.includes('карт')) {
        paymentMethod = 'card';
      } else if (method.includes('transfer') || method.includes('перевод')) {
        paymentMethod = 'transfer';
      }
    }

    return {
      id: transaction.txId, // Keep full txId for display
      txId: transaction.txId, // Keep full txId for API calls
      clientId: transaction.clientId,
      clientName: transaction.clientName,
      clientPhone: transaction.clientPhone,
      amount: transaction.amount,
      bonusEarned: transaction.bonusGranted,
      bonusUsed: transaction.bonusUsed,
      bonusRevoked: transaction.bonusRevoked || 0,
      paymentMethod: paymentMethod,
      isRefund: transaction.status === 'REFUNDED' || transaction.refundedPaymentTxId !== null,
      date: dateStr,
      time: timeStr
    };
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

  // Payment view modal
  showPaymentViewModal = false;
  selectedPaymentTxId: string | null = null;
  selectedPaymentSearchResult: PaymentSearchResult | null = null;

  openPaymentView(paymentId: string): void {
    const payment = this.userPayments.find(p => p.txId === paymentId);
    if (payment) {
      this.selectedPaymentSearchResult = {
        txId: payment.txId,
        clientId: payment.clientId,
        clientName: payment.clientName,
        clientPhone: payment.clientPhone,
        clientEmail: null,
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

  closePaymentView(): void {
    this.showPaymentViewModal = false;
    this.selectedPaymentTxId = null;
    this.selectedPaymentSearchResult = null;
  }

  onPaymentUpdated(): void {
    // Reload user transactions after update
    this.loadUserTransactions();
  }
}
