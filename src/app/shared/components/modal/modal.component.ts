import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconButtonComponent],
  template: `
    <div class="modal-overlay" *ngIf="visible" [class.show]="visible" (click)="onOverlayClick($event)">
      <div class="modal-container" [class.small]="size === 'small'" [class.large]="size === 'large'" (click)="$event.stopPropagation()">
        <div class="modal-header" *ngIf="title || showCloseButton">
          <h3 class="modal-title" *ngIf="title">{{ title }}</h3>
          <app-icon-button
            *ngIf="showCloseButton"
            icon="✕"
            iconButtonType="ghost"
            size="small"
            (onClick)="onClose()">
          </app-icon-button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
        <div class="modal-footer" *ngIf="showFooter">
          <ng-content select="[modalFooter]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.2s ease;
      backdrop-filter: blur(4px);
    }

    .modal-overlay.show {
      opacity: 1;
    }

    .modal-container {
      background-color: #ffffff;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      transform: scale(0.95);
      transition: transform 0.2s ease;
    }

    .modal-overlay.show .modal-container {
      transform: scale(1);
    }

    .modal-container.small {
      max-width: 400px;
    }

    .modal-container.large {
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `]
})
export class ModalComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() showCloseButton = true;
  @Input() showFooter = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() closeOnOverlayClick = true;

  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.visible && this.showCloseButton) {
      this.onClose();
    }
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

