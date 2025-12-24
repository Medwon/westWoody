import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="accordion">
      <div class="accordion-header" (click)="toggle()">
        <span class="accordion-title">{{ title }}</span>
        <span class="accordion-icon" [class.expanded]="expanded">▼</span>
      </div>
      <div class="accordion-content" [class.expanded]="expanded">
        <div class="accordion-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accordion {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .accordion-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background-color: #ffffff;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s ease;
    }

    .accordion-header:hover {
      background-color: #f8f9fa;
    }

    .accordion-title {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1a202c;
    }

    .accordion-icon {
      font-size: 0.75rem;
      color: #64748b;
      transition: transform 0.2s ease;
    }

    .accordion-icon.expanded {
      transform: rotate(180deg);
    }

    .accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .accordion-content.expanded {
      max-height: 1000px;
    }

    .accordion-body {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background-color: #ffffff;
    }
  `]
})
export class AccordionComponent {
  @Input() title = '';
  @Input() expanded = false;

  @Output() toggleChange = new EventEmitter<boolean>();

  toggle(): void {
    this.expanded = !this.expanded;
    this.toggleChange.emit(this.expanded);
  }
}

