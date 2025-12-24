import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ListItem {
  id: any;
  [key: string]: any;
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list">
      <div
        *ngFor="let item of items; let i = index"
        class="list-item"
        [class.clickable]="clickable"
        [class.selected]="isSelected(item)"
        (click)="onItemClick(item)">
        <ng-container *ngIf="itemTemplate; else defaultItem">
          <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item, index: i }"></ng-container>
        </ng-container>
        <ng-template #defaultItem>
          <div class="list-item-content">{{ item }}</div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .list {
      display: flex;
      flex-direction: column;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .list-item {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      transition: background-color 0.15s ease;
    }

    .list-item:last-child {
      border-bottom: none;
    }

    .list-item.clickable {
      cursor: pointer;
    }

    .list-item.clickable:hover {
      background-color: #f8f9fa;
    }

    .list-item.selected {
      background-color: #eff6ff;
    }

    .list-item-content {
      color: #1a202c;
      font-size: 0.875rem;
    }
  `]
})
export class ListComponent {
  @Input() items: ListItem[] = [];
  @Input() itemTemplate?: TemplateRef<any>;
  @Input() clickable = false;
  @Input() selectedItems: any[] = [];

  onItemClick(item: ListItem): void {
    // Можно добавить логику выбора
  }

  isSelected(item: ListItem): boolean {
    return this.selectedItems.includes(item.id);
  }
}

