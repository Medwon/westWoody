import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonType = 'primary' | 'primary-outline' | 'secondary' | 'danger' | 'danger-outline' | 'success' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="getButtonClasses()"
      [disabled]="disabled || loading"
      [type]="type"
      [title]="tooltip"
      (click)="onClick.emit($event)"
    >
      <span *ngIf="loading" class="button-spinner">⟳</span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    button svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      display: block;
    }

    button.small svg {
      width: 16px;
      height: 16px;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    button.primary {
      background-color: var(--primary-color, #16A34A);
      color: #ffffff;
    }

    button.primary-outline {
      background-color: #16A34A;
      border: 1.5px solid #16A34A;
      color: #ffffff;
    }

    button.primary-outline:hover:not(:disabled) {
      background-color: #15803d;
      border-color: #15803d;
    }

    button.secondary {
      background-color: #6c757d;
      color: #ffffff;
    }

    button.danger {
      background-color: #dc3545;
      color: #ffffff;
    }

    button.danger-outline {
      background-color: #fef2f2;
      border: 1.5px solid #fecaca;
      color: #dc2626;
    }

    button.danger-outline:hover:not(:disabled) {
      background-color: #fee2e2;
      border-color: #fca5a5;
    }

    button.success {
      background-color: #28a745;
      color: #ffffff;
    }

    button.outline {
      background-color: transparent;
      border: 1px solid var(--primary-color, #007bff);
      color: var(--primary-color, #007bff);
    }

    button.ghost {
      background-color: transparent;
      color: #64748b;
    }

    button.small {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    button.large {
      padding: 0.875rem 1.75rem;
      font-size: 1rem;
    }

    .button-spinner {
      display: inline-block;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class ButtonComponent {
  @Input() buttonType: ButtonType = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() tooltip = '';
  @Output() onClick = new EventEmitter<MouseEvent>();

  getButtonClasses(): string {
    return `${this.buttonType} ${this.size}`;
  }
}

