import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../core/store/app.state';
import { selectUser } from '../../../../core/store/auth/auth.selectors';
import { User } from '../../../../core/models/user.model';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { TransactionModalService } from '../../../../core/services/transaction-modal.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

interface KpiCard {
  icon: string;
  iconBg: string;
  value: string;
  label: string;
  change?: string;
  changeType?: 'positive' | 'negative';
}

interface RecentClient {
  id: string;
  name: string;
  phone: string;
  lastOperation: string;
  amount: string;
  date: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <button class="new-transaction-btn" (click)="openTransactionModal()">
          <svg viewBox="0 0 24 24" fill="none" class="btn-icon">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Новая транзакция
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" *ngFor="let kpi of kpiCards">
          <div class="kpi-header">
            <div class="kpi-icon" [style.background]="kpi.iconBg">
              <span [innerHTML]="kpi.icon"></span>
            </div>
            <span class="kpi-change" *ngIf="kpi.change" [class.positive]="kpi.changeType === 'positive'" [class.negative]="kpi.changeType === 'negative'">
              {{ kpi.change }}
            </span>
          </div>
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Line Chart -->
        <div class="chart-card line-chart-card">
          <div class="chart-container">
            <div class="chart-y-axis">
              <span>24 000</span>
              <span>22 000</span>
              <span>20 000</span>
              <span>18 000</span>
              <span>16 000</span>
              <span>14 000</span>
              <span>12 000</span>
            </div>
            <div class="chart-area">
              <svg viewBox="0 0 600 300" preserveAspectRatio="none" class="line-chart">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#22c55e;stop-opacity:0.02" />
                  </linearGradient>
                </defs>
                <!-- Area fill -->
                <path d="M0,280 Q150,250 300,180 T600,20 L600,300 L0,300 Z" fill="url(#chartGradient)" />
                <!-- Line -->
                <path d="M0,280 Q150,250 300,180 T600,20" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/>
                <!-- Start point -->
                <circle cx="0" cy="280" r="6" fill="#22c55e"/>
                <!-- End point -->
                <circle cx="600" cy="20" r="6" fill="white" stroke="#22c55e" stroke-width="3"/>
              </svg>
              <div class="chart-x-axis">
                <span>22:00</span>
                <span>22:00</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Donut Chart -->
        <div class="chart-card donut-chart-card">
          <h3 class="chart-title">Бонусный баланс</h3>
          <div class="donut-container">
            <svg viewBox="0 0 200 200" class="donut-chart">
              <circle cx="100" cy="100" r="70" fill="none" stroke="#e8f5e9" stroke-width="24"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke="#15803d" stroke-width="24" 
                      stroke-dasharray="330 440" stroke-linecap="round" 
                      transform="rotate(-90 100 100)"/>
            </svg>
          </div>
          <div class="donut-legend">
            <div class="legend-item">
              <span class="legend-color active"></span>
              <span class="legend-label">Активные</span>
            </div>
            <div class="legend-item">
              <span class="legend-color forecast"></span>
              <span class="legend-label">Прогноз</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Clients Table -->
      <div class="table-section">
        <div class="table-header">
          <h3 class="table-title">Последние операции</h3>
          <a routerLink="/clients" class="view-all-link">Смотреть всех →</a>
        </div>
        <div class="table-card">
          <table class="clients-table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Телефон</th>
                <th>Последняя операция</th>
                <th>Сумма</th>
                <th>Дата</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let client of recentClients" class="table-row" (click)="goToClient(client.id)">
                <td>
                  <div class="client-info">
                    <div class="client-avatar">{{ getInitials(client.name) }}</div>
                    <span class="client-name">{{ client.name }}</span>
                  </div>
                </td>
                <td class="client-phone">{{ client.phone }}</td>
                <td>
                  <app-badge [badgeType]="getOperationBadgeType(client.lastOperation)" size="medium">
                    {{ client.lastOperation }}
                  </app-badge>
                </td>
                <td class="client-amount">{{ client.amount }}</td>
                <td class="client-date">{{ client.date }}</td>
                <td class="client-action">
                  <button class="action-btn" (click)="goToClient(client.id); $event.stopPropagation()">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .page-wrapper {
      min-height: 100%;
      margin: -2rem;
      padding: 2rem;
      background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 50%, #f8fafc 100%);
    }

    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .dashboard-header {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .dashboard-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.25rem 0;
    }

    .dashboard-subtitle {
      font-size: 0.9375rem;
      color: #64748b;
      margin: 0;
    }

