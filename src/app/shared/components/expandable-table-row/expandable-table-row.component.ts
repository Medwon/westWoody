import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';

/**
 * Сервис для управления состоянием раскрытия строк таблиц
 */
export class ExpandableRowService {
  private expandedRows = new Set<string>();

  isExpanded(rowId: string): boolean {
    return this.expandedRows.has(rowId);
  }

  toggle(rowId: string): void {
    if (this.expandedRows.has(rowId)) {
      this.expandedRows.delete(rowId);
    } else {
      this.expandedRows.add(rowId);
    }
  }

  expand(rowId: string): void {
    this.expandedRows.add(rowId);
  }

  collapse(rowId: string): void {
    this.expandedRows.delete(rowId);
  }

  collapseAll(): void {
    this.expandedRows.clear();
  }
}

/**
 * Компонент кнопки для раскрытия/сворачивания строки таблицы
 */
@Component({
  selector: 'app-expandable-row-toggle',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <app-icon-button
      *ngIf="enabled"
      iconButtonType="ghost"
      size="small"
      [tooltip]="isExpanded ? expandedTooltip : collapsedTooltip"
      (onClick)="toggle()">
      <svg [class.rotated]="isExpanded" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </app-icon-button>
  `,
  styles: [`
    svg {
      transition: transform 0.3s ease;
    }

    svg.rotated {
      transform: rotate(180deg);
    }
  `]
})
export class ExpandableRowToggleComponent {
  @Input() rowId: string = '';
  @Input() service!: ExpandableRowService;
  @Input() enabled: boolean = true;
  @Input() collapsedTooltip: string = 'Показать детали';
  @Input() expandedTooltip: string = 'Скрыть детали';
  @Output() expandedChange = new EventEmitter<boolean>();

  get isExpanded(): boolean {
    return this.service?.isExpanded(this.rowId) ?? false;
  }

  toggle(): void {
    if (this.service) {
      this.service.toggle(this.rowId);
      this.expandedChange.emit(this.service.isExpanded(this.rowId));
    }
  }
}

/**
 * Директива для проверки состояния раскрытия строки
 */
@Component({
  selector: '[appExpandableRowDetails]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-content></ng-content>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ExpandableRowDetailsComponent {
  @Input() rowId: string = '';
  @Input() service!: ExpandableRowService;
  @Input() colspan: number = 1;
  @Input() rowClass: string = '';
  @Input() cellClass: string = '';
  @Input() contentClass: string = '';

  get isExpanded(): boolean {
    return this.service?.isExpanded(this.rowId) ?? false;
  }
}
