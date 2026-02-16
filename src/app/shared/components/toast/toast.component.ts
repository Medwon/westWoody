import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { ToastType, ToastAction } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="toast" [class]="type" [class.show]="visible" [class.hiding]="hiding">
      <div class="toast-content">
        <div class="toast-icon">
          <svg *ngIf="type === 'success'" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg *ngIf="type === 'error'" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="toast-message">{{ message }}</div>
        <button *ngIf="action" type="button" class="toast-action-btn" (click)="onAction()">{{ action.label }}</button>
        <app-icon-button
          iconButtonType="ghost"
          size="small"
          (onClick)="onClose()">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </app-icon-button>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      display: flex;
      align-items: center;
      min-width: 300px;
      max-width: 400px;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 0.75rem;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-left: 4px solid;
    }

    .toast.show {
      opacity: 1;
      transform: translateX(0);
    }

    .toast.hiding {
      opacity: 0;
      transform: translateX(100%);
    }

    .toast.success {
      border-left-color: #16A34A;
    }

    .toast.error {
      border-left-color: #dc2626;
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }

    .toast-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-icon svg {
      width: 20px;
      height: 20px;
    }

    .toast.success .toast-icon {
      color: #16A34A;
    }

    .toast.error .toast-icon {
      color: #dc2626;
    }

    .toast-message {
      flex: 1;
      font-size: 0.9375rem;
      line-height: 1.5;
      color: #1f2937;
      font-weight: 500;
    }

    .toast-action-btn {
      flex-shrink: 0;
      padding: 0.35rem 0.6rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #16A34A;
      background: transparent;
      border: 1px solid #16A34A;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .toast-action-btn:hover {
      background: #16A34A;
      color: white;
    }

    :host ::ng-deep app-icon-button {
      flex-shrink: 0;
    }

    :host ::ng-deep app-icon-button svg {
      width: 16px;
      height: 16px;
      color: #64748b;
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() message = '';
  @Input() type: ToastType = 'success';
  @Input() duration = 3000;
  @Input() action?: ToastAction;

  @Output() closed = new EventEmitter<void>();

  visible = false;
  hiding = false;
  private timeoutId?: number;

  ngOnInit(): void {
    // Небольшая задержка для анимации появления
    setTimeout(() => {
      this.visible = true;
    }, 10);

    // Автоматическое закрытие
    if (this.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  onClose(): void {
    this.close();
  }

  onAction(): void {
    this.action?.callback();
    this.close();
  }

  private close(): void {
    this.hiding = true;
    setTimeout(() => {
      this.closed.emit();
    }, 300); // Время анимации
  }
}
