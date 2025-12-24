import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tooltip-wrapper">
      <ng-content></ng-content>
      <div class="tooltip" [class]="position" *ngIf="text">
        {{ text }}
      </div>
    </div>
  `,
  styles: [`
    .tooltip-wrapper {
      position: relative;
      display: inline-block;
    }

    .tooltip-wrapper:hover .tooltip {
      opacity: 1;
      visibility: visible;
    }

    .tooltip {
      position: absolute;
      z-index: 1000;
      padding: 0.5rem 0.75rem;
      background-color: #1a202c;
      color: #ffffff;
      border-radius: 4px;
      font-size: 0.75rem;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      pointer-events: none;
    }

    .tooltip::before {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
    }

    .tooltip.top {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 0.5rem;
    }

    .tooltip.top::before {
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 5px 5px 0 5px;
      border-color: #1a202c transparent transparent transparent;
    }

    .tooltip.bottom {
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 0.5rem;
    }

    .tooltip.bottom::before {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent #1a202c transparent;
    }

    .tooltip.left {
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-right: 0.5rem;
    }

    .tooltip.left::before {
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      border-width: 5px 0 5px 5px;
      border-color: transparent transparent transparent #1a202c;
    }

    .tooltip.right {
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-left: 0.5rem;
    }

    .tooltip.right::before {
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      border-width: 5px 5px 5px 0;
      border-color: transparent #1a202c transparent transparent;
    }
  `]
})
export class TooltipComponent {
  @Input() text = '';
  @Input() position: TooltipPosition = 'top';
}

