import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';

export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="chip" [class]="getClasses()" [class.clickable]="clickable">
      <span class="chip-icon" *ngIf="icon">{{ icon }}</span>
      <span class="chip-label"><ng-content></ng-content></span>
      <app-icon-button
        *ngIf="deletable"
        icon="✕"
        iconButtonType="ghost"
        size="small"
        (onClick)="onDelete($event)">
      </app-icon-button>
    </div>
  `,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 500;
      background-color: #f1f5f9;
      color: #1a202c;
      border: 1px solid #e2e8f0;
    }

    .chip.clickable {
      cursor: pointer;
    }

    .chip.clickable:hover {
      background-color: #e2e8f0;
    }

    .chip.primary {
      background-color: #eff6ff;
      color: #1e40af;
      border-color: #93c5fd;
    }

    .chip.success {
      background-color: #f0fdf4;
      color: #15803d;
      border-color: #86efac;
    }

    .chip.warning {
      background-color: #fffbeb;
      color: #854d0e;
      border-color: #fde047;
    }

    .chip.error {
      background-color: #fef2f2;
      color: #991b1b;
      border-color: #fca5a5;
    }

    .chip-icon {
      font-size: 1rem;
      line-height: 1;
    }

    .chip-label {
      line-height: 1.5;
    }
  `]
})
export class ChipComponent {
  @Input() variant: ChipVariant = 'default';
  @Input() icon = '';
  @Input() deletable = false;
  @Input() clickable = false;

  @Output() deleted = new EventEmitter<void>();
  @Output() clicked = new EventEmitter<void>();

  getClasses(): string {
    return this.variant;
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.deleted.emit();
  }
}

