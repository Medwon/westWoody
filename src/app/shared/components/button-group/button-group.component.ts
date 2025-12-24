import { Component, Input, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-button-group',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="button-group" [class.vertical]="vertical">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .button-group {
      display: inline-flex;
      gap: 0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }

    .button-group.vertical {
      flex-direction: column;
    }

    :host ::ng-deep app-button button {
      border-radius: 0;
      border: none;
      border-right: 1px solid #cbd5e1;
    }

    :host ::ng-deep app-button:last-child button {
      border-right: none;
    }

    .button-group.vertical :host ::ng-deep app-button button {
      border-right: none;
      border-bottom: 1px solid #cbd5e1;
    }

    .button-group.vertical :host ::ng-deep app-button:last-child button {
      border-bottom: none;
    }
  `]
})
export class ButtonGroupComponent {
  @Input() vertical = false;
}

