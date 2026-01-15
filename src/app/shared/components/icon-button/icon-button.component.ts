import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconButtonType = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'view' | 'refund' | 'edit';
export type IconButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      class="icon-button"
      [class]="getButtonClasses()"
      [disabled]="disabled"
      [type]="type"
      [title]="tooltip"
      (click)="onClick.emit($event)"
    >
      <span class="icon-content">
        <ng-content></ng-content>
        <span *ngIf="icon">{{ icon }}</span>
      </span>
    </button>
  `,
  styles: [`
    app-icon-button .icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      background: white;
      color:rgb(0, 61, 146);
      width: 32px;
      height: 32px;
      padding: 0;
    }

    app-icon-button .icon-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    app-icon-button .icon-button.small {
      width: 28px;
      height: 28px;
    }

    app-icon-button .icon-button.large {
      width: 40px;
      height: 40px;
    }

    app-icon-button .icon-content {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    app-icon-button svg {
      width: 16px;
      height: 16px;
      display: block;
      flex-shrink: 0;
    }

    app-icon-button svg path,
    app-icon-button svg circle,
    app-icon-button svg rect,
    app-icon-button svg line {
      stroke: currentColor !important;
    }

    app-icon-button .icon-button.small svg {
      width: 14px;
      height: 14px;
    }

    app-icon-button .icon-button.large svg {
      width: 20px;
      height: 20px;
    }

    app-icon-button .icon-button.primary {
      background-color: var(--primary-color, #007bff);
      color: #ffffff;
    }

    app-icon-button .icon-button.primary:hover:not(:disabled) {
      background-color: var(--primary-color-hover, #0056b3);
    }

    app-icon-button .icon-button.secondary {
      background-color: #6c757d;
      color: #ffffff;
    }

    app-icon-button .icon-button.secondary:hover:not(:disabled) {
      background-color: #545b62;
    }

    app-icon-button .icon-button.danger {
      background-color: #dc3545;
      color: #ffffff;
    }

    app-icon-button .icon-button.danger:hover:not(:disabled) {
      background-color: #c82333;
    }

    app-icon-button .icon-button.ghost {
      background-color: transparent;
      border: none;
      color: #64748b;
    }

    app-icon-button .icon-button.ghost:hover:not(:disabled) {
      background-color: #f1f5f9;
      color: #1a202c;
    }

    app-icon-button .icon-button.outline {
      background-color: transparent;
      border: 1px solid #cbd5e1;
      color: #64748b;
    }

    app-icon-button .icon-button.outline:hover:not(:disabled) {
      background-color: #f8f9fa;
      border-color: var(--primary-color, #007bff);
      color: var(--primary-color, #007bff);
    }

    app-icon-button .icon-button.view {
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }

    app-icon-button .icon-button.view:hover:not(:disabled) {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #16A34A;
    }

    app-icon-button .icon-button.refund {
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }

    app-icon-button .icon-button.refund:hover:not(:disabled) {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }

    app-icon-button .icon-button.refund:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    app-icon-button .icon-button.edit {
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }

    app-icon-button .icon-button.edit:hover:not(:disabled) {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #16A34A;
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

