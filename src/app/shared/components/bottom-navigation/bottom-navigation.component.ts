import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BottomNavItem {
  label: string;
  icon: string;
  route?: string;
  url?: string;
}

@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bottom-nav" [class.fixed]="fixed">
      <a
        *ngFor="let item of items"
        [routerLink]="item.route"
        [href]="item.url"
        class="bottom-nav-item"
        [class.active]="isActive(item)"
        (click)="onItemClick(item)">
        <span class="bottom-nav-icon">{{ item.icon }}</span>
        <span class="bottom-nav-label">{{ item.label }}</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      display: flex;
      justify-content: space-around;
      background-color: #ffffff;
      border-top: 1px solid #e2e8f0;
      padding: 0.5rem 0;
      position: relative;
    }

    .bottom-nav.fixed {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
    }

    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 1rem;
      color: #64748b;
      text-decoration: none;
      font-size: 0.75rem;
      transition: color 0.2s ease;
      border-radius: 8px;
    }

    .bottom-nav-item:hover {
      color: #007bff;
      background-color: #f8f9fa;
    }

    .bottom-nav-item.active {
      color: #007bff;
    }

    .bottom-nav-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .bottom-nav-label {
      font-weight: 500;
    }
  `]
})
export class BottomNavigationComponent {
  @Input() items: BottomNavItem[] = [];
  @Input() fixed = true;

  @Output() itemClick = new EventEmitter<BottomNavItem>();

  onItemClick(item: BottomNavItem): void {
    this.itemClick.emit(item);
  }

  isActive(item: BottomNavItem): boolean {
    // Можно добавить логику проверки активного маршрута
    return false;
  }
}

