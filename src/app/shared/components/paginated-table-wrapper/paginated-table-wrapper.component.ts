import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ContentChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PaginationComponent } from '../pagination/pagination.component';
import { PaginationService } from '../../../core/services/pagination.service';
import { SelectComponent, SelectOption } from '../select/select.component';

@Component({
  selector: 'app-paginated-table-wrapper',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, SelectComponent],
  template: `
    <div class="paginated-wrapper">
      <!-- Table Content (ng-content) -->
      <ng-content></ng-content>

      <!-- Pagination with Page Size Filter -->
      <div class="pagination-container" *ngIf="paginationEnabled && totalItems > 0">
        <div class="pagination-left">
          <div class="pagination-info">
            <span>Показано {{ startIndex }}-{{ endIndex }} из {{ totalItems }}</span>
          </div>
          <div class="page-size-filter-section">
            <app-select
              label="Строк на странице:"
              [(ngModel)]="pageSize"
              [options]="pageSizeSelectOptions"
              (ngModelChange)="onPageSizeChange()">
            </app-select>
          </div>
        </div>
        <div class="pagination-right" *ngIf="totalPages > 1">
          <app-pagination
            [currentPage]="currentPage"
            [totalPages]="totalPages"
            (pageChange)="onPageChange($event)">
          </app-pagination>
        </div>
      </div>
    </div>
  `,
  exportAs: 'paginatedTable',
  styles: [`
    .paginated-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Pagination Container */
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      gap: 1rem;
    }

    .pagination-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .pagination-right {
      display: flex;
      align-items: center;
    }

    .pagination-info {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Page Size Filter */
    .page-size-filter-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-size-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }

    .page-size-select {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      color: #1f2937;
      cursor: pointer;
      outline: none;
      transition: all 0.2s;
    }

    .page-size-select:hover {
      border-color: #94a3b8;
    }

    .page-size-select:focus {
      border-color: #16A34A;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .pagination-container {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .pagination-left {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .pagination-info {
        text-align: center;
      }

      .page-size-filter-section {
        justify-content: center;
      }

      .pagination-right {
        justify-content: center;
      }
    }
  `]
})
export class PaginatedTableWrapperComponent implements OnInit, OnChanges {
  @Input() paginationEnabled = true;
  @Input() data: any[] = [];
  @Input() defaultPageSize = 15;
  @Input() paginationKey: string = 'default'; // Unique key for this pagination instance
  
  // Output для передачи пагинированных данных
  @Output() paginatedDataChange = new EventEmitter<any[]>();
  @Output() paginationInfoChange = new EventEmitter<{
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
  }>();

  // Pagination state
  currentPage = 1;
  pageSize = 15;
  totalPages = 1;
  totalItems = 0;
  startIndex = 0;
  endIndex = 0;
  pageSizeOptions: number[] = [];
  get pageSizeSelectOptions(): SelectOption[] {
    return this.pageSizeOptions.map(s => ({ value: s, label: String(s) }));
  }
  paginatedData: any[] = [];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paginationService = inject(PaginationService);

  ngOnInit(): void {
    this.pageSize = this.defaultPageSize;
    this.pageSizeOptions = this.paginationService.getPageSizeOptions();

    if (this.paginationEnabled) {
      // Initialize pagination from route
      const paginationParams = this.paginationService.initFromRoute(this.route, this.paginationKey);
      this.currentPage = paginationParams.page;
      this.pageSize = paginationParams.pageSize;
      
      // Subscribe to route query params changes
      this.route.queryParams.subscribe(params => {
        const pageParam = this.paginationKey === 'default' ? 'page' : `${this.paginationKey}Page`;
        const pageSizeParam = this.paginationKey === 'default' ? 'pageSize' : `${this.paginationKey}PageSize`;
        
        const page = params[pageParam] ? parseInt(params[pageParam], 10) : 1;
        const pageSize = params[pageSizeParam] ? parseInt(params[pageSizeParam], 10) : this.paginationService.getDefaultPageSize();
        
        const newPage = isNaN(page) || page < 1 ? 1 : page;
        const newPageSize = this.pageSizeOptions.includes(pageSize) ? pageSize : this.paginationService.getDefaultPageSize();
        
        if (newPage !== this.currentPage || newPageSize !== this.pageSize) {
          this.currentPage = newPage;
          this.pageSize = newPageSize;
          this.updatePagination();
        }
      });
    }

    this.updatePagination();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['paginationEnabled']) {
      this.updatePagination();
    }
  }

  updatePagination(): void {
    if (this.paginationEnabled && this.data) {
      const paginationResult = this.paginationService.getPaginatedData(
        this.data,
        this.currentPage,
        this.pageSize
      );
      
      this.paginatedData = paginationResult.paginatedData;
      this.totalPages = paginationResult.totalPages;
      this.totalItems = paginationResult.totalItems;
      this.startIndex = paginationResult.startIndex;
      this.endIndex = paginationResult.endIndex;

      // Emit events
      this.paginatedDataChange.emit(this.paginatedData);
      this.paginationInfoChange.emit({
        currentPage: this.currentPage,
        pageSize: this.pageSize,
        totalPages: this.totalPages,
        totalItems: this.totalItems,
        startIndex: this.startIndex,
        endIndex: this.endIndex
      });
    } else {
      this.paginatedData = this.data || [];
      this.totalItems = this.data?.length || 0;
      this.paginatedDataChange.emit(this.paginatedData);
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    if (this.paginationEnabled) {
      this.paginationService.updateRoute(this.route, this.currentPage, this.pageSize, this.paginationKey);
    }
    this.updatePagination();
    // Scroll to top of table
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when changing page size
    if (this.paginationEnabled) {
      this.paginationService.updateRoute(this.route, this.currentPage, this.pageSize, this.paginationKey);
    }
    this.updatePagination();
  }
}
