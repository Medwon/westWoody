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
    }

    .alert.success {
      background-color: #f0fdf4;
      border-color: #86efac;
      color: #166534;
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

