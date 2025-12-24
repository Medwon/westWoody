import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tab-content" *ngIf="active">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .tab-content {
      width: 100%;
    }
  `]
})
export class TabComponent {
  @Input() label = '';
  active = false;
}

