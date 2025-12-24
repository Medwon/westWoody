import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  url?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="breadcrumbs">
      <a
        *ngFor="let item of items; let last = last; let i = index"
        [routerLink]="item.route"
        [href]="item.url"
        class="breadcrumb-item"
        [class.last]="last">
        {{ item.label }}
      </a>
    </nav>
  `,
  styles: [`
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .breadcrumb-item {
      color: #64748b;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .breadcrumb-item:not(.last):hover {
      color: #007bff;
    }

    .breadcrumb-item:not(.last)::after {
      content: '›';
      margin-left: 0.5rem;
      color: #cbd5e1;
    }

    .breadcrumb-item.last {
      color: #1a202c;
      font-weight: 500;
      cursor: default;
      pointer-events: none;
    }
  `]
})
export class BreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
}

