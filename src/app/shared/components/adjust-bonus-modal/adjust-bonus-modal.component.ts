import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { BonusesService } from '../../../core/services/bonuses.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-adjust-bonus-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [visible]="visible"
      [title]="'Скорректировать бонусный баланс'"
      [showCloseButton]="true"
      [showFooter]="true"
      (visibleChange)="onClose()">
      <div class="adjust-bonus-content">
        <p class="adjust-bonus-subtitle">Вручную добавляйте или вычитайте бонусы из счета клиента.</p>

        <div class="toggle-pill">
          <button
            type="button"
            class="toggle-seg toggle-add"
            [class.active]="isAdd"
            (click)="isAdd = true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Добавить бонусы
          </button>
          <button
            type="button"
            class="toggle-seg toggle-deduct"
            [class.active]="!isAdd"
            (click)="isAdd = false">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Вычесть бонусы
          </button>
        </div>

        <div class="form-group">
          <label>Количество</label>
          <div class="amount-row">
            <input
              type="number"
              [(ngModel)]="amount"
              [min]="1"
              [max]="!isAdd ? bonusBalance : null"
              placeholder="0"
              class="amount-input">
            <span class="currency-icon">₸</span>
          </div>
        </div>

        <div class="form-group">
          <label>Причина (обязательно)</label>
          <input
            type="text"
            [(ngModel)]="reason"
            class="reason-input"
            placeholder="например, компенсация, бонус ко дню рождения, корректировка баланса.">
        </div>
      </div>
      <div modalFooter class="modal-footer-actions">
        <button type="button" class="footer-cancel" (click)="onClose()">Отмена</button>
        <app-button
          buttonType="primary"
          [disabled]="!isValid() || isSubmitting"
          [loading]="isSubmitting"
          (onClick)="onSubmit()">
          {{ isAdd ? 'Добавить бонусы' : 'Вычесть бонусы' }}
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    .adjust-bonus-content {
      padding: 0.25rem 0 1rem;
    }

    .adjust-bonus-subtitle {
      margin: 0 0 1.25rem 0;
      font-size: 0.9375rem;
      color: #64748b;
      font-weight: 400;
      line-height: 1.4;
    }

    .toggle-pill {
      display: flex;
      width: 100%;
      margin-bottom: 1.5rem;
      border-radius: 10px;
      overflow: hidden;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
    }

    .toggle-seg {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      background: transparent;
      color: #475569;
    }

    .toggle-seg svg {
      width: 18px;
      height: 18px;
    }

    .toggle-seg.toggle-add {
      border-radius: 0;
    }

    .toggle-seg.toggle-deduct {
      border-radius: 0;
    }

    .toggle-seg.toggle-add.active {
      background: #16A34A;
      color: white;
    }

    .toggle-seg.toggle-add.active svg {
      stroke: white;
    }

    .toggle-seg.toggle-deduct.active {
      background: #16A34A;
      color: white;
    }

    .toggle-seg.toggle-deduct.active svg {
      stroke: white;
    }

    .toggle-seg:not(.active):hover {
      background: #e2e8f0;
      color: #334155;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .amount-row {
      display: flex;
      align-items: center;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      overflow: hidden;
    }

    .amount-input {
      flex: 1;
      min-width: 0;
      padding: 0.75rem 1rem;
      border: none;
      font-size: 1rem;
      color: #1e293b;
      background: transparent;
    }

    .amount-input:focus {
      outline: none;
    }

    .amount-input::placeholder {
      color: #94a3b8;
    }

    .currency-icon {
      padding: 0 1rem;
      font-size: 1rem;
      font-weight: 500;
      color: #64748b;
      border-left: 1px solid #e2e8f0;
    }

    .reason-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9375rem;
      background: #fff;
      color: #1e293b;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .reason-input:focus {
      outline: none;
      border-color: #16A34A;
    }

    .reason-input::placeholder {
      color: #94a3b8;
      font-style: italic;
    }

    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 1rem;
    }

    .footer-cancel {
      padding: 0.5rem 0.75rem;
      border: none;
      background: none;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      transition: color 0.15s;
    }

    .footer-cancel:hover {
      color: #1e293b;
    }
  `]
})
export class AdjustBonusModalComponent {
  @Input() visible = false;
  @Input() clientId: string | null = null;
  @Input() bonusBalance = 0;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() bonusAdjusted = new EventEmitter<void>();

  isAdd = true;
  amount: number | null = null;
  reason = '';
  isSubmitting = false;

  constructor(
    private bonusesService: BonusesService,
    private toast: ToastService
  ) {}

  formatAmount(value: number): string {
    return new Intl.NumberFormat('ru-RU').format(value);
  }

  isValid(): boolean {
    const amt = this.amount ?? 0;
    if (amt <= 0) return false;
    if (!this.isAdd && amt > this.bonusBalance) return false;
    if (!this.reason?.trim()) return false;
    return true;
  }

  onClose(): void {
    if (!this.isSubmitting) {
      this.reset();
      this.visibleChange.emit(false);
    }
  }

  reset(): void {
    this.isAdd = true;
    this.amount = null;
    this.reason = '';
  }

  onSubmit(): void {
    if (!this.clientId || !this.isValid() || this.isSubmitting) return;
    const amt = Math.round(Number(this.amount));
    this.isSubmitting = true;

    const request = { amount: amt, reason: this.reason.trim() };
    const op$ = this.isAdd
      ? this.bonusesService.grantBonus(this.clientId, request)
      : this.bonusesService.revokeBonus(this.clientId, request);

    op$.subscribe({
      next: () => {
        this.toast.success(this.isAdd ? 'Бонусы начислены' : 'Бонусы списаны');
        this.reset();
        this.visibleChange.emit(false);
        this.bonusAdjusted.emit();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || (this.isAdd ? 'Не удалось начислить бонусы' : 'Не удалось списать бонусы');
        this.toast.error(msg);
      }
    });
  }
}
