import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="drawer-overlay" *ngIf="visible" [class.show]="visible" (click)="onOverlayClick($event)">
      <div class="drawer" [class]="getClasses()" [class.show]="visible" (click)="$event.stopPropagation()">
        <div class="drawer-header" *ngIf="title || showCloseButton">
          <h3 class="drawer-title" *ngIf="title">{{ title }}</h3>
          <app-icon-button
            *ngIf="showCloseButton"
            icon="✕"
            iconButtonType="ghost"
            size="small"
            (onClick)="onClose()">
          </app-icon-button>
        </div>
        <div class="drawer-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drawer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.2s ease;
      backdrop-filter: blur(4px);
    }

    .drawer-overlay.show {
      opacity: 1;
    }

    .drawer {
      position: fixed;
      background-color: #ffffff;
      box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 320px;
      max-width: 90vw;
      transition: transform 0.3s ease;
    }

    .drawer.left {
      left: 0;
      top: 0;
      transform: translateX(-100%);
    }

    .drawer.right {
      right: 0;
      top: 0;
      transform: translateX(100%);
    }

    .drawer.top {
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 320px;
      max-height: 90vh;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-100%);
    }

    .drawer.bottom {
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 320px;
      max-height: 90vh;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(100%);
    }

    .drawer.show {
      transform: translate(0);
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .drawer-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
    }

    .drawer-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }
  `]
})
export class DrawerComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() showCloseButton = true;
  @Input() anchor: 'left' | 'right' | 'top' | 'bottom' = 'right';
  @Input() closeOnOverlayClick = true;

  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.visible && this.showCloseButton) {
      this.onClose();
    }
  }

  getClasses(): string {
    return this.anchor;
  }

  onClose(): void {
    this.visible = false;
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (this.closeOnOverlayClick && event.target === event.currentTarget) {
      this.onClose();
    }
  }
}

