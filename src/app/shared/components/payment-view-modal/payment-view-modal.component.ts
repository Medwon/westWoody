import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { BadgeComponent } from '../badge/badge.component';
import { PaymentsService, PaymentTransactionDto, UpdatePaymentMethodRequest, PaymentSearchResult } from '../../../core/services/payments.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-payment-view-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent, ButtonComponent, BadgeComponent],
  template: `
    <app-modal
      [visible]="visible"
      title="Детали платежа"
      [showCloseButton]="true"
      [size]="'large'"
      (closed)="onClose()">
      
      <div class="payment-view-content" *ngIf="paymentData">
        <!-- Header Section -->
        <div class="payment-header">
          <div class="payment-id-section">
            <span class="payment-id-label">ID платежа</span>
            <span class="payment-id-value">{{ paymentData.txId }}</span>
          </div>
          <div class="payment-status">
            <app-badge 
              [badgeType]="getStatusBadgeType()" 
              size="medium"
              [icon]="getStatusIcon()">
              {{ getStatusLabel() }}
            </app-badge>
          </div>
        </div>

        <!-- Main Info Grid -->
        <div class="payment-info-grid">
          <!-- Left Column -->
          <div class="info-column">
            <div class="info-section">
              <h3 class="section-title">Информация о платеже</h3>
              
              <div class="info-item">
                <span class="info-label">Сумма</span>
                <span class="info-value amount">{{ formatAmount(paymentData.amount) }} ₸</span>
              </div>

              <div class="info-item">
                <span class="info-label">Способ оплаты</span>
                <div class="payment-method-section">
                  <app-badge 
                    *ngIf="!isEditingPaymentMethod"
                    badgeType="paymentMethod" 
                    size="medium"
                    [paymentMethod]="getPaymentMethodForBadge()">
                  </app-badge>
                  <div class="method-selector" *ngIf="isEditingPaymentMethod">
                    <select [(ngModel)]="selectedPaymentMethod" class="method-select">
                      <option value="CASH">Наличные</option>
                      <option value="CARD">Карта</option>
                      <option value="TRANSFER">Перевод</option>
                    </select>
                    <div class="method-actions">
                      <button class="method-btn save" (click)="savePaymentMethod()" [disabled]="isSaving">
                        {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
                      </button>
                      <button class="method-btn cancel" (click)="cancelEditPaymentMethod()">Отмена</button>
                    </div>
                  </div>
                  <button class="edit-method-btn" *ngIf="!isEditingPaymentMethod && !isSaving" (click)="startEditPaymentMethod()">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Изменить
                  </button>
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Бонусы</span>
                <div class="bonus-info-section">
                  <!-- Revoked bonuses (show revoked badge instead of granted) -->
                  <ng-container *ngIf="paymentData.bonusRevocations && paymentData.bonusRevocations.length > 0">
                    <div class="bonus-item revoked" *ngFor="let revocation of paymentData.bonusRevocations">
                      <app-badge badgeType="danger" size="small" icon="refund">
                        Отозвано: -{{ formatAmount(revocation.bonusAmount) }}
                      </app-badge>
                      <span class="revoke-reason">({{ getRevokeReasonLabel(revocation.revokeReason) }})</span>
                    </div>
                  </ng-container>
                  <!-- Active granted bonuses (only show if not revoked) -->
                  <ng-container *ngIf="!paymentData.bonusRevocations || paymentData.bonusRevocations.length === 0">
                    <div class="bonus-item" *ngIf="bonusInfo && bonusInfo.bonusGranted > 0">
                      <app-badge badgeType="bonusGranted" size="small" icon="star">
                        Начислено: +{{ formatAmount(bonusInfo.bonusGranted) }}
                      </app-badge>
                    </div>
                  </ng-container>
                  <!-- Used bonuses -->
                  <div class="bonus-item" *ngIf="bonusInfo && bonusInfo.bonusUsed > 0">
                    <app-badge badgeType="bonusUsed" size="small" icon="check">
                      Использовано: -{{ formatAmount(bonusInfo.bonusUsed) }}
                    </app-badge>
                  </div>
                  <!-- No bonuses -->
                  <span class="bonus-none" *ngIf="(!bonusInfo || (bonusInfo.bonusGranted === 0 && bonusInfo.bonusUsed === 0)) && (!paymentData.bonusRevocations || paymentData.bonusRevocations.length === 0)">Нет бонусов</span>
                </div>
              </div>

              <div class="info-item" *ngIf="paymentData.notes">
                <span class="info-label">Заметки</span>
                <span class="info-value notes">{{ paymentData.notes }}</span>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="info-column">
            <div class="info-section">
              <h3 class="section-title">Информация о клиенте</h3>
              
              <div class="info-item">
                <span class="info-label">Клиент</span>
                <a [routerLink]="['/clients', paymentData.clientId]" class="info-value link">
                  {{ paymentData.clientName }}
                </a>
              </div>

              <div class="info-item" *ngIf="bonusInfo?.clientPhone">
                <span class="info-label">Телефон</span>
                <span class="info-value">{{ bonusInfo?.clientPhone }}</span>
              </div>

              <div class="info-item" *ngIf="bonusInfo?.clientEmail">
                <span class="info-label">Email</span>
                <span class="info-value">{{ bonusInfo?.clientEmail }}</span>
              </div>
            </div>

            <div class="info-section">
              <h3 class="section-title">Дополнительная информация</h3>
              
              <div class="info-item">
                <span class="info-label">Инициатор</span>
                <a [routerLink]="['/users', paymentData.enteredByUserId]" class="info-value link" *ngIf="paymentData.enteredByUserId">
                  {{ paymentData.enteredByUsername }}
                </a>
                <span class="info-value" *ngIf="!paymentData.enteredByUserId">{{ paymentData.enteredByUsername || 'Не указан' }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Дата создания</span>
                <span class="info-value">{{ formatDate(paymentData.createdAt) }}</span>
              </div>

              <div class="info-item" *ngIf="paymentData.updatedAt && paymentData.updatedAt !== paymentData.createdAt">
                <span class="info-label">Последнее обновление</span>
                <span class="info-value">{{ formatDate(paymentData.updatedAt) }}</span>
              </div>

              <div class="info-item" *ngIf="paymentData.refundedPaymentTxId">
                <span class="info-label">Возврат платежа</span>
                <span class="info-value refund-link" (click)="openRefundedPayment(paymentData.refundedPaymentTxId!)">
                  {{ paymentData.refundedPaymentTxId }}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="loading-state" *ngIf="isLoading">
        <div class="loader"></div>
        <span>Загрузка данных...</span>
      </div>
    </app-modal>
  `,
  styles: [`
    .payment-view-content {
      padding: 0;
    }

    .payment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 2px solid #f1f5f9;
      margin-bottom: 2rem;
    }

    .payment-id-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .payment-id-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .payment-id-value {
      font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      letter-spacing: 0.5px;
    }

    .payment-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      padding: 0 1.5rem 1.5rem;
    }

    .info-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .info-value {
      font-size: 1rem;
      color: #1f2937;
      font-weight: 500;
    }

    .info-value.amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #16A34A;
    }

    .info-value.link {
      color: #16A34A;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s;
    }

    .info-value.link:hover {
      color: #14532d;
      text-decoration: underline;
    }

    .info-value.refund-link {
      color: #dc2626;
      cursor: pointer;
      text-decoration: underline;
    }

    .info-value.refund-link:hover {
      color: #991b1b;
    }

    .info-value.notes {
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .revocations-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .revocation-item {
      padding: 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      border-left: 4px solid #dc2626;
    }

    .revocation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .revocation-amount {
      font-size: 1.125rem;
      font-weight: 600;
      color: #dc2626;
    }

    .revocation-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .revocation-badge.revoked {
      background: #fee2e2;
      color: #991b1b;
    }

    .revocation-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .revocation-detail-item {
      display: flex;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .revocation-detail-item .detail-label {
      color: #64748b;
      font-weight: 500;
      min-width: 120px;
    }

    .revocation-detail-item .detail-value {
      color: #1e293b;
      flex: 1;
    }

    .revocation-detail-item .detail-value.refund-link {
      color: #dc2626;
      cursor: pointer;
      text-decoration: underline;
    }

    .revocation-detail-item .detail-value.refund-link:hover {
      color: #991b1b;
    }

    .payment-method-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }


    .edit-method-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .edit-method-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #1f2937;
    }

    .edit-method-btn svg {
      width: 16px;
      height: 16px;
    }

    .method-selector {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }

    .method-select {
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      color: #1f2937;
      cursor: pointer;
      transition: all 0.2s;
    }

    .method-select:focus {
      outline: none;
      border-color: #16A34A;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
    }

    .method-actions {
      display: flex;
      gap: 0.5rem;
    }

    .method-btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .method-btn.save {
      background: #16A34A;
      color: white;
    }

    .method-btn.save:hover:not(:disabled) {
      background: #14532d;
    }

    .method-btn.save:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .method-btn.cancel {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .method-btn.cancel:hover {
      background: #e2e8f0;
    }

    .bonus-info-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .bonus-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bonus-item.revoked {
      flex-direction: row;
    }

    .revoke-reason {
      font-size: 0.75rem;
      color: #dc2626;
      font-style: italic;
    }

    .bonus-none {
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
      color: #64748b;
    }

    .loader {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #16A34A;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .payment-info-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        padding: 0 1rem 1rem;
      }

      .payment-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
  `]
})
export class PaymentViewModalComponent implements OnInit, OnChanges {
  private paymentsService = inject(PaymentsService);
  private toastService = inject(ToastService);

