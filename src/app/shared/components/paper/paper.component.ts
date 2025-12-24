import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="paper" [class]="getClasses()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .paper {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .paper.elevated {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .paper.outlined {
      border: 1px solid #e2e8f0;
    }

    .paper.flat {
      background-color: transparent;
    }
  `]
})
export class PaperComponent {
  @Input() variant: 'elevated' | 'outlined' | 'flat' = 'elevated';

  getClasses(): string {
    return this.variant;
  }
}

