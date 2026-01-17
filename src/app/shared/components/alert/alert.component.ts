import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';

export type AlertType = 'success' | 'info' | 'warning' | 'error';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="alert" [class]="getClasses()" *ngIf="visible">
      <div class="alert-icon" *ngIf="showIcon">
        <span>{{ getIcon() }}</span>
      </div>
      <div class="alert-content">
        <div class="alert-title" *ngIf="title">{{ title }}</div>
        <div class="alert-message">
          <ng-content></ng-content>
        </div>
      </div>
      <app-icon-button
        *ngIf="dismissible"
        icon="✕"
        class="alert-dismiss-button"
        iconButtonType="ghost"
        size="small"
        (onClick)="onDismiss()">
      </app-icon-button>
    </div>
  `,
  styles: [`
    .alert {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid;
      margin-bottom: 1rem;
    }



    .alert.success {
      background-color: #f0fdf4;
      border-color: #86efac;
      color: #15803d;
    }

    .alert.info {
      background-color: #eff6ff;
      border-color: #93c5fd;
      color: #1e40af;
    }

    .alert.warning {
      background-color: #fffbeb;
      border-color: #fde047;
      color: #854d0e;
    }

    .alert.error {
      background-color: #fef2f2;
      border-color: #fca5a5;
      color: #991b1b;
    }

    .alert-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .alert-content {
      flex: 1;
      min-width: 0;
    }

    .alert-title {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .alert-message {
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .alert-dismiss-button {
      flex-shrink: 0;
      margin-top: -0.25rem;
      margin-right: -0.25rem;
    }

    /* Success alert dismiss button */
    .alert.success .alert-dismiss-button ::ng-deep .icon-button {
      color: #15803d;
    }

    .alert.success .alert-dismiss-button ::ng-deep .icon-button:hover:not(:disabled) {
      background-color: rgba(22, 163, 74, 0.1);
      color: #15803d;
    }

    /* Info alert dismiss button */
    .alert.info .alert-dismiss-button ::ng-deep .icon-button {
      color: #1e40af;
    }

    .alert.info .alert-dismiss-button ::ng-deep .icon-button:hover:not(:disabled) {
      background-color: rgba(30, 64, 175, 0.1);
      color: #1e40af;
    }

    /* Warning alert dismiss button */
    .alert.warning .alert-dismiss-button ::ng-deep .icon-button {
      color: #854d0e;
    }

    .alert.warning .alert-dismiss-button ::ng-deep .icon-button:hover:not(:disabled) {
      background-color: rgba(133, 77, 14, 0.1);
      color: #854d0e;
    }

    /* Error alert dismiss button */
    .alert.error .alert-dismiss-button ::ng-deep .icon-button {
      color: #991b1b;
    }

    .alert.error .alert-dismiss-button ::ng-deep .icon-button:hover:not(:disabled) {
      background-color: rgba(153, 27, 27, 0.1);
      color: #991b1b;
    }
  `]
})
export class AlertComponent {
  @Input() type: AlertType = 'info';
  @Input() title = '';
  @Input() dismissible = false;
  @Input() showIcon = true;
  @Input() visible = true;

  @Output() dismissed = new EventEmitter<void>();

  getClasses(): string {
    return this.type;
  }

  getIcon(): string {
    const icons: Record<AlertType, string> = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      error: '✕'
    };
    return icons[this.type];
  }

  onDismiss(): void {
    this.visible = false;
    this.dismissed.emit();
  }
}

