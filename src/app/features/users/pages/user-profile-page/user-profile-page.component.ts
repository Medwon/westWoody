import { Component, OnInit, AfterViewInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { UsersService, UserStatus } from '../../../../core/services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TransactionModalService } from '../../../../core/services/transaction-modal.service';
import { Subject, takeUntil } from 'rxjs';
import { User as ApiUser, UserRole, UserTransaction } from '../../../../core/models/user.model';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { NotFoundStateComponent } from '../../../../shared/components/not-found-state/not-found-state.component';
import { PaymentViewModalComponent } from '../../../../shared/components/payment-view-modal/payment-view-modal.component';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format.pipe';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: 'invited' | 'active' | 'closed';
  createdAt: string;
}

interface UserPayment {
  id: string;
  txId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  amount: number;
  bonusEarned: number;
  bonusUsed: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | string;
  isRefund: boolean;
  date: string;
  time: string;
}

@Component({
  selector: 'app-user-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent, LoaderComponent, NotFoundStateComponent, PaymentViewModalComponent, PhoneFormatPipe],
  template: `
    <div class="page-wrapper">
      <div class="profile-container-wrapper">
        <!-- Loading State -->
        <div class="page-loading-container" *ngIf="isLoading">
          <app-loader [visible]="true" [overlay]="false" type="logo" size="large"></app-loader>
        </div>

      <!-- Not Found State -->
      <app-not-found-state
        *ngIf="!isLoading && userNotFound"
        title="Пользователь не найден"
        description="К сожалению, запрашиваемый пользователь не существует или был удален."
        backLink="/users"
        backText="Вернуться к пользователям">
      </app-not-found-state>

      <div class="profile-container" *ngIf="!isLoading && user && !userNotFound">
        
        <!-- Profile Header Card -->
        <div class="profile-header-card">
          <div class="profile-header-content">
              <div class="avatar-wrapper">
              <div class="avatar-large">
                {{ getInitials() }}
              </div>
              <div class="status-indicator" [class.online]="userStatus?.isOnline" [class.offline]="!userStatus?.isOnline"></div>
            </div>
            <div class="profile-main-info">
              <div class="name-row">
                <h1 class="profile-name">{{ getFullName() }}</h1>
                <app-badge 
                  [badgeType]="getStatusBadgeType(user.status)" 
                  size="medium">
                  {{ getStatusLabel(user.status) }}
                </app-badge>
              </div>
              <p class="profile-email">{{ user.email }}</p>
              <p class="profile-phone" *ngIf="user.phoneNumber">{{ user.phoneNumber | phoneFormat }}</p>
              <div class="role-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ user.role }}</span>
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
          </div>
          <div class="info-content">
            <div class="info-row">
              <span class="info-label">Имя:</span>
              <span class="info-value">{{ user.firstName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Фамилия:</span>
              <span class="info-value">{{ user.lastName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">{{ user.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Телефон:</span>
              <span class="info-value">{{ user.phoneNumber || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Роль:</span>
              <span class="info-value">{{ user.role }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Дата регистрации:</span>
              <span class="info-value">{{ formatDate(user.createdAt) }}</span>
            </div>
            <div class="info-row" *ngIf="userStatus">
              <span class="info-label">Статус:</span>
              <span class="info-value">
                <span class="status-badge" [class.online]="userStatus.isOnline" [class.offline]="!userStatus.isOnline">
                  <span class="status-dot"></span>
                  {{ userStatus.isOnline ? 'Онлайн' : 'Офлайн' }}
                </span>
              </span>
            </div>
            <div class="info-row" *ngIf="userStatus?.lastSeenAt">
              <span class="info-label">Последний раз онлайн:</span>
              <span class="info-value">{{ formatLastSeen(userStatus?.lastSeenAt || null) }}</span>
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
                    <span class="payment-id clickable" (click)="openPaymentView(payment.txId || payment.id)">#{{ payment.txId || payment.id }}</span>
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
                        *ngIf="getBonusGranted(payment) > 0"
                        badgeType="bonusGranted" 
                        size="medium"
                        icon="star"
                        class="bonus-badge">
                        +{{ formatAmount(getBonusGranted(payment)) }}
                      </app-badge>
                      <app-badge 
                        *ngIf="getBonusUsed(payment) > 0"
                        badgeType="bonusUsed" 
                        size="medium"
                        icon="check"
                        class="bonus-badge">
                        -{{ formatAmount(getBonusUsed(payment)) }}
                      </app-badge>
                      <span class="bonus-none" *ngIf="getBonusGranted(payment) === 0 && getBonusUsed(payment) === 0">—</span>
                    </div>
                  </td>
                  <td class="td-method">
                    <app-badge 
                      badgeType="paymentMethod" 
                      size="medium"
                      [paymentMethod]="getPaymentMethodForBadge(getPaymentMethod(payment))">
                    </app-badge>
                  </td>
                  <td class="td-status">
                    <app-badge 
                      [badgeType]="isRefunded(payment) ? 'refund' : 'payment'" 
                      size="medium"
                      [icon]="isRefunded(payment) ? 'refund' : 'payment'">
                      {{ isRefunded(payment) ? 'Возврат' : 'Оплачено' }}
                    </app-badge>
                  </td>
                  <td class="td-date">
                    <div class="date-info">
                      <span class="date-text">{{ getFormattedDate(payment) }}</span>
                      <span class="time-text">{{ getFormattedTime(payment) }}</span>
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
              <div class="mobile-payment-card-header" (click)="toggleMobilePaymentCard(payment.txId || payment.id)">
                <div class="mobile-payment-card-main">
                  <div>
                    <div class="mobile-payment-id clickable" (click)="openPaymentView(payment.txId || payment.id); $event.stopPropagation()">#{{ payment.txId || payment.id }}</div>
                    <div class="mobile-payment-amount">{{ formatAmount(payment.amount) }} ₸</div>
                  </div>
                </div>
                <div class="mobile-payment-expand" [class.expanded]="isMobilePaymentExpanded(payment.txId || payment.id)">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <div class="mobile-payment-details" [class.expanded]="isMobilePaymentExpanded(payment.txId || payment.id)">
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
                    <app-badge *ngIf="getBonusGranted(payment) > 0" badgeType="bonusGranted" size="small">+{{ formatAmount(getBonusGranted(payment)) }}</app-badge>
                    <app-badge *ngIf="getBonusUsed(payment) > 0" badgeType="bonusUsed" size="small">-{{ formatAmount(getBonusUsed(payment)) }}</app-badge>
                    <span *ngIf="getBonusGranted(payment) === 0 && getBonusUsed(payment) === 0">—</span>
                  </div>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Способ оплаты:</span>
                  <span class="detail-value">
                    <app-badge 
                      badgeType="paymentMethod" 
                      size="small"
                      [paymentMethod]="getPaymentMethodForBadge(getPaymentMethod(payment))">
                    </app-badge>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Дата:</span>
                  <span class="detail-value">{{ getFormattedDate(payment) }} {{ getFormattedTime(payment) }}</span>
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

    .status-indicator.online {
      background: #22c55e;
    }

    .status-indicator.offline {
      background: #94a3b8;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-badge.online {
      background: #f0fdf4;
      color: #16A34A;
    }

    .status-badge.offline {
      background: #f1f5f9;
      color: #64748b;
    }

    .status-badge .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-badge.online .status-dot {
      background: #16A34A;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
    }

    .status-badge.offline .status-dot {
      background: #94a3b8;
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
      font-weight: 600;
      color: #1f2937;
      font-size: 0.9375rem;
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
export class UserProfilePageComponent implements OnInit, AfterViewInit, OnDestroy {
  private pageHeaderService = inject(PageHeaderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private usersService = inject(UsersService);
  private toastService = inject(ToastService);
  private transactionModalService = inject(TransactionModalService);
  private destroy$ = new Subject<void>();

  user: User | null = null;
  userPayments: UserPayment[] = [];
  isLoading = true;
  userNotFound = false;
  userStatus: { isOnline: boolean; lastSeenAt: string | null } | null = null;
  expandedMobilePaymentCards = new Set<string>();

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.pageHeaderService.setPageHeader('Профиль пользователя', [
        { label: 'Главная', route: '/home' },
        { label: 'Пользователи', route: '/users' },
        { label: 'Профиль пользователя' }
      ]);
      this.loadUser(userId);
      this.loadTransactions(userId);
      this.loadUserStatus(userId);
    } else {
      this.isLoading = false;
      this.toastService.error('ID пользователя не указан');
    }

    // Subscribe to transaction completion events
    this.transactionModalService.transactionComplete$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Reload user transactions when on user profile route
        const currentUrl = this.router.url;
        const userId = this.route.snapshot.paramMap.get('id');
        if (currentUrl.startsWith('/users/') && userId) {
          this.loadTransactions(userId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(userId: string): void {
    this.usersService.getUserById(userId).subscribe({
      next: (apiUser) => {
        this.user = this.mapApiUserToUser(apiUser);
        
        // Update page title with user name
        const userName = `${this.user.firstName}${this.user.lastName ? ' ' + this.user.lastName : ''}`.trim();
        this.titleService.setTitle(`Westwood - User - ${userName}`);
        
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.userNotFound = true;
          this.isLoading = false;
          return;
        }
        const errorMessage = err.error?.message || 'Ошибка загрузки пользователя';
        this.toastService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  loadTransactions(userId: string): void {
    this.usersService.getUserTransactions(userId).subscribe({
      next: (transactions) => {
        this.userPayments = transactions.map(tx => this.mapTransactionToPayment(tx));
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка загрузки транзакций';
        this.toastService.error(errorMessage);
      }
    });
  }

  loadUserStatus(userId: string): void {
    this.usersService.getUserStatus(userId).subscribe({
      next: (status) => {
        this.userStatus = {
          isOnline: status.isOnline,
          lastSeenAt: status.lastSeenAt
        };
      },
      error: (err) => {
        console.error('Error loading user status:', err);
      }
    });
  }

  formatLastSeen(lastSeenAt: string | null): string {
    if (!lastSeenAt) {
      return 'Никогда';
    }
    
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Только что';
    }
    if (diffMins < 60) {
      return `${diffMins} мин назад`;
    }
    if (diffHours < 24) {
      return `${diffHours} ч назад`;
    }
    if (diffDays < 7) {
      return `${diffDays} дн назад`;
    }
    
    return lastSeen.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  mapApiUserToUser(apiUser: ApiUser): User {
    return {
      id: apiUser.id,
      firstName: apiUser.firstName,
      lastName: apiUser.lastName,
      email: apiUser.email,
      phoneNumber: apiUser.phone || '—',
      role: this.getRoleLabel(apiUser.roles),
      status: this.mapAccountStatusToStatus(apiUser.accountStatus, apiUser.active),
      createdAt: apiUser.createdAt || ''
    };
  }

  mapAccountStatusToStatus(accountStatus?: string, active?: boolean): 'invited' | 'active' | 'closed' {
    if (accountStatus === 'PENDING_ACTIVATION') {
      return 'invited';
    }
    if (active === false) {
      return 'closed';
    }
    return 'active';
  }

  getRoleLabel(roles: UserRole[]): string {
    if (roles.includes('SUDO')) return 'Супер администратор';
    if (roles.includes('ADMIN')) return 'Администратор';
    if (roles.includes('MANAGER')) return 'Менеджер';
    return roles.join(', ');
  }

  mapTransactionToPayment(tx: UserTransaction): UserPayment {
    const date = new Date(tx.createdAt);
    return {
      id: tx.txId,
      clientId: tx.clientId,
      clientName: tx.clientName,
      clientPhone: tx.clientPhone,
      amount: tx.amount,
      bonusEarned: tx.bonusGranted,
      bonusUsed: tx.bonusUsed,
      paymentMethod: tx.paymentMethod || 'unknown',
      isRefund: tx.status === 'REFUNDED',
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
  }

  getBonusGranted(payment: UserPayment): number {
    return payment.bonusEarned || 0;
  }

  getBonusUsed(payment: UserPayment): number {
    return payment.bonusUsed || 0;
  }

  getPaymentMethod(payment: UserPayment): string {
    return payment.paymentMethod || 'unknown';
  }

  isRefunded(payment: UserPayment): boolean {
    return payment.isRefund || false;
  }

  getFormattedDate(payment: UserPayment): string {
    return payment.date || '';
  }

  getFormattedTime(payment: UserPayment): string {
    return payment.time || '';
  }

  ngAfterViewInit(): void {
    const sidebarContent = document.querySelector('.sidebar-content');
    if (sidebarContent) {
      sidebarContent.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }

  getFullName(): string {
    if (!this.user) return '';
    return `${this.user.firstName} ${this.user.lastName}`;
  }

  getInitials(name?: string): string {
    if (name) {
      const parts = name.split(' ');
      return parts.map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    if (!this.user) return '';
    return `${this.user.firstName.charAt(0)}${this.user.lastName.charAt(0)}`.toUpperCase();
  }

  getStatusBadgeType(status: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'active':
        return 'success';
      case 'invited':
        return 'warning';
      case 'closed':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'invited':
        return 'Приглашен';
      case 'active':
        return 'Активный';
      case 'closed':
        return 'Закрытый';
      default:
        return status;
    }
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

  openPaymentView(paymentId: string): void {
    this.selectedPaymentTxId = paymentId;
    this.showPaymentViewModal = true;
  }

  closePaymentView(): void {
    this.showPaymentViewModal = false;
    this.selectedPaymentTxId = null;
  }

  onPaymentUpdated(): void {
    // Reload user payments after update
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadTransactions(userId);
    }
  }
}