    .new-transaction-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #15803d;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .new-transaction-btn:hover {
      background: #166534;
    }

    .new-transaction-btn .btn-icon {
      width: 18px;
      height: 18px;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 1200px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }

    .kpi-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 3px 6px rgba(0, 0, 0, 0.03);
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .kpi-change {
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.25rem 0.625rem;
      border-radius: 20px;
      background: #f0fdf4;
      color: #15803d;
    }

    .kpi-change.positive {
      background: #f0fdf4;
      color: #15803d;
    }

    .kpi-change.negative {
      background: #fef2f2;
      color: #dc2626;
    }

    .kpi-value {
      font-size: 2rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }

    .kpi-label {
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Charts Section */
    .charts-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 1024px) {
      .charts-section {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .chart-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 1.5rem 0;
    }

    /* Line Chart */
    .line-chart-card {
      min-height: 350px;
    }

    .chart-container {
      display: flex;
      height: 280px;
    }

    .chart-y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding-right: 1rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .chart-area {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .line-chart {
      flex: 1;
      width: 100%;
    }

    .chart-x-axis {
      display: flex;
      justify-content: space-between;
      padding-top: 0.5rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Donut Chart */
    .donut-chart-card {
      display: flex;
      flex-direction: column;
    }

    .donut-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .donut-chart {
      width: 180px;
      height: 180px;
    }

    .donut-legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      padding-top: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .legend-color.active {
      background: #15803d;
    }

    .legend-color.forecast {
      background: #dcfce7;
    }

    /* Table Section */
    .table-section {
      margin-bottom: 2rem;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .table-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }

    .view-all-link {
      font-size: 0.875rem;
      color: #15803d;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .view-all-link:hover {
      color: #166534;
    }

    .table-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .clients-table {
      width: 100%;
      border-collapse: collapse;
    }

    .clients-table th {
      text-align: left;
      padding: 1rem 1.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .clients-table td {
      padding: 1rem 1.5rem;
      font-size: 0.9375rem;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }

    .table-row {
      cursor: pointer;
    }

    .table-row:last-child td {
      border-bottom: none;
    }

    .client-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .client-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #15803d, #22c55e);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .client-name {
      font-weight: 500;
      color: #0f172a;
    }

    .client-phone {
      color: #64748b;
    }

    .client-amount {
      font-weight: 600;
      color: #0f172a;
    }

    .client-date {
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .client-action {
      text-align: right;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f1f5f9;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
      color: #64748b;
    }

    @media (max-width: 768px) {
      .page-wrapper {
        margin: -1rem;
        padding: 1rem;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 1rem;
      }

      .new-transaction-btn {
        width: 100%;
        justify-content: center;
      }

      .clients-table {
        display: block;
        overflow-x: auto;
      }
    }
  `]
})
export class HomePageComponent implements OnInit {
  user$: Observable<User | null>;
  private pageHeaderService = inject(PageHeaderService);
  transactionModalService = inject(TransactionModalService);

  // KPI Cards Data
  kpiCards: KpiCard[] = [
    {
      icon: '₸',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '35 634 ₸',
      label: 'Выручка за сегодня',
      change: '+24%',
      changeType: 'positive'
    },
    {
      icon: '🎁',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '3 563',
      label: 'Бонусов начислено'
    },
    {
      icon: '👥',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '2',
      label: 'Новых клиентов',
      change: '+5',
      changeType: 'positive'
    },
    {
      icon: '📋',
      iconBg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      value: '17 817',
      label: 'Средний чек'
    }
  ];

  // Recent Clients Data
  recentClients: RecentClient[] = [
    {
      id: '1',
      name: 'Иванов Иван',
      phone: '+7 (999) 123-45-67',
      lastOperation: 'Оплата',
      amount: '12 500 ₸',
      date: '5 янв, 21:30'
    },
    {
      id: '2',
      name: 'Петрова Анна',
      phone: '+7 (999) 234-56-78',
      lastOperation: 'Бонусы',
      amount: '3 200 ₸',
      date: '5 янв, 20:15'
    },
    {
      id: '3',
      name: 'Сидоров Петр',
      phone: '+7 (999) 345-67-89',
      lastOperation: 'Оплата',
      amount: '8 750 ₸',
      date: '5 янв, 19:45'
    },
    {
      id: '4',
      name: 'Козлова Мария',
      phone: '+7 (999) 456-78-90',
      lastOperation: 'Возврат',
      amount: '1 500 ₸',
      date: '5 янв, 18:20'
    },
    {
      id: '5',
      name: 'Новиков Алексей',
      phone: '+7 (999) 567-89-01',
      lastOperation: 'Оплата',
      amount: '25 000 ₸',
      date: '5 янв, 17:00'
    }
  ];

  constructor(private store: Store<AppState>) {
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Панель управления', [
      { label: 'Главная' }
    ]);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getOperationBadgeType(operation: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' {
    const types: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Оплата': 'success',
      'Бонусы': 'primary',
      'Возврат': 'warning'
    };
    return types[operation] || 'secondary';
  }

  goToClient(clientId: string): void {
    console.log('Navigate to client:', clientId);
    // router.navigate(['/clients', clientId]);
  }

  openTransactionModal(): void {
    this.transactionModalService.open();
  }

  }
