import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" [class.hoverable]="hoverable" [class.shadow]="shadow" [class.bordered]="bordered">
      <div class="card-header" *ngIf="header || showHeader">
        <ng-container *ngTemplateOutlet="headerTemplate"></ng-container>
        <h3 *ngIf="!header">{{ headerText }}</h3>
      </div>
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      <div class="card-footer" *ngIf="footer || showFooter">
        <ng-container *ngTemplateOutlet="footerTemplate"></ng-container>
      </div>
    </div>
    <ng-template #headerTemplate>
      <ng-content select="[cardHeader]"></ng-content>
    </ng-template>
    <ng-template #footerTemplate>
      <ng-content select="[cardFooter]"></ng-content>
    </ng-template>
  `,
  styles: [`
    .card {
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .card.shadow {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .card.bordered {
      border: 1px solid #e2e8f0;
    }

    .card.hoverable {
      cursor: pointer;
    }

    .card.hoverable:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .card-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background-color: #f8f9fa;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
    }

    .card-body {
      padding: 1.5rem;
    }

    .card-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background-color: #f8f9fa;
    }

    :host ::ng-deep [cardHeader] {
      display: block;
    }

    :host ::ng-deep [cardFooter] {
      display: block;
    }
  `]
})
export class CardComponent {
  @Input() headerText = '';
  @Input() showHeader = false;
  @Input() footer = false;
  @Input() showFooter = false;
  @Input() hoverable = false;
  @Input() shadow = true;
  @Input() bordered = false;
  
  header = false;
}

