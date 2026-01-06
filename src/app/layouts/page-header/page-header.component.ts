import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderService } from '../../core/services/page-header.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbsComponent],
  template: `
    <div class="page-header" *ngIf="(pageHeaderService.headerData$ | async) as data">
      <ng-container *ngIf="data.title || data.breadcrumbs.length">
        <app-breadcrumbs 
          *ngIf="data.breadcrumbs.length" 
          [items]="data.breadcrumbs">
        </app-breadcrumbs>
        <h1 class="page-title" *ngIf="data.title">{{ data.title }}</h1>
      </ng-container>
    </div>
  `,
  styles: [`
    .page-header {
      padding: 1.5rem 0 3.5rem 0;
    }

    :host ::ng-deep .breadcrumbs {
      margin-bottom: 0.5rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }

    @media (max-width: 768px) {
      .page-header {
        padding: 1rem 0;
      }

      .page-title {
        font-size: 1.5rem;
      }
    }
  `]
})
export class PageHeaderComponent {
  pageHeaderService = inject(PageHeaderService);
}

