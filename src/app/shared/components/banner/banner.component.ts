import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';

export type BannerType = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="banner" [class]="getClasses()" *ngIf="visible">
      <div class="banner-content">
        <span class="banner-icon" *ngIf="showIcon">{{ getIcon() }}</span>
        <div class="banner-text">
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
    .banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-radius: 6px;
    }

    .banner.info {
      background-color: #eff6ff;
      color: #1e40af;
    }

    .banner.success {
      background-color: #f0fdf4;
      color: #15803d;
    }

    .banner.warning {
      background-color: #fffbeb;
      color: #854d0e;
    }

    .banner.error {
      background-color: #fef2f2;
      color: #991b1b;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .banner-icon {
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    .banner-text {
      font-size: 0.875rem;
      line-height: 1.5;
    }
  `]
})
export class BannerComponent {
  @Input() type: BannerType = 'info';
  @Input() dismissible = false;
  @Input() showIcon = true;
  @Input() visible = true;

  @Output() dismissed = new EventEmitter<void>();

  getClasses(): string {
    return this.type;
  }

  getIcon(): string {
    const icons: Record<BannerType, string> = {
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
}

