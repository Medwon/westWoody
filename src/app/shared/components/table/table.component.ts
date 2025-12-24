import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  template?: TemplateRef<any>;
  width?: string;
}

export interface TableRow {
  [key: string]: any;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table class="table" [class.striped]="striped" [class.bordered]="bordered" [class.hoverable]="hoverable">
        <thead>
          <tr>
            <th 
              *ngFor="let column of columns" 
              [style.width]="column.width"
              [class.sortable]="column.sortable"
              (click)="column.sortable && onSort(column.key)"
            >
              <div class="th-content">
                {{ column.label }}
                <span *ngIf="column.sortable" class="sort-icon">
                  <span *ngIf="sortKey !== column.key">↕</span>
                  <span *ngIf="sortKey === column.key && sortDirection === 'asc'">↑</span>
                  <span *ngIf="sortKey === column.key && sortDirection === 'desc'">↓</span>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of sortedData; let i = index" [class.even]="striped && i % 2 === 0">
            <td *ngFor="let column of columns">
              <ng-container *ngIf="column.template; else defaultCell">
                <ng-container *ngTemplateOutlet="column.template; context: { $implicit: row, column: column }"></ng-container>
              </ng-container>
              <ng-template #defaultCell>
                {{ row[column.key] }}
              </ng-template>
            </td>
          </tr>
          <tr *ngIf="data.length === 0" class="empty-row">
            <td [attr.colspan]="columns.length">{{ emptyMessage }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      background-color: #ffffff;
    }

    .table.bordered {
      border: 1px solid #e2e8f0;
    }

    .table.bordered th,
    .table.bordered td {
      border: 1px solid #e2e8f0;
    }

    thead {
      background-color: #f8f9fa;
    }

    th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    th.sortable {
      cursor: pointer;
      user-select: none;
    }

    th.sortable:hover {
      background-color: #e2e8f0;
    }

    .th-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sort-icon {
      font-size: 0.75rem;
      opacity: 0.5;
    }

    td {
      padding: 0.75rem 1rem;
      color: #1a202c;
      font-size: 0.875rem;
    }

    tbody tr {
      border-bottom: 1px solid #e2e8f0;
    }

    .table.striped tbody tr:nth-child(even) {
      background-color: #f8f9fa;
    }

    .table.hoverable tbody tr:hover {
      background-color: #f1f5f9;
    }

    .empty-row td {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
    }

    tbody tr:last-child {
      border-bottom: none;
    }
  `]
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: TableRow[] = [];
  @Input() striped = false;
  @Input() bordered = false;
  @Input() hoverable = true;
  @Input() emptyMessage = 'Нет данных';

  sortKey: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  get sortedData(): TableRow[] {
    if (!this.sortKey) {
      return this.data;
    }

    return [...this.data].sort((a, b) => {
      const aValue = a[this.sortKey!];
      const bValue = b[this.sortKey!];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  onSort(key: string): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
  }
}

