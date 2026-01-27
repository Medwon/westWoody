import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoaderSize = 'small' | 'medium' | 'large';
export type LoaderType = 'spinner' | 'logo';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Page/App Loading with Bouncing Logo -->
    <div class="loader-overlay" *ngIf="overlay && visible" [class.fullscreen]="fullscreen">
      <div class="loader-container" [class]="size">
        <div class="loader-logo" [style.width.px]="getLogoSize()" [style.height.px]="getLogoSize()">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#15803d" opacity="0.8"/>
            <path d="M2 17l10 5 10-5" stroke="#15803d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="#15803d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div *ngIf="showText" class="loader-text">{{ text }}</div>
      </div>
    </div>
    
    <!-- Inline Loading: Spinner for buttons, Logo for pages -->
    <div *ngIf="!overlay && visible" [ngSwitch]="type">
      <!-- Spinner for buttons/small elements -->
      <div *ngSwitchCase="'spinner'" class="loader-spinner inline" [class]="size" [style.width.px]="getSpinnerSize()" [style.height.px]="getSpinnerSize()"></div>
      <!-- Logo for inline page loading -->
      <div *ngSwitchDefault class="loader-logo inline" [class]="size" [style.width.px]="getLogoSize()" [style.height.px]="getLogoSize()">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#15803d" opacity="0.8"/>
          <path d="M2 17l10 5 10-5" stroke="#15803d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12l10 5 10-5" stroke="#15803d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      z-index: 9999;
      backdrop-filter: blur(2px);
    }

    .loader-overlay.fullscreen {
      position: fixed;
    }

    .loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      position: relative;
    }

    /* Bouncing Logo for Page/App Loading */
    .loader-logo {
      width: 50px;
      height: 50px;
      animation: bounce 1.4s ease-in-out infinite;
      position: relative;
    }

    .loader-logo.inline {
      display: inline-block;
    }

    .loader-logo svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .loader-logo.small {
      width: 24px;
      height: 24px;
    }

    .loader-logo.large {
      width: 64px;
      height: 64px;
    }

    /* Spinner for Buttons/Small Elements */
    .loader-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #16A34A;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      position: relative;
    }

    .loader-spinner.inline {
      display: inline-block;
    }

    .loader-spinner.small {
      width: 24px;
      height: 24px;
      border-width: 2px;
    }

    .loader-spinner.large {
      width: 64px;
      height: 64px;
      border-width: 6px;
    }

    .loader-text {
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      margin-top: 0.5rem;
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0) scale(1);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
      }
      50% {
        transform: translateY(-25%) scale(1.1);
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoaderComponent {
  @Input() visible = false;
  @Input() overlay = true;
  @Input() fullscreen = true;
  @Input() size: LoaderSize = 'medium';
  @Input() customSize?: number;
  @Input() text = '';
  @Input() showText = false;
  @Input() type: LoaderType = 'logo'; // 'spinner' for buttons, 'logo' for pages

  getLogoSize(): number {
    if (this.customSize) {
      return this.customSize;
    }
    switch (this.size) {
      case 'small':
        return 24;
      case 'large':
        return 64;
      default:
        return 50;
    }
  }

  getSpinnerSize(): number {
    if (this.customSize) {
      return this.customSize;
    }
    switch (this.size) {
      case 'small':
        return 24;
      case 'large':
        return 64;
      default:
        return 50;
    }
  }
}

