import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'circle' | 'rectangle';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="skeleton" 
      [class]="type"
      [style.width]="width"
      [style.height]="height"
      [style.border-radius]="type === 'circle' ? '50%' : borderRadius"
    ></div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s ease-in-out infinite;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .skeleton.text {
      height: 1em;
      border-radius: 4px;
    }

    .skeleton.circle {
      width: 40px;
      height: 40px;
    }

    .skeleton.rectangle {
      border-radius: 4px;
    }
  `]
})
export class SkeletonComponent {
  @Input() type: SkeletonType = 'text';
  @Input() width = '100%';
  @Input() height = '1em';
  @Input() borderRadius = '4px';
}

