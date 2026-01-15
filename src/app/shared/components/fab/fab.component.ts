import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FabSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="fab"
      [class]="getClasses()"
      [disabled]="disabled"
      (click)="onClick.emit($event)">
      <span class="fab-icon">
        <ng-content></ng-content>
        <svg *ngIf="showDefaultIcon" viewBox="0 0 24 24" fill="none">
          <path d="M6 12H18M12 6V18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>
  `,
  styles: [`
    .fab {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background-color: #007bff;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 1000;
    }

    .fab:hover:not(:disabled) {
      background-color: #0056b3;
      box-shadow: 0 6px 16px rgba(0, 123, 255, 0.5);
      transform: translateY(-2px);
    }

    .fab:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .fab.small {
      width: 40px;
      height: 40px;
    }

    .fab.large {
      width: 64px;
      height: 64px;
    }

    .fab-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fab-icon svg {
      width: 24px;
      height: 24px;
    }

    .fab.small .fab-icon svg {
      width: 20px;
      height: 20px;
    }

    .fab.large .fab-icon svg {
      width: 28px;
      height: 28px;
    }
  `]
})
export class FabComponent {
  @Input() showDefaultIcon = true;
  @Input() size: FabSize = 'medium';
  @Input() disabled = false;

  @Output() onClick = new EventEmitter<MouseEvent>();

  getClasses(): string {
    return this.size;
  }
}

