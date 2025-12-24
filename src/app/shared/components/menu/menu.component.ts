import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MenuItem {
  label: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="menu-container" *ngIf="visible" [class.show]="visible" [style.top.px]="top" [style.left.px]="left">
      <div
        *ngFor="let item of items"
        class="menu-item"
        [class.disabled]="item.disabled"
        [class.divider]="item.divider"
        (click)="onItemClick(item)"
      >
        <span class="menu-item-icon" *ngIf="item.icon">{{ item.icon }}</span>
        <span class="menu-item-label">{{ item.label }}</span>
      </div>
    </div>
  `,
  styles: [`
    .menu-container {
      position: fixed;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 0.5rem;
      min-width: 200px;
      z-index: 10000;
      opacity: 0;
      transform: scale(0.95);
      transition: all 0.15s ease;
      pointer-events: none;
    }

    .menu-container.show {
      opacity: 1;
      transform: scale(1);
      pointer-events: all;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      color: #1a202c;
      transition: background-color 0.15s ease;
      user-select: none;
    }

    .menu-item:hover:not(.disabled):not(.divider) {
      background-color: #f1f5f9;
    }

    .menu-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .menu-item.divider {
      height: 1px;
      padding: 0;
      margin: 0.5rem 0;
      background-color: #e2e8f0;
      cursor: default;
    }

    .menu-item-icon {
      font-size: 1rem;
      width: 1.25rem;
      text-align: center;
    }

    .menu-item-label {
      flex: 1;
    }
  `]
})
export class MenuComponent {
  @Input() visible = false;
  @Input() items: MenuItem[] = [];
  @Input() top = 0;
  @Input() left = 0;

  @Output() itemSelected = new EventEmitter<MenuItem>();
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.visible) {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        this.close();
      }
    }
  }

  onItemClick(item: MenuItem): void {
    if (item.disabled || item.divider) return;
    
    if (item.action) {
      item.action();
    }
    
    this.itemSelected.emit(item);
    this.close();
  }

  close(): void {
    this.visible = false;
    this.closed.emit();
  }
}

