import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

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
}

@Component({
  selector: 'app-user-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent],
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
              <div class="status-indicator" [class.active]="mockUser.status === 'active'"></div>
            </div>
            <div class="profile-main-info">
              <div class="name-row">
                <h1 class="profile-name">{{ getFullName() }}</h1>
                <app-badge 
                  [badgeType]="getStatusBadgeType(mockUser.status)" 
                  size="medium">
                  {{ getStatusLabel(mockUser.status) }}
                </app-badge>
              </div>
              <p class="profile-email">{{ mockUser.email }}</p>
              <p class="profile-phone">{{ mockUser.phoneNumber }}</p>
              <div class="role-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ mockUser.role }}</span>
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
              <span class="info-value">{{ mockUser.firstName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Фамилия:</span>
              <span class="info-value">{{ mockUser.lastName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">{{ mockUser.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Телефон:</span>
              <span class="info-value">{{ mockUser.phoneNumber }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Роль:</span>
              <span class="info-value">{{ mockUser.role }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Дата регистрации:</span>
              <span class="info-value">{{ formatDate(mockUser.createdAt) }}</span>
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
          <div class="payments-table-container">
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
                    <span class="payment-id">#{{ payment.id }}</span>
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
        </div>

      </div>
    </div>
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
      background: linear-gradient(135deg, #15803d 0%, #22c55e 100%);
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
      color: #15803d;
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
      color: #15803d;
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
      color: #15803d;
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
      color: #15803d;
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

    .method-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .method-cash {
      background: #fef3c7;
      color: #92400e;
    }

    .method-card {
      background: #dbeafe;
      color: #1e40af;
    }

    .method-online {
      background: #dcfce7;
      color: #166534;
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
  `]
})
export class UserProfilePageComponent implements OnInit, AfterViewInit {
  private pageHeaderService = inject(PageHeaderService);
  private route = inject(ActivatedRoute);

  mockUser: User = {
    id: '1',
    firstName: 'Иван',
    lastName: 'Иванов',
    email: 'ivan@example.com',
    phoneNumber: '+7 (777) 123-45-67',
    role: 'Администратор',
    status: 'active',
    createdAt: '2024-01-15'
  };

  userPayments: UserPayment[] = [
    {
      id: 'PAY-001',
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
      id: 'PAY-002',
      clientId: '2',
      clientName: 'Мария Сидорова',
      clientPhone: '+7 (777) 234-56-78',
      amount: 8750,
      bonusEarned: 0,
      bonusUsed: 500,
      paymentMethod: 'cash',
      isRefund: false,
      date: '15.01.2025',
      time: '15:45'
    },
    {
      id: 'PAY-003',
      clientId: '3',
      clientName: 'Дмитрий Козлов',
      clientPhone: '+7 (777) 345-67-89',
      amount: 25000,
      bonusEarned: 250,
      bonusUsed: 0,
      paymentMethod: 'online',
      isRefund: false,
      date: '14.01.2025',
      time: '10:20'
    },
    {
      id: 'PAY-004',
      clientId: '4',
      clientName: 'Елена Новикова',
      clientPhone: '+7 (777) 456-78-90',
      amount: 15300,
      bonusEarned: 0,
      bonusUsed: 2800,
      paymentMethod: 'card',
      isRefund: false,
      date: '13.01.2025',
      time: '16:10'
    }
  ];

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      // TODO: Load user data by ID
      this.pageHeaderService.setPageHeader('Профиль пользователя', [
        { label: 'Главная', route: '/home' },
        { label: 'Пользователи', route: '/users' },
        { label: 'Профиль пользователя' }
      ]);
    }
  }

  ngAfterViewInit(): void {
    const sidebarContent = document.querySelector('.sidebar-content');
    if (sidebarContent) {
      sidebarContent.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }

  getFullName(): string {
    return `${this.mockUser.firstName} ${this.mockUser.lastName}`;
  }

  getInitials(name?: string): string {
    if (name) {
      const parts = name.split(' ');
      return parts.map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    return `${this.mockUser.firstName.charAt(0)}${this.mockUser.lastName.charAt(0)}`.toUpperCase();
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

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'cash':
        return 'Наличные';
      case 'card':
        return 'Карта';
      case 'online':
        return 'Онлайн';
      default:
        return method;
    }
  }
}

