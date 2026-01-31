import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PageHeaderService } from '../../../../core/services/page-header.service';
import { ClientsService } from '../../../../core/services/clients.service';
import { BonusesService } from '../../../../core/services/bonuses.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format.pipe';

interface ClientResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  type: 'individual' | 'business';
  tags: string[];
}

@Component({
  selector: 'app-bonus-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoaderComponent, PhoneFormatPipe],
  template: `
    <div class="bonus-management-page">
      <!-- Search Section -->
      <div class="search-section">
        <div class="search-header">
          <h2>Поиск клиента</h2>
          <p>Введите номер телефона для поиска клиента</p>
        </div>
        
        <div class="search-form">
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input 
              type="tel"
              [(ngModel)]="searchPhone"
              (keydown.enter)="searchClient()"
              placeholder="+7 (___) ___-__-__"
              class="search-input"
              [disabled]="isSearching">
            <button 
              class="search-btn" 
              (click)="searchClient()"
              [disabled]="!searchPhone.trim() || isSearching">
              <span *ngIf="isSearching" class="spinner"></span>
              <span *ngIf="!isSearching">Найти</span>
            </button>
          </div>
          <p class="search-hint">Пример: +77001234567 или 87001234567</p>
        </div>
      </div>

      <!-- No Result -->
      <div class="no-result" *ngIf="searchPerformed && !client && !isSearching">
        <div class="no-result-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 15s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3>Клиент не найден</h3>
        <p>Проверьте правильность введенного номера телефона</p>
      </div>

      <!-- Client Card & Bonus Management -->
      <div class="content-grid" *ngIf="client">
        <!-- Client Info Card -->
        <div class="client-card">
          <div class="client-card-header">
            <div class="client-avatar">
              {{ getInitials() }}
            </div>
            <div class="client-info">
              <h3 class="client-name">{{ client.firstName }} {{ client.lastName || '' }}</h3>
              <p class="client-phone">{{ client.phone | phoneFormat }}</p>
              <span class="client-type-badge" [class.business]="client.type === 'business'">
                {{ client.type === 'business' ? 'Бизнес' : 'Индивидуальный' }}
              </span>
            </div>
            <a [routerLink]="['/clients', client.id]" class="view-profile-link">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M15 3h6v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 14L21 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>Профиль</span>
            </a>
          </div>
          
          <div class="client-tags" *ngIf="client.tags && client.tags.length > 0">
            <span class="tag" *ngFor="let tag of client.tags">{{ tag }}</span>
          </div>

          <div class="balance-section">
            <div class="balance-label">Текущий баланс бонусов</div>
            <div class="balance-value">{{ formatAmount(bonusBalance) }} <span class="currency">₸</span></div>
          </div>
        </div>

        <!-- Bonus Actions -->
        <div class="bonus-actions">
          <!-- Grant Bonus Card -->
          <div class="action-card grant">
            <div class="action-card-header">
              <div class="action-icon grant">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="action-title">
                <h4>Начислить бонусы</h4>
                <p>Вручную добавить бонусы клиенту</p>
              </div>
            </div>
            
            <div class="action-form">
              <div class="form-group">
                <label>Сумма бонусов</label>
                <div class="amount-input-wrapper">
                  <input 
                    type="number" 
                    [(ngModel)]="grantAmount" 
                    placeholder="0"
                    min="1"
                    class="amount-input">
                  <span class="input-suffix">₸</span>
                </div>
              </div>
              
              <div class="form-group">
                <label>Причина начисления</label>
                <textarea 
                  [(ngModel)]="grantReason"
                  placeholder="Например: Компенсация за неудобства, подарок на день рождения..."
                  class="reason-textarea"
                  rows="2"></textarea>
              </div>
              
              <button 
                class="action-submit-btn grant-btn"
                (click)="grantBonus()"
                [disabled]="!grantAmount || grantAmount <= 0 || isGranting">
                <svg viewBox="0 0 24 24" fill="none" *ngIf="!isGranting">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span *ngIf="isGranting" class="spinner white"></span>
                {{ isGranting ? 'Начисление...' : 'Начислить бонусы' }}
              </button>
            </div>
          </div>

          <!-- Revoke Bonus Card -->
          <div class="action-card revoke">
            <div class="action-card-header">
              <div class="action-icon revoke">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="action-title">
                <h4>Списать бонусы</h4>
                <p>Вручную списать бонусы у клиента</p>
              </div>
            </div>
            
            <div class="action-form">
              <div class="form-group">
                <label>
                  Сумма списания 
                  <span class="max-badge">макс. {{ formatAmount(bonusBalance) }} ₸</span>
                </label>
                <div class="amount-input-wrapper">
                  <input 
                    type="number" 
                    [(ngModel)]="revokeAmount" 
                    placeholder="0"
                    min="1"
                    [max]="bonusBalance"
                    class="amount-input">
                  <span class="input-suffix">₸</span>
                </div>
              </div>
              
              <div class="form-group">
                <label>Причина списания</label>
                <textarea 
                  [(ngModel)]="revokeReason"
                  placeholder="Например: Корректировка баланса, ошибочное начисление..."
                  class="reason-textarea"
                  rows="2"></textarea>
              </div>
              
              <button 
                class="action-submit-btn revoke-btn"
                (click)="revokeBonus()"
                [disabled]="!revokeAmount || revokeAmount <= 0 || revokeAmount > bonusBalance || isRevoking || bonusBalance <= 0">
                <svg viewBox="0 0 24 24" fill="none" *ngIf="!isRevoking">
                  <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span *ngIf="isRevoking" class="spinner white"></span>
                {{ isRevoking ? 'Списание...' : 'Списать бонусы' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bonus-management-page {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Search Section */
    .search-section {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
    }

    .search-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .search-header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .search-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.95rem;
    }

    .search-form {
      max-width: 500px;
      margin: 0 auto;
    }

    .search-input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.5rem 0.75rem;
      transition: all 0.2s;
    }

    .search-input-wrapper:focus-within {
      border-color: #16A34A;
      background: white;
      box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
    }

    .search-icon {
      width: 24px;
      height: 24px;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 1.125rem;
      color: #1f2937;
      outline: none;
      padding: 0.5rem 0;
    }

    .search-input::placeholder {
      color: #94a3b8;
    }

    .search-btn {
      padding: 0.625rem 1.5rem;
      background: #16A34A;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 90px;
    }

    .search-btn:hover:not(:disabled) {
      background: #15803d;
    }

    .search-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .search-hint {
      margin: 0.75rem 0 0 0;
      font-size: 0.8rem;
      color: #94a3b8;
      text-align: center;
    }

    /* No Result */
    .no-result {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .no-result-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem;
      color: #94a3b8;
    }

    .no-result-icon svg {
      width: 100%;
      height: 100%;
    }

    .no-result h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      color: #374151;
    }

    .no-result p {
      margin: 0;
      color: #64748b;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    /* Client Card */
    .client-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }

    .client-card-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .client-avatar {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #16A34A 0%, #22c55e 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .client-info {
      flex: 1;
    }

    .client-name {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .client-phone {
      margin: 0 0 0.5rem 0;
      color: #64748b;
      font-size: 0.95rem;
    }

    .client-type-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      background: #f0fdf4;
      color: #16A34A;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .client-type-badge.business {
      background: #eff6ff;
      color: #2563eb;
    }

    .view-profile-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #64748b;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .view-profile-link:hover {
      background: #f1f5f9;
      color: #1f2937;
    }

    .view-profile-link svg {
      width: 18px;
      height: 18px;
    }

    .client-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .tag {
      padding: 0.25rem 0.75rem;
      background: #f1f5f9;
      color: #475569;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .balance-section {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-radius: 12px;
      text-align: center;
    }

    .balance-label {
      font-size: 0.875rem;
      color: #16A34A;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .balance-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #15803d;
    }

    .balance-value .currency {
      font-size: 1.5rem;
      font-weight: 600;
    }

    /* Bonus Actions */
    .bonus-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .action-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      transition: all 0.2s;
    }

    .action-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .action-card.grant {
      border-top: 3px solid #16A34A;
    }

    .action-card.revoke {
      border-top: 3px solid #ea580c;
    }

    .action-card-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .action-icon.grant {
      background: #dcfce7;
      color: #16A34A;
    }

    .action-icon.revoke {
      background: #fed7aa;
      color: #ea580c;
    }

    .action-icon svg {
      width: 26px;
      height: 26px;
    }

    .action-title h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .action-title p {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .action-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .max-badge {
      font-weight: 400;
      text-transform: none;
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .amount-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .amount-input {
      width: 100%;
      padding: 0.875rem 3rem 0.875rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 1.25rem;
      font-weight: 600;
      background: #f8fafc;
      transition: all 0.2s;
    }

    .amount-input:focus {
      outline: none;
      border-color: #16A34A;
      background: white;
      box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
    }

    .input-suffix {
      position: absolute;
      right: 1rem;
      color: #94a3b8;
      font-size: 1.125rem;
      font-weight: 500;
    }

    .reason-textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.95rem;
      background: #f8fafc;
      resize: none;
      transition: all 0.2s;
      font-family: inherit;
    }

    .reason-textarea:focus {
      outline: none;
      border-color: #16A34A;
      background: white;
      box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
    }

    .reason-textarea::placeholder {
      color: #94a3b8;
    }

    .action-submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 0.5rem;
    }

    .action-submit-btn svg {
      width: 20px;
      height: 20px;
    }

    .action-submit-btn.grant-btn {
      background: #16A34A;
      color: white;
    }

    .action-submit-btn.grant-btn:hover:not(:disabled) {
      background: #15803d;
    }

    .action-submit-btn.revoke-btn {
      background: #ea580c;
      color: white;
    }

    .action-submit-btn.revoke-btn:hover:not(:disabled) {
      background: #c2410c;
    }

    .action-submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Spinners */
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-top-color: #16A34A;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner.white {
      border-color: rgba(255, 255, 255, 0.3);
      border-top-color: white;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .bonus-management-page {
        padding: 1rem;
      }

      .search-section {
        padding: 1.5rem;
      }

      .search-input-wrapper {
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.5rem;
      }

      .search-input {
        width: 100%;
        text-align: center;
      }

      .search-btn {
        width: 100%;
      }

      .client-card-header {
        flex-wrap: wrap;
      }

      .view-profile-link {
        width: 100%;
        justify-content: center;
        margin-top: 0.5rem;
      }

      .bonus-actions {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class BonusManagementPageComponent implements OnInit {
  private pageHeaderService = inject(PageHeaderService);
  private clientsService = inject(ClientsService);
  private bonusesService = inject(BonusesService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  searchPhone = '';
  isSearching = false;
  searchPerformed = false;

  client: ClientResult | null = null;
  bonusBalance = 0;

  grantAmount: number | null = null;
  grantReason = '';
  isGranting = false;

  revokeAmount: number | null = null;
  revokeReason = '';
  isRevoking = false;

  ngOnInit(): void {
    this.pageHeaderService.setPageHeader('Управление бонусами', [
      { label: 'Главная', route: '/home' },
      { label: 'Управление бонусами' }
    ]);
  }

  searchClient(): void {
    if (!this.searchPhone.trim()) return;

    this.isSearching = true;
    this.searchPerformed = true;
    this.client = null;

    // Normalize phone number
    let phone = this.searchPhone.trim().replace(/[\s\-\(\)]/g, '');
    if (phone.startsWith('8')) {
      phone = '+7' + phone.substring(1);
    } else if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    this.clientsService.searchClientByPhone(phone).subscribe({
      next: (result) => {
        if (result) {
          this.client = {
            id: result.id,
            firstName: result.firstName,
            lastName: result.lastName,
            phone: result.phone,
            email: result.email || null,
            type: result.type || 'individual',
            tags: result.tags || []
          };
          this.loadBonusBalance();
        }
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isSearching = false;
        this.client = null;
        this.cdr.detectChanges();
      }
    });
  }

  private loadBonusBalance(): void {
    if (!this.client) return;

    this.bonusesService.getClientBonusBalance(this.client.id).subscribe({
      next: (balance) => {
        this.bonusBalance = balance.currentBalance;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading balance:', err);
        this.bonusBalance = 0;
      }
    });
  }

  grantBonus(): void {
    if (!this.client || !this.grantAmount || this.grantAmount <= 0) return;

    this.isGranting = true;
    this.bonusesService.grantBonus(this.client.id, {
      amount: this.grantAmount,
      reason: this.grantReason || undefined
    }).subscribe({
      next: (balance) => {
        this.bonusBalance = balance.currentBalance;
        this.toastService.success(`Успешно начислено ${this.formatAmount(this.grantAmount!)} ₸ бонусов`);
        this.grantAmount = null;
        this.grantReason = '';
        this.isGranting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при начислении бонусов';
        this.toastService.error(errorMessage);
        this.isGranting = false;
        this.cdr.detectChanges();
      }
    });
  }

  revokeBonus(): void {
    if (!this.client || !this.revokeAmount || this.revokeAmount <= 0 || this.revokeAmount > this.bonusBalance) return;

    this.isRevoking = true;
    this.bonusesService.revokeBonus(this.client.id, {
      amount: this.revokeAmount,
      reason: this.revokeReason || undefined
    }).subscribe({
      next: (balance) => {
        this.bonusBalance = balance.currentBalance;
        this.toastService.success(`Успешно списано ${this.formatAmount(this.revokeAmount!)} ₸ бонусов`);
        this.revokeAmount = null;
        this.revokeReason = '';
        this.isRevoking = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Ошибка при списании бонусов';
        this.toastService.error(errorMessage);
        this.isRevoking = false;
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(): string {
    if (!this.client) return '';
    const first = this.client.firstName?.charAt(0) || '';
    const last = this.client.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  formatAmount(amount: number | null): string {
    if (amount === null || amount === undefined) return '0';
    return new Intl.NumberFormat('ru-RU').format(amount);
  }
}
