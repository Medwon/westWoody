import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconButtonType = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type IconButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="icon-button"
      [class]="getButtonClasses()"
      [disabled]="disabled"
      [type]="type"
      [title]="tooltip"
      (click)="onClick.emit($event)"
    >
      <span class="icon-content">{{ icon }}</span>
    </button>
  `,
  styles: [`
    .icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: transparent;
      padding: 0.5rem;
    }

    .icon-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon-button.small {
      padding: 0.375rem;
      font-size: 0.875rem;
    }

    .icon-button.large {
      padding: 0.75rem;
      font-size: 1.25rem;
    }

    .icon-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-button.primary {
      background-color: var(--primary-color, #007bff);
      color: #ffffff;
    }

    .icon-button.primary:hover:not(:disabled) {
      background-color: var(--primary-color-hover, #0056b3);
    }

    .icon-button.secondary {
      background-color: #6c757d;
      color: #ffffff;
    }

    .icon-button.secondary:hover:not(:disabled) {
      background-color: #545b62;
    }

    .icon-button.danger {
      background-color: #dc3545;
      color: #ffffff;
    }

    .icon-button.danger:hover:not(:disabled) {
      background-color: #c82333;
    }

    .icon-button.ghost {
      background-color: transparent;
      color: #64748b;
    }

    .icon-button.ghost:hover:not(:disabled) {
      background-color: #f1f5f9;
      color: #1a202c;
    }

    .icon-button.outline {
      background-color: transparent;
      border: 1px solid #cbd5e1;
      color: #64748b;
    }

    .icon-button.outline:hover:not(:disabled) {
      background-color: #f8f9fa;
      border-color: var(--primary-color, #007bff);
      color: var(--primary-color, #007bff);
    }
  `]
})
export class IconButtonComponent {
  @Input() icon = '';
  @Input() iconButtonType: IconButtonType = 'ghost';
  @Input() size: IconButtonSize = 'medium';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() tooltip = '';
  @Output() onClick = new EventEmitter<MouseEvent>();

  getButtonClasses(): string {
    return `${this.iconButtonType} ${this.size}`;
  }
}

