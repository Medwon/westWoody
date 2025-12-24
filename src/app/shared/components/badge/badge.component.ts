import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [class]="getBadgeClasses()" [class.dot]="dot">
      <span *ngIf="dot" class="badge-dot"></span>
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-weight: 500;
      font-size: 0.75rem;
      line-height: 1.5;
      white-space: nowrap;
    }

    .badge.small {
      padding: 0.125rem 0.5rem;
      font-size: 0.625rem;
    }

    .badge.large {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .badge.primary {
      background-color: #007bff;
      color: #ffffff;
    }

    .badge.secondary {
      background-color: #6c757d;
      color: #ffffff;
    }

    .badge.success {
      background-color: #28a745;
      color: #ffffff;
    }

    .badge.danger {
      background-color: #dc3545;
      color: #ffffff;
    }

    .badge.warning {
      background-color: #ffc107;
      color: #1a202c;
    }

    .badge.info {
      background-color: #17a2b8;
      color: #ffffff;
    }

    .badge.dot {
      padding-left: 0.375rem;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .badge.large .badge-dot {
      width: 8px;
      height: 8px;
    }

    .badge.small .badge-dot {
      width: 4px;
      height: 4px;
    }
  `]
})
export class BadgeComponent {
  @Input() badgeType: BadgeType = 'primary';
  @Input() size: BadgeSize = 'medium';
  @Input() dot = false;

  getBadgeClasses(): string {
    return `${this.badgeType} ${this.size}`;
  }
}

