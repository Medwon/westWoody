import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-divider',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="divider" [class]="orientation" [class.spaced]="spaced"></div>
  `,
  styles: [`
    .divider {
      background-color: #e2e8f0;
    }

    .divider.horizontal {
      width: 100%;
      height: 1px;
    }

    .divider.vertical {
      height: 100%;
      width: 1px;
    }

    .divider.spaced.horizontal {
      margin: 1rem 0;
    }

    .divider.spaced.vertical {
      margin: 0 1rem;
    }
  `]
})
export class DividerComponent {
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() spaced = false;
}