  @Input() visible = false;
  @Input() paymentTxId: string | null = null;
  @Input() paymentSearchResult: PaymentSearchResult | null = null; // Optional: if we already have search result data
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() paymentUpdated = new EventEmitter<void>();
  @Output() refundedPaymentClick = new EventEmitter<string>();

  paymentData: PaymentTransactionDto | null = null;
  bonusInfo: PaymentSearchResult | null = null;
  isLoading = false;
  isEditingPaymentMethod = false;
  selectedPaymentMethod: 'CASH' | 'CARD' | 'TRANSFER' = 'CASH';
  isSaving = false;

  ngOnInit(): void {
    if (this.paymentSearchResult) {
      this.loadPaymentFromSearchResult();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue && this.paymentTxId) {
      this.loadPayment();
    }
    if (changes['paymentSearchResult'] && changes['paymentSearchResult'].currentValue) {
      this.loadPaymentFromSearchResult();
    }
  }

  loadPayment(): void {
    if (!this.paymentTxId) return;

    this.isLoading = true;
    this.paymentsService.getPaymentByTxId(this.paymentTxId).subscribe({
      next: (payment) => {
        this.paymentData = payment;
        this.selectedPaymentMethod = (payment.paymentMethod || 'CASH') as 'CASH' | 'CARD' | 'TRANSFER';
        this.isLoading = false;
        // Try to load bonus info if we have search result
        if (this.paymentSearchResult && this.paymentSearchResult.txId === payment.txId) {
          this.bonusInfo = this.paymentSearchResult;
        }
      },
      error: (err) => {
        this.toastService.error('Ошибка при загрузке платежа');
        console.error('Error loading payment:', err);
        this.isLoading = false;
      }
    });
  }

