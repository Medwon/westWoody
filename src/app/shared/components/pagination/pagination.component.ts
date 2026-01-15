import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="pagination">
      <app-icon-button
        iconButtonType="ghost"
        size="large"
        [disabled]="currentPage === 1"
        (onClick)="goToPage(1)"
        title="Первая страница">
        <svg viewBox="0 0 24 24" fill="none" class="pagination-arrow-icon">
          <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </app-icon-button>
      
      <app-icon-button
        iconButtonType="ghost"
        size="large"
        [disabled]="currentPage === 1"
        (onClick)="goToPage(currentPage - 1)"
        title="Предыдущая страница">
        <svg viewBox="0 0 24 24" fill="none" class="pagination-arrow-icon">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </app-icon-button>

      <div class="pagination-pages">
        <button
          *ngFor="let page of getPages()"
          class="pagination-page"
          [class.active]="page === currentPage"
          [class.ellipsis]="page === '...'"
          [disabled]="page === '...'"
          (click)="handlePageClick(page)">
          {{ page }}
        </button>
      </div>

      <app-icon-button
        iconButtonType="ghost"
        size="large"
        [disabled]="currentPage === totalPages"
        (onClick)="goToPage(currentPage + 1)"
        title="Следующая страница">
        <svg viewBox="0 0 24 24" fill="none" class="pagination-arrow-icon">
          <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </app-icon-button>
      
      <app-icon-button
        iconButtonType="ghost"
        size="large"
        [disabled]="currentPage === totalPages"
        (onClick)="goToPage(totalPages)"
        title="Последняя страница">
        <svg viewBox="0 0 24 24" fill="none" class="pagination-arrow-icon">
          <path d="M13 17l5-5-5-5M6 17l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </app-icon-button>
    </div>
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pagination-pages {
      display: flex;
      gap: 0.25rem;
    }

    .pagination-page {
      min-width: 40px;
      width: 40px;
      height: 40px;
      padding: 0;
      border: 1px solid #e2e8f0;
      border-radius: 50%;
      background-color: #ffffff;
      color: #1a202c;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pagination-page:hover:not(:disabled):not(.active):not(.ellipsis) {
      background-color: #f8f9fa;
      border-color: #cbd5e1;
    }

    .pagination-page.active {
      background-color: #16A34A;
      color: #ffffff;
      border-color: #16A34A;
    }

    .pagination-page.ellipsis {
      border: none;
      cursor: default;
    }

    .pagination-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* SVG иконки стрелок */
    .pagination-arrow-icon {
      width: 20px;
      height: 20px;
      display: block;
      color:rgb(0, 0, 0);
    }

    :host ::ng-deep app-icon-button.large .pagination-arrow-icon {
      width: 24px;
      height: 24px;
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() maxVisible = 5;

  @Output() pageChange = new EventEmitter<number>();

  getPages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const start = Math.max(1, this.currentPage - Math.floor(this.maxVisible / 2));
    const end = Math.min(this.totalPages, start + this.maxVisible - 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < this.totalPages) {
      if (end < this.totalPages - 1) pages.push('...');
      pages.push(this.totalPages);
    }

    return pages;
  }

  handlePageClick(page: number | string): void {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.pageChange.emit(page);
    }
  }
}

