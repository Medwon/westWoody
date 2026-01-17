import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="visible" [class.show]="visible">
      <div class="modal-container" [class.small]="size === 'small'" [class.large]="size === 'large'">
        <div class="modal-header" *ngIf="title || showCloseButton">
          <h3 class="modal-title" *ngIf="title">{{ title }}</h3>
          <button 
            *ngIf="showCloseButton"
            class="close-btn"
            type="button"
            (click)="onClose()"
            aria-label="Закрыть">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
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

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border: none;
      background: #f3f4f6;
      border-radius: 10px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .close-btn:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .close-btn:active {
      transform: scale(0.95);
    }

    .close-btn svg {
      width: 20px;
      height: 20px;
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
  /** @deprecated No longer used - modals only close via close button */
  @Input() closeOnOverlayClick = false;
  /** @deprecated No longer used - all modals are now "important" by default */
  @Input() important = true;

  @Output() closed = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.closed.emit();
  }
}

