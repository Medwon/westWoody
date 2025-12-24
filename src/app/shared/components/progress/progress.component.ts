import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ProgressVariant = 'linear' | 'circular';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress" *ngIf="variant === 'linear'">
      <div class="progress-bar" [style.width.%]="value" [class.indeterminate]="indeterminate"></div>
    </div>
    <div class="progress-circular" *ngIf="variant === 'circular'" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" class="progress-svg">
        <circle
          class="progress-circle-bg"
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="(size - strokeWidth) / 2"
          [attr.stroke-width]="strokeWidth">
        </circle>
        <circle
          class="progress-circle"
          [class.indeterminate]="indeterminate"
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="(size - strokeWidth) / 2"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke-dasharray]="getCircumference()"
          [attr.stroke-dashoffset]="getDashOffset()">
        </circle>
      </svg>
    </div>
  `,
  styles: [`
    .progress {
      width: 100%;
      height: 8px;
      background-color: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background-color: #007bff;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-bar.indeterminate {
      animation: indeterminate 1.5s ease-in-out infinite;
      width: 40% !important;
    }

    @keyframes indeterminate {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(300%); }
    }

    .progress-circular {
      position: relative;
    }

    .progress-svg {
      transform: rotate(-90deg);
    }

    .progress-circle-bg {
      fill: none;
      stroke: #e2e8f0;
    }

    .progress-circle {
      fill: none;
      stroke: #007bff;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.3s ease;
    }

    .progress-circle.indeterminate {
      animation: circular-indeterminate 1.4s linear infinite;
    }

    @keyframes circular-indeterminate {
      0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
      50% { stroke-dasharray: 100, 200; stroke-dashoffset: -15; }
      100% { stroke-dasharray: 100, 200; stroke-dashoffset: -125; }
    }
  `]
})
export class ProgressComponent {
  @Input() value = 0;
  @Input() variant: ProgressVariant = 'linear';
  @Input() indeterminate = false;
  @Input() size = 40;
  @Input() strokeWidth = 4;

  getCircumference(): number {
    const radius = (this.size - this.strokeWidth) / 2;
    return 2 * Math.PI * radius;
  }

  getDashOffset(): number {
    if (this.indeterminate) return 0;
    const circumference = this.getCircumference();
    return circumference - (this.value / 100) * circumference;
  }
}

