import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconButtonComponent } from '../../shared/components/icon-button/icon-button.component';

@Component({
  selector: 'app-mobile-header',
  standalone: true,
  imports: [CommonModule, RouterModule, IconButtonComponent],
  template: `
    <header class="mobile-header">
      <div class="mobile-header-content">
        <a routerLink="/home" class="mobile-logo-link">
          <img src="assets/tinta-logo-short.svg" alt="Tinta" class="mobile-logo-icon">
          <span class="mobile-logo-text">{{ logoText }}</span>
        </a>
        <app-icon-button
          iconButtonType="ghost"
          size="medium"
          (onClick)="onMenuClick()">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </app-icon-button>
      </div>
    </header>
  `,
  styles: [`
    .mobile-header {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      z-index: 101;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .mobile-header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding: 0 1rem;
    }

    .mobile-logo-link {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }

    .mobile-logo-icon {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      object-fit: contain;
    }

    .mobile-logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a202c;
      letter-spacing: -0.02em;
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      .mobile-header {
        display: block;
      }
    }
  `]
})
export class MobileHeaderComponent {
  @Input() logoText: string = 'Tinta';
  @Output() menuClick = new EventEmitter<void>();

  onMenuClick(): void {
    this.menuClick.emit();
  }
}
