import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-app-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-bar" [class.fixed]="fixed" [class.bottom]="position === 'bottom'">
      <div class="app-bar-content">
        <div class="app-bar-start">
          <ng-content select="[appBarStart]"></ng-content>
          <h1 *ngIf="title" class="app-bar-title">{{ title }}</h1>
        </div>
        <div class="app-bar-center">
          <ng-content select="[appBarCenter]"></ng-content>
        </div>
        <div class="app-bar-end">
          <ng-content select="[appBarEnd]"></ng-content>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-bar {
      background-color: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      z-index: 90;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .app-bar.fixed {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      transition: margin-left 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
      will-change: margin-left;
    }

    .app-bar.bottom {
      border-bottom: none;
      border-top: 1px solid #e2e8f0;
    }

    .app-bar.bottom.fixed {
      top: auto;
      bottom: 0;
    }

    .app-bar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      height: 64px;
      gap: 1rem;
    }

    .app-bar-start,
    .app-bar-center,
    .app-bar-end {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .app-bar-start {
      flex: 1;
    }

    .app-bar-center {
      flex: 1;
      justify-content: center;
    }

    .app-bar-end {
      flex: 1;
      justify-content: flex-end;
    }

    .app-bar-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
    }
  `]
})
export class AppBarComponent {
  @Input() title = '';
  @Input() fixed = false;
  @Input() position: 'top' | 'bottom' = 'top';
}

