import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'payment' | 'refund' | 'bonusGranted' | 'bonusUsed' | 'bonusExpired';
export type BadgeSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [class]="getBadgeClasses()" [class.dot]="dot" [class.with-icon]="icon">
      <span *ngIf="dot" class="badge-dot"></span>
      <span *ngIf="icon" class="badge-icon">
        <svg *ngIf="icon === 'star'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
        </svg>
        <svg *ngIf="icon === 'check'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 12l3 3 5-6" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <svg *ngIf="icon === 'refund'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg *ngIf="icon === 'payment'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </span>
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      font-weight: 500;
      font-size: 0.8rem;
      line-height: 1.5;
      white-space: nowrap;
    }

    .badge.small {
      padding: 0.15rem 0.5rem;
      font-size: 0.7rem;
    }

    .badge.large {
      padding: 0.3rem 0.8rem;
      font-size: 0.9rem;
    }

    .badge.medium {
      padding: 0.2rem 0.6rem;
      font-size: 0.8rem;
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

    .badge.payment {
      background-color: #dcfce7;
      color: #15803d;
    }

    .badge.refund {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .badge.bonusGranted {
      background-color: #fef3c7;
      color: #d97706;
    }

    .badge.bonusUsed {
      background-color: #fce7f3;
      color: #db2777;
    }

    .badge.bonusExpired {
      background-color: #f3f4f6;
      color: #64748b;
    }

    .badge.dot {
      padding-left: 0.375rem;
    }

    .badge.with-icon {
      padding-left: 0.5rem;
    }

    .badge-icon {
      display: inline-flex;
      align-items: center;
      margin-right: 0.25rem;
    }

    .badge-icon svg {
      width: 14px;
      height: 14px;
      display: block;
      flex-shrink: 0;
    }

    .badge.large .badge-icon svg {
      width: 16px;
      height: 16px;
    }

    .badge.small .badge-icon svg {
      width: 12px;
      height: 12px;
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
  @Input() icon: 'star' | 'check' | 'refund' | 'payment' | null = null;

  getBadgeClasses(): string {
    return `${this.badgeType} ${this.size}`;
  }
}