  loadPaymentFromSearchResult(): void {
    if (!this.paymentSearchResult) return;

    this.bonusInfo = this.paymentSearchResult;
    // Load full payment data
    if (this.paymentSearchResult.txId) {
      this.paymentTxId = this.paymentSearchResult.txId;
      this.loadPayment();
    }
  }

  startEditPaymentMethod(): void {
    this.isEditingPaymentMethod = true;
    this.selectedPaymentMethod = (this.paymentData?.paymentMethod || 'CASH') as 'CASH' | 'CARD' | 'TRANSFER';
  }

  cancelEditPaymentMethod(): void {
    this.isEditingPaymentMethod = false;
    this.selectedPaymentMethod = (this.paymentData?.paymentMethod || 'CASH') as 'CASH' | 'CARD' | 'TRANSFER';
  }

  savePaymentMethod(): void {
    if (!this.paymentData || !this.paymentTxId) return;

    this.isSaving = true;
    const request: UpdatePaymentMethodRequest = {
      paymentMethod: this.selectedPaymentMethod
    };

    this.paymentsService.updatePaymentMethod(this.paymentTxId, request).subscribe({
      next: (updated) => {
        this.paymentData = updated;
        this.isEditingPaymentMethod = false;
        this.isSaving = false;
        this.toastService.success('Способ оплаты обновлен');
        this.paymentUpdated.emit();
      },
      error: (err) => {
        this.toastService.error('Ошибка при обновлении способа оплаты');
        console.error('Error updating payment method:', err);
        this.isSaving = false;
      }
    });
  }

  openRefundedPayment(txId: string): void {
    this.refundedPaymentClick.emit(txId);
  }

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.isEditingPaymentMethod = false;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getPaymentMethodForBadge(): 'CASH' | 'CARD' | 'TRANSFER' | null {
    if (!this.paymentData?.paymentMethod) return null;
    const method = this.paymentData.paymentMethod.toUpperCase();
    if (method === 'CASH' || method === 'CARD' || method === 'TRANSFER') {
      return method as 'CASH' | 'CARD' | 'TRANSFER';
    }
    return null;
  }

  getPaymentMethodLabel(method: string | null | undefined): string {
    if (!method) return 'Не указан';
    const labels: Record<string, string> = {
      'CASH': 'Наличные',
      'CARD': 'Карта',
      'TRANSFER': 'Перевод'
    };
    return labels[method.toUpperCase()] || method;
  }

  getRevokeReasonLabel(reason: string | null | undefined): string {
    if (!reason) return 'Не указана';
    const labels: Record<string, string> = {
      'PAYMENT_REFUND': 'Возврат платежа',
      'EXPIRED': 'Истек срок действия',
      'MANUAL': 'Ручной отзыв'
    };
    return labels[reason] || reason;
  }

  getStatusLabel(): string {
    if (!this.paymentData) return '';
    const status = this.paymentData.status;
    if (status === 'COMPLETED') return 'Оплачено';
    if (status === 'PENDING') return 'В ожидании';
    if (status === 'CANCELLED') return 'Отменено';
    if (status === 'REFUNDED') return 'Возвращено';
    return status;
  }

  getStatusBadgeType(): 'payment' | 'refund' {
    if (!this.paymentData) return 'payment';
    const status = this.paymentData.status;
    if (status === 'REFUNDED') return 'refund';
    return 'payment';
  }

  getStatusIcon(): 'payment' | 'refund' | null {
    if (!this.paymentData) return 'payment';
    const status = this.paymentData.status;
    if (status === 'REFUNDED') return 'refund';
    return 'payment';
  }
}
