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
      <span class="fab-icon">{{ icon }}</span>
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
      font-size: 1.5rem;
      line-height: 1;
    }

    .fab.small .fab-icon {
      font-size: 1.125rem;
    }

    .fab.large .fab-icon {
      font-size: 1.75rem;
    }
  `]
})
export class FabComponent {
  @Input() icon = '+';
  @Input() size: FabSize = 'medium';
  @Input() disabled = false;

  @Output() onClick = new EventEmitter<MouseEvent>();

  getClasses(): string {
    return this.size;
  }
}

