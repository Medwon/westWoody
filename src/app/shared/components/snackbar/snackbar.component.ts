import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { ButtonComponent } from '../button/button.component';

export type SnackbarType = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule, IconButtonComponent, ButtonComponent],
  template: `
    <div class="snackbar" [class]="getClasses()" [class.show]="visible" *ngIf="visible">
      <div class="snackbar-content">
        <span class="snackbar-icon" *ngIf="showIcon">{{ getIcon() }}</span>
        <span class="snackbar-message"><ng-content></ng-content></span>
      </div>
      <div class="snackbar-actions">
        <app-button
          *ngIf="actionLabel"
          buttonType="ghost"
          size="small"
          (onClick)="onAction()">
          {{ actionLabel }}
        </app-button>
        <app-icon-button
          *ngIf="dismissible"
          icon="✕"
          iconButtonType="ghost"
          size="small"
          (onClick)="onDismiss()">
        </app-icon-button>
      </div>
    </div>
  `,
  styles: [`
    .snackbar {
      position: fixed;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1rem;
      background-color: #1a202c;
      color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      min-width: 300px;
      max-width: 500px;
      z-index: 10000;
      opacity: 0;
      transition: all 0.3s ease;
    }

    .snackbar.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    .snackbar-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .snackbar-icon {
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    .snackbar-message {
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .snackbar-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .snackbar.success {
      background-color: #16A34A;
    }

    .snackbar.error {
      background-color: #dc3545;
    }

    .snackbar.warning {
      background-color: #f59e0b;
    }
  `]
})
export class SnackbarComponent implements OnInit, OnDestroy {
  @Input() type: SnackbarType = 'info';
  @Input() dismissible = true;
  @Input() showIcon = true;
  @Input() visible = false;
  @Input() duration = 4000;
  @Input() actionLabel = '';

  @Output() dismissed = new EventEmitter<void>();
  @Output() action = new EventEmitter<void>();

  private timeoutId?: number;

  ngOnInit(): void {
    if (this.visible && this.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.onDismiss();
      }, this.duration);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  getClasses(): string {
    return this.type;
  }

  getIcon(): string {
    const icons: Record<SnackbarType, string> = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✕'
    };
    return icons[this.type];
  }

  onDismiss(): void {
    this.visible = false;
    this.dismissed.emit();
  }

  onAction(): void {
    this.action.emit();
  }
}

