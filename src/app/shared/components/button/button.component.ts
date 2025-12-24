import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonType = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
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

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    button.primary {
      background-color: var(--primary-color, #007bff);
      color: #ffffff;
    }

    button.primary:hover:not(:disabled) {
      background-color: var(--primary-color-hover, #0056b3);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
    }

    button.secondary {
      background-color: #6c757d;
      color: #ffffff;
    }

    button.secondary:hover:not(:disabled) {
      background-color: #545b62;
      transform: translateY(-1px);
    }

    button.danger {
      background-color: #dc3545;
      color: #ffffff;
    }

    button.danger:hover:not(:disabled) {
      background-color: #c82333;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
    }

    button.success {
      background-color: #28a745;
      color: #ffffff;
    }

    button.success:hover:not(:disabled) {
      background-color: #218838;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
    }

    button.outline {
      background-color: transparent;
      border: 1px solid var(--primary-color, #007bff);
      color: var(--primary-color, #007bff);
    }

    button.outline:hover:not(:disabled) {
      background-color: var(--primary-color, #007bff);
      color: #ffffff;
    }

    button.ghost {
      background-color: transparent;
      color: #64748b;
    }

    button.ghost:hover:not(:disabled) {
      background-color: #f1f5f9;
      color: #1a202c;
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

