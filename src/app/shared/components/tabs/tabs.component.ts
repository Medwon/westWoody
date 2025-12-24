import { Component, Input, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabComponent } from './tab.component';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, TabComponent],
  template: `
    <div class="tabs">
      <div class="tabs-header">
        <div
          *ngFor="let tab of tabsList; let i = index"
          class="tab-header-item"
          [class.active]="activeIndex === i"
          (click)="selectTab(i)">
          {{ tab.label }}
        </div>
      </div>
      <div class="tabs-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .tabs {
      width: 100%;
    }

    .tabs-header {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      gap: 0.5rem;
    }

    .tab-header-item {
      padding: 0.875rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
      user-select: none;
    }

    .tab-header-item:hover {
      color: #1a202c;
    }

    .tab-header-item.active {
      color: #007bff;
      border-bottom-color: #007bff;
    }

    .tabs-content {
      padding: 1.5rem 0;
    }
  `]
})
export class TabsComponent implements AfterContentInit {
  @ContentChildren(TabComponent) tabs!: QueryList<TabComponent>;
  tabsList: TabComponent[] = [];
  activeIndex = 0;

  ngAfterContentInit(): void {
    this.tabsList = this.tabs.toArray();
    this.selectTab(0);
  }

  selectTab(index: number): void {
    this.activeIndex = index;
    this.tabsList.forEach((tab, i) => {
      tab.active = i === index;
    });
  }
}

