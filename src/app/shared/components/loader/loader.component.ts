import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoaderSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-overlay" *ngIf="overlay && visible" [class.fullscreen]="fullscreen">
      <div class="loader-spinner" [class]="size" [style.width.px]="customSize" [style.height.px]="customSize">
        <div *ngIf="showText" class="loader-text">{{ text }}</div>
      </div>
    </div>
    <div *ngIf="!overlay && visible" class="loader-spinner inline" [class]="size" [style.width.px]="customSize" [style.height.px]="customSize"></div>
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

    .loader-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
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
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 0.75rem;
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
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
}

