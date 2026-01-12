import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

export interface Payment {
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
  comment?: string;
}

@Component({
  selector: 'app-refund-confirmation-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [visible]="visible"
      [title]="'Подтверждение возврата'"
      [showCloseButton]="true"
      (visibleChange)="onClose()">
      <div class="refund-modal-content" *ngIf="payment">
        <p class="refund-question">
          Вы уверены, что хотите вернуть платеж?
        </p>
        <div class="refund-info">
          <div class="refund-info-item">
            <span class="refund-label">ID Платежа:</span>
            <span class="refund-value payment-id">{{ formatPaymentId(payment.id) }}</span>
          </div>
          <div class="refund-info-item">
            <span class="refund-label">Клиент:</span>
            <span class="refund-value">{{ payment.clientName }}</span>
          </div>
          <div class="refund-info-item">
            <span class="refund-label">Сумма платежа:</span>
            <span class="refund-value">{{ formatAmount(payment.amount) }} ₸</span>
          </div>
          <div class="refund-warning">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="warning-icon">
              <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            </svg>
            <div class="warning-text">
              <strong>Внимание!</strong> Бонусы, выданные за этот платеж, также будут откачены.
            </div>
          </div>
          <div class="refund-info-item bonus-info">
            <span class="refund-label">Бонусы к откату:</span>
            <span class="refund-value bonus-amount">{{ formatAmount(payment.bonusEarned) }} ₸</span>
          </div>
        </div>
        <div modalFooter class="refund-modal-footer">
          <app-button
            buttonType="ghost"
            (onClick)="onClose()">
            Отмена
          </app-button>
          <app-button
            buttonType="danger"
            (onClick)="onConfirm()">
            Подтвердить возврат
          </app-button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .refund-modal-content {
      padding: 1rem 0;
    }

    .refund-question {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1.5rem;
    }

    .refund-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .refund-info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .refund-info-item.bonus-info {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .refund-label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .refund-value {
      font-size: 0.875rem;
      color: #1f2937;
      font-weight: 600;
    }

    .refund-value.payment-id {
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .refund-value.bonus-amount {
      color: #dc2626;
      font-size: 1rem;
    }

    .refund-warning {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 8px;
      align-items: flex-start;
    }

    .warning-icon {
      width: 20px;
      height: 20px;
      color: #d97706;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .warning-text {
      font-size: 0.875rem;
      color: #92400e;
      line-height: 1.5;
    }

    .warning-text strong {
      font-weight: 600;
    }

    .refund-modal-footer {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
  `]
})
export class RefundConfirmationModalComponent {
  @Input() visible = false;
  @Input() payment: Payment | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<Payment>();

  onClose(): void {
    this.visibleChange.emit(false);
  }

  onConfirm(): void {
    if (this.payment) {
      this.confirm.emit(this.payment);
    }
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('ru-RU');
  }

  formatPaymentId(id: string): string {
    return `#PAY-${id.padStart(3, '0')}`;
  }
}

